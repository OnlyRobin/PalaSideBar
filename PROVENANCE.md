# PalaSidebar source provenance and licensing

## What the project owner has reported

On 31 October 2026, the maintainer reported that **Custom Sidebar was used as a behavioral example**, not intentionally as a source for copied code. The maintainer cannot independently confirm whether any assistant-authored implementation copied or adapted source during development.

Previous development discussions show the reference project and the user's YAML were examined to understand navigation, swipe and Android back-button behavior. Some of those **behaviors/techniques were reimplemented in PalaSidebar**. Reading reference code and recreating its behavior does not by itself prove that any source code was copied; conversely, a complete origin guarantee cannot be made from conversation history.

## Comparison with the exact old plugin archive

The supplied `custom-sidebar-master(5).zip` was identified as **elchininet/custom-sidebar v17.3.0**, licensed **Apache-2.0**. The 30 upstream source/build files were compared with 10 PalaSidebar beta7 runtime files, including the frontend. Two historical PalaSidebar builds were also checked.

- No exact 80-consecutive-character matches in the examined code.
- No eight-consecutive-identifier matches.
- No runtime imports or references to Custom Sidebar.
- PalaSidebar's integration/loader arrangement differs from the original plugin's modular TypeScript architecture.

These tests **support the assessment that no verbatim old-plugin code was copied**, but cannot rule out conceptual influence, rewritten algorithms, or other third-party sources. See [detailed public-release audit](docs/PUBLICATION-AUDIT-2026-10-31.md).

## License handling

- Original PalaSidebar contributions are licensed under MIT with **Copyright (c) 2026 Robin Bouwman**; this attribution is not a claim of ownership over any third-party material.
- If evidence emerges that any Apache-2.0 source or other third-party implementation has been adapted, retain the corresponding license and notices and follow its redistribution requirements.
- Do not remove a required third-party attribution simply to remove a project's name.
- The PalaSidebar brand icon/logo was designed for this project during development, but the maintainer should confirm redistribution rights for *all* included assets and any imported fonts or images.
- Check the current files and repository history for private configuration before public publication.

## Release gate

The code-comparison task is complete. **The remaining owner-controlled checks are rights to publish all included assets, confirmation that there is no knowingly incorporated third-party source requiring extra notices, and a final scan of release content/history.** Issue [#1](https://github.com/OnlyRobin/PalaSideBar/issues/1) tracks these confirmations.

The repository is **public** and GitHub prerelease **v2.0.0-beta7** was published on 31 October 2026. Code checks, Hassfest and the public HACS validation have passed. This file preserves the provenance caveat that no mechanical source comparison can guarantee independent authorship or automatically establish rights to redistributed third-party assets. Issue [#1](https://github.com/OnlyRobin/PalaSideBar/issues/1) tracks those residual checks. Future changes should go through the `develop` branch and a reviewed pull request.
