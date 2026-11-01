# PalaSidebar v2.0.0-rc.13 — opgeschoonde vormgeving

**Releasecandidate voor HACS, geen Stable.** RC12 blijft beschikbaar als terugvaloptie.

## Opgelost

- **Home Assistant-badges** is voortaan de naam van de instellingen voor de badgewaarden bij Instellingen en Meldingen. De interne opslagvelden blijven ongewijzigd, zodat bestaande voorkeuren blijven werken.
- **Dubbele achtergrondkeuze verwijderd.** De bestaande dropdown en de achtergrondgalerij boden dezelfde negen stijlen aan. Alleen de visuele galerij blijft zichtbaar.
- De galerij bewaart de achtergrond in hetzelfde configuratieveld als voorheen. De presets, huidige selectie, live voorvertoning, opslaan en heropenen blijven werken.
- De andere stijlopties uit RC12, waaronder Badge Design Studio, eigen fontupload, sensorkleuren, randen, gloed en native Home Assistant-badges, blijven beschikbaar.

## Testen

1. Installeer RC13 via HACS → PalaSidebar → Opnieuw downloaden → Andere versie nodig? → `v2.0.0-rc.13`. De automatische HACS-updateselectie kan nog steeds een oudere RC voorstellen ([HACS-bug #5655](https://github.com/hacs/integration/issues/5655)).
2. Open Instellingen → PalaSidebar UI. Controleer dat er slechts **één Dashboardachtergrond-galerij** staat, met negen keuzes.
3. Kies Aurora of Midnight, controleer de live selectie, sla op, sluit en open de instellingen opnieuw. Controleer dat de keuze bewaard bleef.
4. Kies achtereenvolgens HA standaard en AMOLED in de presets en controleer dat de galerij de juiste actieve achtergrond aangeeft.
5. Controleer dat het kopje **Home Assistant-badges** staat, en dat achtergrond, tekstkleur, rand en afronding nog werken bij Instellingen/Meldingen.
6. Test mobiel, tablet en desktop, inclusief bestaande badge-sensorkleuren, F1, warmtepomp, backpress en swipe.

**Terugval:** [RC12](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc.12). Wij wijzigen bestaande tags en releases niet. Stable wordt alleen met expliciete goedkeuring uitgebracht.
