# PalaSidebar v2.0.0 — Voorbereiding van de stabiele release

> **Nog niet gepubliceerd.** Deze release is technisch voorbereid op de branch `release/v2.0.0`. De huidige beta is `v2.0.0-beta8`; de eerdere RC1- en RC2-testreleases blijven beschikbaar.

## Wat zit erin?

- Installeerbare PalaSidebar-integratie voor Home Assistant met automatische frontend AutoLoader.
- Configureerbare sidebar, favorieten, snelmenu's en dashboardnavigatie.
- Dynamische badges, Live Control Center en eigen thema's.
- Lang indrukken / rechtermuisknop-menu's en aanpasbare dashboardvolgorde.
- Instellingen per Home Assistant-account met export, import en herstel.
- Oplossing voor lege **PalaSidebar UI**-instellingen, ontbrekende standaardondertitel en de incomplete standaardsectie **BEHEER** (gevalideerd in RC2).
- Broncode en copyrightvermeldingen afgestemd op **© 2026 Robin Bouwman** onder MIT voor eigen bijdragen.
- Aparte ontwikkelbranch en regressietests voor desktop, mobiel/touch en backend.

## Compatibiliteit en aandachtspunten

- Gebruik het integratiedomein `pala_sidebar`; installeer niet tegelijkertijd de dev- en releaseversie in één Home Assistant-instantie.
- Maak vóór een update een back-up van `/config/custom_components/pala_sidebar/`, plus eventueel aangepaste `pala-sidebar-config.json`, en exporteer je instellingen.
- Verwijder overgebleven handmatige frontendresources als ze dubbel geladen worden.
- Herstart Home Assistant volledig na installatie of update.
- De echte werking op Android Companion, PalaKiosk en desktop moet vóór de stabiele publicatie zijn bevestigd.

## Technische controles

- [ ] Code checks op de definitieve `release/v2.0.0`-commit groen.
- [ ] Hassfest op de definitieve release-commit groen.
- [ ] HACS-validatie op de definitieve release-commit groen.
- [ ] Alle Playwright/Chromium-regressietests op de definitieve release-commit groen.
- [ ] Praktijktest van beta8/RC2 op Home Assistant geslaagd.
- [ ] Installatie-/migratie- en hersteltest geslaagd.
- [ ] Release-pull-request naar `main` gereviewd en gemerged.

## Publicatie zodra alle voorwaarden zijn afgevinkt

1. Voeg de pull request van `release/v2.0.0` samen met `main` en controleer dat `manifest.json`, frontendversie, JS en backend dezelfde versie `2.0.0` hebben.
2. Open https://github.com/OnlyRobin/PalaSideBar/releases/new.
3. Maak tag `v2.0.0` **vanaf de `main`-commit met de stabiele code** (niet vanaf `develop` of een eerdere betatag).
4. Titel: **PalaSidebar v2.0.0 — Stabiele versie**.
5. Vul de openbare releasebeschrijving in; **vink `Set as a pre-release` NIET aan** (dit is de Engelse naam van een GitHub-instelling).
6. Publiceer en controleer dat GitHub de normale `Latest` release toont.
7. Installeer via HACS → PalaSidebar → drie puntjes → Redownload / update, maak eerst een back-up en herstart Home Assistant.

De tag `v2.0.0-beta7` blijft intact als herstelmogelijkheid.
