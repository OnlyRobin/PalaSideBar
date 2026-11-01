# PalaSidebar v2.0.0 — eerste stabiele release

**Status:** formeel goedgekeurd op 1 november 2026 na praktijkacceptatie van RC14; deze notities gelden voor de uiteindelijke stable-publicatie van exact die code.

## Vrijgegeven op basis van RC14

- Eén eigen PalaSidebar-zijbalk voor desktop, Android Companion en tablet.
- Behoud van menu's, subsecties, favorieten, dynamische sensoren, badges met kleurregels en F1-/warmtepomp-weergave.
- Sectie Design Studio: randen rond START/BEHEER, achtergronden, sectiekoppen, itemranden en live voorvertoning.
- Instellingen logisch onderverdeeld in Basis & weergave, Menu & inhoud, Vormgeving en Onderhoud.
- Aangepaste Home Assistant-badges, fonts, thema's, glas en achtergrondgalerij.
- Zelftest en privacyvriendelijke bugmelding met lokale screenshot-preview; foto's worden pas door jou op GitHub toegevoegd.
- Updatecontrole voor beta/RC/stable. Installatie blijft via HACS.
- Home Assistant-accountopslag, herstelpunten en bestaande instellingen.

## Validatie

De broncode is ontleend aan [RC14](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc.14), GitHub-testcontrole [geslaagd](https://github.com/OnlyRobin/PalaSideBar/actions/runs/41294767117) op commit `51424aba37bf7c0a29367178dbca888e5c9f89e1`. De gebruiker bevestigde op **1 november 2026** dat de geteste functies goed werken en gaf expliciet toestemming voor de eerste stabiele versie.

Voor Stable worden de drie installatieversies veranderd naar `2.0.0` en de exacte RC14-code vergeleken, waarna alle tests, HACS en Hassfest op de stable-commit opnieuw worden uitgevoerd. Een release verschijnt alleen bij een volledig geslaagde controle.

## Installatie en terugval

Gebruik HACS → PalaSidebar → **v2.0.0** en herstart Home Assistant volledig. Maak vooraf een Home Assistant-back-up. RC14 en oudere RC/bèta-tags blijven beschikbaar als terugvaloptie en worden niet hernoemd of verwijderd. Bij problemen kun je [RC14](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc.14) via HACS handmatig opnieuw downloaden.

Stable betekent vrijgegeven na de uitgevoerde controles; er wordt geen garantie gegeven dat toekomstige Home Assistant-versies of alle apparaten foutloos blijven.
