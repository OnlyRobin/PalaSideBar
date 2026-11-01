# PalaSidebar v2.0.0-rc.12 — Badge Design Studio en achtergronden

**Testversie, geen Stable.** Publicatie volgt pas als alle automatische controles slagen. RC11 en eerdere releases blijven ongewijzigd beschikbaar.

## Verbeterd
- **Badge Design Studio:** standaardbadgekleuren kunnen Home Assistant/PalaSidebar blijven volgen of volledig eigen achtergrond- en tekstkleuren krijgen. Instelbaar: randkleur, randdikte, afronding, binnenruimte, gloed en transparantie.
- **Home Assistant-tellers apart:** Instellingen en Meldingen behouden hun HA-functionaliteit en sensortelling, maar kunnen de PalaSidebar-accentkleur, de HA-kleur of een eigen achtergrond- en tekstkleur gebruiken, plus eigen rand en radius.
- **Per sensorbadge:** een individuele menubadge kan de algemene instellingen volgen of eigen randdikte, afronding, HEX-randkleur en gloed gebruiken. Twee extra stijlen: Glass en Gradient, naast solid, soft, outline, plain en dot. De bestaande sensorkleur-, regel- en temperatuurinterpolatie wordt niet vervangen.
- **Achtergrondselectie:** alle achtergronden zijn beschikbaar in een visuele galerij, met Home Assistant, Klassiek, Glas, Effen HA, Eigen kleur, Midnight, Aurora, Zonsondergang en AMOLED. De gewone keuzelijst blijft werken.
- **Menuranden:** eigen randdikte en randkleur voor de PalaSidebar-menuitems.
- Bestaande kleur- en sensorvoorkeuren worden behouden: de nieuwe velden hebben veilige standaardwaarden en overschrijven geen individuele sensorkleuren.

## Handmatig controleren
1. Installeer `v2.0.0-rc.12` via HACS → PalaSidebar → Opnieuw downloaden → Andere versie nodig?; HACS sorteert RC-tags soms verkeerd ([HACS issue #5655](https://github.com/hacs/integration/issues/5655)).
2. Open PalaSidebar → Instellingen → PalaSidebar UI. Probeer eerst **HA standaard**, daarna **Eigen PalaSidebar-kleuren**.
3. Verander achtergrond, tekstkleur, radius, rand, gloed en transparantie en controleer voorbeeld + sidebar.
4. Controleer de standaard Home Assistant-tellers bij Instellingen en Meldingen in elk kleurkanaal.
5. Open de editor van een individuele sensorbadge; probeer Glass, Gradient en eigen border/glow.
6. Controleer F1-aftelling, warmtepomp-sensorbadges, meerregelige badges en sensorgestuurde kleuren. Die moeten blijven werken.
7. Test ook licht/donker thema, mobiele breedte, instellingen opslaan/heropenen, backpress, swipe en performance.
8. Meld eventuele regressies via Instellingen → Diagnose → Bug melden.

Bij problemen kun je [RC11](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc.11) opnieuw installeren. Er is **geen automatische update of kanaalwissel**; Stable wordt niet uitgebracht zonder goedkeuring.
