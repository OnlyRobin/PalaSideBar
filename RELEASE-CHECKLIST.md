# GitHub/HACS release checklist

- [x] Create GitHub repository `OnlyRobin/PalaSideBar` (private until provenance review).
- [x] Set `manifest.json` documentation and issue tracker links to `OnlyRobin/PalaSideBar` and codeowner to `@OnlyRobin`.
- [ ] Update `codeowners` when the actual GitHub maintainer is known.
- [ ] Complete PROVENANCE.md review and all needed third-party license notices.
- [ ] Enable GitHub Issues, set description and `home-assistant`, `hacs`, `custom-integration`, `sidebar` topics.
- [ ] Commit repository contents preserving `custom_components/pala_sidebar` and `hacs.json`.
- [ ] Push to GitHub and run validation CI. Resolve failures.
- [ ] Create a GitHub **pre-release** tag `v2.0.0-beta7`, matching `manifest.json` version (no separate release ZIP configured).
- [ ] In HACS choose Custom repository → Integration and enable pre-releases if desired.
- [ ] Back up custom settings and install, then restart HA and add integration under Devices & services.
- [ ] Test on Android Companion app and desktop (menus, gestures, refresh, settings, reload).
