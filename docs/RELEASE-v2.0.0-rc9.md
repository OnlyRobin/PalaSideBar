# PalaSidebar v2.0.0-rc9 — zichtbare feedback bij updatecontrole

**Releasecandidate voor testen op Home Assistant, telefoon en tablet. Geen stabiele release.**

## Opgelost
- Handmatig klikken op **Controleer op updates** toont onmiddellijk **Controleren op GitHub…**.
- Tijdens de lopende controle is de knop uitgeschakeld, zodat dubbele verzoeken worden voorkomen.
- Na voltooiing toont het diagnosepaneel de uitkomst of een foutmelding; daarna is de knop weer beschikbaar.
- De kanaalbewuste versiecontrole uit RC8 blijft bestaan: bèta ziet bèta, RC ziet RC, stabiel ziet stabiel; bèta en RC worden ook op geschikte stabiele versies gewezen.
- Installatie verloopt uitsluitend via HACS. Er wordt niet automatisch geïnstalleerd.

## Testen
1. Open **Instellingen → Diagnose** en klik **Controleer op updates**.
2. Controleer de onmiddellijke status **Controleren op GitHub…**, en de definitieve uitkomst na het ophalen.
3. Controleer dat de knop tijdens het controleren niet herhaald kan worden aangeklikt en daarna weer actief wordt.
4. Test ook een tijdelijk ontbrekende verbinding met GitHub.
5. Test gebruikelijke functies, waaronder bugmelden, swipe, terugknop en instellingen.

Bij problemen blijft [RC8](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc8) beschikbaar als terugvaloptie. Stable wordt pas gepubliceerd na goedkeuring.
