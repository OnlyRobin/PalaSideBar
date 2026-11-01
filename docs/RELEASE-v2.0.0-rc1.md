# PalaSidebar v2.0.0-rc1 — Release candidate (HACS testversie)

**Dit is een prerelease om PalaSidebar via HACS te testen.** Het is nog geen stabiele 2.0.0 en wordt niet automatisch bij alle gebruikers uitgerold.

## Wat zit erin?
- De functies van PalaSidebar 2.0.0-beta7, zonder functionele wijzigingen.
- Copyrightvermelding © 2026 Robin Bouwman en bijgewerkte GitHub-documentatie.
- Een apart geteste ontwikkelbranch met extra browser-, touch- en backendregressietests.
- Consistente versie `2.0.0-rc1` in het integratiemanifest, de AutoLoader-versie en de frontend.

## Via HACS installeren
1. Maak een back-up van Home Assistant, `custom_components/pala_sidebar`, je PalaSidebar-instellingen en eventuele aangepaste `pala-sidebar-config.json`.
2. Open **HACS → PalaSidebar → drie puntjes → Redownload** (of Download).
3. Schakel **Show beta versions / Pre-release** in en kies **v2.0.0-rc1**.
4. Download de versie en herstart Home Assistant volledig.
5. Controleer `/pala_sidebar/assets/pala-sidebar-version.json` op de URL van je Home Assistant. Hier moet `2.0.0-rc1` staan.
6. Test desktopnavigatie, Android-terugknop, live swipes, lang indrukken, badges, instellingen en PalaKiosk.

**HACS toont de RC1 pas als de GitHub-prerelease is gepubliceerd en de repositorygegevens zijn ververst.** Het zichtbaar worden kan vertragen.

## Terug naar beta7
Open HACS → PalaSidebar → Redownload en kies `v2.0.0-beta7`. Herstart Home Assistant. Bij problemen kun je ook de gemaakte back-up terugzetten.

## Bekende aandachtspunten
- Oudere HACS-versies tonen bij nieuwe custom integraties soms *Icon not available* ondanks geldige lokale logo's in `brand/`. Dat is een bekend HACS-frontendprobleem; de nieuwe Home Assistant Marketplace (2026.11) brengt hiervoor een oplossing.
- Gelijktijdig twee varianten installeren binnen dezelfde Home Assistant-instantie kan niet: beide gebruiken integratiedomein `pala_sidebar`.
- Voor een stabiele release volgen nog real-device-tests en acceptatie van [PR #3](https://github.com/OnlyRobin/PalaSideBar/pull/3).

[Ontwikkelbranch en testinstructies](https://github.com/OnlyRobin/PalaSideBar/blob/develop/docs/DEVELOP-TESTEN-NL.md)
