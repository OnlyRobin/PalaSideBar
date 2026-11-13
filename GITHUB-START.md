# GitHub / HACS: eerste publicatie

Repository: https://github.com/OnlyRobin/PalaSideBar

De mapstructuur van deze ZIP is **de repositoryroot**. Upload niet het ZIP-bestand als één los bestand.

## GitHub uploaden

1. Open https://github.com/OnlyRobin/PalaSideBar.
2. Als de repository nog leeg is, kies **uploading an existing file**; anders **Add file → Upload files**.
3. Pak de ZIP lokaal uit en upload de inhoud van de uitgepakte map, inclusief `.github`, `custom_components`, `tests`, `README.md`, `hacs.json` en `LICENSE`. Gebruik zo nodig Git of GitHub Desktop om verborgen mappen zoals `.github` mee te nemen.
4. Commit de bestanden naar `main`, terwijl de repository nog **privé** is.
5. Controleer of `custom_components/pala_sidebar/manifest.json` in GitHub zichtbaar is.
6. Controleer de GitHub Actions en los eventuele meldingen op.

## Licentie en openbaar publiceren

Lees `PROVENANCE.md` en de `RELEASE-CHECKLIST.md` voordat je de repository openbaar zet of een release publiceert. Controleer eventuele code, assets en verplichtingen van derden. De MIT-licentie dekt alleen materiaal dat de rechthebbenden daadwerkelijk onder MIT mogen uitbrengen.

## Eerste HACS-publicatie (historisch)

De oorspronkelijke beta7 werd in 2026 via de toenmalige aparte HACS-integratie aangeboden. Die publicatiestappen zijn inmiddels afgerond. Herhaal ze niet voor dezelfde tags.

## Nu installeren met de ingebouwde Marketplace

1. Ga op **Home Assistant 2026.11 of nieuwer** naar **Instellingen → Marketplace**.
2. Zoek **PalaSidebar**. Kies zo nodig **Toevoegen via link** (*Add from link*) en vul `https://github.com/OnlyRobin/PalaSideBar` in.
3. Verbind GitHub via de apparaatcode als Marketplace daarom vraagt.
4. Open de repository, kies **Installeren** en selecteer voor normaal gebruik **v2.0.1 Stable**.
5. Herstart Home Assistant wanneer nodig en voeg de integratie zo nodig toe onder **Instellingen → Apparaten en diensten**.

Voor RC-testversies gebruik je de **Pre-release**-schakelaar onder **Instellingen → Apparaten en diensten → Marketplace**, of selecteer je op de repositorypagina via **⋮ → Andere versie installeren** een specifieke gepubliceerde versie.

Maak vóór updates een Home Assistant-back-up; herstel deze bij problemen. De oude losse HACS-integratie is alleen nodig op Home Assistant **2026.10 of ouder**.

Zie de [actuele README op main](https://github.com/OnlyRobin/PalaSideBar/blob/main/README.md) en de [Home Assistant Marketplace-handleiding](https://www.home-assistant.io/integrations/marketplace).
