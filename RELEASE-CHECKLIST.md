# GitHub / HACS release checklist

Repository: https://github.com/OnlyRobin/PalaSideBar  
Target version: `2.0.0-beta7` (planned prerelease)

## Repository and CI
- [x] GitHub repository created and made **public** by the owner.
- [x] Repository structure uploaded, including `custom_components/pala_sidebar`, `hacs.json`, tests, and docs.
- [x] `.github/workflows/code-checks.yml` and `.github/workflows/validate.yml` committed.
- [x] Integration manifest points to `OnlyRobin/PalaSideBar` and `@OnlyRobin`.
- [x] Source code checks passed on the initial upload.
- [x] HACS validation is now active on the public repository and **passed** on 2026-10-31, workflow run [41203936735](https://github.com/OnlyRobin/PalaSideBar/actions/runs/41203936735).
- [x] Draft release notes: `docs/RELEASE-NOTES-v2.0.0-beta7.md`.
- [x] Dutch public release instructions: [`docs/HACS-PUBLICATIE-NL.md`](docs/HACS-PUBLICATIE-NL.md).
- [x] Ready-to-paste prerelease notes: [`docs/RELEASE-TEXT-v2.0.0-beta7.md`](docs/RELEASE-TEXT-v2.0.0-beta7.md).

## Latest validation (2026-10-31)
- [x] Code checks and **Hassfest passed** after adjusting manifest ordering and adding the config-entry-only schema.
- [x] Current source/asset/publication review recorded in [docs/PUBLICATION-AUDIT-2026-10-31.md](docs/PUBLICATION-AUDIT-2026-10-31.md).
- [x] Compare exact supplied historical `custom-sidebar-master(5).zip` (v17.3.0 / Apache-2.0) with current beta7 runtime and historical v1.3.54/beta3 frontend; no long literal matches found.
- [ ] Close [Issue #1: provenance and licensing](https://github.com/OnlyRobin/PalaSideBar/issues/1) **only after the maintainer confirms the source and asset rights**.
- [x] HACS validation **passed** on the public repository (run [41203936735](https://github.com/OnlyRobin/PalaSideBar/actions/runs/41203936735), attempt 2).

## Required before public HACS prerelease
- [ ] Review `PROVENANCE.md`, identify third-party code/assets, and retain required license and attribution notices.
- [ ] Check for private addresses, credentials, tokens and personal defaults in all tracked files.
- [x] Code checks, Hassfest and public HACS validator succeeded on the release candidate.
- [x] Repository owner made repository **public**. Asset/source rights and Git history should still be reviewed before distribution (issue #1).
- [ ] Run HACS validation successfully as a **public** repository; a skipped job does not count.
- [ ] **Owner action:** Publish a GitHub release (not only a tag): tag `v2.0.0-beta7`, title `PalaSidebar v2.0.0-beta7 — First HACS Beta`, target `main`, mark **pre-release**; copy notes from `docs/RELEASE-TEXT-v2.0.0-beta7.md`. Connected GitHub actions cannot create releases.
- [ ] Add repo to HACS → Custom repositories → Integration and enable prereleases if needed.
- [ ] Test fresh install and update from manual install, desktop and Android Companion app.
- [ ] Complete HACS installation and release announcement only after the above checks.

GitHub release notes are prepared and the repository is public, but **no GitHub tag or release has been created**.