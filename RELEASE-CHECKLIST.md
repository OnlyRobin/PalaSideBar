# GitHub / HACS release checklist

Repository: https://github.com/OnlyRobin/PalaSideBar  
Published beta: `2.0.0-beta7` (GitHub prerelease, 2026-10-31)

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

## Copyright and licensing
- [x] MIT LICENSE attributes original PalaSidebar code to **Robin Bouwman (2026)** on `develop`.
- [x] README and frontend code header use the same copyright attribution on `develop`.
- [ ] Merge copyright/documentation updates to `main` only after review and passing tests. The existing `v2.0.0-beta7` tag is immutable.

## Latest validation (2026-10-31)
- [x] Code checks and **Hassfest passed** after adjusting manifest ordering and adding the config-entry-only schema.
- [x] Current source/asset/publication review recorded in [docs/PUBLICATION-AUDIT-2026-10-31.md](docs/PUBLICATION-AUDIT-2026-10-31.md).
- [x] Compare exact supplied historical `custom-sidebar-master(5).zip` (v17.3.0 / Apache-2.0) with current beta7 runtime and historical v1.3.54/beta3 frontend; no long literal matches found.
- [ ] Close [Issue #1: provenance and licensing](https://github.com/OnlyRobin/PalaSideBar/issues/1) **only after the maintainer confirms the source and asset rights**.
- [x] HACS validation **passed** on the public repository (run [41203936735](https://github.com/OnlyRobin/PalaSideBar/actions/runs/41203936735), attempt 2).

## Completed release steps and post-release follow-up
- [x] Source provenance and exact older ZIP comparison documented in `PROVENANCE.md`; third-party rights concerns remain explicitly tracked in issue #1.
- [x] Static scan of tracked release files performed; historical Git content and any third-party license rights should remain under review.
- [x] Code checks, Hassfest and public HACS validator succeeded on the release commit.
- [x] Repository owner made repository **public**. Asset/source rights and Git history should still be reviewed before distribution (issue #1).
- [x] HACS validation succeeded on the public repository; see [successful run](https://github.com/OnlyRobin/PalaSideBar/actions/runs/41205006660).
- [x] **Published** GitHub prerelease [`v2.0.0-beta7`](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-beta7) on 2026-10-31, title `PalaSidebar v2.0.0-beta7 — First HACS Beta`. Verified public, not draft, prerelease flag true, manifest version matches.
- [ ] Add repo to HACS → Custom repositories → Integration and enable prereleases if needed.
- [ ] Test fresh install and update from manual install, desktop and Android Companion app.
- [ ] Complete HACS installation and release announcement only after the above checks.

**GitHub prerelease `v2.0.0-beta7` is live**. Code checks, Hassfest, and public HACS validation passed on its commit. Next: verify real HACS installation and migration from any manual install. Issue #1 remains open for follow-up provenance/asset review.