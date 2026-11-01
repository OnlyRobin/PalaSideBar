# PalaSidebar v2.0.0-beta7 — historisch publicatieverslag

> **Historisch document.** Deze eerste beta is al op 31 oktober 2026 gepubliceerd. Dit is het oorspronkelijke voorbereidingsverslag, in het Nederlands bijgewerkt. Voor de huidige beta zie [v2.0.0-beta8](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-beta8).

## Wat er in beta7 werd opgenomen

- PalaSidebar-vormgeving en een HACS-geschikte `custom_components/pala_sidebar`-mapstructuur.
- Aanpasbare menu's, favorieten, dashboardsnelkoppelingen en persoonlijke accountvoorkeuren.
- Live Control Center en sidebaronderdelen die het gekozen thema volgen.
- Contextmenu's en de mogelijkheid dashboards te verslepen om ze anders te ordenen.
- Theme Studio en Performance Center.
- Herstartbediening voor Home Assistant, alleen voor beheerders en met bevestiging.
- Automatisch geregistreerde frontend-loader.

## Voorbereiding van de eerste publicatie

Voor de publicatie zijn bronherkomst en licenties onderzocht, openbare bestanden op mogelijke privégegevens gecontroleerd en de GitHub-workflows voor codecontrole, Hassfest en HACS-validatie ingericht. Na het openbaar maken van de repository zijn de HACS-controles geslaagd en is de prerelease `v2.0.0-beta7` aangemaakt.

De originele rechtencontrole staat in [PROVENANCE.md](../PROVENANCE.md). Automatische controles vervangen geen praktijktest op een Home Assistant-installatie.

## Bijwerken vanaf een handmatige installatie

- Maak eerst een back-up van `custom_components/pala_sidebar` en exporteer de instellingen.
- Bewaar een eigen `pala-sidebar-config.json` afzonderlijk voordat HACS de bestanden vervangt.
- Verander de integratiedomeinnaam `pala_sidebar` niet.
- Herstart Home Assistant volledig na installatie.

## Later ontdekte fouten

De originele beta7 bevatte drie fouten: het tabblad **PalaSidebar UI** bleef leeg, de standaardondertitel ontbrak en de standaardsectie **BEHEER** bevatte slechts twee opties. Dit is opnieuw bevestigd in de [beta7-regressiecontrole](https://github.com/OnlyRobin/PalaSideBar/actions/runs/41213687322). De oplossingen zitten in **beta8**.
