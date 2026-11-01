# PalaSidebar v2.0.0-rc7 — Testversie voor HACS

RC7 wordt uitgebracht vanuit de permanente [`rc`-branch](https://github.com/OnlyRobin/PalaSideBar/tree/rc). RC4, RC5 en RC6 blijven beschikbaar om terug te zetten. **RC7 is géén Stable.**

## Nieuw in RC7

### Bugs melden en onmiddellijk testen
- In **Instellingen → Diagnose** staat nu een **Zelftest uitvoeren**-knop. Deze controleert of PalaSidebar actief is, HA is gekoppeld, instellingen zijn geladen, navigatie beschikbaar is en het instellingenvenster werkt.
- Bij **Bug melden via GitHub** vul je de titel, foutbeschrijving en reproduceerstappen in.
- Met **Voorbeeld bekijken** zie je de melding exact vooraf.
- Pas na een privacybevestiging opent GitHub een nieuw issue met vooraf ingevulde tekst. **Jij klikt op GitHub zelf nog op Submit**; er wordt niet stilzwijgend een issue aangemaakt.
- De automatische diagnose vermeldt alleen versies, algemene status en het resultaat van controles; geen Home Assistant-token, gebruikers-ID, sensorwaarde of volledige configuratie. Controleer zelf je ingevulde tekst vóór publicatie.

### RC-update melden
- PalaSidebar kijkt via de openbare GitHub-release-API of er een **nieuwere RC** is en toont dan een discrete melding in de sidebar.
- Je kunt **Bekijk RC** kiezen of de melding met **Later** voor die versie verbergen.
- Er wordt niet automatisch iets geïnstalleerd. Installeer updates altijd zelf via **HACS → PalaSidebar → Downloaden/Opnieuw downloaden → Testversies tonen**.
- Geen HA-gebruikersgegevens worden naar GitHub verzonden voor de versiecontrole. Als de check mislukt, kun je HACS zelf gebruiken.

### Openbare broncodebewaking (aparte GitHub Action)
- De officiële broncode bevat twee herkenbare, niet-persoonlijke herkomstmarkeringen.
- Een GitHub Actions-workflow zoekt wekelijks naar **openbaar geïndexeerde** GitHub-projecten die beide markeringen bevatten. Bij een overeenkomst wordt een GitHub-issue gemaakt ter beoordeling; een melding verschijnt alleen afhankelijk van je GitHub-notificatie-instellingen.
- **Niet gegarandeerd:** privé-repositories, niet-geïndexeerde code, verwijderde/gewijzigde markeringen en ingrijpend aangepaste forks zijn niet te detecteren. Een overeenkomst is geen bewijs van misbruik. MIT staat hergebruik, forks en commerciële verspreiding onder voorwaarden toe.
- Er wordt niets ingebouwd dat vanuit een Home Assistant-gebruikersinstallatie toezicht houdt of gegevens naar de maker verzendt.

## Testen
1. Maak een Home Assistant-back-up en exporteer je instellingen.
2. Kies **v2.0.0-rc7** via HACS en herstart Home Assistant.
3. Open **PalaSidebar → Instellingen → Diagnose**, voer de zelftest uit en bekijk de resultaten.
4. Vul een **testmelding** in en klik op **Voorbeeld bekijken**. Controleer dat er nog geen issue ontstaat. Open desgewenst het GitHub-issueformulier, maar klik voor een test niet op Submit.
5. Controleer de knop **Controleer nieuwere RC**. De RC-melding mag alleen verschijnen als er ook echt een nieuwere gepubliceerde RC bestaat.
6. Test swipe, backpress, headerfoto, sensorbadges, thema's en tekstgrootte zoals in RC6.

Bij problemen installeer je de gepubliceerde [RC6](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc6) opnieuw.

**De bestaande MIT-licentie blijft ongewijzigd. Stable wordt alleen gemaakt na jouw goedkeuring van de geteste RC.**
