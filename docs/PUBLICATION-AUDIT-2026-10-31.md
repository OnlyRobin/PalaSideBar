# PalaSidebar: onderzoek vóór de eerste openbare release — 31 oktober 2026

> **Historisch onderzoek.** Dit verslag is opgesteld toen de repository nog privé was. De repository is later openbaar gemaakt en de eerste prerelease beta7 is gepubliceerd nadat de automatische code-, Hassfest- en HACS-controles waren geslaagd. Inmiddels bestaat ook [beta8](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-beta8). De bevindingen hieronder beschrijven de **oorspronkelijke audit** en zijn geen garantie dat de rechten op ieder extern onderdeel definitief vaststaan. Voor de eigen PalaSidebar-bijdragen geldt **© 2026 Robin Bouwman**; openstaande vragen worden gevolgd in [issue #1](https://github.com/OnlyRobin/PalaSideBar/issues/1).

## Destijds gecontroleerd op GitHub

- Integratiedomein: `pala_sidebar`; broncode onder `custom_components/pala_sidebar`.
- `hacs.json`, het integratiemanifest en versie `2.0.0-beta7` waren aanwezig.
- De codecontrole slaagde op commit `e05efc7`.
- Hassfest slaagde op commit `e05efc7`, nadat de volgorde van manifestvelden was gecorrigeerd en het configuratieschema voor integraties via de gebruikersinterface was toegevoegd.
- Toen de repository nog privé was, werd de HACS-validatie bewust overgeslagen. **Overgeslagen** is niet hetzelfde als **geslaagd**.
- De lokale bestanden onder `brand/` waren aanwezig. Home Assistant vanaf 2026.3 ondersteunt lokale merkafbeeldingen bij customintegraties.

## Herkomst van de broncode: bevindingen en beperkingen

- De toenmalige frontend `pala-sidebar.js` is vergeleken met broncode van `elchininet/custom-sidebar` (Apache-2.0) en met bestanden uit `galloween/custom-sidebar-v2` en `Villhellm/custom-sidebar`.
- Bij een eerste vergelijking van **16 opeenvolgende JavaScript-identificaties** werden geen overeenkomende reeksen gevonden. Er waren ook geen letterlijke verwijzingen naar `custom-sidebar` in de uitvoerbare frontendcode.
- Een vergelijking van teksten bewijst **geen onafhankelijk auteurschap**. Eerdere versies, functionele ideeën, bewerkte algoritmen en informatie over het ontstaan van de code kunnen daarnaast relevant zijn. Het exacte oude ZIP-archief is later afzonderlijk onderzocht.
- Van `elchininet/custom-sidebar` is vastgesteld dat de onderzochte versie de licentie **Apache-2.0** gebruikt. Voor oudere of andere bestanden kunnen andere rechten gelden. Het ontbreken van een licentiebestand op een bekeken pad bewijst niets over de rechten van de twee andere genoemde projecten.
- De MIT-licentie van PalaSidebar mag alleen gelden voor materiaal dat de rechthebbende daadwerkelijk onder MIT mag verspreiden. Als materiaal van derden is overgenomen, moeten bijbehorende licenties en auteursvermeldingen behouden blijven.
- De repository bevat acht PNG-bestanden met PalaSidebar-logo's. Controleer het recht om deze en alle eventuele andere niet-eigen onderdelen openbaar te verspreiden.

## Vergelijking met het exacte aangeleverde oude archief

De gebruiker leverde `custom-sidebar-master(5).zip` aan. Volgens de eigen `package.json` gaat het om **`elchininet/custom-sidebar` versie 17.3.0** onder **Apache-2.0**. Het archief telt 469 onderdelen, waaronder `src/`, `dist/`, een volledig Apache-2.0-licentiebestand en een meegeleverde Home Assistant-testomgeving onder `.hass/`.

- **SHA-256 van het archief:** `d46a81b744818659b3320d5a5c47e493e2c72a4bfe1e48b6d0e034f2981167e4`.
- **Onderzochte oorspronkelijke code:** 30 bron- en gecompileerde JavaScript-, TypeScript- en CSS-bestanden onder `src/` en `dist/`, samen 304.085 bytes.
- **Onderzochte PalaSidebar-code:** tien uitvoerbestanden van het type JavaScript, Python, JSON en CSS in `custom_components/pala_sidebar`, samen 543.222 UTF-8-bytes. Dit kwam overeen met de frontendomvang van de toenmalige beta7. Latere wijzigingen aan het Python-manifest of configuratieschema veranderen die vergelijking van de frontend niet.
- **Exacte reeksen van 80 tekens:** alle 292.899 bronreeksen van 80 tekens werden geïndexeerd en vergeleken met 541.952 reeksen uit de onderzochte PalaSidebar-bestanden. Er waren **nul overeenkomsten**. Eventuele hashbotsingen zouden eerder extra schijnbare overeenkomsten opleveren dan exacte overeenkomsten verbergen.
- **Opeenvolgende identificaties:** bij acht opeenvolgende JavaScript-/TypeScript-identificaties waren er **nul overeenkomsten**.
- **Oudere PalaSidebar-versies:** ook de frontends van v1.3.54 en v2.0.0-beta3 zijn vergeleken met hetzelfde oude bronarchief. In beide gevallen werden **nul overeenkomende reeksen van 80 tekens en nul overeenkomende reeksen van acht identificaties** gevonden. Dit ondersteunt de indruk van een afzonderlijke codebasis door de tijd heen, maar bewijst geen onafhankelijk ontwerp.
- **Externe projectverwijzingen:** in de onderzochte uitvoerbestanden leverde het zoeken naar `custom-sidebar`, `custom_sidebar`, `CustomSidebar`, `elchininet`, `galloween`, `villhellm` en `apache` **nul resultaten** op. In de historische documentatie worden de oude projecten uiteraard wél besproken; dit betekent niet dat ze als code worden geïmporteerd.
- **Architectuurverschil:** het oorspronkelijke project was een modulaire TypeScript-**plugin** met aparte bronmodules, abonnementen, gegevensophalers en controles. PalaSidebar is een Home Assistant-**integratie** met een eigen frontend-loader en één zelfstandig JavaScript-bestand. Vergelijkbare Home Assistant-gebeurtenissen of UI-functies vormen op zichzelf geen bewijs van kopiëren.

**Betekenis van de uitkomst:** bij deze concrete bronvergelijking is geen letterlijke codekopie vastgesteld. Dat verkleint de kans op rechtstreeks overnemen van tekst uit het onderzochte archief, maar **bewijst geen eigendom en sluit bewerkte of anderszins afgeleide code niet uit**. De beheerder moet daarom blijven nagaan of code van derden is verwerkt op een manier die extra licentieverplichtingen oproept.

### Let op: vertrouwelijke bestanden in het oorspronkelijke ZIP-archief

Het oude archief bevat ook een testmap `.hass/config/.storage/`, een `auth`-bestand, `secrets.yaml` en een Home Assistant-database. Deze bestanden zijn **niet** naar de PalaSidebar-repository gekopieerd of in het onderzoek gepubliceerd. Verspreid het oorspronkelijke archief niet zonder eerst de inhoud op vertrouwelijke gegevens te controleren.

### Licentievoorwaarden

Apache-2.0 verbiedt het hergebruiken van code niet, maar stelt wel voorwaarden bij verspreiding van overgenomen materiaal. Dit omvat waar nodig het bewaren van licentieteksten, verplichte vermeldingen en het aangeven van gewijzigde bestanden. De MIT-licentie van PalaSidebar dekt alleen materiaal waarvoor de rechthebbende die licentie mag toepassen.

Alleen het bestuderen van een andere sidebar als **gedragsvoorbeeld** zonder broncodeovername leidt op zichzelf niet automatisch tot een verplichting om de Apache-2.0-licentie over te nemen.

## Controle op privégegevens

De tekstbestanden van het releasepakket zijn onderzocht op veelvoorkomende vormen van toegangssleutels, wachtwoordtoewijzingen, interne IP-adressen, interne hostnamen, e-mailadressen en absolute HTTP-adressen.

Daarbij zijn geen herkenbare actieve geheime gegevens, privé-IP-adressen of persoonlijke hostnamen gevonden. De aangetroffen URL's betroffen onder meer documentatielinks, XML-naamruimten van SVG en voorbeelden.

Dit was een **controle op tekstpatronen**, geen garantie dat alle vertrouwelijke gegevens uit alle oude commits of lokale configuratiebestanden zijn verwijderd.

## Openstaande aandachtspunten

- [ ] De herkomst van alle gebruikte code bevestigen en vastleggen of er ergens aangepaste code van andere sidebarprojecten aanwezig is.
- [x] Het exacte oude archief en de licentie vergelijken: **Custom Sidebar 17.3.0 / Apache-2.0**, zonder gevonden lange letterlijke overeenkomsten.
- [ ] Als toch code of afbeeldingen van derden zijn overgenomen, de juiste licentieteksten en verplichte auteursvermeldingen toevoegen.
- [ ] Bevestigen dat alle meegeleverde logo's, iconen en overige media rechtmatig verspreid mogen worden.
- [ ] De volledige Git-geschiedenis en persoonlijke configuratiebestanden op vertrouwelijke gegevens controleren.

## De oorspronkelijke publicatiestappen (inmiddels uitgevoerd)

1. De repository openbaar maken.
2. De HACS-validatie uitvoeren en eventuele fouten oplossen.
3. Code checks en Hassfest op de releasecode opnieuw uitvoeren.
4. Een echte GitHub-prerelease publiceren, niet alleen een tag.
5. Installatie en bijwerken via een echte Home Assistant-installatie testen.

Sinds dit onderzoek zijn beta7, RC1, RC2 en beta8 gepubliceerd. Het testen van de praktijkwerking en het afronden van eventuele licentievraagstukken blijven afzonderlijke taken.

## Geraadpleegde project- en documentatiebronnen

- https://github.com/elchininet/custom-sidebar (oorspronkelijk project, Apache-2.0)
- https://github.com/galloween/custom-sidebar-v2
- https://github.com/Villhellm/custom-sidebar
- https://contributors.home-assistant.io/core/integrations/brands/
- https://hacs.dev/docs/publish/integration/
