#!/usr/bin/env python3
"""Zoek wekelijks best-effort naar publieke PalaSidebar-broncodekopieën.

Geen telemetry, geen Home Assistant-gegevens en GEEN juridische inbreukdetectie.
Alleen publiek geïndexeerde GitHub-code met twee onafhankelijke herkenningsregels.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.github.com"
FINGERPRINTS = (
    "PALASIDEBAR_ORIGIN_ROBIN_2026",
    "PALASIDEBAR_AUTOLOADER_ROBIN_2026",
)
ORIGINAL = "onlyrobin/palasidebar"
AGENT = "PalaSidebar-public-source-monitor/1.0"


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
    with urllib.request.urlopen(req, timeout=25) as response:
        return json.load(response)


def find_public_repositories(token: str):
    """Code Search is incomplete: renamed/deleted markers or unindexed code is invisible."""
    results = {}
    for mark in FINGERPRINTS:
        query = urllib.parse.urlencode({"q": f'"{mark}" in:file', "per_page": 100})
        answer = request("GET", f"{API}/search/code?{query}", token)
        if answer.get("incomplete_results"):
            print(f"WAARSCHUWING: GitHub meldt onvolledige zoekresultaten voor {mark}.")
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
            + "".join(f"- \`{mark}\`\n" for mark in sorted(matched))
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
        else:
            print("Geen publieke repositories met beide herkenningsregels gevonden.")
        print("Let op: een lege uitslag is geen bewijs dat er geen kopieën bestaan.")
    except (urllib.error.HTTPError, urllib.error.URLError, ValueError) as error:
        # Fail conspicuously; never silently claim that monitoring succeeded.
        print(f"GitHub-zoekcontrole ONVOLLEDIG/MISLUKT: {error}", file=sys.stderr)
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()
