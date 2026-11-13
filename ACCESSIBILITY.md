# Toegankelijkheid – PalaSidebar

PalaSidebar is bedoeld voor Home Assistant op desktop, telefoon, tablet en kioskweergaven. We streven ernaar dat de navigatie begrijpelijk en bruikbaar blijft, ook met toetsenbord, aanraakbediening of aangepaste weergavevoorkeuren.

## Waar we op letten

- **Toetsenbord:** bereikbare knoppen en bedieningsonderdelen, zichtbare focus en logische navigatie.
- **Schermlezers:** betekenisvolle knopnamen en labels, waar technisch mogelijk.
- **Leesbaarheid:** aanpasbare tekstgrootte en contrast binnen de mogelijkheden van het gekozen Home Assistant-thema.
- **Aanraakbediening:** voldoende grote doelen voor veelgebruikte acties op mobiel en tablet.
- **Beweging:** respect voor de systeemvoorkeur *Verminder beweging* bij eigen overgangen.
- **Responsiviteit:** bruikbare instellingen, menu's en dialogen op verschillende schermbreedtes.

## Bekende beperkingen

PalaSidebar gebruikt de frontend van Home Assistant, inclusief aangepaste elementen en shadow DOM. Dat maakt de uiteindelijke toegankelijkheid afhankelijk van Home Assistant, thema, browser, apparaat en gekozen instellingen. Sommige complexe badge-editors, drag-and-drop-acties, overgangsanimaties en kioskcombinaties zijn nog niet onder alle ondersteunende technologieën handmatig getest.

**Dit document is geen claim dat PalaSidebar volledig aan WCAG 2.2 AA voldoet.** Geautomatiseerde tests zijn nuttig, maar vervangen geen praktijktest met toetsenbord, schermlezer of een specifiek apparaat.

## Een toegankelijkheidsprobleem melden

Gebruik de [bugmelding](https://github.com/OnlyRobin/PalaSideBar/issues/new/choose) en vermeld:

- PalaSidebar- en Home Assistant-versie;
- apparaat en browser, eventueel schermlezer of toetsenbord;
- welke handeling niet lukt;
- verwacht gedrag en daadwerkelijk gedrag;
- een geanonimiseerde screenshot of korte beschrijving, waar nuttig.

Deel geen wachtwoorden, tokens, privéadressen of persoonlijke informatie. Voor een echt beveiligingslek: [SECURITY.md](SECURITY.md).

Verbeteringen met een gerichte regressietest zijn welkom via de [bijdragehandleiding](CONTRIBUTING.md).
