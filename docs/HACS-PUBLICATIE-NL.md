# PalaSidebar — eerste openbare HACS-release (NL)

Repository: https://github.com/OnlyRobin/PalaSideBar  
Doelversie: **`2.0.0-beta7`** — GitHub-release-tag: **`v2.0.0-beta7`**

> **Status:** voorbereid, nog niet openbaar gemaakt of als GitHub-release gepubliceerd. Openbaar maken is een bewuste beheerdershandeling. Alle code, GitHub Actions-logs en Git-geschiedenis worden zichtbaar na deze wijziging.

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

## 4. Via HACS installeren

1. Maak een back-up van `/config/custom_components/pala_sidebar` en exporteer PalaSidebar-accountinstellingen.
2. Als je `pala-sidebar-config.json` lokaal hebt aangepast, maak daarvan een **aparte** back-up buiten de integratiemap.
3. Open HACS → drie puntjes → **Custom repositories**.
4. Voeg `https://github.com/OnlyRobin/PalaSideBar` toe met type **Integration**.
5. Kies PalaSidebar en schakel **Show beta/pre-release versions** in indien nodig.
6. Installeer de prerelease, herstart Home Assistant volledig en voeg de integratie zo nodig toe via Instellingen → Apparaten en diensten.
7. Verwijder eventueel overgebleven **handmatige frontendresources** om dubbel laden te voorkomen.
8. Test menu, lang indrukken, dashboards sorteren, backpress, badges, thema's, Live Control Center, herstartbevestiging en automatische updates op desktop en Android.

## 5. Verificatie en vervolg

- Controleer na installatie de frontend-versie `2.0.0-beta7`.
- Houd bestaande instellingen en migratie in de gaten; test minstens een update van een handmatige installatie.
- Zet bevindingen in GitHub Issues. Gebruik een nieuwe release voor updates, niet stilzwijgend bestanden onder een bestaande tag vervangen.
- [Releasechecklist](../RELEASE-CHECKLIST.md) en [GitHub Actions](https://github.com/OnlyRobin/PalaSideBar/actions).

Officiële informatie:
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility
- https://hacs.dev/docs/publish/integration/
- https://hacs.dev/docs/publish/start/
