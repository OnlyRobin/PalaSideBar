# PalaSidebar

**Een persoonlijke, moderne zijbalk voor Home Assistant.** Richt je dashboards, menu's, live sensorbadges en vormgeving zelf in — op desktop, telefoon en tablet.

[**Installeren**](#installeren) · [**Zo werkt het**](#zo-werkt-het) · [**Versies**](#versies-en-releases) · [**Bijwerken**](#bijwerken-en-terugzetten) · [**Hulp**](#hulp-en-problemen)

<p align="center">
  <a href="docs/images/palasidebar-standaard-groot.png"><img src="docs/images/palasidebar-standaard.webp" width="250" alt="Standaard PalaSidebar"></a>
  <a href="docs/images/palasidebar-aangepast-groot.png"><img src="docs/images/palasidebar-aangepast.webp" width="250" alt="PalaSidebar met eigen vormgeving"></a>
  <a href="docs/images/palasidebar-sensoren-groot.png"><img src="docs/images/palasidebar-sensoren.webp" width="250" alt="PalaSidebar met live sensoren"></a>
</p>

<p align="center"><sub>Klik op een voorbeeld om het groter te bekijken. De weergave is afhankelijk van je Home Assistant-thema en instellingen.</sub></p>

## Installeren

PalaSidebar is een **aangepaste Home Assistant-integratie** die je via [HACS](https://www.hacs.xyz/) installeert. Je hoeft geen JavaScript handmatig in de map `www` te plaatsen.

1. Installeer [HACS](https://www.hacs.xyz/docs/use/) in Home Assistant als je dat nog niet hebt.
2. Open **HACS → ⋮ → Aangepaste repositories** (*Custom repositories*).
3. Voeg `https://github.com/OnlyRobin/PalaSideBar` toe en kies als type **Integratie** (*Integration*).
4. Zoek/open **PalaSidebar** in HACS en kies **Downloaden**. Gebruik voor normaal gebruik de **Stable-versie v2.0.0**.
5. **Herstart Home Assistant volledig**.
6. Ga naar **Instellingen → Apparaten en diensten → Integratie toevoegen**, zoek **PalaSidebar** en voeg deze toe als dat nog niet is gebeurd.
7. Open PalaSidebar en pas de indeling en het uiterlijk aan via het eigen **instellingenmenu**.

> **Belangrijk:** de integratie laadt de frontend automatisch vanuit `custom_components/pala_sidebar`. Voeg dus géén extra PalaSidebar-script toe aan `frontend.extra_module_url` of de Lovelace-resources. Verwijder zo nodig oude, handmatige PalaSidebar-verwijzingen om dubbel laden te voorkomen.

**Liever eerst een testversie proberen?** Kies in HACS bij **PalaSidebar → Opnieuw downloaden → Andere versie nodig?** een beschikbare prerelease, bijvoorbeeld [v2.0.1-rc.1](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1-rc.1). Schakel de weergave van testversies in als dat nodig is. Maak eerst een back-up.

## Zo werkt het

PalaSidebar biedt een vervangende, instelbare navigatie in Home Assistant. Je kunt de sidebar inklappen, je favoriete dashboards bereikbaar houden en live Home Assistant-informatie naast je menu-items tonen.

### Wat kun je aanpassen?

| Onderdeel | Mogelijkheden |
| --- | --- |
| **Menu en dashboards** | Eigen secties en menu-items, volgorde, favorieten, snelkoppelingen en dashboards. |
| **Live badges** | Sensorwaarden, iconen, meerdere gegevens, kleurregels en afzonderlijke badge-opmaak. |
| **Header** | Titel, subtitel, avatar of afbeelding, extra sensorinformatie en eigen kleuren. |
| **Vormgeving** | Thema's, achtergronden, lettertypen, tekstgroottes, glaseffecten, randen en afrondingen. |
| **Sectie Design Studio** | Een rand of achtergrond rond volledige secties (zoals START en BEHEER), plus aparte opmaak voor sectiekoppen en menu-items. |
| **Bediening** | Snelmenu via lang indrukken/rechtermuisknop, mobiele swipebediening en ondersteuning voor de terugknop. |
| **Extra's** | Agenda, Control Center, Performance, diagnose, back-ups en herstelpunten. |

### Waar staan de instellingen?

Open de **PalaSidebar-instellingen**. De onderdelen zijn overzichtelijk verdeeld:

| Groep | Instellingen |
| --- | --- |
| **Basis & weergave** | Algemeen, Header, Snelmenu |
| **Menu & inhoud** | Indeling, Dashboards, Acties, Sensoren, Agenda, Control Center |
| **Vormgeving** | Thema's, Design, PalaSidebar UI, Badges |
| **Onderhoud** | Diagnose, Performance, Backup |

Een paar handige startpunten:

- **Een dashboard of menu-item toevoegen:** open **Menu & inhoud → Indeling** of **Dashboards**, kies wat je wilt tonen en sla de wijzigingen op.
- **Een live sensorbadge maken:** ga naar **Menu & inhoud → Sensoren** of de badge-editor, zoek je Home Assistant-entiteit en stel de weergave, het icoon en eventueel kleurregels in. Je kunt ook een attribuut van een sensor gebruiken.
- **Een headerfoto plaatsen:** open **Basis & weergave → Header**, selecteer een afbeelding, bekijk de uitsnede en sla de header op.
- **Kleuren en randen instellen:** ga naar **Vormgeving → PalaSidebar UI** voor de live voorvertoning, de Badge Design Studio en de Sectie Design Studio. Algemene styling hoeft bestaande individuele sensorkleurregels niet te overschrijven.
- **Instellingen bewaren:** gebruik de opslagknop van het betreffende onderdeel. Je voorkeuren kunnen per Home Assistant-account worden bewaard; via **Onderhoud → Backup** kun je exporteren en herstellen.

Meer uitleg over installatie, instellingen en veelvoorkomende problemen staat in de [configuratiehandleiding](docs/configuration.md).

## Versies en releases

| Kanaal | Versie | Voor wie? |
| --- | --- | --- |
| **Stable** | [**v2.0.0**](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0) | Aanbevolen voor dagelijks gebruik. Eerste officieel goedgekeurde stabiele versie, gebaseerd op RC14. |
| **RC (test)** | [**v2.0.1-rc.1**](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1-rc.1) | Nieuwere testversie met oplossingen voor [Issue #16](https://github.com/OnlyRobin/PalaSideBar/issues/16) (ingeklapte sidebar) en [Issue #17](https://github.com/OnlyRobin/PalaSideBar/issues/17) (headerfoto). Praktijktesten blijven belangrijk. |
| **Oudere versies** | [Alle releases](https://github.com/OnlyRobin/PalaSideBar/releases) | Eerdere RC- en bètaversies om terug te zetten of wijzigingen te bekijken. |

**Stable** is de goedgekeurde versie. **RC** (*release candidate*) is een testversie en wordt niet vanzelf Stable. Na v2.0.0 loopt de testreeks verder met `2.0.1-rc.x`. Oude tags blijven beschikbaar; een Stable-release verschijnt pas na goedkeuring en geslaagde controles.

**Let op bij HACS:** de volgorde van prereleases kan soms onjuist worden getoond ([HACS-issue #5655](https://github.com/hacs/integration/issues/5655)). Selecteer daarom zo nodig **handmatig de exacte versietag** via *Opnieuw downloaden → Andere versie nodig?*.

[Alle releases en wijzigingen](https://github.com/OnlyRobin/PalaSideBar/releases) · [Releasenotities Stable v2.0.0](docs/RELEASE-v2.0.0-STABLE.md) · [RC-branch](https://github.com/OnlyRobin/PalaSideBar/tree/rc)

## Bijwerken en terugzetten

1. Maak vóór een update een **Home Assistant-back-up** en exporteer je PalaSidebar-instellingen.
2. Open **HACS → PalaSidebar → Downloaden / Opnieuw downloaden**.
3. Kies de gewenste **Stable** of een specifieke **RC-testversie**.
4. Installeer de versie en **herstart Home Assistant volledig**.
5. Controleer de sidebar op desktop en mobiel. Gebruik bij twijfel de back-up of selecteer via HACS een eerdere release.

De actieve frontendversie kun je ook bekijken via dit pad op je eigen Home Assistant-adres:

```text
/pala_sidebar/assets/pala-sidebar-version.json
```

Je kunt tevens in **Onderhoud → Diagnose** de zelftest of updatecontrole gebruiken. PalaSidebar kan nieuwe releases melden, maar **installeert updates niet zelf**: dat gaat via HACS.

## Hulp en problemen

| Probleem | Controleer eerst |
| --- | --- |
| **Sidebar verschijnt niet** | Is de integratie toegevoegd onder *Apparaten en diensten* en is Home Assistant volledig herstart? |
| **Dubbele sidebar of vreemd gedrag** | Verwijder oude handmatige PalaSidebar-JavaScript-resources en `extra_module_url`-verwijzingen. |
| **Wijzigingen worden niet zichtbaar** | Controleer de geïnstalleerde versie, herstart Home Assistant en vernieuw zo nodig de browser-/frontendcache. |
| **HACS toont een oudere RC** | Kies de gewenste release handmatig onder *Andere versie nodig?*. |
| **Instellingen herstellen** | Gebruik **Onderhoud → Backup** en je eigen Home Assistant-back-up. |

**Een bug melden?** Open **Onderhoud → Diagnose → Bug melden** of maak een [GitHub Issue](https://github.com/OnlyRobin/PalaSideBar/issues/new). Vermeld je PalaSidebar-versie, Home Assistant-versie, apparaat en stappen om de fout te reproduceren. Screenshots voeg je zelf toe op GitHub; controleer ze eerst op privégegevens, tokens en adressen.

## Project en links

- [GitHub-repository](https://github.com/OnlyRobin/PalaSideBar) · [Releases](https://github.com/OnlyRobin/PalaSideBar/releases) · [Issues](https://github.com/OnlyRobin/PalaSideBar/issues) · [GitHub Actions](https://github.com/OnlyRobin/PalaSideBar/actions)
- [Uitgebreide configuratie](docs/configuration.md) · [Officiële uitgaven](OFFICIEEL-PROJECT.md) · [Herkomst van broncode en assets](PROVENANCE.md)
- [MIT-licentie](LICENSE) · [Nederlandstalige licentie-uitleg](docs/LICENTIE-EN-GEBRUIK-NL.md)

**PalaSidebar is een project van Robin Bouwman · © 2026 Robin Bouwman.** De oorspronkelijke PalaSidebar-bijdragen vallen onder de MIT-licentie; rechten van derden blijven van toepassing.
