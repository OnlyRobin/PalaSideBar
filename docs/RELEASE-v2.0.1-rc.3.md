# PalaSidebar v2.0.1-rc.3 — Optionele PalaGuard-koppeling

**HACS-testrelease; geen Stable.** Gebaseerd op v2.0.1-rc.2. De bestaande Stable en eerdere RC's blijven intact.

## Nieuw

- **PalaGuard automatisch herkennen:** als Home Assistant het beheerpaneel `palaguard-security` aanbiedt, verschijnt in **BEHEER** een directe PalaGuard-snelkoppeling met het schildicoon.
- **PalaSidebar → Instellingen → Onderhoud → Diagnose:** een onderdeel *PalaGuard · Beveiligingscentrum* met knop **Open PalaGuard**, uitsluitend wanneer de integratie aanwezig en de gebruiker beheerder is.
- **Geen dubbele dashboards:** het PalaGuard-paneel wordt niet nogmaals onder *Andere dashboards* gezet; ook niet wanneer de beheerder het speciale menu-item verbergt.
- **Volledig optioneel:** zonder PalaGuard werkt de bestaande PalaSidebar ongewijzigd. PalaGuard wordt nooit als dependency ingeladen.
- **Eenrichtingskoppeling en privacy:** PalaSidebar leest geen PalaGuard-eventlogboek, IP-gegevens, tokens of integratie-instellingen. Alleen het door Home Assistant gepubliceerde paneel wordt herkend.
- **Rechten:** koppeling is alleen zichtbaar voor Home Assistant-beheerders; PalaGuard zelf bewaakt ook zijn eigen beheerdersrechten.

## Automatisch koppelen

1. Installeer PalaGuard afzonderlijk in Home Assistant en controleer of **PalaGuard Security** beschikbaar is.
2. Werk uitsluitend **PalaSidebar** bij naar RC3 via HACS.
3. Herstart Home Assistant en open PalaSidebar: **BEHEER → PalaGuard**. Ook beschikbaar onder **Instellingen → Onderhoud → Diagnose**.
4. Verwijder je PalaGuard, dan verdwijnt de koppeling wanneer Home Assistant zijn paneelstatus bijwerkt.

## Testen

`tests/test_rc3_palaguard_optional.py` controleert op mobiele en desktopbreedte: met/zonder PalaGuard, één menu-item, geen duplicatie, verbergen/herstellen, knopnavigatie en beheerdersrechten. Bestaande Python-, browser-, HACS- en Hassfest-controles blijven verplicht.

**Let op:** de RC bevat alleen PalaSidebar-wijzigingen, **geen PalaGuard-broncode**. Niet naar Stable mergen voordat de gebruiker de RC expliciet heeft goedgekeurd.
