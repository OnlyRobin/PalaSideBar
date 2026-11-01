# PalaSidebar RC5 → v2.0.0 · stabilisatiecontrole

**Uitgangspunt:** de gepubliceerde GitHub-tag `v2.0.0-rc5` (niet `main` of de bestaande, verouderde releasebranch).  
**Werkbranch:** `stabilization/rc5-to-v2`.  
**Stabiele release gepubliceerd?** **Nee.** Deze branch blijft een testkandidaat.  
**Status:** technisch onderzoek en automatische regressie; praktijkacceptatie moet nog plaatsvinden.

## 1. Vastgestelde feiten

| Onderdeel | Vaststelling | Risico/maatregel |
| --- | --- | --- |
| Huidige gepubliceerde RC5 | Code-, HACS-, Hassfest- en oorspronkelijke Chromium-tests geslaagd | Goed uitgangspunt, geen bewijs van volledige stabiliteit |
| `main` | Frontendversie `2.0.0-beta7` | Niet op basis van `main` een stable build maken |
| `develop` | Frontendversie `2.0.0-rc2` | Niet ongemerkt overschrijven met oudere code |
| `release/v2.0.0` | Vermeldt al `2.0.0`, maar wijkt af van gepubliceerde RC5 | **Releaseblokkade:** niet direct taggen; pas na gecontroleerde integratie |
| RC5-headerfoto | Snel een ongeldig tweede bestand kiezen tijdens verwerking kon upload in toestand 'bezig' laten staan | Gerepareerd in deze branch, met extra regressietest |
| Grote headerfoto's | Er bestond alleen een grens per afbeeldingzijde, niet voor totaal aantal pixels | Grens van 24 megapixel toegevoegd, met behoud van de 4 MB uploadlimiet |
| Migratielog in Python | Noemde nog RC2 | Verwijzing op deze branch naar RC5 gecorrigeerd |
| Versies per gebruiker | Accountgegevens worden via Home Assistant `frontend/get_user_data` / `frontend/set_user_data` opgeslagen | Extra browsertest op afbeelding, synchronisatie, accountwisseling en terugladen toegevoegd |
| Browserondersteuning | Bestaande Playwright-tests simuleren HA; er is geen echte Companion App of PalaKiosk in CI | **Releaseblokkade:** testen op de echte apparaten |

## 2. Automatische checks

De aparte workflow [PalaSidebar RC5 naar stabiel — integrale audit](../.github/workflows/stabilization-audit.yml):

- controleert de daadwerkelijke RC5-versie in manifest, frontend-JavaScript en versie-JSON;
- voert Node-syntaxcontrole, Python-compilatie, bestaande code-/brandtests en HACS-validatie uit;
- draait **alle** bestaande `tests/test_*.py`, inclusief de aanvullende account- en headerfototests;
- bouwt een installeerbaar ZIP-testpakket en biedt dit als GitHub Actions-artifact aan;
- **publiceert geen release en verandert `main` niet**.

Een groen resultaat betekent dat deze automatische controles geslaagd zijn. Het valideert geen echte Home Assistant-installatie, Bluetooth/Android-systeembackpress, sensortiming of browserprestaties op een fysiek apparaat.

## 3. Praktijktesten vóór een stabiele uitgave

| Test | Vereiste |
| --- | --- |
| Installatie | Schone installatie via custom_components, herstart Home Assistant en HACS-update |
| Upgrades | Beta8 en RC4/RC5 → kandidaat zonder instellingenverlies; ook na herstart en cachewissen |
| Accountopslag | Verschillende HA-accounts op telefoon en desktop, inclusief headerfoto's, export, import en herstelpunten |
| Telefoon | Swipe open/dicht met direct volgen van de vinger, lang indrukken, contextmenu, native Android-terugknop |
| Dialogen | Home Assistant- en Browser Mod-dialogen moeten niet per ongeluk mee sluiten |
| Desktop | Native HA-header verbergen, PalaSidebar-header, in-/uitklappen, mousewheel, keyboardfocus |
| Tablet | Compacte layout en vloeiende scrolling, geen andere scrollbalken of popup-terugsprongen |
| Dynamische badges | F1-countdown, warmtepomp, sensorkleuren en iconen bij realtime updates |
| Prestaties | Vergelijk meetbaar met RC5 bij een representatieve set van veel badges; geen zichtbare lekkage of groei bij heropenen |
| Foto | JPG/PNG/WebP selecteren, te grote/corrupte afbeelding weigeren, bewaren, verwijderen, herladen |
| Herstel | Backup + rollback naar RC5 blijft mogelijk zonder oude serverinstellingen te beschadigen |

## 4. Vrijgavecriteria

**Nog geen stabiele uitgave** zolang een van bovenstaande praktische tests niet bevestigd is of een ernstige regressie openstaat. Pas daarna:

1. Regels en bestanden van de beoogde release met RC5 vergelijken.
2. `manifest.json`, versie-JSON, frontendversie, release notes en README samen naar `2.0.0` brengen.
3. Nog een volledige CI-run op de exacte uiteindelijke commit uitvoeren.
4. Alleen die exacte commit taggen als `v2.0.0`, zonder RC5 of Beta8 te verwijderen.
5. Een nette HACS-release met changelog, bekende beperkingen en terugvalinstructies publiceren.

**Juridisch:** de bestaande MIT-licentie blijft ongewijzigd; een los concept voor een toekomstige licentie wordt niet geactiveerd door deze stabilisatie.

Dit document is geen certificering of garantie dat de volledige frontendcode foutvrij is.
