# Bijdragen aan PalaSidebar

Leuk dat je wilt helpen met PalaSidebar!

## Fouten melden

Gebruik het formulier **[Bug melden](https://github.com/OnlyRobin/PalaSideBar/issues/new/choose)**. Het vraagt automatisch naar de Home Assistant-versie, PalaSidebar-versie, installatiemethode, apparaat, reproduceerstappen en verwacht/daadwerkelijk gedrag. Voor ideeën is er een apart formulier **Verbetering voorstellen**.

**Deel nooit wachtwoorden, toegangstokens, privé-IP-adressen of andere vertrouwelijke gegevens. Een beveiligingslek hoort niet in een openbare issue; gebruik [SECURITY.md](SECURITY.md).**

## Wijzigingen voorstellen

- Voor codewijzigingen: maak een feature- of fixbranch vanaf `rc` en stuur een pull request naar `rc`; de geteste RC wordt later gecontroleerd naar `main` gepromoveerd. Voor uitsluitend documentatie kun je een pull request naar `main` openen.
- Houd aanpassingen overzichtelijk en verander bestaande thema-, swipe- en navigatiewerking niet onnodig.
- Vul het [pull-request-sjabloon](.github/PULL_REQUEST_TEMPLATE.md) in en voeg bij nieuwe functionaliteit of bugfixes een passende regressietest toe.
- Controleer vóór het indienen de JavaScript-syntax, Python-compilatie en GitHub Actions (Code checks, Hassfest en HACS-validatie).
- Test belangrijke UI-wijzigingen op desktop én op een mobiel scherm; beschrijf eerlijk wat nog niet op echte Home Assistant-/PalaKiosk-apparaten is getest.
- Gebruik duidelijke Nederlandse documentatie en interfaceberichten. **Vertaal geen technische sleutels, bestandspaden of API-velden** die Home Assistant vereist.
- Publiceer geen nieuwe release of bestaande tagwijziging zonder controle. Bestaande GitHub-tags en releases blijven onveranderd; Stable vereist herhaalde tests op de releasecommit.

## Samenwerken en toegankelijkheid

We hanteren de [gedragscode](CODE_OF_CONDUCT.md). Meld intimidatie via GitHub of een geschikt privé kanaal en bespreek technische problemen met respect. We streven naar toetsenbordondersteuning, bruikbare touchdoelen en verminderde animaties; zie [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Licenties en rechten

De eigen PalaSidebar-code staat onder de MIT-licentie met **© 2026 Robin Bouwman**. Neem geen code, afbeeldingen, lettertypen of andere onderdelen van derden over zonder dat verspreiding is toegestaan. Bewaar de voorgeschreven auteursvermeldingen en licentieteksten. Zie [PROVENANCE.md](PROVENANCE.md).

Voor forks en aangepaste uitgaven: houd de bijbehorende **MIT-licentie en oorspronkelijke auteursrechtvermeldingen** intact. Vermeld bij voorkeur ook de [officiële bronrepository](OFFICIEEL-PROJECT.md) zodat gebruikers herkomst en aangepaste versies kunnen onderscheiden. Dit is een aanbeveling, **geen aanvullende licentievoorwaarde**. De huidige MIT-licentie staat commercieel gebruik en herdistributie toe.
