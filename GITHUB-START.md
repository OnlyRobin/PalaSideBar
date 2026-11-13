# GitHub en HACS: hoe de eerste publicatie is uitgevoerd

> **Historisch document.** Deze stappen horen bij de eerste GitHub-publicatie van PalaSidebar. De repository is inmiddels openbaar en beta7, RC1, RC2 en beta8 zijn gepubliceerd. Voer deze stappen niet opnieuw uit voor dezelfde versietag.

Repository: https://github.com/OnlyRobin/PalaSideBar

## De oorspronkelijke GitHub-upload

1. Een lokale ZIP met de projectbestanden werd uitgepakt; de mapinhoud moest in de **hoofdmap van de repository** terechtkomen.
2. De broncode, `.github`-workflows, `custom_components`, `tests`, `README.md`, `hacs.json` en `LICENSE` werden geüpload.
3. Daarna zijn de GitHub-acties voor codecontrole, Hassfest en HACS-validatie ingericht.
4. De repository is openbaar gemaakt en de eerste prerelease is gepubliceerd.

## Licenties en bronherkomst

Lees [PROVENANCE.md](PROVENANCE.md) en het [publicatieonderzoek](docs/PUBLICATION-AUDIT-2026-10-31.md). De MIT-licentie geldt alleen voor materiaal dat de rechthebbenden daadwerkelijk onder MIT mogen verspreiden. Eventuele licenties van derden blijven geldig.

## Huidige installatie (Home Assistant 2026.11+)

De eerste HACS-publicatiestappen hierboven zijn **historisch**. Sinds Home Assistant **2026.11** is HACS ingebouwd als **Marketplace**. De aparte HACS-installatie is niet meer nodig.

1. Open **Instellingen → Marketplace** als beheerder en accepteer bij het eerste gebruik de waarschuwing voor communitysoftware.
2. Zoek **PalaSidebar**. Niet in de catalogus? Kies rechtsboven **Toevoegen via link** (*Add from link*) en vul `https://github.com/OnlyRobin/PalaSideBar` in.
3. Koppel je GitHub-account via de apparaatcode als Marketplace daarom vraagt en kies, indien nodig, het type **Integratie**.
4. Open PalaSidebar, kies **Installeren** en gebruik de actuele [v2.0.1 Stable](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1).
5. Volg de instelwizard. Herstart Home Assistant wanneer daarom gevraagd wordt; voeg PalaSidebar zo nodig toe via **Instellingen → Apparaten en diensten**.

Een RC selecteer je via de repositorypagina **⋮ → Andere versie installeren**. Om ook automatisch RC-updates aangeboden te krijgen, activeer je de standaard uitgeschakelde **Pre-release**-entiteit van de PalaSidebar-repository onder **Instellingen → Apparaten en diensten → Marketplace**.

Maak vóór iedere update een back-up van Home Assistant en exporteer de sidebarinstellingen. Herstel bij problemen de back-up; gebruik **Andere versie installeren** niet als gewone rollbackmethode.

Op **Home Assistant 2026.10 of ouder** gebruik je nog de afzonderlijke HACS-integratie. Na upgraden naar 2026.11 worden eerdere HACS-installaties automatisch meegenomen.

Zie de actuele [README](README.md) en de [officiële Marketplace-documentatie](https://www.home-assistant.io/integrations/marketplace).
