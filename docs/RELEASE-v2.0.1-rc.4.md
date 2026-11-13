# PalaSidebar v2.0.1-rc.4 — PalaGuard footer-snelkoppeling

**HACS RC-testversie, niet Stable.** Gebaseerd op RC3; alle eerdere tags, de RC3-koppeling en Stable blijven behouden.

## Nieuw

- In de PalaSidebar-footer verschijnt **automatisch het echte PalaGuard-logo**, alleen voor beheerders wanneer Home Assistant het PalaGuard Security Center-paneel heeft geregistreerd.
- **Subtiele gouden rand en glow**; hover en toetsenbordfocus geven een duidelijk zichtbaar accent, met ondersteuning voor verminderde animaties.
- **Direct openen:** één klik op het footerlogo opent het bestaande paneel `/palaguard-security`.
- Tooltip/voorleestekst: **PalaGuard gekoppeld · Security Center openen**.
- **Eénrichting:** PalaSidebar ontdekt alleen het Home Assistant-paneel en gebruikt het lokaal aangeboden afbeeldingsbestand `/palaguard-assets/brand-icon.png`. Als de afbeelding ontbreekt, toont de knop een standaard schildicoon.
- **Dynamisch:** bij installeren, verwijderen en het veranderen van beheerdersrechten wordt de footer bijgewerkt via de bestaande Home Assistant-verversing. Er komt geen extra polling of achtergrondlistener.
- **Geen risico-indicator:** de glow betekent dat het PalaGuard-paneel beschikbaar is, **niet** dat Home Assistant veilig of vrij van aanvallen is.
- **Bestaande footer behouden:** Herstarten, instellingen, versietekst en het bestaande statusschild blijven intact. De PalaGuard-knop is niet zichtbaar voor niet-beheerders of zonder PalaGuard.

## Installeren

1. Installeer PalaGuard afzonderlijk. Controleer dat **PalaGuard Security Center** beschikbaar is.
2. Werk uitsluitend **PalaSidebar** bij naar **v2.0.1-rc.4** via HACS (testversies).
3. Herstart Home Assistant, open PalaSidebar en klik **onderaan rechts op het gouden PalaGuard-logo**.
4. De bestaande link onder **Instellingen → Onderhoud → Diagnose** blijft beschikbaar.

## Regressietests

- `tests/test_rc4_palaguard_footer.py`: Chromium op 390, 768 en 1280 px, met/zonder PalaGuard, juiste lokale merkafbeelding, fallback, kliknavigatie, beheerrechten, live ontkoppelen en bestaande footerknoppen.
- Alle eerder beschikbare Python-, browser-, HACS- en Hassfest-controles blijven vereist.

**Geen PalaGuard-broncode of logboeken naar GitHub.** De merkafbeelding wordt door de lokaal geïnstalleerde PalaGuard-integratie geleverd. Publiceer alleen als RC; pas na expliciete goedkeuring naar Stable.
