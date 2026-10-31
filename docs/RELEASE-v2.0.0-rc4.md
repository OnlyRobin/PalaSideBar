# PalaSidebar v2.0.0-rc4 — Overal duidelijke kleurkiezers

**Testrelease voor HACS, gebaseerd op RC3.** RC2, RC3 en Beta8 blijven intact.

## Nieuw

- In **Instellingen → Algemeen** is het handmatige HEX-veld vervangen door een kleurenkiezer met zichtbare kleur en bewerkbare HEX-code. Beide blijven gesynchroniseerd.
- De selectie toont onmiddellijk een kleurvoorbeeld, zonder de actieve sidebar al te wijzigen. Pas **Instellingen opslaan** past de kleur toe.
- In **Instellingen → Header** zijn de zeven handmatige kleurvelden nu dezelfde bediening: titelkleur, ondertitelkleur, sensorregel, headerachtergrond, logoachtergrond, logokleur en klokkleur.
- Met **Themakleur gebruiken** kun je de optionele headerkleur opnieuw leegmaken en het Home Assistant-/PalaSidebar-thema volgen.
- Ongeldige HEX-codes worden zichtbaar gemarkeerd; de opslag wordt geblokkeerd vóórdat voorkeuren worden veranderd.
- Bestaande kleuren en instellingen worden behouden; kleurkiezers bij badges, thema's en PalaSidebar UI blijven werken.

## Installeren en testen

1. Maak een Home Assistant-back-up en exporteer je PalaSidebar-instellingen.
2. HACS → PalaSidebar → **Opnieuw downloaden** → **testversies tonen** → **v2.0.0-rc4**.
3. Download en herstart Home Assistant volledig.
4. Controleer de versie via `/pala_sidebar/assets/pala-sidebar-version.json`, verwacht `2.0.0-rc4`.
5. Test mobiel en desktop: kies kleur, typ HEX, probeer een ongeldige HEX, sla op en controleer het resultaat na opnieuw openen.
6. Controleer bij Header ook **Themakleur gebruiken**, plus je bestaande sensorkoppelingen en Android-terugknop.

**Terugzetten:** kies RC3, RC2 of Beta8 expliciet via HACS → Opnieuw downloaden en herstart. Dit is geen definitieve stabiele release.
