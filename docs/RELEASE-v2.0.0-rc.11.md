# PalaSidebar v2.0.0-rc.11 — Premium UI en footer-tekstgrootte

**Nieuwe RC-testversie, geen stabiele release.** Het versienummer heeft nu het SemVer-formaat `rc.11` (de oude ongewijzigde RC10 heet `rc10`). De permanente `rc`-branch blijft bestaan.

## Verbeteringen

- **Issue #13**: de desktop-/mobielschuifregelaars veranderen nu ook de drie originele Home Assistant-footerlabels: Instellingen, Meldingen en Profiel. We gebruiken de echte Home Assistant 2026.10-ID's (`sidebar-config`, `sidebar-notifications`, `sidebar-profile`), niet langer alleen linkdetectie. De wijziging blijft beperkt tot deze drie labels; er is een extra schaalregelaar **Onderste Home Assistant-knoppen**.
- **Lettertype uploaden**: upload WOFF2/WOFF/TTF/OTF van maximaal 160 kB. Je ziet het lettertype direct als voorbeeld en kunt het na controle per Home Assistant-account opslaan, of weer verwijderen. De fontdata wordt in PalaSidebar-instellingen opgeslagen; upload uitsluitend bestanden die je vertrouwt en mag gebruiken.
- **Luxere presetbalk**: betere hover, zachtere randen en extra profielen **Midnight Gold**, **Nordic Ice** en **Zonsondergang**, naast HA standaard, Klassiek, Premium glas, Compact en AMOLED.
- **Meer styling**: optionele premium knop-gloed en een aparte footer-tekstgrootte, met behoud van bestaande kleuren, achtergrond, glas, kaartafronding en schaduwen.
- **Updatemelding**: de ingebouwde updateherkenning ondersteunt zowel oude tags `rc10` als nieuwe numerieke prerelease-tags `rc.11`, `rc.12` enzovoort.
- De bestaande privacyvriendelijke bugmelding met lokale screenshot-preview blijft aanwezig. Screenshots worden **niet** ongemerkt naar GitHub geüpload.

## Testen op Home Assistant 2026.10.4

1. Installeer de release via HACS met prereleases ingeschakeld en herstart Home Assistant.
2. Zet desktoptekstgrootte op 80%, 100%, 130%; controleer onderaan Instellingen, Meldingen en Profiel, maar ook andere sidebarlabels en bestaande badgegroottes.
3. Doe hetzelfde met mobiele tekstgrootte op telefoon en tablet en controleer dat de sidebar niet verspringt.
4. Test de aparte footer-schuifregelaar; deze hoort alleen die drie HA-knoppen te beïnvloeden.
5. Upload een klein eigen WOFF2-lettertype, kies **Eigen lettertype (upload)** en sla op; controleer na herladen dat het werkt. Test verwijderen.
6. Probeer de nieuwe profielen, donker/licht thema, swipe, backpress, instellingen, bugmeldingen en updatemeldingen.
7. Controleer in HACS of `rc.11` als nieuwere versie wordt gezien. Sommige oudere HACS-versies sorteren prereleases niet correct; controleer dan handmatig de releaseversie.

**Terugval:** [RC10](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc10) en alle oudere RC-releases blijven beschikbaar. **Stable wordt pas gepubliceerd na jouw expliciete goedkeuring.**
