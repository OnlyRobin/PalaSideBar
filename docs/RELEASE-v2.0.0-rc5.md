# PalaSidebar v2.0.0-rc5 — Foto in de eigen header

RC5 bouwt voort op RC4 en behoudt het bestaande HACS-updatemechanisme, badges, sensorzoeken, mobiel gedrag en thema's.

## Nieuw

- Foto uit de bestandskiezer kiezen in **Instellingen → Header → Headerafbeelding (optioneel)**.
- Ondersteunt JPG, PNG en WebP tot 4 MB; afbeelding wordt lokaal uitgesneden en verkleind tot een kleine JPEG in je accountinstellingen (geen aparte `www`-map).
- Direct voorbeeld, uitsnede boven/midden/onder, eigen foto verwijderen en pas bewaren na **Header opslaan**.
- De foto verschijnt alleen in de eigen PalaSidebar-header; de Home Assistant-header wordt niet aangepast.
- De titel, subtitel, sensoren en bestaande kleuren blijven intact. Bij geen foto blijft de standaardheader staan.
- De foto's worden als onderdeel van de huidige serverinstellingen gesynchroniseerd; herstelpunten en een export bevatten de foto als compact JPEG-datablok.
- Drie kleine illustratieve PalaSidebar-voorbeelden toegevoegd aan de README.

## Veilig testen

1. Exporteer je instellingen en maak een Home Assistant-back-up.
2. Kies **HACS → PalaSidebar → Opnieuw downloaden → Testversies tonen → v2.0.0-rc5**, herstart HA.
3. Open **Instellingen → Header**, kies een foto, controleer het voorbeeld, sla de header op en heropen de instellingen.
4. Controleer ook op de mobiele Android-app, met verborgen originele HA-sidebarheader, sensorregel en gesynchroniseerde accountinstellingen.
5. Test verwijderen en herladen. Bij problemen kun je naar RC4 of een oudere versie terugkeren.

**Let op:** Illustraties in de README zijn artistieke voorbeelden en geen exacte screenshots. Er worden geen foto's naar externe servers gestuurd; accountgegevens worden via bestaande Home Assistant-opslag verwerkt.
