"""Controleer filter en deduplicatie van de openbare GitHub-broncodebewaking."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

spec=spec_from_file_location("source_watch",Path(__file__).resolve().parents[1]/"scripts/watch_palasidebar_reuse.py")
watch=module_from_spec(spec)
spec.loader.exec_module(watch)

calls=[]
def fake_request(method,url,token,payload=None):
    calls.append((method,url,payload))
    if "search/code" in url:
        from urllib.parse import parse_qs,urlparse
        q=parse_qs(urlparse(url).query)["q"][0]
        if "PALASIDEBAR_ORIGIN_ROBIN_2026" in q:
            repos=["OnlyRobin/PalaSideBar","Someone/changed-app","Someone/single-marker"]
        else:
            repos=["OnlyRobin/PalaSideBar","Someone/changed-app"]
        return {"total_count":len(repos),"items":[{"repository":{"full_name":n}} for n in repos]}
    if "/issues?" in url:
        return [{"title":"Broncode-overeenkomst controleren: Old/previous-match"}]
    if method=="POST" and url.endswith("/issues"):
        return {"number":13}
    raise AssertionError(url)

watch.request=fake_request
results=watch.find_public_repositories("fake-token")
assert results=={"Someone/changed-app":set(watch.FINGERPRINTS)},results
watch.notify("fake-token","OnlyRobin/PalaSideBar",results)
posted=[c for c in calls if c[0]=="POST"]
assert len(posted)==1,posted
assert posted[0][2]["title"]=="Broncode-overeenkomst controleren: Someone/changed-app",posted
assert "geen bewijs" in posted[0][2]["body"] and "MIT-licentie" in posted[0][2]["body"]
assert all("OnlyRobin/PalaSideBar" not in c[2]["title"] for c in posted)
print("PASS GitHub-monitor: twee fingerprints vereist, eigen repo uitgesloten, menselijke review en geen valse juridische claim")
