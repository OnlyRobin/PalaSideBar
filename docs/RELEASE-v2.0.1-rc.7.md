# PalaSidebar v2.0.1-rc.7 – Premium Quality & Release Audit

**HACS-prerelease**, gebaseerd op de door de gebruiker bevestigde RC6. Niet automatisch Stable.

## Wat is verbeterd

- **Updateveiligheid:** de AutoLoader vergelijkt nu versies semantisch. Beta, RC en Stable hebben een duidelijke volgorde; een oudere manifestversie of gedeeltelijke rollback verschijnt niet meer ten onrechte als nieuwe update. Een echte nieuwere RC of Stable wordt wél gemeld.
- **Premium bediening:** subtiele thema-afhankelijke rand voor het actieve navigatie-item en helderdere footer-versietekst, zonder bestaande thema- of kaartinstellingen te overschrijven.
- **Toegankelijkheid:** grotere aanraakvlakken voor de PalaGuard-snelkoppeling en Home Assistant-herstartknop op aanraakschermen. Bij *Verminder beweging* zijn eigen sectie-overgangen uitgeschakeld.
- **Versiediagnose:** de oude hardcoded RC11-vermelding bij het migreren van een legacyconfig is verwijderd; configuratie- en serveropslag blijven ongewijzigd.
- **Documentatie:** de HACS-uitleg en ontwikkelingstakken zijn bijgewerkt met de actuele versies.
- **Regressies:** nieuwe Chromium-tests voor versievolgorde, vals update-alarm bij rollback, touch-targets, actieve navigatie en reduced motion. De bestaande #16/#17/#22-, mobiele, PalaGuard-, opslag- en headerfoto-tests blijven actief.
- **Voorbereiding voor Stable:** bestaande update-regressie maakt onderscheid tussen RC- en Stable-updates, zodat een latere v2.0.1 uit dezelfde codebasis kan worden getest.

## Wat bewust niet is gewijzigd

Geen grote herschrijving van de JS-architectuur, geen nieuwe achtergrondprocessen, geen externe afhankelijkheden, geen wijzigingen in PalaGuard-broncode, geen veranderingen in opgeslagen voorkeuren, apparaatmigratie, HA-accountrechten, menu-routes of headerfoto-positionering. Vorige tags/releases blijven herstelpunten.

## Releasecontrole

- Manifest, versie-JSON en frontendversie moeten exact `2.0.1-rc.7` zijn.
- GitHub code checks, HACS, Hassfest, backend- en **alle** Chromium-regressies moeten slagen op de PR-head en de uiteindelijke RC-release.
- Praktijkacceptatie op desktop, Android Companion en PalaKiosk blijft noodzakelijk voor een volledige veldbeoordeling. Een geslaagde CI-run is geen garantie dat alle Home Assistant-versies en apparaten foutvrij zijn.

## Installeren

1. Maak een Home Assistant-back-up en exporteer je PalaSidebar-voorkeuren.
2. HACS → PalaSidebar → Opnieuw downloaden → **v2.0.1-rc.7** (toon prereleases indien nodig).
3. Herstart Home Assistant volledig en controleer mobiel, desktop, PalaKiosk en PalaGuard-footer.
4. Via HACS kan je terug naar de onveranderlijke v2.0.1-rc.6.

**Stable/main blijft buiten de RC-publicatie.**
