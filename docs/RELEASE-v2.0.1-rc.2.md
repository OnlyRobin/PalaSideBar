# PalaSidebar v2.0.1-rc.2 — headerfoto positioneren (Issue #22)

**HACS-testversie, geen Stable.** Deze RC bouwt voort op v2.0.1-rc.1. Stable v2.0.0 en alle eerdere RC-tags blijven ongewijzigd.

## Opgelost

- **Issue #22 — Bovenkant / Midden / Onderkant bij de headerfoto leek niets te doen.** De oude uploader sneed de originele afbeelding vóór opslag direct bij tot een horizontale strook van ongeveer 3,1:1. Daardoor bleef er nauwelijks verticale informatie over die met de positie-instelling verplaatst kon worden.
- Nieuwe uploads bewaren de **hele beeldverhouding** van de foto, lokaal verkleind tot een compacte JPEG van maximaal 100 kB. De uitsnede gebeurt pas tijdens weergave in de header met de bestaande `background-size: cover` en `background-position`.
- Het voorbeeld in **Instellingen → Header → Foto positioneren** verandert meteen bij de keuze Bovenkant, Midden of Onderkant. Na **Header opslaan** wordt de gekozen positie per Home Assistant-account bewaard.
- Bestaande foto-upload, verwijdering, accountopslag, beveiligde JPEG-validatie, headerhoogte en knoppenlayout blijven behouden.

> **Belangrijk voor bestaande foto's:** een foto die in een eerdere versie al is bijgesneden, kan de verdwenen delen niet terugkrijgen. **Upload je oorspronkelijke foto één keer opnieuw** en kies daarna de gewenste positie.

## Regressiecontroles

- Nieuwe Chromium-test `tests/test_issue22_header_photo_position.py` met een verticale foto met drie duidelijk verschillende kleurvlakken. Controleert dat alle delen na upload aanwezig blijven, de drie previewposities werken, de gekozen positie wordt opgeslagen en de header niet verspringt op telefoon, tablet en desktop.
- De bestaande browser- en backendtests blijven actief, inclusief issue #16 en #17.
- Publicatie via de bestaande RC-workflow pas na geslaagde codechecks, HACS, Hassfest en browserregressies.

## Testen op je eigen Home Assistant

1. Maak een back-up en installeer **v2.0.1-rc.2** via HACS → PalaSidebar → Opnieuw downloaden → Andere versie nodig?; schakel testversies in indien nodig. Herstart Home Assistant.
2. Ga naar **PalaSidebar → Instellingen → Header** en upload je **originele foto opnieuw**.
3. Wissel tussen **Bovenkant**, **Midden** en **Onderkant**. De preview moet zichtbaar van uitsnede veranderen bij een foto die hoger is dan de header.
4. Klik **Header opslaan**. Controleer dat de foto in de sidebar meeschuift, de titel/knoppen op hun plaats blijven en de positie na opnieuw openen bewaard is.
5. Test ook op Android en desktop. Meld eventuele afwijkingen in [Issue #22](https://github.com/OnlyRobin/PalaSideBar/issues/22).

**Terugval:** [v2.0.1-rc.1](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1-rc.1) en [v2.0.0 Stable](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0) blijven beschikbaar.
