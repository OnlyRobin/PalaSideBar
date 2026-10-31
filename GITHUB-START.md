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

## Eerste versie via HACS

Nadat de code is gepubliceerd en rechten zijn gecontroleerd:

1. Maak in GitHub een release met de tag `v2.0.0-beta7`, gemarkeerd als **pre-release**.
2. Maak de repository publiek zodra dat juridisch verantwoord is.
3. Voeg de URL `https://github.com/OnlyRobin/PalaSideBar` toe als **Integration** onder HACS → Custom repositories.
4. Installeer PalaSidebar, herstart Home Assistant en controleer de versie.

Bij een migratie van handmatige installatie: maak vooraf een back-up van de oude map en instellingen. HACS gebruikt dezelfde `pala_sidebar`-integratiedomeinnaam.
