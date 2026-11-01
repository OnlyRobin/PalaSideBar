# PalaSidebar v2.0.0-rc3 — Home Assistant-sensoren zoeken en attributen kiezen

**Testrelease voor HACS.** Gebaseerd op v2.0.0-rc2; bestaande instellingen en de beschikbare eerdere releases blijven behouden.

## Nieuw en verbeterd
- In **Header** kun je nu een Home Assistant-entiteit op naam of entity-ID zoeken, een van de beschikbare attributen selecteren en deze invoegen in titel, subtitel of extra sensorregel.
- De actuele waarde wordt getoond als voorbeeld. Na **Header opslaan** blijft de sensor live zichtbaar in de header.
- De reeds aanwezige entiteitenzoeker voor badges, acties, dynamische menu-items, snelmenu-sensoren en Live Control Center gebruikt nu ook een expliciete zoekknop en een overzichtelijke mobiele keuzelijst.
- Zoeken is niet hoofdlettergevoelig en vindt zowel de vriendelijke naam als de technische entity-ID. Geldige handmatig ingevoerde entity-ID's blijven werken.
- Bestaande placeholders zoals `{sensor.woonkamer_temperatuur}` en `{sensor.f1#race_name}` blijven ongewijzigd bruikbaar.
- Extra beveiliging tegen het invoegen van ongeldige tokens of tekst die de maximale headerlengte overschrijdt.

## Compatibiliteit
Attributen worden aangeboden op de plaatsen waar de gebruikersinterface daadwerkelijk een attribuutwaarde kan tonen. Status-/actievelden bewaren bewust alleen een entity-ID, zodat schakelaars en acties niet stukgaan.

## Installeren via HACS
1. Maak een Home Assistant-back-up en exporteer je PalaSidebar-instellingen.
2. Open **HACS → PalaSidebar → Opnieuw downloaden**.
3. Schakel **testversies / prereleases** in en kies **v2.0.0-rc3**.
4. Download, herstart Home Assistant en controleer `/pala_sidebar/assets/pala-sidebar-version.json` op `2.0.0-rc3`.
5. Open **PalaSidebar → Instellingen → Header** en test zoeken, attribuutkeuze, opslaan, swipen, de Android-terugknop en een herstart.

**Let op:** wijzigingen in live Home Assistant zijn niet identiek aan lokale Chromium-simulaties; test RC3 eerst op een testapparaat. Terugzetten: kies `v2.0.0-rc2` of `v2.0.0-beta8` in HACS en herstart.
