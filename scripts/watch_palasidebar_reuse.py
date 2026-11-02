#!/usr/bin/env python3
"""Zoek wekelijks best-effort naar publieke PalaSidebar-broncodekopieën.

Geen telemetry, geen Home Assistant-gegevens en GEEN juridische inbreukdetectie.
Alleen publiek geïndexeerde GitHub-code met twee onafhankelijke herkenningsregels.
"""
from __future__ import annotations

import json
import math
import os
import sys
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.github.com"
FINGERPRINTS = (
    "PALASIDEBAR_ORIGIN_ROBIN_2026",
    "PALASIDEBAR_AUTOLOADER_ROBIN_2026",
)
ORIGINAL = "onlyrobin/palasidebar"
AGENT = "PalaSidebar-public-source-monitor/1.1"
MAX_ATTEMPTS = 3
MAX_WAIT_SECONDS = 360


def _rate_limited(error: urllib.error.HTTPError) -> bool:
    """403 kan ook een autorisatiefout zijn; alleen echte limieten opnieuw proberen."""
    if error.code == 429:
        return True
    if error.code != 403:
        return False
    if error.headers.get("X-RateLimit-Remaining") == "0":
        return True
    details = error.read(2048).decode("utf-8", errors="replace").lower()
    return any(message in details for message in (
        "secondary rate limit", "rate limit exceeded", "abuse detection",
    ))


def _retry_seconds(error: urllib.error.HTTPError, attempt: int) -> int:
    """Volg eerst Retry-After en daarna het primaire rate-limit-resetmoment."""
    retry_after = error.headers.get("Retry-After")
    if retry_after:
        try:
            return max(1, math.ceil(float(retry_after)))
        except ValueError:
            try:
                target = parsedate_to_datetime(retry_after)
                if target.tzinfo is None:
                    target = target.replace(tzinfo=timezone.utc)
                return max(1, math.ceil(target.timestamp() - time.time()) + 1)
            except (TypeError, ValueError, OverflowError):
                pass
    if error.headers.get("X-RateLimit-Remaining") == "0":
        try:
            reset = float(error.headers["X-RateLimit-Reset"])
            return max(1, math.ceil(reset - time.time()) + 1)
        except (KeyError, ValueError, TypeError):
            pass
    # Bij een secundaire limiet zonder headers adviseert GitHub >= 60 seconden.
    return 60 * (2 ** (attempt - 1))


def _summary(status: str, description: str) -> None:
    """Een korte, eerlijke status op het GitHub Actions-overzicht."""
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    with open(path, "a", encoding="utf-8") as output:
        output.write(f"## PalaSidebar broncodebewaking — {status}\n\n{description}\n\n")
        output.write("Dit is een indicatieve controle van openbare GitHub-code, geen bewijs van auteursrechtinbreuk of afwezigheid van kopieën.\n")




def request(method: str, url: str, token: str, payload: dict | None = None):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Authorization": f"Bearer {token}",
        "User-Agent": AGENT,
    }
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    endpoint = urllib.parse.urlsplit(url).path

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(req, timeout=25) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if method != "GET":
                raise  # Issue-aanmaak (POST) niet herhalen: dubbele meldingen voorkomen.
            limited = _rate_limited(error)
            transient = error.code in (500, 502, 503, 504)
            if not limited and not transient:
                raise  # 401, 404, andere 403 en overige permanente fouten niet herhalen
            if attempt == MAX_ATTEMPTS:
                raise RuntimeError(
                    f"GitHub API {endpoint} gaf HTTP {error.code} na {attempt} pogingen; "
                    "zoekcontrole onvolledig, probeer later opnieuw."
                ) from error
            delay = _retry_seconds(error, attempt) if limited else 3 * 2 ** (attempt - 1)
            if delay > MAX_WAIT_SECONDS:
                raise RuntimeError(
                    f"GitHub API {endpoint} is beperkt (HTTP {error.code}); "
                    f"volgende toegestane poging pas over circa {delay} seconden. "
                    "Geen nieuwe verzoeken uitgevoerd en zoekcontrole onvolledig."
                ) from error
            print(
                f"::warning::GitHub API {endpoint} gaf HTTP {error.code}; "
                f"poging {attempt}/{MAX_ATTEMPTS}, wacht {delay}s voor herhaling.",
                flush=True,
            )
            time.sleep(delay)
        except urllib.error.URLError as error:
            if method != "GET":
                raise  # Bij onbekende POST-uitkomst nooit opnieuw een Issue aanmaken.
            if attempt == MAX_ATTEMPTS:
                raise RuntimeError(
                    f"GitHub API {endpoint} niet bereikbaar na {attempt} pogingen; "
                    "zoekcontrole onvolledig."
                ) from error
            delay = 3 * 2 ** (attempt - 1)
            print(
                f"::warning::Tijdelijk netwerkprobleem bij {endpoint}; "
                f"wacht {delay}s voor herhaling.",
                flush=True,
            )
            time.sleep(delay)



