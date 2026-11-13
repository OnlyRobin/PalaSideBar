"""Premium release: AutoLoader only advertises genuinely NEWER versions.

Prevents wrong update banners during rollback, partial updates or stale caches.
The test uses the real loader in Chromium but replaces only the dynamic import.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1] / "custom_components/pala_sidebar/frontend"
loader = (ROOT/"pala-sidebar-loader.js").read_text(encoding="utf-8")
version = json.loads((ROOT/"pala-sidebar-version.json").read_text(encoding="utf-8"))["version"]
mock = loader.replace("await import(MAIN + query)", "await window.__testImport(MAIN + query)")
assert mock != loader, "Unable to stub frontend import"

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path="/usr/bin/chromium",
        args=["--no-sandbox", "--disable-dev-shm-usage"])
    scenarios = [
        ("2.0.1-rc.7", "2.0.1-rc.6", False),
        ("2.0.1-rc.7", "2.0.1-beta9", False),
        ("2.0.1-rc.7", "2.0.1-rc.7", False),
        ("2.0.1-rc.7", "2.0.1-rc.8", True),
        ("2.0.1-rc.7", "2.0.1", True),
        ("2.0.1", "2.0.1-rc.7", False),
        ("2.0.1", "2.0.0", False),
        ("2.0.1", "2.0.2", True),
    ]
    assert version == "2.0.1-rc.7", version
    for width in (390, 1280):
        for loaded, next_version, should_show in scenarios:
            page = browser.new_page(viewport={"width": width, "height": 850})
            errors = []
            page.on("pageerror", lambda err: errors.append(str(err)))
            page.set_content("<html><body></body></html>")
            page.evaluate("""v => {
              window.__networkVersion=v;
              window.__imports=[];
              window.__testImport=async url=>window.__imports.push(url);
              window.fetch=async url=>({ok:true,json:async()=>({schema:1,version:window.__networkVersion})});
            }""", loaded)
            page.evaluate(mock)
            page.wait_for_function("(v)=>window.PalaSidebarUpdater?.status().loaded===v",
                                   arg=loaded, timeout=10000)
            page.evaluate("(v)=>window.__networkVersion=v", next_version)
            page.evaluate("window.PalaSidebarUpdater.check()")
            visible = page.locator("#palasidebar-update-notice").count() > 0
            assert visible == should_show, {
                "width": width, "loaded": loaded, "next": next_version,
                "actual": visible, "expected": should_show}
            # A genuine upgrade banner must be removed if version.json is
            # subsequently rolled back or the server presents the loaded version.
            if should_show:
                page.evaluate("(v)=>window.__networkVersion=v", loaded)
                page.evaluate("window.PalaSidebarUpdater.check()")
                assert page.locator("#palasidebar-update-notice").count() == 0, (
                    width, loaded, next_version)
            assert not errors, (width, loaded, next_version, errors)
            page.close()
        print("PASS AutoLoader semantic version comparisons on", width, "pixels")
    browser.close()
