# PalaSidebar configureren

Deze handleiding hoort bij de [PalaSidebar README](../README.md). Gebruik de [officiële GitHub-releases](https://github.com/OnlyRobin/PalaSideBar/releases) voor exacte versienummers en wijzigingen.

## Installatie via Marketplace (Home Assistant 2026.11+)

De Marketplace is sinds **Home Assistant 2026.11 ingebouwd**. Er hoeft geen aparte HACS-integratie meer te worden geïnstalleerd.

1. Open als beheerder **Instellingen → Marketplace** en accepteer de waarschuwing bij het eerste gebruik.
2. Zoek **PalaSidebar**. Ontbreekt de repository? Kies rechtsboven **Toevoegen via link** (*Add from link*) en vul `https://github.com/OnlyRobin/PalaSideBar` in.
3. Verbind een GitHub-account via de aangeboden apparaatcode als daarom wordt gevraagd. Bevestig het type **Integratie** als Marketplace dit niet zelf herkent.
4. Open PalaSidebar en kies **Installeren**. De aanbevolen Stable is [v2.0.1](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1).
5. Doorloop de aangeboden instelwizard. Is de integratie niet direct beschikbaar? Herstart Home Assistant en open **Instellingen → Apparaten en diensten → Integratie toevoegen → PalaSidebar**.
6. Pas het menu aan via de eigen PalaSidebar-instellingen.

**Home Assistant 2026.10 of ouder:** gebruik de oude HACS-integratie. Bij de overstap naar 2026.11 migreert Home Assistant de bestaande HACS-repositories en installaties automatisch.

De frontend registreert zichzelf vanuit `custom_components/pala_sidebar`. Voeg **geen los JavaScript** toe via `frontend.extra_module_url` of Lovelace-resources; dat kan dubbel laden veroorzaken.

[Officiële Marketplace-handleiding](https://www.home-assistant.io/integrations/marketplace).

## De instellingen gebruiken

De instellingen zijn verdeeld in vier groepen:

| Groep | Hier vind je |
| --- | --- |
| **Basis & weergave** | Algemeen, Header, Snelmenu |
| **Menu & inhoud** | Indeling, Dashboards, Acties, Sensoren, Agenda, Control Center |
| **Vormgeving** | Thema's, Design, PalaSidebar UI, Badges |
| **Onderhoud** | Diagnose, Performance, Backup |

### Menu, dashboards en favorieten

Open **Menu & inhoud → Indeling** om menu-items en secties te beheren. Onder **Dashboards** kies je welke dashboards beschikbaar zijn. Je kunt de volgorde en zichtbaarheid aanpassen en veelgebruikte onderdelen als favoriet gebruiken. Op geschikte apparaten is er een snelmenu via lang indrukken of de rechtermuisknop.

### Live sensoren en badges

In **Menu & inhoud → Sensoren** of bij de badge-instellingen selecteer je Home Assistant-entiteiten. Afhankelijk van het veld kun je de status of een attribuut tonen, een icoon instellen en kleurregels gebruiken.

Bestaande sensortokens zoals `{sensor.woonkamer_temperatuur}` en `{sensor.f1#race_name}` kunnen in geschikte dynamische tekstvelden worden gebruikt. Controleer altijd het actuele voorbeeld voordat je opslaat.

In **Vormgeving → Badges** en de **Badge Design Studio** kun je algemene opmaak, randen, kleur en afronding kiezen. Afzonderlijk ingestelde badges kunnen een eigen stijl en sensorafhankelijke kleuren behouden.

### Header en vormgeving

- **Basis & weergave → Header:** pas titel, subtitel, kleuren en eventueel een headerfoto aan. De afbeelding wordt lokaal verkleind en bij je accountvoorkeuren opgeslagen; een extra map in `www` is niet nodig.
- **Vormgeving → PalaSidebar UI:** kies bijvoorbeeld een thema, achtergrond, lettertype of tekstgrootte, bekijk de live voorvertoning en sla op.
- **Sectie Design Studio:** geef een hele menusectie, zoals START of BEHEER, een eigen rand, achtergrond, afstand en afronding. De koppen en items kunnen afzonderlijk worden aangepast.
- **Onderhoud → Backup:** maak een export of herstel eerder bewaarde instellingen.

Niet alle instellingen worden met dezelfde knop opgeslagen: gebruik de **Opslaan**-knop van het onderdeel dat je hebt gewijzigd.

## Updates, RC-testversies en herstel

De actuele Stable is [v2.0.1](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1). De laatste uitgebrachte RC in deze reeks is [v2.0.1-rc.7](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1-rc.7).

1. Maak een **Home Assistant-back-up** en exporteer je PalaSidebar-instellingen.
2. Controleer **Instellingen → Updates** voor nieuwe Marketplace-updates, of open de PalaSidebar-repository onder **Instellingen → Marketplace**.
3. Wil je testversies aangeboden krijgen? Open **Instellingen → Apparaten en diensten → Marketplace**, selecteer het repositoryapparaat van PalaSidebar en zet de standaard uitgeschakelde **Pre-release**-entiteit aan. Schakel vervolgens **Pre-release** in.
4. Voor een specifieke gepubliceerde versie open je de PalaSidebar-repository in **Instellingen → Marketplace** en kies je rechtsboven **⋮ → Andere versie installeren** (*Install another version*).
5. Installeer de gewenste versie, herstart Home Assistant na een integratie-update en controleer `/pala_sidebar/assets/pala-sidebar-version.json`.

**Een mislukte update terugdraaien:** herstel de Home Assistant-back-up die je vóór de update hebt gemaakt. Volgens de officiële Marketplace-documentatie is *Andere versie installeren* geen aanbevolen rollbackmethode. Oudere GitHub-releasebestanden kunnen dienen als aanvullende herstelreferentie, niet als vervanging van een back-up.

## Problemen oplossen

**PalaSidebar verschijnt niet:** controleer of de Marketplace-installatie is voltooid, of de integratie via Apparaten en diensten is toegevoegd en of Home Assistant na de update volledig is herstart.

**De sidebar verschijnt dubbel:** verwijder oude handmatige scripts, `extra_module_url`-verwijzingen en Lovelace-resources die PalaSidebar nog laden. De PalaSidebar-integratie registreert de frontend zelf.

**Een nieuwe versie lijkt niet geladen:** controleer het versiebestand hierboven. Herstart Home Assistant en vernieuw zo nodig de browser-/frontendcache.

**Instellingen ontbreken na een update:** gebruik je eerdere export/herstelpunt. Heb je zelf een `pala-sidebar-config.json` aangepast, bewaar hiervan een kopie buiten `custom_components/pala_sidebar` voordat de Marketplace de integratiemap vervangt.

**Een fout gevonden:** ga naar **Onderhoud → Diagnose → Bug melden** of open een [GitHub Issue](https://github.com/OnlyRobin/PalaSideBar/issues/new). Vermeld versie, apparaat, Home Assistant-versie en reproduceerstappen. Voeg screenshots zelf toe en deel geen wachtwoorden, tokens of andere privégegevens.

[Terug naar de README](../README.md) · [Alle releases](https://github.com/OnlyRobin/PalaSideBar/releases) · [GitHub Issues](https://github.com/OnlyRobin/PalaSideBar/issues)
