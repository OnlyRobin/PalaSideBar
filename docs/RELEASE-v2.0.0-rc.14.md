# PalaSidebar v2.0.0-rc.14 — Sectie Design Studio en georganiseerde instellingen

**Testrelease voor HACS, geen Stable.** Bestaande RC13 en eerdere releases blijven staan. Er worden geen huidige gebruikersinstellingen verwijderd.

## Nieuw in RC14

- **Sectie Design Studio** voor alle navigatiesecties zoals START, BEHEER, FAVORIETEN en RECENT: een echte gemeenschappelijke sectiekaart rondom de titel en inhoud, niet alleen een losse lijn naast de sectie. Kies Uit, Outline, Soft, Glass of Accent.
- **Volledige sectierand:** doorgetrokken, gestreepte of gestippelde lijn; randkleur, dikte, afronding, padding, onderlinge afstand, achtergrondkleur, transparantie en glow.
- **Sectiekoppen:** eigen kleur, tekstgrootte, gekleurde headerachtergrond en dekking. Pijltjes, toetsenbordfocus en soepele uitklapanimaties blijven intact.
- **Items binnen secties:** randkleur/-dikte, radius, padding, ruimte tussen items, achtergrondkleur/dekking en randkleur voor actieve items. De bestaande sensorbadges houden hun afzonderlijke kleurregels.
- **Live sectievoorbeeld** om een START-blok en twee voorbeeldmenu-items te zien veranderen vóór Opslaan.
- **Nieuwe ordening voor alle instellingen**: de 16 bestaande tabs zijn logisch verdeeld in vier groepen — **Basis & weergave** (Algemeen, Header, Snelmenu); **Menu & inhoud** (Indeling, Dashboards, Acties, Sensoren, Agenda, Control Center); **Vormgeving** (Thema’s, Design, PalaSidebar UI, Badges); en **Onderhoud** (Diagnose, Performance, Backup). De opslag en technische tab-ID's blijven gelijk.

## Belangrijke compatibiliteit

Alle nieuw toegevoegde sectiestijlen zijn standaard uitgeschakeld. Na een upgrade blijft je huidige PalaSidebar-weergave intact totdat je expliciet een sectiestijl kiest. Er is geen extra javascript-bestand, www-map of aparte dashboardbron nodig. Sensor- en badgekleuren, snelmenu, inklappen, terugknop en performance-opties blijven in hun bestaande implementaties.

## Praktijkcontrole

1. HACS → PalaSidebar → Opnieuw downloaden → Andere versie nodig? → `v2.0.0-rc.14`; herstart Home Assistant. HACS kan prereleases verkeerd sorteren ([issue #5655](https://github.com/hacs/integration/issues/5655)).
2. Open **Instellingen → Vormgeving → PalaSidebar UI → Sectie Design Studio**. Kies Outline (2 px), daarna Soft en Glass. Controleer randen rondom START/BEHEER én hun inhoud.
3. Test randkleur, afronding, padding, kleur en gloed; daarna de titel-/header- en itemopties. Kijk of het live voorbeeld gelijk mee verandert.
4. Sla op, sluit de instellingen, open opnieuw. Controleer dat de waarden bewaard blijven.
5. Klap START en BEHEER in/uit. De hele sectiekaart moet netjes blijven en de animatie moet werken, zonder verplaatsing van badges.
6. Test de vier nieuwe hoofdcategorieën, inclusief alle 16 tabbladen, en kies elke categorie op desktop, telefoon en tablet.
7. Test daarnaast je bestaande warmtepomp-badges, F1-aftelling, swipe, Android-terugknop, accountopslag en licht/donker thema.

**Terugval:** [RC13](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc.13) blijft beschikbaar. **Stable wordt niet uitgebracht zonder uitdrukkelijke goedkeuring.**
