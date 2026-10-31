# PalaSidebar v2.0.0-beta7 — release notes (DRAFT)

> **Not yet published.** Keep the repository private until source provenance and third-party license obligations have been reviewed.

## What's included

- PalaSidebar UI branding and HACS-ready `custom_components/pala_sidebar` layout.
- Configurable menus, favorites, dashboard shortcuts and account-specific preferences.
- Live Control Center and theme-aware sidebar sections.
- Context menus and drag-to-reorder dashboard shortcuts.
- Theme Studio and Performance Center.
- Admin-only Home Assistant restart control with confirmation.
- Automatically registered frontend loader.

## Before publishing

1. Complete the provenance review in `PROVENANCE.md` and preserve any required third-party notices.
2. Check public files for keys, private URLs, usernames, credentials and personal defaults.
3. Verify GitHub Actions **Code checks** passes.
4. After the repository can be made public, enable **HACS validation** and resolve any failures.
5. Check PalaSidebar in the Android Companion app and on desktop, including backpress and long-press.
6. Create GitHub release tag **`v2.0.0-beta7`** and mark it **pre-release**.
7. Add this GitHub repository as an **Integration** in HACS custom repositories and enable pre-releases if needed.

The HACS validation action cannot validate private repositories. The workflow is configured to skip it while private, not treat the skip as an actual HACS pass.

## Upgrade notes

- Back up the current `custom_components/pala_sidebar` and export settings first.
- Preserve any local custom configuration separately when migrating from a manual install to HACS.
- Do **not** rename the integration domain `pala_sidebar`.
- Restart Home Assistant after installation; check frontend cache only if old assets persist.
