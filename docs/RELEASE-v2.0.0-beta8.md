# PalaSidebar v2.0.0-beta8 — Settings & navigation fixes

**Nieuwe beta op basis van de werkende RC2-code.** Dit is geen stabiele v2.0.0.

## Opgelost sinds beta7
- **PalaSidebar UI**: het voorheen lege tabblad toont de instellingen weer, inclusief de vormgevingsopties.
- **Headerondertitel**: de standaardtekst **Mijn Home Assistant** wordt gebruikt als er geen ondertitel is ingesteld.
- **BEHEER**: standaardmenu uitgebreid met Apparaten, Entiteiten, Automatiseringen, Scripts, Helpers en Ontwikkelaarstools. HACS en Add-ons zijn zichtbaar als de betreffende panelen beschikbaar zijn.
- Bij een ongewijzigde oude BEHEER-indeling worden de extra standaarditems aangevuld. Eigen opgeslagen instellingen en aangepaste indelingen moeten intact blijven.
- De dubbele UI-preview-aanroep tijdens het opbouwen van instellingen is verwijderd.

## Installeren via HACS
1. Maak eerst een back-up van Home Assistant, de integratiemap en je PalaSidebar-instellingen.
2. Open HACS → PalaSidebar → **Download / Redownload**.
3. Zet de optie voor **prereleases / beta versions** aan en selecteer expliciet **v2.0.0-beta8**.
4. Klik Download en herstart Home Assistant volledig.
5. Controleer onderin de sidebar de versie **2.0.0-beta8**, of open `/pala_sidebar/assets/pala-sidebar-version.json`.
6. Test het instellingenpaneel, de ondertitel, het BEHEER-menu, Android-terugknop, swipen en het bewaren van persoonlijke instellingen.

## Versievolgorde belangrijk
De eerder gepubliceerde **v2.0.0-rc2** is volgens de gebruikelijke prereleaseversievolgorde **hoger** dan **v2.0.0-beta8**. HACS kan daarom RC2 nog als nieuwere versie zien. Beta8 is uitdrukkelijk een voortzetting van de beta-reeks en moet vanuit RC2 **handmatig** worden geselecteerd; een automatische upgrade vanuit RC2 kan niet worden beloofd.

## Terugzetten
Beta7, RC1 en RC2 blijven intact en beschikbaar als afzonderlijke GitHub-releases. Kies de gewenste versie via HACS → Redownload en herstart Home Assistant. Herstel indien nodig je configuratieback-up.

Copyright © 2026 Robin Bouwman — MIT voor originele PalaSidebar-bijdragen.
