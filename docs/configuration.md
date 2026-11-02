# PalaSidebar configureren

Deze handleiding hoort bij de [PalaSidebar README](../README.md). Gebruik de [officiële GitHub-releases](https://github.com/OnlyRobin/PalaSideBar/releases) voor exacte versienummers en wijzigingen.

## Installatie via HACS

1. Zorg dat [HACS](https://www.hacs.xyz/docs/use/) beschikbaar is in Home Assistant.
2. Voeg bij **HACS → ⋮ → Aangepaste repositories** de URL `https://github.com/OnlyRobin/PalaSideBar` toe met het type **Integratie**.
3. Open **PalaSidebar** en installeer bij voorkeur [v2.0.0 Stable](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0).
4. Herstart Home Assistant **volledig**.
5. Open **Instellingen → Apparaten en diensten → Integratie toevoegen → PalaSidebar** als de integratie nog niet is toegevoegd.
6. Pas het menu naar wens aan via de eigen PalaSidebar-instellingen.

De frontend wordt automatisch geregistreerd vanuit `custom_components/pala_sidebar`. Installeer **geen losse JavaScript-resource** via `frontend.extra_module_url` of Lovelace-resources. Anders kan de sidebar dubbel laden.

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

## Updates en testversies

De eerste goedgekeurde versie is [v2.0.0 Stable](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0). De eerste nieuwere testversie is [v2.0.1-rc.1](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1-rc.1). RC-versies zijn bedoeld om verbeteringen op eigen apparaten te controleren voordat ze eventueel Stable worden.

1. Maak een Home Assistant-back-up en exporteer PalaSidebar-instellingen.
2. Open **HACS → PalaSidebar → Opnieuw downloaden**.
3. Kies bij **Andere versie nodig?** eventueel een specifieke prerelease; schakel testversies in waar nodig.
4. Installeer en herstart Home Assistant volledig.
5. Controleer de actieve versie via `/pala_sidebar/assets/pala-sidebar-version.json`.

HACS kan prereleases in een vreemde volgorde tonen ([bekend issue](https://github.com/hacs/integration/issues/5655)). Selecteer dus desgewenst de exacte versietag en vertrouw niet alleen op de volgorde in de lijst. Oude, gepubliceerde RC-tags blijven als terugvaloptie bestaan.

## Problemen oplossen

**PalaSidebar verschijnt niet:** controleer of de HACS-download voltooid is, of de integratie via Apparaten en diensten is toegevoegd en of je Home Assistant volledig hebt herstart.

**De sidebar verschijnt dubbel:** verwijder oude handmatige scripts, `extra_module_url`-verwijzingen en Lovelace-resources die PalaSidebar nog laden. De HACS-integratie registreert de frontend zelf.

**Een nieuwe versie lijkt niet geladen:** controleer het versiebestand hierboven. Herstart Home Assistant en vernieuw zo nodig de browser-/frontendcache.

**Instellingen ontbreken na een update:** gebruik je eerdere export/herstelpunt. Heb je zelf een `pala-sidebar-config.json` aangepast, bewaar hiervan een kopie buiten `custom_components/pala_sidebar` voordat HACS de integratiemap vervangt.

**Een fout gevonden:** ga naar **Onderhoud → Diagnose → Bug melden** of open een [GitHub Issue](https://github.com/OnlyRobin/PalaSideBar/issues/new). Vermeld versie, apparaat, Home Assistant-versie en reproduceerstappen. Voeg screenshots zelf toe en deel geen wachtwoorden, tokens of andere privégegevens.

[Terug naar de README](../README.md) · [Alle releases](https://github.com/OnlyRobin/PalaSideBar/releases) · [GitHub Issues](https://github.com/OnlyRobin/PalaSideBar/issues)
