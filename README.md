# PalaSidebar

**© Robin Bouwman 2026** · Licensed under MIT.

PalaSidebar is a Home Assistant custom integration with a configurable sidebar and a bundled frontend loader.

**Latest HACS test release:** [v2.0.0-rc2](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc2) (pre-release; fixes missing UI settings, subtitle and BEHEER links). **Previous release:** [v2.0.0-rc1](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc1). **Stable v2.0.0** remains unreleased pending real-device tests.

## Features

- Custom sidebar menus, favorites and dashboards
- Live sensor badges and a configurable Live Control Center
- Mobile gestures and contextual shortcut menus
- Theme Studio, typography controls and performance diagnostics
- Per-account preference storage, backups and settings export/import
- Versioned, automatically registered frontend loader (no manual `/www/` resource)

**Repository:** https://github.com/OnlyRobin/PalaSideBar

## Publicatie / First public HACS release

De eerste publieke prerelease is [v2.0.0-beta7](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-beta7). GitHub Actions (Code checks, Hassfest en HACS-validatie) zijn geslaagd. De historische publicatie-instructies staan in [HACS-PUBLICATIE-NL.md](docs/HACS-PUBLICATIE-NL.md); nieuwe wijzigingen verlopen via de `develop`-branch en worden na controle naar `main` gemerged.

## Develop-branch testen

Voor veilig testen en terugzetten van de ontwikkelversie: [Nederlandstalige instructies en testchecklist](docs/DEVELOP-TESTEN-NL.md). De actuele `develop`-branch wordt **niet** automatisch als normale HACS-release geïnstalleerd: gebruik de geteste GitHub Actions-ZIP, liefst op een aparte Home Assistant-testinstantie.

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

This repository is public. Read `PROVENANCE.md` and [the publication audit](docs/PUBLICATION-AUDIT-2026-10-31.md) for source and asset provenance; public visibility does not waive third-party license obligations. The first HACS prerelease must only be published after the live HACS validator passes.

## License

**Copyright © 2026 Robin Bouwman.** PalaSidebar is distributed under the [MIT license](LICENSE) for the original code and assets the copyright holder has the right to license. Third-party materials, if included, retain their applicable license and attribution obligations; see [PROVENANCE.md](PROVENANCE.md).
