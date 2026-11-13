# PalaSidebar

**© Robin Bouwman 2026** · Licensed under MIT.

PalaSidebar is a Home Assistant custom integration with a configurable sidebar and a bundled frontend loader.

> **Historische beta-branch.** Deze README beschrijft oudere ontwikkeling. De actuele, gepubliceerde Stable is **[v2.0.1](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1)**; de recentste RC in deze reeks is **[v2.0.1-rc.7](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1-rc.7)**. Zie de [actuele README op main](https://github.com/OnlyRobin/PalaSideBar/blob/main/README.md) voor huidige functies.

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

## Installation via Home Assistant Marketplace (2026.11+)

**Home Assistant 2026.11 and later includes Marketplace (formerly HACS).** There is no separate HACS installation. PalaSidebar remains a third-party custom integration.

1. Open **Settings → Marketplace** as an administrator and accept the community software warning when first prompted.
2. Search for **PalaSidebar**. If it is not in the catalog, select **Add from link** (top right) and enter `https://github.com/OnlyRobin/PalaSideBar`.
3. When prompted, connect your GitHub account using the provided device sign-in code. Select type **Integration** if the Marketplace cannot identify it automatically.
4. Open the PalaSidebar repository page, select **Install**, and choose the current Stable **v2.0.1** for everyday use.
5. Follow the integration setup prompt. Restart Home Assistant when needed; if necessary, add it under **Settings → Devices & services → Add integration**.
6. Remove any previous manually added PalaSidebar frontend resource to avoid duplicate loading.

**For an RC:** Enable the repository's disabled **Pre-release** entity under **Settings → Devices & services → Marketplace**, then turn on its switch. To select a specific release, open the Marketplace repository page and choose **⋮ → Install another version**.

**Updating and recovery:** Marketplace updates are shown under **Settings → Updates**. Back up Home Assistant before updating and restore the backup if the update fails. Do **not** use *Install another version* as a routine rollback method.

**Home Assistant 2026.10 and older:** Use the separate HACS integration. Existing HACS repositories and installations migrate automatically on upgrade to 2026.11.

The frontend is automatically registered from `custom_components/pala_sidebar`; do not add any extra `frontend.extra_module_url` or Lovelace resource.

### Updating from an existing manual install

1. Back up `custom_components/pala_sidebar` and export your sidebar settings.
2. Install this repository from **Settings → Marketplace → Add from link** (or legacy HACS on Home Assistant 2026.10 and older), keeping the existing `pala_sidebar` domain.
3. Restart Home Assistant. Existing account preferences use the same storage keys and the UI styling settings are migrated automatically.
4. If you have a custom `pala-sidebar-config.json` stored in the integration directory, **back it up separately** before HACS takes over: Marketplace can replace bundled files on update.

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
