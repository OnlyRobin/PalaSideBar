# PalaSidebar v2.0.0-rc8 — kanaalbewuste updatemeldingen

**Testrelease. Niet stabiel.** RC7 en eerdere releases blijven als terugval beschikbaar.

## Nieuw
- Updatecontrole herkent **bèta**, **RC** en **stabiel** uit de geïnstalleerde versie en GitHub-releasetags.
- Een gebruiker van een bèta ziet nieuwere bèta's; een RC-gebruiker nieuwere RC's; een stabiele gebruiker uitsluitend nieuwere stabiele releases.
- Bèta- en RC-gebruikers ontvangen ook bericht wanneer een **nieuwe stabiele versie** met dezelfde of hogere basisversie is uitgebracht.
- Er wordt nooit automatisch naar een ander testkanaal overgeschakeld en er wordt niets automatisch geïnstalleerd. **HACS verzorgt installatie en updates.**
- Instellingen → Diagnose toont de eigen versie, het updatekanaal en een handmatige knop om te controleren.
- De automatische GitHub-controle gebeurt maximaal om de zes uur; **Later** verbergt uitsluitend de betreffende versietag.

## Testen
1. Controleer versie 2.0.0-rc8 in Instellingen → Diagnose.
2. Klik op **Controleer op updates**. Is er nog geen nieuwere RC of stabiele release, dan mag geen updatebanner verschijnen.
3. Test ook een ontbrekende GitHub-verbinding; er moet een veilige status verschijnen, zonder crash.
4. Controleer dat **Later** alleen de betreffende melding verbergt.
5. Controleer HACS, swipe, backpress, diagnose, meldingen en bestaande instellingen.

Bij problemen installeer [RC7](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc7) opnieuw.
