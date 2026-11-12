# PalaSidebar v2.0.1-rc.6 — Issue #22 bovenruimte headerfoto definitief gericht onderzocht

**HACS-testrelease (niet Stable).** Basis: v2.0.1-rc.5. Vorige RC-tags en main blijven intact.

## De resterende fout uit RC5

De gebruiker liet na RC5 opnieuw een grijze strook boven de headerfoto zien, circa **16 pixels**. De RC5-fix verwijderde de eigen Home Assistant-menubalk, maar niet de **losse bovenmarge** die Home Assistant aan de scrollbare navigatielijst toevoegt:

- Home Assistant frontend: `ha-sidebar`
- `ha-list-nav.before-spacer` heeft `margin-block: var(--ha-space-2)` (thema-afhankelijk; in de screenshot ongeveer 16px).
- PalaSidebar wordt via het `main-navigation`-slot **binnen** die scrollbare lijst geplaatst.
- Daarom begon de foto ook zonder zichtbare `.menu` nog onder deze marge.

## Gerichte reparatie

- Wanneer **Headerfoto tot aan de bovenrand** aanstaat, de PalaSidebar-header zichtbaar is en een geldige foto is geüpload, krijgt uitsluitend de navlijst `ha-list-nav.before-spacer` in de native Home Assistant-sidebar `margin-block-start:0`.
- De bestaande RC5-regel die de aparte HA-menubalk verbergt blijft actief, en de PalaSidebar-menuknop blijft beschikbaar.
- De **ondermarge**, vaste HA-footer, sidebarbreedte, thema, scrollwerking, native accountinstellingen en andere menu's worden niet aangepast.
- De ingreep is geheel omkeerbaar: na uitzetten van de optie of verwijderen van de headerfoto herstelt Home Assistant zijn oorspronkelijke bovenmarge.
- Geen negatieve margins, geen overlaplaag, geen wijzigingen aan de originele foto-opslag of aan Boven/Midden/Onder.

## Nieuwe regressietest

De bestaande `tests/test_issue22_native_header_photo_gap.py` is verbeterd: deze simuleert nu óók de Home Assistant DOM-structuur (`.menu`, `.panels-list .wrapper ha-list-nav.before-spacer`, en `ha-list-nav.after-spacer`) met **52px menubalk + 16px navigatiemarge** op 390, 768 en 1280 pixels. De test eist een bovenruimte van 0px met foto + optie, en controleert tevens dat het uitzetten/verwijderen exact de originele marge herstelt, de vaste HA-footer ongemoeid blijft en issue #17 niet terugkomt.

Eerdere regressietests #16, #17, #22 en PalaGuard-footer blijven behouden.

**Issue #22 blijft open tot praktijkbevestiging** op Home Assistant en Android Companion. Geen merge naar Stable/main.
