# Beta7 preparation audit

- Built from user-supplied beta6 archive. Existing integration domain, route, config and account preference keys retained.
- Visible former nickname references renamed to **PalaSidebar UI**, including settings tab, previews and labels.
- CSS custom properties renamed consistently. New style setting stored as `ui_style`; previous `palafix` preference is read for migration without modifying user data in place.
- The only remaining old nickname strings in code refer to **specific legacy identifiers**, required to detect/remove stale previously loaded scripts or read old preferences. They do not point to an external dependency or repository.
- Removed obsolete references to an older sidebar project in comments. The package manifest has no declared dependency on that project.
- `LICENSE` (MIT) is included for owned contributions. **Third-party provenance must be audited before publishing** (see `PROVENANCE.md`).
- HACS layout, manifest, icon and version checks prepared; repository URL placeholders remain until actual GitHub owner/repository is known.
- Full cross-device stability and ownership review are not guaranteed by this audit.

## Tests executed for this package

12 individual test scripts passed using their direct Python entry points (some are browser scripts, not pytest functions):

- `test_pala_sidebar_cc.py`
- `test_brand_files.py`
- `test_v2_migration.py`
- `test_beta4_stability.py`
- `test_beta3_unified_sections.py`
- `test_beta6_quick_order.py`
- `test_beta2_interaction.py`
- `test_v2_browser.py`
- `test_restart_browser.py`
- `test_beta5_real_gestures.py`
- `test_beta5_action_safety.py`
- `test_pala_sidebar_cc_browser.py`

`node --check` succeeded for both frontend and loader, Python compilation succeeded, and the HACS layout smoke test passed. Actual HACS/GitHub Actions validation and real-device tests require a published repository and a Home Assistant installation.
