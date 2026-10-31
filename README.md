# PalaSidebar

PalaSidebar is a Home Assistant custom integration with a configurable sidebar and a bundled frontend loader.

**Status:** 2.0.0-beta7 (pre-release). Tested as an installable custom integration; further real-device testing is recommended.

## Features

- Custom sidebar menus, favorites and dashboards
- Live sensor badges and a configurable Live Control Center
- Mobile gestures and contextual shortcut menus
- Theme Studio, typography controls and performance diagnostics
- Per-account preference storage, backups and settings export/import
- Versioned, automatically registered frontend loader (no manual `/www/` resource)

**Repository:** https://github.com/OnlyRobin/PalaSideBar

## Publicatie / First public HACS release

De Nederlandstalige publicatiestappen staan in [HACS-PUBLICATIE-NL.md](docs/HACS-PUBLICATIE-NL.md). Deze repository is voor de eerste release voorbereid; maak hem eerst openbaar, laat de echte HACS-validatie slagen en publiceer daarna pas de GitHub-prerelease `v2.0.0-beta7`. Zie ook de [kant-en-klare releasetekst](docs/RELEASE-TEXT-v2.0.0-beta7.md).

## Installation with HACS

1. Make sure HACS is available in Home Assistant.
2. Open HACS → Custom repositories and add `https://github.com/OnlyRobin/PalaSideBar` as an **Integration**.
3. Install **PalaSidebar** from the repository. Enable pre-releases if installing a beta release.
4. Fully restart Home Assistant.
5. Go to **Settings → Devices & services → Add integration** and add **PalaSidebar**.
6. Remove any previously added *manual* PalaSidebar frontend resource to prevent duplicate loading.

All code required by HACS is in `custom_components/pala_sidebar`. The frontend is registered automatically by the integration.

### Updating from an existing manual install

1. Back up `custom_components/pala_sidebar` and export your sidebar settings.
2. Install this repository as a custom repository in HACS, maintaining the existing `pala_sidebar` domain.
3. Restart Home Assistant. Existing account preferences use the same storage keys and the UI styling settings are migrated automatically.
4. If you have a custom `pala-sidebar-config.json` stored in the integration directory, **back it up separately** before HACS takes over: HACS can replace bundled files on update.

**Do not rename the integration domain** (`pala_sidebar`) because it would break existing config entries and resource paths.

## Configuration

Open the sidebar settings menu. The current beta includes a Live Control Center, long-press/desktop context menus, Theme Studio, and a Performance Center. The UI settings previously shown with an older nickname are now under **PalaSidebar UI**. Older styling preferences are migrated by the application and existing values are read as a fallback.

## Compatibility

Built for Home Assistant custom integrations. Brand images are included locally for Home Assistant 2026.3+. Exact support for older Home Assistant versions and device-specific Android gestures has not been verified.

## Development

- Manifest: `custom_components/pala_sidebar/manifest.json`
- Python backend: `custom_components/pala_sidebar/__init__.py`
- Frontend: `custom_components/pala_sidebar/frontend/pala-sidebar.js`
- Loader: `custom_components/pala_sidebar/frontend/pala-sidebar-loader.js`
- Tests: `tests/` and `.github/workflows/`

## Publishing checklist

Before making this repository public, review `PROVENANCE.md` and verify the licensing of every reused source file and asset. The repository is initially private; HACS installation requires that the Home Assistant installation can access the repository.

## License

This repository includes a proposed MIT `LICENSE` for original PalaSidebar contributions. **It does not cancel third-party copyright, attribution or license obligations.** See `PROVENANCE.md` before publishing.