def find_public_repositories(token: str):
    """Code Search is incomplete: renamed/deleted markers or unindexed code is invisible."""
    results = {}
    for index, mark in enumerate(FINGERPRINTS):
        if index:
            time.sleep(2)  # Kleine pauze tussen twee aparte GitHub-codezoekopdrachten.
        query = urllib.parse.urlencode({"q": f'"{mark}" in:file', "per_page": 100})
        answer = request("GET", f"{API}/search/code?{query}", token)
        if answer.get("incomplete_results"):
            raise RuntimeError(
                "GitHub Code Search meldt incomplete_results=true; "
                f"zoekresultaten voor {mark} zijn onvolledig."
            )
        for item in answer.get("items", []):
            repo = item.get("repository", {}).get("full_name", "")
            if not repo or repo.lower() == ORIGINAL:
                continue
            results.setdefault(repo, set()).add(mark)
    # Twee unieke herkenningsregels in verschillende bronbestanden, niet één losse term.
    return {repo: matched for repo, matched in results.items()
            if len(matched) == len(FINGERPRINTS)}


def existing_alerts(token: str, repository: str):
    # Ons eigen issue-overzicht is klein. De titel wordt exact op naam vergeleken.
    url = f"{API}/repos/{repository}/issues?state=all&per_page=100"
    items = request("GET", url, token)
    return {item.get("title", "") for item in items if not item.get("pull_request")}


def notify(token: str, repository: str, candidates: dict):
    seen = existing_alerts(token, repository)
    for suspect, matched in sorted(candidates.items()):
        title = f"Broncode-overeenkomst controleren: {suspect}"
        if title in seen:
            print(f"Reeds gemeld: {suspect}")
            continue
        body = (
            "@OnlyRobin — automatische wekelijkse controle van openbare GitHub-code.\n\n"
            f"**Controleer repository:** https://github.com/{suspect}\n\n"
            "**Overeenkomende publieke broncodemarkeringen:**\n"
            + "".join(f"- `{mark}`\n" for mark in sorted(matched))
            + "\n**Belangrijk:** dit is **geen bewijs van kopiëren of een licentieschending**. "
            "De MIT-licentie staat kopiëren, wijzigen, herpublicatie en verkoop onder voorwaarden toe. "
            "Forks en naamwijzigingen kunnen dus rechtmatig zijn. Controleer de repository, "
            "licentie- en auteursrechtvermeldingen en de feitelijke verschillen vóór verdere actie.\n\n"
            "Deze controle ziet geen privé-repositories, niet-geïndexeerde bestanden of kopieën "
            "waarbij herkenningsregels zijn verwijderd of gewijzigd. "
            "Er wordt geen Home Assistant-informatie verzameld of doorgestuurd."
        )
        request("POST", f"{API}/repos/{repository}/issues", token,
                {"title": title, "body": body})
        print(f"Nieuw controle-issue: {suspect}")


def main():
    token = os.environ.get("GH_TOKEN", "")
    repository = os.environ.get("GH_REPO", "")
    if not token or repository != "OnlyRobin/PalaSideBar":
        raise SystemExit("Geen geldig GitHub-token of onverwachte repository; controle afgebroken.")
    try:
        candidates = find_public_repositories(token)
        if candidates:
            notify(token, repository, candidates)
            _summary("afgerond", f"{len(candidates)} mogelijke overeenkomsten gevonden; controleer de aangemaakte of bestaande Issues handmatig.")
        else:
            print("Geen publieke repositories met beide herkenningsregels gevonden.")
            _summary("afgerond", "Geen publiek geïndexeerde repositories met beide herkenningsregels aangetroffen.")
        print("Let op: een lege uitslag is geen bewijs dat er geen kopieën bestaan.")
    except (urllib.error.HTTPError, urllib.error.URLError, ValueError, RuntimeError) as error:
        # Niet doen alsof een 429/403 betekent dat er geen kopieën bestaan.
        message = f"GitHub-zoekcontrole ONVOLLEDIG/MISLUKT: {error}"
        _summary("niet afgerond", message + " Controleer de limieten en voer later opnieuw uit.")
        print(f"::error::{message}", file=sys.stderr)
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()
