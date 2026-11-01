# PalaSidebar 2.0.0-rc10 — issue #13 en screenshots

**RC-testversie voor HACS, geen Stable.** De permanente `rc`-branch blijft bestaan en RC9 blijft als terugval beschikbaar.

## Nieuw
- Eerste reparatie voor [issue #13](https://github.com/OnlyRobin/PalaSideBar/issues/13): de native Home Assistant-footer (Instellingen, Meldingen, Profiel) ontvangt de PalaSidebar desktop-/mobiel-tekstgrootte. Geen globale schaal op andere Home Assistant-componenten.
- Diagnose → Bug melden: selecteer PNG, JPG of WebP (maximaal 10 MB), bekijk lokaal een voorbeeld en ontvang duidelijke instructies om het bestand zelf bij het GitHub-issue te voegen.
- De afbeelding wordt **niet automatisch geüpload** en niet in de diagnose-URL verwerkt.
- Automatische GitHub-ontvangstbevestiging voor nieuw geopende issues via een afzonderlijke workflow; deze bevestigt uitsluitend ontvangst, geen automatische AI-codewijzigingen of releases.

## Praktijktest
1. Selecteer 80%, 100% en 130% desktoptekstgrootte, controleer onderaan Instellingen, Meldingen en profiel, en test op mobiel.
2. Controleer dat de overige HA-views niet onbedoeld veranderen.
3. Selecteer lokaal een screenshot in Diagnose. Bekijk de preview en controleer dat GitHub hem niet automatisch ontvangt. Voeg hem zelf toe via de GitHub-bijlagefunctie.
4. Test bestaande navigatie, swipe, backpress en versiecontrole.
5. Meld eventuele afwijkingen in issue #13. Sluit de issue pas na praktijkacceptatie.

Bij problemen kun je [RC9](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc9) opnieuw installeren via HACS.
