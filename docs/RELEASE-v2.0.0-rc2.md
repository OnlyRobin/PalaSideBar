# PalaSidebar v2.0.0-rc2 — UI en standaardmenu hersteld

**Prérelease voor HACS-testers, geen definitieve stable.**

## Opgelost
- **PalaSidebar UI**: het instellingenpaneel werd opgebouwd op de oude interne tabnaam `palafix`; nu wordt het correct gekoppeld aan `ui_style` en verschijnen de instellingen en het voorbeeld.
- **Standaardondertitel**: bij een configuratie zonder expliciete `subtitle` is de standaard nu **Mijn Home Assistant** in plaats van een lege regel. Expliciet ingestelde lege of eigen ondertitels blijven behouden.
- **BEHEER**: de standaardlijst is uitgebreid met Apparaten, Entiteiten, Automatiseringen, Scripts, Helpers en Ontwikkelaarstools. **HACS** en **Add-ons** worden alleen getoond als de bijbehorende Home Assistant-panelen bestaan.
- Bij de oude, ongewijzigde BEHEER-lijst met alleen Integraties/Updates worden de nieuwe standaardopties aangevuld. Aangepaste menu's, gebruikersvolgorde, verborgen onderdelen, badges en accountinstellingen blijven behouden.
- Eén overbodige extra UI-preview-aanroep verwijderd om dubbele verwerking te vermijden.

## Testen in HACS
1. Exporteer PalaSidebar-instellingen en maak een Home Assistant-back-up, plus aparte kopie van een lokaal aangepaste `pala-sidebar-config.json`.
2. Open HACS → PalaSidebar → Download / Redownload → **Show beta versions** → selecteer `v2.0.0-rc2`.
3. Download en herstart Home Assistant volledig.
4. Controleer versie `2.0.0-rc2` onderin de sidebar en op `/pala_sidebar/assets/pala-sidebar-version.json`.
5. Controleer het tabblad PalaSidebar UI, de headerondertitel en de adminsectie BEHEER. Test daarna de Android-terugknop, swipen en opgeslagen instellingen.

Terug naar RC1: kies in HACS opnieuw `v2.0.0-rc1` en herstart Home Assistant.

**Geen automatische stabiele release:** `v2.0.0` blijft een concept totdat de werking op echte apparaten is bevestigd.
