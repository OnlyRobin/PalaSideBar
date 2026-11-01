# PalaSidebar v2.0.0 — Releasevoorbereiding, nog niet gepubliceerd

**STATUS: NOG NIET STABIEL VRIJGEGEVEN.** De bestaande `release/v2.0.0`-branch bevatte oudere code dan de gepubliceerde RC5. De actuele stabilisatiecode staat in [concept-PR #10](https://github.com/OnlyRobin/PalaSideBar/pull/10).

De kandidaten op deze PR zijn gebaseerd op de **gepubliceerde v2.0.0-rc5-tag**, met de reparatie van een vastlopende headerfoto-upload, maximale pixelgrens en extra browsertests.

## Technische vrijgavecriteria

- [ ] De exact beoogde `2.0.0`-build heeft overal dezelfde versie (manifest, frontend, versie-JSON en eventuele Home Assistant-logregels).
- [ ] Codechecks, Hassfest, HACS en alle Playwright-regressietests geslaagd op die commit.
- [ ] Test-ZIP uit de integrale stabilisatiecontrole op een afzonderlijke Home Assistant-testomgeving geïnstalleerd.
- [ ] Upgrade van Beta8 en RC5 zonder verlies van badges, thema's, menu's, eigen headerfoto en accountopslag getest.
- [ ] Desktop, Android Companion, tablet/PalaKiosk en normale Home Assistant-dialogen praktijkgetest.
- [ ] Onderzoek van prestaties, badge-live-updates en Android-terugknop afgesloten.
- [ ] GitHub-pull-request volledig gereviewd, inclusief versie en documentatie.
- [ ] Stabiele tag en release pas na succesvolle eindcontrole gepubliceerd, oude prereleases blijven staan.

Lees [het stabilisatierapport](STABILISATIE-RC5-NAAR-V2-NL.md). De kandidaat wordt niet automatisch als HACS-release gepubliceerd; de bestaande MIT-licentie blijft gelden.

## Terugzetten

Maak vooraf een volledige Home Assistant-back-up, exporteer de PalaSidebar-instellingen en bewaar een kopie van eventuele eigen `pala-sidebar-config.json`. De bestaande RC5 blijft beschikbaar voor terugzetten via HACS.
