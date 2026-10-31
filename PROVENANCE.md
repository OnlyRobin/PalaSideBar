# Herkomst van de PalaSidebar-broncode en licenties

## Verklaring van de projectbeheerder

Op **31 oktober 2026** heeft de beheerder aangegeven dat **Custom Sidebar alleen als voorbeeld voor de werking is gebruikt**. Het was niet de bedoeling broncode over te nemen. De beheerder kan echter niet onafhankelijk bevestigen of tijdens eerdere, door de assistent uitgevoerde wijzigingen toch code is overgenomen of bewerkt.

In de eerdere ontwikkelgesprekken werd de oude sidebar samen met de bijbehorende YAML bestudeerd om het gedrag van menu's, swipebewegingen en de Android-terugknop te begrijpen. Dergelijke functies zijn opnieuw in PalaSidebar gebouwd. Alleen het bestuderen van een voorbeeld bewijst geen broncodekopie, maar de ontwikkelgeschiedenis biedt evenmin een absolute garantie dat er niets is hergebruikt.

## Vergelijking met de oorspronkelijke Custom Sidebar

Het aangeleverde archief `custom-sidebar-master(5).zip` is herkend als **elchininet/custom-sidebar v17.3.0**, met de licentie **Apache-2.0**. Dertig oorspronkelijke bron- en distributiebestanden zijn vergeleken met tien uitvoerbestanden van PalaSidebar beta7. Ook twee oudere PalaSidebar-versies zijn onderzocht.

- **Geen overeenkomende reeksen van 80 aaneengesloten codekarakters** gevonden.
- **Geen overeenkomende reeksen van acht opeenvolgende identificaties** gevonden.
- **Geen imports of afhankelijkheden van Custom Sidebar** in de onderzochte uitvoercode gevonden.
- PalaSidebar gebruikt een Home Assistant-integratie met een eigen frontend-loader; de oorspronkelijke plugin had een andere, modulaire TypeScript-opbouw.

Dit ondersteunt de conclusie dat geen letterlijke broncode uit dat archief is gekopieerd. Het sluit **niet** uit dat ideeën, algoritmen of bewerkte code afkomstig kunnen zijn uit externe bronnen. Lees het [uitgebreide publicatieonderzoek](docs/PUBLICATION-AUDIT-2026-10-31.md).

## Auteursrecht en licentie

- Eigen PalaSidebar-bijdragen worden onder de **MIT-licentie** verspreid met **© 2026 Robin Bouwman**. Daarmee worden geen rechten geclaimd op materiaal van derden.
- Als later blijkt dat Apache-2.0-broncode of andere externe code is bewerkt of overgenomen, moeten de bijbehorende licentievoorwaarden en verplichte vermeldingen worden nageleefd.
- Vereiste auteursvermeldingen mogen niet worden verwijderd alleen om de naam van een ander project niet meer te tonen.
- Het PalaSidebar-logo is voor dit project ontworpen. Controleer wel dat alle meegeleverde logo's, afbeeldingen en eventuele lettertypen rechtmatig opnieuw verspreid mogen worden.
- Controleer de bestanden en de Git-geschiedenis ook op privégegevens.

## Status van de publicatie

De repository is **openbaar** en de versies **beta7, RC1, RC2 en beta8** zijn op 31 oktober 2026 als GitHub-prerelease gepubliceerd. De automatische code-, Hassfest-, HACS- en browsercontroles zijn op de recente testversies geslaagd.

De vergelijking van de broncode is afgerond, maar een automatische vergelijking kan geen volledig bewijs van onafhankelijk auteurschap of de rechten op alle externe onderdelen leveren. Eventuele openstaande vragen blijven geregistreerd in [GitHub-issue #1](https://github.com/OnlyRobin/PalaSideBar/issues/1).

Nieuwe wijzigingen horen via een ontwikkelbranch, tests en een beoordeelde pull request te verlopen.
