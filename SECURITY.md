# Beveiligingsbeleid – PalaSidebar

Bedankt dat je PalaSidebar veiliger helpt maken. Beveiligingsproblemen kunnen gevolgen hebben voor een Home Assistant-installatie en horen daarom **niet openbaar** gemeld te worden voordat ze zijn onderzocht.

## Ondersteunde versies

| Kanaal | Status |
| --- | --- |
| [v2.0.1 Stable](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1) | Actuele Stable; meldingen worden beoordeeld |
| [v2.0.1-rc.7](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1-rc.7) | Meest recente RC in deze reeks; meldingen worden beoordeeld |
| Oudere Stable-, RC- en betaversies | Geen afzonderlijke onderhouds- of beveiligingsgarantie; werk waar mogelijk bij |

Deze tabel beschrijft de versies op **13 november 2026**. Gebruik bij nieuwe releases altijd de [actuele GitHub-releaselijst](https://github.com/OnlyRobin/PalaSideBar/releases).

## Een kwetsbaarheid privé melden

1. Gebruik bij voorkeur **[GitHub Private Vulnerability Reporting](https://github.com/OnlyRobin/PalaSideBar/security/advisories/new)** als dit voor de repository is ingeschakeld.
2. Beschrijf de mogelijke impact, de getroffen versie, de minimale reproduceerstappen en een veilige manier om het probleem te verifiëren. Vermeld welke gegevens eventueel zichtbaar kunnen worden.
3. Deel gevoelige details, tokens, echte privé-IP-adressen, toegangssleutels en persoonlijke gegevens uitsluitend via een geschikt privé kanaal, en anonimiseer waar mogelijk.
4. Is privé melden op GitHub **niet beschikbaar**? Publiceer de details **niet** als gewone Issue. Vraag de repository-eigenaar eerst via een eerder afgesproken betrouwbaar privécommunicatiekanaal om een veilige meldroute.

> **Voor de repository-eigenaar:** controleer onder **Settings → Security → Code security and analysis** of **Private vulnerability reporting** is ingeschakeld. Dit beveiligingsbeleid schakelt die GitHub-instelling niet automatisch in.

## Wat gebeurt er met de melding?

De onderhoudende partij beoordeelt eerst of het probleem reproduceerbaar is, bepaalt de impact en onderzoekt een oplossing. Waar passend volgt een aparte beveiligingsfix, regresstest en GitHub Security Advisory. Openbare toelichting volgt pas wanneer dit verantwoord is; er wordt geen vaste hersteltermijn toegezegd.

Respecteer de gegevens en apparaten van anderen. Test alleen systemen waarvoor je toestemming hebt en vermijd onnodige dataverzameling, verstoring of het delen van exploitcode met derden.

## Wat hoort niet in een beveiligingsmelding?

Gewone layoutproblemen, functievragen en fouten zonder beveiligingsimpact horen in de [Issue-sjablonen](https://github.com/OnlyRobin/PalaSideBar/issues/new/choose). Problemen met het rechtstreeks openzetten van Home Assistant-poorten of de beveiliging van je eigen netwerk zijn niet automatisch kwetsbaarheden in PalaSidebar.

PalaSidebar is **geen firewall** en beschermt op zichzelf niet tegen internetaanvallen. De optionele PalaGuard-koppeling opent alleen de afzonderlijk geïnstalleerde integratie. Volg ook de [Home Assistant-beveiligingsadviezen](https://www.home-assistant.io/docs/configuration/securing/).
