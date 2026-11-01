# PalaSidebar veilig testen: Beta, RC en Stable

De repository heeft **precies drie vaste branches**:

- [`main`](https://github.com/OnlyRobin/PalaSideBar/tree/main): beschermde standaardbranch en officiële projectdocumentatie.
- [`beta`](https://github.com/OnlyRobin/PalaSideBar/tree/beta): bètabranch, momenteel gebaseerd op v2.0.0-beta8.
- [`rc`](https://github.com/OnlyRobin/PalaSideBar/tree/rc): permanente release-candidatebranch, momenteel gebaseerd op v2.0.0-rc6.

**Wijzigingen in de app verschijnen altijd eerst als een nieuwe, hoger genummerde RC.** RC6 wordt RC7, RC8 enzovoort, met voor elke versie een nieuwe GitHub-prerelease. De vorige RC-tags en releases blijven permanent bestaan als herstelopties. Alleen nadat je zelf op je apparaten akkoord hebt gegeven, wordt een gecontroleerde RC uitgebracht als Stable.

## Een RC via HACS testen

1. Maak een back-up van Home Assistant en exporteer de PalaSidebar-accountinstellingen.
2. Open HACS (of vanaf Home Assistant 2026.11 de Marketplace) en zoek **PalaSidebar**.
3. Kies **Downloaden / Opnieuw downloaden**, schakel **testversies / prereleases** in en selecteer de nieuwste `v2.0.0-rcN`.
4. Installeer de update en herstart Home Assistant volledig.
5. Controleer het versienummer in de integratie en test op desktop, telefoon en tablet.
6. Meld eventuele fouten via [GitHub Issues](https://github.com/OnlyRobin/PalaSideBar/issues).

### Praktijktesten

- [ ] Desktop en mobiel: tekstgrootte, menu en dynamische badges.
- [ ] Android: swipe open en dicht, terugknop, lang indrukken en dialogen.
- [ ] Tablet/PalaKiosk: scrollen, animaties en vloeiend aftellen bij live F1-badges.
- [ ] Home Assistant: verborgen originele sidebarheader en zichtbare eigen PalaSidebar-header.
- [ ] Headerfoto kiezen, bewaren, terugladen en verwijderen.
- [ ] Instellingen per account, export/import en herstellen.
- [ ] Geen geheugen- of prestatieproblemen bij langdurig gebruik.

Bij problemen kun je via HACS een **vorige RC-release** opnieuw installeren; de branch `rc` zelf is geen herstelpunt voor oudere code, daarvoor dienen de onveranderlijke release-tags.

## Belangrijk bij het icoon in de Updates-pagina

PalaSidebar levert de correcte lokale `custom_components/pala_sidebar/brand/`-afbeeldingen mee. Het ontbreken van een logo in de oude HACS-updateweergave is een bekend probleem van de HACS-frontend, niet van die bestanden. De nieuwere Home Assistant Marketplace vanaf 2026.11 gebruikt het nieuwe brands-systeem. Voor dit visuele probleem is geen codepatch of nieuwe RC nodig.

## Stable

Een stabiele versie wordt pas voorbereid na expliciete goedkeuring van de meest recent geteste RC en een nieuwe, geslaagde controle van alle tests. De open [concept-pull-request](https://github.com/OnlyRobin/PalaSideBar/pull/12) is uitsluitend bedoeld voor dat toekomstige besluit; er wordt niets automatisch samengevoegd.
