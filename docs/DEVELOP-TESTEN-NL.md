# PalaSidebar veilig testen: Beta, RC en Stable

> **Home Assistant 2026.11+:** de oude, apart te installeren HACS-integratie is vervangen door de **ingebouwde Marketplace** onder **Instellingen → Marketplace**. Deze handleiding gebruikt de actuele menupaden. Op Home Assistant 2026.10 of ouder gebruik je nog HACS. Zie de [officiële Marketplace-documentatie](https://www.home-assistant.io/integrations/marketplace).

De drie publicatiekanalen zijn:

- [`main`](https://github.com/OnlyRobin/PalaSideBar/tree/main): Stable-code; de nieuwste gepubliceerde Stable is [v2.0.1](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1).
- [`rc`](https://github.com/OnlyRobin/PalaSideBar/tree/rc): geteste release candidates; laatst gepubliceerd [v2.0.1-rc.7](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1-rc.7).
- [`beta`](https://github.com/OnlyRobin/PalaSideBar/tree/beta): historische bèta-/ontwikkellijn.

Tijdelijke feature- en fixbranches zijn geen extra releasekanalen. Nieuwe code verschijnt eerst als een nieuwe RC. Bestaande GitHub-release-tags worden niet overschreven.

## Een RC via de ingebouwde Marketplace testen

1. Maak een **Home Assistant-back-up** en exporteer je PalaSidebar-accountinstellingen.
2. Open als beheerder **Instellingen → Marketplace**. Zoek de repository **PalaSidebar**. Is die niet zichtbaar, kies **Toevoegen via link** (*Add from link*) en vul `https://github.com/OnlyRobin/PalaSideBar` in. Marketplace vraagt om een GitHub-koppeling bij aangepaste repositories.
3. Open **Instellingen → Apparaten en diensten → Marketplace** en selecteer het apparaat dat bij de PalaSidebar-repository hoort. Schakel de standaard uitgeschakelde entiteit **Pre-release** in en zet de schakelaar aan om RC-updates te ontvangen.
4. Open de PalaSidebar-repository in de Marketplace. Kies rechtsboven **⋮ → Andere versie installeren** (*Install another version*) en selecteer expliciet de gewenste gepubliceerde RC, bijvoorbeeld `v2.0.1-rc.7`.
5. Installeer de versie en herstart Home Assistant na de update. Controleer `/pala_sidebar/assets/pala-sidebar-version.json`.
6. Test op desktop, telefoon en tablet en meld bevindingen via [GitHub Issues](https://github.com/OnlyRobin/PalaSideBar/issues).

### Praktijktesten

- [ ] Desktop/mobiel: menu, tekstgrootte en dynamische badges.
- [ ] Android: swipe, terugknop, lang indrukken en dialogen.
- [ ] Tablet/PalaKiosk: scrollen, animaties en live sensorwaarden/F1.
- [ ] Native Home Assistant-menu en eigen PalaSidebar-header.
- [ ] Headerfoto opslaan, positioneren, verwijderen en herladen.
- [ ] Instellingen per account, export/import en herstelpunten.
- [ ] PalaGuard-snelkoppeling: zichtbaar voor beheerder wanneer de integratie aanwezig is; anders verborgen.
- [ ] Langdurig gebruik zonder onnodige geheugendruk of prestatieverlies.

## Bij problemen herstellen

De officiële Marketplace-documentatie adviseert **het terugzetten van een Home Assistant-back-up** wanneer een update misgaat. **Andere versie installeren** is bedoeld om een specifieke versie te kiezen en wordt niet aanbevolen als manier om een update terug te draaien. Bewaar daarom altijd een back-up van vóór de test.

Een GitHub-release-tag blijft ongewijzigd beschikbaar als code- en distributiereferentie; de actieve `rc`-branch is geen historisch herstelpunt.

## Logo bij Updates

PalaSidebar bevat lokaal zijn brand-afbeeldingen in `custom_components/pala_sidebar/brand/`. De huidige Marketplace gebruikt die tijdens repositoryherkenning. Een verouderde HACS-schermafbeelding of een oud cache-icoon zegt niets over het functioneren van de integratie. Meld een werkelijk ontbrekend logo met versie en screenshot via een GitHub Issue.

## Stable publiceren

Stable wordt pas gepubliceerd na expliciete vrijgave, bronvergelijking met de geteste RC, HACS/Marketplace-validatie (de technische GitHub-actie blijft **HACS** heten), Hassfest en de volledige backend-/Chromium-regressies op de definitieve Stable-commit. Automatische tests vervangen geen praktijkcontrole op echte apparaten.
