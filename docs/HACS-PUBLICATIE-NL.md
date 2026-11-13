# PalaSidebar — eerste openbare HACS-release (NL)

Repository: https://github.com/OnlyRobin/PalaSideBar  
Doelversie: **`2.0.0-beta7`** — GitHub-release-tag: **`v2.0.0-beta7`**

> **Historisch publicatieplan (31 oktober 2026):** deze stappen zijn op 31 oktober 2026 uitgevoerd. De repository is **openbaar**, GitHub-prerelease [v2.0.0-beta7](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-beta7) is gepubliceerd en de Code checks, Hassfest en HACS-validatie zijn geslaagd. De instructies hieronder blijven beschikbaar als referentie voor een nieuwe repository; publiceer **niet** nogmaals dezelfde tag.

## 0. Publicatievoorwaarden controleren

- Lees [PROVENANCE.md](../PROVENANCE.md), het [technische auditverslag](PUBLICATION-AUDIT-2026-10-31.md) en [issue #1](https://github.com/OnlyRobin/PalaSideBar/issues/1).
- De exacte oude Custom Sidebar v17.3.0 (Apache-2.0) is met PalaSidebar vergeleken; er zijn geen lange letterlijke overeenkomsten gevonden. Dat bewijst niet absoluut dat code nooit is aangepast of hergebruikt.
- Bevestig dat je de rechten hebt om de PalaSidebar-logo's en andere assets openbaar te verspreiden. Neem vereiste auteursvermeldingen/licenties over als er toch code van derden is gebruikt.
- Controleer dat de repository **en Git-geschiedenis** geen privégegevens, tokens of wachtwoorden bevatten. Een tekstscan alleen is geen garantie.
- Houd de eigen `pala_sidebar`-domeinnaam en bestaande opslagmigratie intact.

## 1. Repository openbaar maken — handmatig op GitHub

1. Open https://github.com/OnlyRobin/PalaSideBar/settings
2. Ga naar **General → Danger Zone → Change repository visibility**.
3. Kies **Make public** en bevestig de waarschuwingen.

Dit kan niet met de momenteel beschikbare GitHub-koppeling vanuit ChatGPT. Maak de repository alleen openbaar wanneer de controles hierboven akkoord zijn.

## 2. HACS-validatie uitvoeren

De workflow `.github/workflows/validate.yml` slaat de HACS-check bewust over zolang de repository privé is.

1. Open https://github.com/OnlyRobin/PalaSideBar/actions/workflows/validate.yml
2. Klik **Run workflow**, kies `main` en start.
3. Open de nieuwe run: **Validate with HACS** moet **success** zijn, niet `skipped`.
4. Bij fouten: los die eerst op en controleer de nieuwe run.

Controleer tegelijk dat **Code checks** en **Hassfest** groen blijven:
https://github.com/OnlyRobin/PalaSideBar/actions

## 3. Publiceer de GitHub-prerelease

Pas **na geslaagde HACS-validatie**:

1. Open https://github.com/OnlyRobin/PalaSideBar/releases/new
2. Kies **Choose a tag → Create new tag**: `v2.0.0-beta7`, vanuit `main`.
3. Titel: **PalaSidebar v2.0.0-beta7 — First HACS Beta**
4. Kopieer de inhoud uit [RELEASE-TEXT-v2.0.0-beta7.md](RELEASE-TEXT-v2.0.0-beta7.md) in de beschrijving.
5. Vink **Set as a pre-release** aan; niet als definitieve stabiele versie.
6. Klik **Publish release**.

**Let op:** alleen een Git-tag maken is niet hetzelfde als een GitHub-release publiceren. HACS gebruikt de release en de tag als versiebron. De tag `v2.0.0-beta7` hoort bij manifestversie `2.0.0-beta7`.

## 4. Installeren: historisch HACS, nu ingebouwde Marketplace

Dit document beschrijft de eerste publicatie in oktober 2026. **Vanaf Home Assistant 2026.11 is HACS standaard ingebouwd als Marketplace**, dus de oude HACS-menu-instructies hieronder zijn vervangen door de huidige stappen.

1. Maak vooraf een Home Assistant-back-up en exporteer je PalaSidebar-accountinstellingen. Bewaar een aangepaste `pala-sidebar-config.json` ook apart buiten de integratiemap.
2. Open als beheerder **Instellingen → Marketplace**, zoek **PalaSidebar** en open de repositorypagina.
3. Ontbreekt PalaSidebar, kies **Toevoegen via link** (*Add from link*), voer `https://github.com/OnlyRobin/PalaSideBar` in en bevestig het type **Integratie** als daarom wordt gevraagd. Voor een aangepaste repository vraagt Marketplace om GitHub-apparaatautorisatie.
4. Kies **Installeren** voor de nieuwste Stable, momenteel [v2.0.1](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1).
5. Volg de aangeboden configuratie; herstart Home Assistant wanneer nodig. Voeg de integratie zo nodig toe via **Instellingen → Apparaten en diensten**.
6. Voor een gepubliceerde RC: open de PalaSidebar-repository en kies **⋮ → Andere versie installeren**. Schakel voor automatische RC-updates de **Pre-release**-entiteit van het Marketplace-repositoryapparaat in.
7. Verwijder oude **handmatige frontendresources** om dubbel laden te voorkomen; test vervolgens de sidebar op desktop en Android.

**Bij een mislukte update:** herstel de back-up van vóór de update. De Marketplace raadt *Andere versie installeren* niet aan als rollbackmethode.

Voor **Home Assistant 2026.10 of ouder** blijft de afzonderlijke HACS-integratie het historische installatiepad. Bestaande HACS-installaties migreren automatisch bij een upgrade naar 2026.11.

## 5. Verificatie en vervolg

- Controleer na installatie de frontend-versie `2.0.0-beta7`.
- Houd bestaande instellingen en migratie in de gaten; test minstens een update van een handmatige installatie.
- Zet bevindingen in GitHub Issues. Gebruik een nieuwe release voor updates, niet stilzwijgend bestanden onder een bestaande tag vervangen.
- [Releasechecklist](../RELEASE-CHECKLIST.md) en [GitHub Actions](https://github.com/OnlyRobin/PalaSideBar/actions).

Officiële informatie:
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility
- https://www.home-assistant.io/integrations/marketplace
- https://contributors.home-assistant.io/marketplace/guides/integrations/
