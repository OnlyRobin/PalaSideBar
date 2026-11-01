# PalaSidebar — releasecontrole voor v2.0.0

**Laatste gepubliceerde release candidate:** [RC5](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc5)  
**Werkbranch:** [stabilization/rc5-to-v2](https://github.com/OnlyRobin/PalaSideBar/tree/stabilization/rc5-to-v2)  
**Vrijgave:** **nog niet goedgekeurd**. [Concept-PR #10](https://github.com/OnlyRobin/PalaSideBar/pull/10) mag niet automatisch worden samengevoegd.

## Technische controles

- [x] De gepubliceerde RC5-code als uitgangspunt gebruikt, niet de oudere broncode op `main`, `develop` of `release/v2.0.0`.
- [x] De headerfoto-race gerepareerd: ongeldige selectie mag opslaan niet blokkeren.
- [x] Maximaal totaal aantal afbeeldingspixels begrensd om geheugendruk te verkleinen.
- [x] Nieuwe browserregressietests voor headerfoto, serveropslag en accountwissel.
- [x] Losse HACS-, backend-, browser- en packaging-workflow ingericht, zonder automatische release.
- [x] Conflicten met de oude releasebranch opgelost met behoud van RC5-code en recentere documentatie.
- [ ] Alle automatische controles opnieuw geslaagd op de **uiteindelijke** releasecommit.
- [ ] Versie `2.0.0` consistent in frontend-JS, versie-JSON, manifest en toelichtingen.

## Praktijkacceptatie

- [ ] Nieuwe installatie in afzonderlijke Home Assistant-testomgeving.
- [ ] Upgrade van Beta8, RC4 en RC5 zonder verloren voorkeuren.
- [ ] Correct serveropslag, herstelpunten, export/import en offline-synchronisatie.
- [ ] Desktop Home Assistant: native sidebarheader, navigatie, scroll, thema's, instellingen.
- [ ] Mobiele Android Companion: swipe, backpress, lang indrukken en HA-dialogen.
- [ ] PalaKiosk/tablet: compacte weergave en stabiele animatie/prestaties.
- [ ] F1-badges en live sensorwaarden bij wisselende Home Assistant-states.
- [ ] Niet alleen kortstondige tests: langdurig herladen, uit-/inklappen en foutafhandeling.
- [ ] Backup en terugzetten naar gepubliceerde RC5 daadwerkelijk getest.

## Veilig uitbrengen

1. Bevestig de volledige [stabilisatiecontrole](docs/STABILISATIE-RC5-NAAR-V2-NL.md) en [testinstructies](docs/DEVELOP-TESTEN-NL.md).
2. Werk pas na goedkeuring de versie en Nederlandstalige release notes bij en leg de definitieve broncommit vast.
3. Draai de volledige testsuite en HACS/Hassfest **op precies die commit**.
4. Review en merge de gecontroleerde wijzigingen via de beveiligde GitHub-branch.
5. Publiceer `v2.0.0` als normale GitHub-release (geen prerelease), zonder bestaande MIT-tags of installaties te veranderen.
6. Controleer de upgrade op HACS en bewaar RC5 als rollback.

De MIT-licentie blijft ongewijzigd. De oude RC1-, RC2- en RC3-releases zijn bewust verwijderd; oudere tests kunnen voor regressiecontrole behouden blijven zonder een downloadlink naar die versies te tonen.
