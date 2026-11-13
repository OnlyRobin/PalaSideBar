# PalaSidebar v2.0.1-rc.5 — Issue #22: headerfoto tot bovenrand

**HACS-testrelease, niet Stable.** Gebaseerd op v2.0.1-rc.4; eerdere RC's blijven bestaan.

## Probleem en oorzaak

De oorspronkelijke oplossing uit RC2 bewaart de volledige foto en laat Boven/Midden/Onder werken. Een apart verschijnsel bleef: in de native Home Assistant-sidebar kan de eigen Home Assistant-menubalk boven de PalaSidebar-headerfoto ruimte innemen. De foto staat uitsluitend op de PalaSidebar-header, onder deze menubalk, waardoor een lege bovenstrook ontstaat.

## Gerichte oplossing

- **Header → Headerafbeelding → Headerfoto tot aan de bovenrand**: standaard ingeschakeld bij een foto.
- Bij een foto in de **native** PalaSidebar verdwijnt de aparte Home Assistant-menubalk en begint de foto bovenaan. De bestaande PalaSidebar-menuknop blijft bruikbaar.
- De gekozen instelling *Originele Home Assistant-header* wordt niet aangepast. **Zonder foto** of met **Headerfoto tot aan de bovenrand uit** komt de ingestelde HA-menubalk terug.
- Wanneer de PalaSidebar-header bewust verborgen is, blijft de HA-menubalk bestaan, zodat navigatie mogelijk blijft.
- Geen negatieve marges, geen nieuwe overlappende achtergrondlaag, geen extra polling of gewijzigde foto-opslag.
- **Oude RC2-fix behouden:** volledige beeldverhouding, Boven/Midden/Onder, preview en 100 kB limiet blijven gelijk.

## Controleren

1. HACS → PalaSidebar → **v2.0.1-rc.5** installeren en Home Assistant herstarten.
2. PalaSidebar → **Instellingen → Basis & weergave → Header → Headerafbeelding**.
3. Vink **Headerfoto tot aan de bovenrand** aan; kies Boven/Midden/Onder en sla op.
4. Controleer desktop en de Android Companion App. Als de foto zelf een lege bovenrand bevat, upload de originele foto opnieuw.

## Tests

- Nieuwe regressietest: tests/test_issue22_native_header_photo_gap.py: native 52px HA-menubalk → 0px ruimte bij foto, omkeerbare keuze, behoud van layout, menuknop en accountinstelling op 390/768/1280px.
- Bestaande regressietests #17 en #22 blijven.
- Volledige Python-, Chromium-, HACS- en Hassfest-controles blijven verplicht.

**Geen wijziging aan Stable/main.** Issue #22 blijft open tot praktijkbevestiging van de bovenrand in de echte Home Assistant/Android-weergave.
