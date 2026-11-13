# Wijziging aan PalaSidebar

## Wat verandert er en waarom?

<!-- Beschrijf het probleem, de oorzaak en de concrete oplossing. Verwijs naar de issue als die bestaat. -->

**Gerelateerde issue:** Closes #

## Type wijziging

- [ ] Bugfix (oorzaak aangetoond, oude foutieve route vervangen)
- [ ] Verbetering / nieuwe functie
- [ ] UI / toegankelijkheid / performance
- [ ] Documentatie
- [ ] Release / onderhoud

## Veiligheid en achterwaartse compatibiliteit

- [ ] Bestaande accountinstellingen, back-ups en migratie blijven werken, of een migratie is uitgewerkt en getest.
- [ ] Bestaande navigatie, focus, scrollen, thema's en mobiele bediening zijn waar relevant opnieuw gecontroleerd.
- [ ] Geen geheimen, echte tokens, privé-IP's, persoonsgegevens of ongeoorloofde afbeeldingen/lettertypen toegevoegd.
- [ ] PalaGuard blijft **optioneel en eenrichtings**; er is geen code of geheime data van PalaGuard aan PalaSidebar toegevoegd.
- [ ] Een gewijzigde implementatie vervangt de oude route; er worden niet ongemerkt concurrerende lagen toegevoegd.
- [ ] Documentatie en changelog zijn bijgewerkt waar nodig.

## Tests en bewijs

<!-- Noem de uitgevoerde tests en voeg bij UI-wijzigingen geanonimiseerde screenshots toe. -->

- [ ] Python-compilatie en JavaScript-syntax gecontroleerd.
- [ ] GitHub Code checks, Home Assistant Hassfest en HACS-validatie geslaagd.
- [ ] Relevante regressietests toegevoegd of bijgewerkt.
- [ ] Desktop, telefoon en waar van toepassing PalaKiosk/Android nagekeken, of expliciet beschreven wat niet getest kon worden.
- [ ] Geen eerdere werkende tests verwijderd om de workflow groen te krijgen.

**Testresultaten / screenshots (zonder privégegevens):**

## Release-afspraak

- [ ] Wijzigingen aan de integratie gaan eerst naar de `rc`-tak en een nieuwe onveranderlijke RC-release.
- [ ] `main` / Stable wordt pas na gecontroleerde RC-promotie en volledige Stable-testmatrix aangepast.
- [ ] Bestaande tags en eerder gepubliceerde releasebestanden blijven onaangeroerd.
- [ ] Als dit een documentatie-only PR is: er wordt **geen nieuwe RC of Stable** gemaakt.

> De aangevinkte punten moeten feitelijk kloppen. Markeer onderdelen die niet van toepassing zijn en leg uitzonderingen kort uit.
