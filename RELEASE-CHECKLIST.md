# GitHub / HACS release checklist

Repository: https://github.com/OnlyRobin/PalaSideBar  
Target version: `2.0.0-beta7` (planned prerelease)

## Repository and CI
- [x] GitHub repository created; keep it **private** until provenance review is finished.
- [x] Repository structure uploaded, including `custom_components/pala_sidebar`, `hacs.json`, tests, and docs.
- [x] `.github/workflows/code-checks.yml` and `.github/workflows/validate.yml` committed.
- [x] Integration manifest points to `OnlyRobin/PalaSideBar` and `@OnlyRobin`.
- [x] Source code checks passed on the initial upload.
- [x] HACS validation identified as unavailable for private repositories; workflow skips it until public.
- [x] Draft release notes: `docs/RELEASE-NOTES-v2.0.0-beta7.md`.

## Required before public HACS prerelease
- [ ] Review `PROVENANCE.md`, identify third-party code/assets, and retain required license and attribution notices.
- [ ] Check for private addresses, credentials, tokens and personal defaults in all tracked files.
- [ ] Test after the latest workflow edits; confirm Code checks success.
- [ ] Make repository public when source and asset redistribution rights are confirmed.
- [ ] Run HACS validation successfully as a **public** repository; a skipped job does not count.
- [ ] Create release tag `v2.0.0-beta7` and mark it **pre-release**.
- [ ] Add repo to HACS → Custom repositories → Integration and enable prereleases if needed.
- [ ] Test fresh install and update from manual install, desktop and Android Companion app.
- [ ] Complete HACS installation and release announcement only after the above checks.

GitHub release notes are prepared, but **no tag, release or publication has been created**.