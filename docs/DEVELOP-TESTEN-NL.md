# PalaSidebar: develop testen zonder je werkende installatie te verliezen

## Welke versie staat waar?

- **main / GitHub-release:** `v2.0.0-beta7` is de gepubliceerde prerelease. De `main`-branch bevat ook latere documentatieupdates.
- **develop:** `2.0.0-rc1` is de *release candidate* voor een toekomstige stabiele `v2.0.0`. **Nog geen stabiele release.**
- Beide branches hebben het Home Assistant-domein `pala_sidebar` en dezelfde interne URL's en opslag-ID's: installeer ze **niet tegelijk in dezelfde Home Assistant-instantie**.

## Aanbevolen: test in aparte Home Assistant-testomgeving

1. Maak een volledige Home Assistant-back-up; download die ook naar je computer.
2. Maak apart een kopie van de huidige map `/config/custom_components/pala_sidebar/`, vooral van een eventueel eigen `pala-sidebar-config.json` bestand.
3. Exporteer je PalaSidebar-instellingen vanuit de sidebar.
4. Open de GitHub Actions-pagina [Development browser regression and test package](https://github.com/OnlyRobin/PalaSideBar/actions/workflows/develop-regression.yml).
5. Selecteer de **nieuwste geslaagde** run voor branch `develop` (groene vink); onder **Artifacts** download je `PalaSidebar-develop-test`. GitHub kan hiervoor een ingelogd account verlangen.
6. Pak de GitHub-artifact uit en pak daarna `PalaSidebar-develop-test.zip` uit. Daarin staat `custom_components/pala_sidebar/`. Kopieer uitsluitend die map naar de testinstantie op `/config/custom_components/pala_sidebar/`.
7. Herstart de **testinstantie** volledig en controleer dat de integratie is toegevoegd via Instellingen → Apparaten en diensten. Open `/pala_sidebar/assets/pala-sidebar-version.json` op de URL van jouw Home Assistant: daar moet `2.0.0-rc1` staan.
8. Test het uiterlijk en de werking op desktop, Android Companion en indien van toepassing PalaKiosk.

Alternatief zonder GitHub Actions-artifact: [download de actuele develop-branch als ZIP](https://github.com/OnlyRobin/PalaSideBar/archive/refs/heads/develop.zip). Daarin staat de integratiemap onder `PalaSideBar-develop/custom_components/pala_sidebar/`. De artifactmethode heeft de voorkeur, omdat het ZIP-bestand **pas wordt aangeboden als de automatische regressietests slagen**.

## Alleen je bestaande Home Assistant beschikbaar?

Dan is testen mogelijk, maar **niet parallel**. Plan een kort onderhoudsmoment en maak eerst de back-ups hierboven.

1. Stop met wijzigen van de sidebar tijdens het vervangen van de integratiemap.
2. Bewaar de huidige map als een afzonderlijke back-up buiten `custom_components` (anders kan HA dubbele integraties ontdekken).
3. Kopieer de ontwikkelmap `pala_sidebar` naar `/config/custom_components/`; behoud een eventueel eigen `pala-sidebar-config.json` door die na de kopie te herstellen.
4. Herstart Home Assistant volledig. Controleer de versie-URL en test alle functies.
5. **Terugzetten:** herstel de oorspronkelijke map of gebruik HACS → PalaSidebar → drie puntjes → **Redownload** → kies `v2.0.0-beta7` als beschikbare versie. Herstart HA opnieuw. Herstel zo nodig je aparte configuratieback-up.

Let op: een handmatig geplaatste ontwikkelversie is geen HACS-release. HACS kan die later bij een update overschrijven. HACS toont standaard de recente GitHub-releases en de **default branch** (`main`), niet willekeurig de `develop`-branch; voor de echte `develop`-code gebruik je daarom de ZIP-testmethode.

## Testchecklist voor v2.0.0

- [ ] Nieuwe installatie en update vanaf `v2.0.0-beta7` starten zonder Home Assistant-fouten.
- [ ] Desktop: menu openen, sluiten, secties in-/uitklappen, dashboardnavigatie en rechtermuisknop-menu.
- [ ] Android Companion: live swipe-open/-dicht, terugknop bij sidebar, dashboard en geopende dialogs.
- [ ] Lang indrukken: contextmenu opent zonder per ongeluk te navigeren.
- [ ] Dynamische badges, iconen en sensorwaarden verversen zonder haperingen.
- [ ] Theme Studio: thema kiezen, bewerken en opslaan; accountinstellingen blijven na herstart bewaard.
- [ ] Live Control Center, snelmenu's en dashboardvolgorde werken.
- [ ] PalaKiosk/tablet: performance, navigatie, landscape en eventuele kiosk-interactie.
- [ ] AutoLoader toont de juiste versie en veroorzaakt geen dubbele resource.
- [ ] Terugzetten van de oude versie en herstellen van voorkeuren werkt.

Noteer als iets misgaat de versie, Home Assistant-versie, toestel, stappen om de fout te reproduceren en geanonimiseerde logregels. Zet geen wachtwoorden, tokens of lokale adressen in openbare GitHub Issues.

## Wanneer wordt v2.0.0 echt stabiel?

Pas als **Code checks, Hassfest, HACS-validation en de Chromium-regressietests groen zijn** én de werking op echte apparaten en de HACS-migratie bevestigd is. Dan maken we van deze kandidaat de definitieve `2.0.0` in `main` en publiceren we een normale (niet-prerelease) GitHub-release `v2.0.0`.

De bestaande `v2.0.0-beta7`-tag blijft onveranderd voor terugrollen.
