# PalaSidebar — nacontrole Git-geschiedenis en assets (31 oktober 2026)

## Resultaat

**Geen herkenbare geheimen, privé-IP-adressen of gevoelige historische configuratiebestanden aangetroffen** in de op GitHub beschikbare, door de controles bereikbare Git-geschiedenis van PalaSidebar. Dit is een technische controle, geen absolute garantie en geen juridisch eigendomsbewijs.

**Uitgevoerde controles:**

- Alle op het scanmoment bereikbare Git-commits vanaf gepubliceerde branches en tags (ook historische, inmiddels gewijzigde of verwijderde bestandsinhoud).
- Git-objectencontrole op gevoelige historische bestandsnamen, lokale privé-IP-adressen, privé-sleutels, URLs met inloggegevens en ingevulde wachtwoord-/tokenvelden.
- Tweede, onafhankelijke scan met **Gitleaks v8.30.0**, ingesteld op `--log-opts="--all"` om alle opgehaalde branches en tags mee te nemen.
- Detectie-zelftest van Gitleaks met een uitsluitend tijdelijk aangemaakte, **fictieve sleutel**. Deze werd correct gedetecteerd; er zijn geen fictieve of echte sleutels gepubliceerd.
- Huidige integratiemap: branding, technische afhankelijkheden, licentie en aanwezige soorten mediabestanden.

**Geverifieerde succesvolle scan:** [GitHub Actions — geschiedeniscontrole](https://github.com/OnlyRobin/PalaSideBar/actions/runs/41217471570).

### Omvang van de eerste volledig geslaagde scan

| Onderdeel | Aantal |
| --- | ---: |
| Bereikbare historische commits | 115 |
| Remote branchverwijzingen | 8 |
| Git-tags | 4 |
| Unieke bereikbare Git-objecten | 502 |
| Unieke Git-blobs | 142 |
| Onderzochte tekstinhoud | ongeveer 4,64 MB |
| Potentieel gevoelige paden/velden in eigen controle | **0** |
| Mogelijke geheimen gemeld door Gitleaks | **0** |
| E-mailadressen buiten GitHub-noreply in commitmetadata | **0** |

De aantallen zijn een **momentopname**. Nieuwe auditcommits, branches en tags kunnen de aantallen daarna verhogen. Git kent inhoud via objectidentificaties; identieke PNG-bestanden delen soms één blob, terwijl meerdere bestandsnamen aanwezig zijn.

## Branding en auteursrechten

- In de huidige PalaSidebar-integratie zijn **acht PNG-merkbestanden** aanwezig onder `custom_components/pala_sidebar/brand/`: licht/donker, icoon/logo en dubbele resoluties.
- De bestaande beeldtest heeft alle acht bestanden gevalideerd op PNG-indeling en juiste afmetingen.
- Er zijn **geen meegeleverde TTF-, WOFF-, muziek- of videobestanden** aangetroffen in de huidige repository.
- Het integratiemanifest bevat `requirements: []`: de integratie declareert geen extern Python-pakket dat met het project wordt meegeleverd.
- `LICENSE` vermeldt **MIT, Copyright (c) 2026 Robin Bouwman**.
- De beheerder heeft eerder verklaard dat het PalaSidebar-project, de licentie en de naamsvermelding juist zijn en dat de oude Custom Sidebar als voorbeeld voor de **werking** werd gebruikt.
- Een machinecontrole kan het **juridische auteursrecht op een afbeelding of algoritme niet onafhankelijk bewijzen**. Voor externe bestanden gelden waar nodig aparte rechten en verplichte vermeldingen. Zie [PROVENANCE.md](../PROVENANCE.md) voor het eerdere broncodeonderzoek.

## Voorkomen van toekomstige fouten

In de aparte auditbranch zijn ter beoordeling toegevoegd:

- Een uitgebreidere `.gitignore`, waarmee lokale Home Assistant-data, `.storage`, `secrets.yaml`, privé-sleutelbestanden, databases en lokale credentialbestanden minder snel per ongeluk worden gecommit.
- [Automatische Git-geschiedeniscontrole](../.github/workflows/audit-geschiedenis.yml) voor nieuwe pushes naar `main` en `develop`, pull requests en handmatige uitvoering.
- [Bijbehorend controlescript](../scripts/controle_git_geschiedenis.py) dat **alle bereikbare Git-objecten** onderzoekt en alleen geaggregeerde bevindingen weergeeft.

Deze preventie houdt geen reeds gepubliceerde secrets achteraf verborgen. Mocht later toch een geldige sleutel blijken te zijn gelekt, dan is **intrekken/vervangen** noodzakelijk; een bestand verwijderen of een commit herschrijven alleen is onvoldoende.

## Duidelijke grenzen van deze audit

1. De scan omvat de commits en objecten die via de op het moment van de scan **bereikbare Git-refs** beschikbaar waren. GitHub kan niet-bereikbare of verborgen serverobjecten bewaren die niet via een gewone clone/fetch zijn op te halen.
2. De Git-repositoryscan onderzoekt **geen** wachtwoorden uit Home Assistant zelf, niet-gepubliceerde lokale bestanden, privé-accounts, bijlagen buiten Git of de inhoud van verbonden diensten.
3. Geheimenscanners zijn patroonherkenners: onbekende sleutelsoorten, versleutelde gegevens of uitzonderlijke vormen kunnen onopgemerkt blijven.
4. Het onderzoek naar de meegeleverde PNG's bevestigt aanwezigheid en bestandsindeling, **niet** een onafhankelijke juridische herkomstverklaring.
5. Commitmetadata kan publiek naam- en e-mailinformatie bevatten. De uitgevoerde controle vond alleen GitHub-noreply-adressen, geen direct zichtbare externe e-mailadressen.

**Technische uitkomst:** de geplande nacontrole voor issue #7 is uitgevoerd zonder technische veiligheidsbevindingen. Aanvullende rechtenbewaking blijft een normale verplichting bij toekomstige code- en mediatoevoegingen.
