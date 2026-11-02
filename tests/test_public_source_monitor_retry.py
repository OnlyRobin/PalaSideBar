"""Gerichte offline regressietests voor GitHub-rate-limits en veilige herhaalpogingen."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from unittest.mock import patch
import io
import json
import os
import tempfile
import urllib.error

spec = spec_from_file_location(
    "source_watch_retry",
    Path(__file__).resolve().parents[1] / "scripts/watch_palasidebar_reuse.py",
)
watch = module_from_spec(spec)
spec.loader.exec_module(watch)

URL = "https://api.github.com/search/code?q=PALASIDEBAR"


def error(status, headers=None, body="API rate limit exceeded"):
    return urllib.error.HTTPError(
        URL, status, "HTTP failure", headers or {},
        io.BytesIO(json.dumps({"message": body}).encode("utf-8")),
    )


def response(data):
    return io.BytesIO(json.dumps(data).encode("utf-8"))


def run_request(outcomes):
    with patch.object(watch.urllib.request, "urlopen", side_effect=outcomes) as urlopen:
        with patch.object(watch.time, "sleep") as sleep:
            with patch.object(watch.time, "time", return_value=1000):
                try:
                    value = watch.request("GET", URL, "fake-token")
                except Exception as failure:
                    return None, failure, sleep.call_args_list, urlopen.call_count
                return value, None, sleep.call_args_list, urlopen.call_count


# 429 met Retry-After: header bepaalt wachttijd en daarna opnieuw proberen.
value, failure, sleeps, count = run_request([
    error(429, {"Retry-After": "4"}), response({"items": []}),
])
assert failure is None and value == {"items": []}
assert [call.args[0] for call in sleeps] == [4], sleeps
assert count == 2

# 429 zonder headers: GitHub vereist minimaal een minuut bij secundaire limieten.
value, failure, sleeps, count = run_request([
    error(429), error(429), response({"items": []}),
])
assert failure is None and count == 3
assert [call.args[0] for call in sleeps] == [60, 120], sleeps

# Na drie pogingen moet het resultaat expliciet ONVOLLEDIG blijven, niet leeg/succes.
value, failure, sleeps, count = run_request([
    error(429), error(429), error(429),
])
assert isinstance(failure, RuntimeError) and "onvolledig" in str(failure)
assert count == 3 and len(sleeps) == 2

# Ook GitHubs werkelijk gemelde 253 seconden moeten worden gerespecteerd.
value, failure, sleeps, count = run_request([
    error(429, {"Retry-After": "253"}), response({"items": []}),
])
assert failure is None and count == 2
assert [call.args[0] for call in sleeps] == [253], sleeps

# 403 zonder rate-limit-signaal: niet nogmaals proberen (bv. foutieve rechten).
value, failure, sleeps, count = run_request([
    error(403, body="Resource not accessible by integration"),
])
assert isinstance(failure, urllib.error.HTTPError)
assert count == 1 and not sleeps

# Primaire rate-limit: resetmoment respecteren.
value, failure, sleeps, count = run_request([
    error(403, {"X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "1060"}),
    response({"items": []}),
])
assert failure is None and count == 2
assert [call.args[0] for call in sleeps] == [61], sleeps

# Ook bij de werkelijk opgetreden wachttijd van 736 seconden doorgaan.
value, failure, sleeps, count = run_request([
    error(429, {"Retry-After": "736"}), response({"items": []}),
])
assert failure is None and count == 2
assert [call.args[0] for call in sleeps] == [736], sleeps

# Lange maar redelijke resetmomenten kunnen binnen het jobbudget aflopen.
value, failure, sleeps, count = run_request([
    error(429, {"Retry-After": "600"}), response({"items": []}),
])
assert failure is None and count == 2
assert [call.args[0] for call in sleeps] == [600], sleeps

# Buiten het individuele wachtbudget meteen stoppen met een eerlijke fout.
value, failure, sleeps, count = run_request([
    error(429, {"Retry-After": "2500"}),
])
assert isinstance(failure, RuntimeError) and "onvolledig" in str(failure)
assert count == 1 and not sleeps

# Ook cumulatief mag de monitor niet onbeperkt blijven slapen.
value, failure, sleeps, count = run_request([
    error(429, {"Retry-After": "1100"}),
    error(429, {"Retry-After": "1100"}),
])
assert isinstance(failure, RuntimeError) and "onvolledig" in str(failure)
assert count == 2 and [call.args[0] for call in sleeps] == [1100]

# Serverfout mag wel kort opnieuw worden geprobeerd.
value, failure, sleeps, count = run_request([
    error(503), response({"items": []}),
])
assert failure is None and count == 2
assert [call.args[0] for call in sleeps] == [3], sleeps

# POST mag ook bij een tijdelijke fout nooit opnieuw worden verzonden.
with patch.object(watch.urllib.request, "urlopen", side_effect=[
    error(503), response({"number": 100}),
]) as urlopen:
    with patch.object(watch.time, "sleep") as sleep:
        try:
            watch.request("POST", "https://api.github.com/repos/OnlyRobin/PalaSideBar/issues",
                          "fake-token", {"title": "Controlerapport"})
        except urllib.error.HTTPError as failure:
            assert failure.code == 503
        else:
            raise AssertionError("POST is onterecht opnieuw geprobeerd")
        assert urlopen.call_count == 1
        sleep.assert_not_called()

# API-resultaat met incomplete_results=true mag geen lege geslaagde scan worden.
with patch.object(watch, "request", return_value={"incomplete_results": True, "items": []}):
    try:
        watch.find_public_repositories("fake-token")
    except RuntimeError as failure:
        assert "incomplete_results" in str(failure)
    else:
        raise AssertionError("Onvolledige Code Search-uitslag werd als volledig behandeld")

# Bij mislukte GitHub-zoekopdracht geen nep-succes en geen notificatie.
with tempfile.TemporaryDirectory() as folder:
    summary_path = Path(folder) / "summary.md"
    env = {
        "GH_TOKEN": "fake-token",
        "GH_REPO": "OnlyRobin/PalaSideBar",
        "GITHUB_STEP_SUMMARY": str(summary_path),
    }
    with patch.dict(os.environ, env):
        with patch.object(watch, "find_public_repositories", side_effect=RuntimeError("zoekcontrole onvolledig")):
            with patch.object(watch, "notify") as notify:
                try:
                    watch.main()
                except SystemExit as failure:
                    assert failure.code == 1, failure.code
                else:
                    raise AssertionError("Mislukte scan had geen foutcode")
                notify.assert_not_called()
    summary = summary_path.read_text(encoding="utf-8")
    assert "niet afgerond" in summary and "onvolledig" in summary

print("PASS rate-limit-tests: 429/403, Retry-After, reset, 503, maximaal wachten en geen vals succes")
