# Controlelijst voor GitHub- en HACS-releases

**Repository:** https://github.com/OnlyRobin/PalaSideBar  
**Actuele beta:** [v2.0.0-beta8](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-beta8)  
**Stabiele v2.0.0:** nog niet uitgebracht; voorbereiding via [pull request #3](https://github.com/OnlyRobin/PalaSideBar/pull/3)

## Afgeronde stappen

- [x] Openbare GitHub-repository ingericht met `custom_components/pala_sidebar`, `hacs.json`, tests en documentatie.
- [x] MIT-auteursvermelding ingesteld op **© 2026 Robin Bouwman**.
- [x] HACS-validatie, Hassfest en codecontrole ingericht en succesvol uitgevoerd.
- [x] Aanvullende browser- en touchregressietests ingericht.
- [x] De oorspronkelijke Custom Sidebar v17.3.0 vergeleken met de PalaSidebar-code; de bevindingen staan in [PROVENANCE.md](PROVENANCE.md).
- [x] [Beta7](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-beta7), [RC1](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc1) en [RC2](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc2) gepubliceerd als testversies.
- [x] Drie fouten in beta7 gereproduceerd: leeg tabblad PalaSidebar UI, ontbrekende standaardondertitel en onvolledige standaardsectie BEHEER.
- [x] De reparaties via RC2 getest en als [**beta8**](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-beta8) uitgebracht.
- [x] Beta8: Code checks, Hassfest, HACS-validatie en volledige Chromium-regressietests geslaagd. Zie [GitHub Actions](https://github.com/OnlyRobin/PalaSideBar/actions/runs/41214412301).
- [x] `hide_default_branch: true` ingesteld, zodat HACS geen losse `main`-commit als nieuwe release aanbiedt.
- [x] Nederlandstalige README en openbare gebruiksdocumentatie voorbereid.

## Betaversies en HACS

- [x] Beta8 is beschikbaar als GitHub-prerelease en kan handmatig in HACS worden gekozen.
- [ ] Op een tweede Home Assistant-installatie testen of een bestaande **beta7**-installatie beta8 op de gewenste manier aangeboden krijgt.
- [ ] Rekening houden met de versievolgorde: **RC2 kan door HACS als hoger dan beta8 worden gezien**. HACS heeft geen afzonderlijk beta-/RC-kanaal.
- [ ] Bij een upgrade controleren of persoonlijke instellingen, badges, thema's en menu-indeling behouden blijven.
- [ ] Testen of terugzetten naar een eerdere versie met een gemaakte back-up werkt.

## Voor de definitieve stabiele versie

- [ ] De nieuwste code vanuit de gecontroleerde releasebranch naar `main` samenvoegen.
- [ ] Vóór samenvoegen Code checks, Hassfest, HACS-validatie en browserregressies laten slagen.
- [ ] Home Assistant op desktop en mobiel doorlopen: navigatie, swipen, Android-terugknop, dialogen, lang indrukken, badges en thema's.
- [ ] PalaKiosk/tablet controleren op prestaties en navigatie.
- [ ] Installatie en migratie vanaf een bestaande HACS- of handmatige versie testen.
- [ ] Opgeslagen instellingen en terugzetten na een update controleren.
- [ ] Rechten op logo's/overige assets en de Git-geschiedenis blijven controleren. Sluit [issue #1](https://github.com/OnlyRobin/PalaSideBar/issues/1) pas als de vragen zijn afgehandeld.
- [ ] Na goedkeuring een normale GitHub-release `v2.0.0` publiceren, **zonder** het prerelease-vinkje.

## Belangrijke afspraken

Bestaande tags zoals `v2.0.0-beta7` en `v2.0.0-beta8` worden **niet achteraf aangepast**. Een nieuwe wijziging krijgt een nieuw versienummer. Bij updates van de integratie worden de domeinnaam `pala_sidebar` en bestaande opslaggegevens behouden.

De juridische licentietekst en technische veldnamen blijven onvertaald waar dat voor hun geldigheid of de werking noodzakelijk is.
