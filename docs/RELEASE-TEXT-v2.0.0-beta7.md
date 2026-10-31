# PalaSidebar v2.0.0-beta7 — First HACS Beta

De eerste publieke **beta** van PalaSidebar, een configureerbare sidebar voor Home Assistant met HACS-installatie en automatische frontendregistratie.

## Functies

- Configureerbare navigatie, dashboards, favorieten en snelkoppelingen
- Live Control Center met dynamische sensorwaarden en thema-overname
- Snelmenu's via lang indrukken en rechtermuisknop, en dashboards slepen/sorteren
- Theme Studio Pro en Performance Center
- Instellingen per Home Assistant-account met import, export en herstelmogelijkheden
- Home Assistant-herstartknop voor beheerders, met bevestiging
- Lokale integratielogo's en een AutoLoader vanuit `custom_components`

## Installatie

Voeg `https://github.com/OnlyRobin/PalaSideBar` onder **HACS → Custom repositories** toe als **Integration**. Schakel prereleases in indien nodig. Installeer PalaSidebar, herstart Home Assistant en voeg de integratie toe via **Instellingen → Apparaten en diensten**, als die nog niet is toegevoegd.

## Update vanaf handmatige installatie

Maak vóór de update een back-up van `custom_components/pala_sidebar` en exporteer je sidebarinstellingen. Bewaar een eventuele aangepaste `pala-sidebar-config.json` buiten de integratiemap. Verwijder eventueel oude handmatige frontendresources om dubbele scripts te voorkomen.

## Beta-opmerkingen

Dit is een testrelease. Controleer op je eigen apparatuur vooral Android-terugknop, swipe, lang indrukken, favorieten, thema's en de opslag van instellingen. Meld problemen via [GitHub Issues](https://github.com/OnlyRobin/PalaSideBar/issues).

**Integratiedomein:** `pala_sidebar`  
**Manifestversie:** `2.0.0-beta7`  
**Release-tag:** `v2.0.0-beta7`
