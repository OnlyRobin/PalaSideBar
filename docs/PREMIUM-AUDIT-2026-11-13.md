# PalaSidebar Premium release-audit – 13 november 2026

## Scope

Uitgangspunt: repository `OnlyRobin/PalaSideBar`, gepubliceerde `v2.0.1-rc.6`, standaardbranch `main` met Stable `v2.0.0`. De open-issue- en open-PR-lijsten zijn gecontroleerd: op auditmoment geen open items.

### Gecontroleerde onderdelen

- **Packaging / backend:** manifest, config flow, static paths, idempotent installeren, legacy-config kopiëren zonder overschrijven, loaderregistratie en ontladen.
- **Security / privacy:** geen `eval` of `Function` en geen `innerHTML=` in de hoofd-sidebar, adminchecks op gevoelige acties, PalaGuard-koppeling leest geen vertrouwelijke data, geen nieuwe externe dependency. Eerdere Git-geschiedenis-secretscan is apart gedocumenteerd; niet opnieuw geclaimd voor deze audit.
- **Frontend:** headerfoto en echte HA-navmarge, scroll/terugknop/swipe, secties, badges, zoekveld, live updates, opslaan/migreren, thema's en PalaKiosk-functies. De reeds aanwezige regressietests blijven de contracten bewaken.
- **A11y & premium:** zichtbare actieve navigatie, toegankelijkheidslabels, touch-doelgrootte, keyboardfocus en gereduceerde animatie.
- **Versie / releases:** juiste versievelden, valse meldingen bij downgrade/rollback, documentatie en automatische HACS-prerelease.
- **Integraties:** PalaGuard alleen optioneel en eenrichtings; afwezigheid verhindert PalaSidebar-installatie niet.

### Aantoonbare bevindingen en maatregelen

| Bevinding | Correctie |
| --- | --- |
| AutoLoader gebruikte alleen `latest !== loaded`; een oudere manifestversie werd als update aangeboden | Semantische versievolgorde met test voor RC/Beta/Stable en rollback |
| Verouderde, hardcoded RC11 in een migratielog | Generiek, accuraat migratiebericht zonder wijzigen van migratie |
| Oude RC-versies in installatie/ontwikkeldocumentatie | Actuele releases en branchstructuur vastgelegd |
| Touch-bediening footer 36–40px | Aanraakdoelen voor PalaGuard en herstart op grovere pointer ≥44px (ingeklapte rail ≥42px) |
| Sectie-overgangen respecteerden niet overal systeembreed ‘verminder beweging’ | Overgangen voor eigen groepssecties uitgeschakeld bij reduced motion |
| Alleen RC-versions in support-update regressie | Channel-aware stable/RC-test voor dezelfde broncode |

### Niet geclaimd als gevalideerd

Dit is een gerichte code- en CI-audit, **geen bewijs van perfecte foutloosheid**. Op de eigen HA-omgeving, Android Companion en PalaKiosk zijn langdurige performancemetingen, recovery en hardwareinteracties zonder directe toegang niet onafhankelijk getest. De omvangrijke frontend is niet zomaar opgesplitst: dit zou bestaande werking en opslag onnodig kunnen verstoren. Een toekomstige modulairheidsstap verdient een apart plan met eerst uitgebreide benchmarks.

### Release gates

RC7 alleen na code checks, Hassfest, HACS en volledige Chromium-suite; Stable `v2.0.1` alleen uit gelijkwaardige bron met alle controles opnieuw op de Stable-commit. Geen oude tags overschrijven, rollback via RC6 of Stable v2.0.0 beschikbaar.
