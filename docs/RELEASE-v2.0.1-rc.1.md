# PalaSidebar v2.0.1-rc.1 — headerfoto en compacte iconenrail

**HACS-testversie, geen Stable.** Dit is de eerste patch-RC ná Stable v2.0.0. Daarom is het versienummer `2.0.1-rc.1` (hoger dan de bestaande Stable), niet `2.0.0-rc.15`. Stable v2.0.0 en alle bestaande RC-tags blijven onaangeraakt.

## Opgeloste meldingen

- **Issue #16 — melding nieuwe update en sectieranden in ingeklapte sidebar:** de updatekaart blijft niet langer breed zichtbaar in de smalle Home Assistant-iconenrail. De melding klapt met de rail in en verschijnt bij uitklappen opnieuw. Zelf ingestelde sectieranden, padding, achtergrond en glow worden in de iconenrail tijdelijk niet toegepast zodat de pictogrammen niet verschuiven; na openen keren alle opgeslagen stijlen terug.
- **Issue #17 — headerfoto duwt inhoud omlaag:** een gekozen headerfoto verandert de hoogte, padding en verticale uitlijning van de header niet langer. Avatar, titel en headerknoppen behouden hun plaats in normaal, compact, minimal en app-modus, ook bij inklappen. Foto-upload, accountopslag en uitsnedepositie blijven intact.

## Controles

- De fixes zijn apart via pull requests #18 en #19 op de permanente `rc`-branch geïntegreerd; Stable (`main`) is niet gewijzigd.
- Nieuwe Playwright-regressietests voor de ingeklapte updatekaart/sectieframes en voor de headerposities met/zonder foto.
- De volledige bestaande browsertestset draait nu ook op pull requests naar `rc`. Publicatie vereist opnieuw groene tests, HACS en Hassfest.
- Geen extra timers, extra overlays of wijzigingen aan Home Assistant-configuratie of accountinstellingen.

## Praktisch testen op jouw Home Assistant

1. Open HACS → PalaSidebar → versie kiezen en installeer `v2.0.1-rc.1` (schakel testversies in); herstart Home Assistant.
2. Activeer een nieuwe-updatemelding en klap de ingebouwde desktop-sidebar open/dicht. De melding mag in de iconenrail geen tekst of knoppen buiten de rail laten zien, maar moet bij openen terugkomen.
3. Zet bij PalaSidebar UI een sectierand op 3 px, padding en glow aan. Klap in en uit: pictogrammen blijven op hun plek, en de volledige sectieranden keren terug.
4. Upload een headerfoto en controleer avatar, titel, instellingen en andere headerknoppen vóór en na het opslaan in normaal, compact en app-modus. Er mag geen verticale sprong zijn.
5. Controleer op tablet en telefoon dat navigatie, badges, terugknop, swipe en instellingen blijven werken.

**Terugval:** Stable `v2.0.0` of de eerdere `v2.0.0-rc.14` blijven beschikbaar. De issues worden pas als definitief opgelost gesloten na jouw praktijktest.
