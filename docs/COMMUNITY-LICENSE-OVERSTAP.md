# Overstapchecklist — alleen voor een toekomstige PalaSidebar-licentie

> **Status: ONBESLIST / NIET GEACTIVEERD.** De huidige [MIT-licentie](../LICENSE) blijft ongewijzigd. Dit is een werkdocument, geen toestemming om reeds uitgegeven MIT-rechten in te trekken.

## 1. Rechten op de code

- [ ] Breng per belangrijke bronmap en gebruikt bestand in kaart wie de maker/rechthebbende is.
- [ ] Onderzoek eerder gedeelde PalaSidebar-uitgaven, externe bijdragen, gekopieerde bestanden, beelden, pictogrammen en eventuele afhankelijkheden.
- [ ] Controleer de vastgelegde herkomst en onzekerheden in [PROVENANCE.md](../PROVENANCE.md) en de [publicatie-audit](PUBLICATION-AUDIT-2026-10-31.md). Eventuele openstaande punten worden niet als afgerond aangemerkt.
- [ ] Bevestig welke nieuwe bijdrage echt onder een nieuwe licentie kan worden aangeboden; behoud de al verleende MIT-licenties en verplichte auteursrechtvermeldingen.

## 2. Juridische beoordeling

- [ ] Laat de conceptvoorwaarden door een jurist controleren op afdwingbaarheid, definities, auteursrecht, aansprakelijkheid, toepasselijk recht en consumenten-/zakelijke gebruikssituaties.
- [ ] Spreek af welke diensten toegestaan blijven: privégebruik, interne bedrijfsinstallaties, installatiehulp door een externe monteur, delen van eigen configuraties.
- [ ] Stel vast of de naam en het logo aanvullende bescherming of een merkstrategie behoeven, zonder onjuiste beweringen over registratie.

## 3. HACS

- [ ] Bevestig met een **testrepository** dat downloaden en updaten als **aangepaste HACS-repository** blijven werken na een eventuele licentiewijziging.
- [ ] Houd rekening met de voorwaarde dat de **standaard HACS-catalogus** een door de Open Source Initiative goedgekeurde licentie vereist. Een verbod op commerciële verspreiding voldoet daar niet aan.
- [ ] Laat huidige `pala_sidebar`-integratie, resourcepaden en bestaande gebruikersinstellingen ongemoeid.
- [ ] Publiceer pas na succesvolle HACS-, Hassfest- en browsertests en goede overgangsinstructies.

## 4. Communicatie en publicatie

- [ ] Benoem exact welke **toekomstige** versie onder welke voorwaarden verschijnt.
- [ ] Update de officiële `LICENSE` pas na toestemming en review, en controleer alle verwijzingen in README, package-informatie, release notes en contributing-regels.
- [ ] Maak een zichtbaar overzicht van historische MIT-releases (ook als sommige release-tags later niet meer online staan).
- [ ] Documenteer een veilige upgrade en rollback voor HACS-gebruikers.
- [ ] Ga niet suggereren dat oude MIT-versies hun distributie- of commerciële rechten hebben verloren.

## Referenties

- [Open Source Definition, OSI](https://opensource.org/osd/)
- [HACS: standaardrepos opnemen](https://hacs.dev/docs/publish/include/)
- [HACS: aangepaste repositories](https://hacs.dev/docs/faq/custom_repositories/)

*Dit document is een technische en juridische controlelijst, geen bewijs van afgeronde rechtencontrole en geen juridisch advies.*
