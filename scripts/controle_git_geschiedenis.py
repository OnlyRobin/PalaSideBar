#!/usr/bin/env python3
"""Inspecteer alle bereikbare Git-objecten zonder gevonden waarden te tonen."""
from __future__ import annotations
import collections
import json
import os
from pathlib import Path
import re
import subprocess
import sys

def git(*args: str) -> bytes:
    return subprocess.check_output(["git", *args], stderr=subprocess.PIPE)

def main() -> int:
    refs = git("for-each-ref", "--format=%(refname)", "refs/heads", "refs/remotes", "refs/tags").decode().splitlines()
    commit_shas = git("rev-list", "--all").decode().splitlines()
    object_lines = git("rev-list", "--objects", "--all").decode().splitlines()
    object_paths: dict[str, set[str]] = {}
    for line in object_lines:
        sha, _, path = line.partition(" ")
        object_paths.setdefault(sha, set())
        if path:
            object_paths[sha].add(path)
    ref_counts = collections.Counter(
        "lokale_branches" if x.startswith("refs/heads/") else
        "remote_branches" if x.startswith("refs/remotes/") else "tags"
        for x in refs
    )
    objectids = list(object_paths)
    proc = subprocess.Popen(["git", "cat-file", "--batch"], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    assert proc.stdin is not None and proc.stdout is not None
    found = collections.Counter()
    blob_count = 0
    scanned_text_bytes = 0
    binary_count = 0
    asset_paths: set[str] = set()
    for oid in objectids:
        proc.stdin.write((oid + "\n").encode("ascii"))
        proc.stdin.flush()
        hdr = proc.stdout.readline().decode("ascii", errors="replace").strip().split()
        if len(hdr) != 3 or hdr[0] != oid:
            raise RuntimeError("Git-objectheader klopt niet")
        _, typ, size = hdr
        size = int(size)
        payload = proc.stdout.read(size)
        proc.stdout.read(1)
        if typ != "blob":
            continue
        blob_count += 1
        paths = object_paths.get(oid) or set()
        for path in paths:
            suffix = Path(path).suffix.lower()
            if suffix in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ttf", ".woff", ".woff2", ".mp3", ".mp4"}:
                asset_paths.add(path)
            if re.search(r"(^|/)(secrets\.ya?ml|\.env(?:\..*)?|id_rsa|id_ed25519|credentials\.json|\.storage/auth(?:$|/)|auth\.json|passwords?\.txt|.*\.(?:p12|pfx|key|pem|sqlite|sqlite3|db))$", path, re.I):
                found["verdachte_historische_bestandsnamen"] += 1
        if b"\x00" in payload[:8192] or size > 4_000_000:
            binary_count += 1
            continue
        scanned_text_bytes += size
        if re.search(rb"(?<![0-9])(?:10\.(?:[0-9]{1,3}\.){2}[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|172\.(?:1[6-9]|2[0-9]|3[01])\.[0-9]{1,3}\.[0-9]{1,3})(?![0-9])", payload):
            found["prive_ipv4_in_historische_blob"] += 1
        if re.search(rb"-----BEGIN (?:OPENSSH|RSA|EC|DSA|PRIVATE) PRIVATE KEY-----", payload, re.I):
            found["privatesleutel_in_historische_blob"] += 1
        if re.search(rb"(?:https?://)[^\s<>\"']+:[^\s<>\"']+@", payload, re.I):
            found["url_met_inloggegevens"] += 1
        risk = False
        for m in re.finditer(
            rb"(?im)^\s*(?:export\s+|(?:const|let|var)\s+)?"
            rb"(?:(?:[a-z_]*)(?:password|passwd|api_?key|client_?secret|access_?token|private_?key|auth_?token))"
            rb"\s*[:=]\s*([^\r\n]{6,180})", payload
        ):
            value = m.group(1).strip().strip(b"',;\" ")
            if not value or value in {b"null", b"undefined", b"None", b"REDACTED"}:
                continue
            if any(x in value.lower() for x in (b"\x24{", b"{{", b"example", b"placeholder", b"dummy", b"your_", b"process.env", b"os.environ", b"secrets.", b"config.")):
                continue
            risk = True
            break
        if risk:
            found["mogelijk_ingevuld_credentialveld"] += 1
    proc.stdin.close()
    proc.wait(timeout=30)
    if proc.returncode != 0:
        raise RuntimeError("git cat-file fout")
    emails = set(git("log", "--all", "--format=%ae%n%ce").decode(errors="replace").splitlines())
    private_like = [x for x in emails if x and not (x.endswith("users.noreply.github.com") or x.endswith("@github.com"))]
    report = {
        "bereikbare_commits": len(commit_shas),
        "refs": dict(ref_counts),
        "unieke_git_objecten": len(objectids),
        "unieke_blobs": blob_count,
        "tekst_bytes_onderzocht": scanned_text_bytes,
        "binair_of_zeer_groot": binary_count,
        "historische_asset_paden": len(asset_paths),
        "asset_soorten": dict(collections.Counter(Path(x).suffix.lower() for x in asset_paths)),
        "unieke_auteur_committer_emailadressen": len(emails),
        "niet_github_noreply_emailadressen_in_commitmetadata": len(private_like),
        "risicos_per_categorie": dict(found),
    }
    out = os.environ.get("AUDIT_SUMMARY_PATH")
    if out:
        Path(out).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Geschiedenis onderzocht: alle bereikbare branches, tags en commits.")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if found:
        print("WAARSCHUWING: mogelijke gevoelige bestanden/waarden; handmatige opvolging nodig.")
        return 2
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print("SCANFOUT:", type(exc).__name__)
        sys.exit(3)
