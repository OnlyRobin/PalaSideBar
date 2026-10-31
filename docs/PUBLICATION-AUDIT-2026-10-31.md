# PalaSidebar public-release audit — 2026-10-31

Status: **NOT CLEARED FOR PUBLIC RELEASE**. The repository intentionally remains private.

## Technical checks verified on GitHub

- Integration domain: `pala_sidebar`; source under `custom_components/pala_sidebar`.
- `hacs.json`, manifest and version `2.0.0-beta7` are present.
- **Code checks: passed** on commit `e05efc7`.
- **Hassfest: passed** on commit `e05efc7`, after sorting manifest fields and defining a config-entry-only schema.
- HACS action is *skipped* for private repositories by design; this is **not** a HACS validation pass.
- Local `brand/` assets are present; Home Assistant 2026.3+ supports custom integration brand assets locally.

## Source-origin findings and limitations

- The currently tracked frontend `pala-sidebar.js` was compared with the main source file from `elchininet/custom-sidebar` (Apache License 2.0) and distribution scripts from `galloween/custom-sidebar-v2` and `Villhellm/custom-sidebar`.
- A heuristic comparison of **16 consecutive JavaScript identifiers** found zero matching windows between the PalaSidebar frontend and those three files. The PalaSidebar JavaScript also has no literal `custom-sidebar` code references.
- These checks **do not prove independent authorship**: historical revisions, other upstream modules, copied architecture, adapted snippets and the exact former local `custom-sidebar-master.zip` were not compared.
- The known upstream `elchininet/custom-sidebar` carries **Apache-2.0**. An older file may have different rights. No conclusion is made about the licensing status of the other two projects merely because `LICENSE` was not found at the inspected path.
- `LICENSE` (MIT) may cover original PalaSidebar contributions only. If any third-party source is reused, its applicable copyright, licensing and attribution requirements must be preserved; renaming code does not remove that obligation.
- The eight logo PNGs are in the repository. Confirm the rights to redistribute the project logo and any non-generated assets.

## Privacy and publication-safety scan

Examined release-package text files for common credential assignments, RFC1918 IP addresses, hardcoded private hostnames, e-mail addresses and absolute HTTP URLs. No apparent live secrets, private IP addresses, or personal service hostnames were found. The observed URL values were documentation links, SVG XML namespaces and examples.

This is a pattern scan, **not** a guaranteed secrets audit. Check previous commits and all local-only config files before publication.

## Unresolved gate — maintainer confirmation required

- [ ] Confirm origin of the current implementation, and identify any code adapted from another sidebar project.
- [ ] Compare the exact historical upstream ZIP/version originally used as reference, if available.
- [ ] If code or assets were reused, add the exact original license and required notices/credits and check compatibility before publishing.
- [ ] Confirm that all committed icons/logos and media can be publicly redistributed.
- [ ] Confirm there are no secrets or personally identifying defaults in Git history.

After the gate is cleared:
1. Make the repository public.
2. Let **HACS validation** run and fix any failures.
3. Re-run Code checks and Hassfest against the release commit.
4. Create an actual GitHub **pre-release** (not only a tag) named `v2.0.0-beta7`.
5. Test installation/update in a real Home Assistant system through HACS custom repositories.

Sources:
- https://github.com/elchininet/custom-sidebar (upstream project; Apache-2.0)
- https://github.com/galloween/custom-sidebar-v2
- https://github.com/Villhellm/custom-sidebar
- https://contributors.home-assistant.io/core/integrations/brands/
- https://hacs.dev/docs/publish/integration/
