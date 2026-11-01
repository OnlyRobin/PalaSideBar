# PalaSidebar v2.0.0-rc6 — HACS-testrelease

**RC6 is een release candidate, geen stabiele versie.** Installeer en test deze op je eigen Home Assistant, Android-telefoon en tablet. De eerdere [RC5](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc5) blijft gewoon beschikbaar voor terugzetten.

## Nieuw sinds RC5

- **[Issue #6](https://github.com/OnlyRobin/PalaSideBar/issues/6): tekstgrootte werkt nu ook in de eigen PalaSidebar.** Desktop- en mobielregelaars passen menu-items, badges, sensoren, secties, zoektekst, klok, footer en agenda aan.
- Regelaars tonen correct percentages, bijvoorbeeld `80%`, `100%` en `120%`, in plaats van `100px`.
- De afzonderlijk ingestelde titel en subtitel van de header blijven ongemoeid.
- Headerfoto-upload loopt niet meer vast als tijdens verwerking een ongeldig tweede bestand wordt gekozen; er is een aanvullende grens van 24 megapixel.
- Accountspecifieke opslag, het terugladen van headerfoto's en het wisselen van accounts zijn extra getest.
- Een Chromium-belastingtest met 120 sensorbadges (inclusief 12 live aftellers) is toegevoegd.
- Geen nieuwe externe afhankelijkheden en geen wijzigingen aan de MIT-licentie.

## Altijd via het RC-testkanaal

De permanente ontwikkelbranch heet [`release/candidate`](https://github.com/OnlyRobin/PalaSideBar/tree/release/candidate).

Bij elke volgende inhoudelijke wijziging **verhogen we het RC-nummer** (RC7, RC8 enzovoort), draaien alle tests en publiceren vervolgens een **nieuwe GitHub-prerelease met een nieuwe tag**. Zo ziet HACS de nieuwe versie als update. We vervangen of verwijderen oude RC-releases of tags **niet**; ook de vorige RC's blijven installabel. Een GitHub-tag is een vastgelegde versie en geen bewegend updatekanaal.

Pas nadat jij de huidige RC in de praktijk goedkeurt, maken we van precies die geteste code een stabiele `v2.0.0`-uitgave. De `release/candidate`-branch blijft bestaan voor toekomstige RC's.

## Zo installeer je RC6

1. Maak een Home Assistant-back-up en exporteer de PalaSidebar-instellingen.
2. Ga naar **HACS → PalaSidebar → Opnieuw downloaden/Downloaden**.
3. Schakel **testversies / prereleases** in en kies **`v2.0.0-rc6`**.
4. Herstart Home Assistant volledig.
5. Test **Instellingen → PalaSidebar UI → Lettertype en responsieve grootte** met bijvoorbeeld 80%, 100% en 120% op je computer en telefoon. Controleer ook de badges en sensors.
6. Test swipe, backpress, HA-dialogen, thema's, afbeeldingen in de header en live sensoren.
7. Meld eventuele problemen voordat een stable-versie wordt aangemaakt.

Bij problemen kies je op dezelfde HACS-pagina de **bestaande RC5** terug. Gebruik bij voorkeur eerst een testinstallatie of een goede back-up.

## Testgrenzen

Geautomatiseerde checks (code, HACS en Playwright) bewijzen niet automatisch dat Android-backpress, echte Home Assistant-dialogen en langdurige tabletprestaties foutloos zijn. [Issue #6](https://github.com/OnlyRobin/PalaSideBar/issues/6) blijft ter acceptatie open totdat de werking op echte apparaten is bevestigd.

Het concept voor een toekomstige Community License staat hier los van. **MIT blijft de huidige licentie.**
