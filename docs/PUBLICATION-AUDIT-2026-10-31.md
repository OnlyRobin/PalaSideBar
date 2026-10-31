# PalaSidebar public-release audit — 2026-10-31

**Historical audit (31 October 2026).** At the time of the initial audit, the repository was private. The repository was subsequently made **public** and prerelease [v2.0.0-beta7](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-beta7) was published after Code checks, Hassfest and public HACS validation passed. The findings below document the original review and its limits; public release does not prove ownership of any third-party sources/assets. Copyright notice for original PalaSidebar code: **© Robin Bouwman 2026**. Remaining questions are tracked in [issue #1](https://github.com/OnlyRobin/PalaSideBar/issues/1).

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
- These checks **do not prove independent authorship**: historical revisions, conceptual reuse, adapted algorithms and human source-origin information still require review. The exact original ZIP has now also been compared; see the detailed section below.
- The known upstream `elchininet/custom-sidebar` carries **Apache-2.0**. An older file may have different rights. No conclusion is made about the licensing status of the other two projects merely because `LICENSE` was not found at the inspected path.
- `LICENSE` (MIT) may cover original PalaSidebar contributions only. If any third-party source is reused, its applicable copyright, licensing and attribution requirements must be preserved; renaming code does not remove that obligation.
- The eight logo PNGs are in the repository. Confirm the rights to redistribute the project logo and any non-generated assets.

## Exact uploaded upstream archive comparison (2026-10-31)

The user supplied `custom-sidebar-master(5).zip`, identified by its own `package.json` as **`elchininet/custom-sidebar` version 17.3.0** under **Apache-2.0**. The ZIP contains 469 entries, including `src/`, `dist/`, a full Apache-2.0 `LICENSE`, and a bundled `.hass/` test environment.

- Original archive SHA-256: `d46a81b744818659b3320d5a5c47e493e2c72a4bfe1e48b6d0e034f2981167e4`.
- Upstream code tested: **30** source and compiled JavaScript/TypeScript/CSS files under `src/` and `dist/` (total 304,085 bytes).
- Current code tested: **10** JavaScript/Python/JSON/CSS runtime files in `custom_components/pala_sidebar` (543,222 UTF-8 bytes), matching the frontend size of the tracked beta7 release. The two Python manifest/schema commits on GitHub do not change frontend source.
- **Exact 80-character test:** indexed all 292,899 upstream 80-character code windows and tested all 541,952 code windows from the current runtime files; **zero matches**. Hash collisions would increase false positives, not hide exact matches. These findings concern matching contiguous text, not licenses.
- **Identifier-sequence test:** compared eight consecutive JavaScript/TypeScript identifiers across the same code files; **zero matches**.
- **Historical check:** the additional PalaSidebar v1.3.54 and v2.0.0-beta3 frontend snapshots were also checked against the same exact old source archive: **zero 80-character matches and zero eight-identifier matches** in each. This supports continuity of independent-looking code across those versions, but does not prove independent design.
- Checked runtime source files for `custom-sidebar`, `custom_sidebar`, `CustomSidebar`, `elchininet`, `galloween`, `villhellm` and `apache`: **zero matching references**. Historical documentation discusses upstream openly for provenance; this is not an imported runtime dependency.
- Implementations differ structurally: upstream is a modular TypeScript HACS **plugin** using source modules, subscribers, fetchers and validators; PalaSidebar is a Home Assistant **integration** with an independent frontend loader and a self-contained sidebar JavaScript. Similar Home Assistant events or UI behavior by themselves do not demonstrate copying.

**Interpretation:** No literal code copying was detected across this exact supplied upstream ZIP and the current beta7 runtime. This substantially reduces concern about direct verbatim copying, but **does not establish ownership or exclude rewritten/adapted code**. The maintainer must still verify that no third-party implementation was adapted in a way that creates license obligations.

**Sensitive-file precaution:** The upstream ZIP also contains a `.hass/config/.storage/` test area, an `auth` file, `secrets.yaml`, and a Home Assistant database. These files were **not** copied into PalaSidebar, posted to GitHub, or quoted in this audit. Do not redistribute the original ZIP wholesale without reviewing these contents.

**Licensing:** Apache-2.0 does not ban reuse; it requires compliance for redistributed portions, including retaining applicable licenses/notices and identifying modified files as required. The MIT file in PalaSidebar covers only material licensed by its rightful owners. No attribution requirement is asserted for merely reading/using the old project as a behavioral reference with no code reuse.

## Privacy and publication-safety scan

Examined release-package text files for common credential assignments, RFC1918 IP addresses, hardcoded private hostnames, e-mail addresses and absolute HTTP URLs. No apparent live secrets, private IP addresses, or personal service hostnames were found. The observed URL values were documentation links, SVG XML namespaces and examples.

This is a pattern scan, **not** a guaranteed secrets audit. Check previous commits and all local-only config files before publication.

## Unresolved gate — maintainer confirmation required

- [ ] Confirm origin of the current implementation, and identify any code adapted from another sidebar project.
- [x] Compare the exact historical upstream ZIP/version: **Custom Sidebar 17.3.0 / Apache-2.0**; no literal code matches found (details above).
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
