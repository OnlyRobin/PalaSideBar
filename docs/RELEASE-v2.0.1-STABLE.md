# PalaSidebar v2.0.1 — Premium Stable

**Stable-release**, gebaseerd op de afzonderlijk gepubliceerde en volledig geteste [v2.0.1-rc.7](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.1-rc.7).

Deze Stable is geen nieuwe ongeteste functiebranch. De releaseworkflow vergelijkt alle bestanden van de PalaSidebar-integratie met de onveranderlijke RC7-tag en weigert publicatie zodra ook maar één onverwachte wijziging is aangetroffen. Alleen de drie officiële versievermeldingen veranderen van `2.0.1-rc.7` in `2.0.1`. Vervolgens voert GitHub op de Stable-commit opnieuw code checks, Home Assistant Hassfest, HACS en de volledige Python-/Chromium-regressiesuite uit.

## Belangrijkste verbeteringen sinds de vorige Stable v2.0.0

- **Navigatie en thema's:** behoud van de moderne PalaSidebar/PalaKiosk-stijl, instelbare sectieranden, designopties, verschillende thema's en intelligente focus/scrollgedrag.
- **Headerfoto:** issue #17 en #22 zijn opgelost, inclusief correcte Boven/Midden/Onder-positionering en het verdwijnen van de 16px native Home Assistant-bovenmarge. De eigenaar heeft dit in RC6 op de echte installatie bevestigd.
- **PalaGuard:** optionele eenrichtingskoppeling met het Security Center, automatische ontdekking voor beheerders en een klikbaar gouden footer-logo. PalaSidebar is niet afhankelijk van PalaGuard en bevat geen PalaGuard-broncode of IP-logboeken.
- **RC7 Premium-kwaliteit:** semantisch veilige AutoLoader-updatecontrole (geen valse ‘nieuwe versie’ tijdens een rollback), verfijnde geselecteerde menu-items, betere leesbaarheid van het footer-versielabel, touchbediening en reduced-motion ondersteuning.
- **Betrouwbare migratie:** bestaande accountvoorkeuren, legacyconfig, back-up-/herstelopties en versiebeheer blijven behouden. De verouderde RC11-diagnosetekst is verwijderd.
- **Getest:** regressies voor alle voorgaande issuefixes, Android/mobile invoer, instellingen, thema's, PalaGuard zonder afhankelijkheid, versiemeldingen, HACS en Home Assistant-integratiecontracten.

## Installeren of bijwerken

1. Maak een **Home Assistant-back-up** en exporteer je PalaSidebar-instellingen via **Onderhoud → Backup**.
2. Open **HACS → PalaSidebar → Opnieuw downloaden** en kies **v2.0.1 Stable**.
3. Herstart Home Assistant volledig. Gebruik geen oude handmatige `extra_module_url`-verwijzingen naar PalaSidebar.
4. Controleer de headerfoto, menu, favorieten, badges, thema, PalaGuard-logo en Android-/PalaKiosk-bediening.
5. Komt er een probleem naar voren, installeer via HACS de eerdere Stable `v2.0.0` of de vorige RC `v2.0.1-rc.7` en herstel zo nodig je instellingenback-up.

## Releasekwaliteit en grenzen

Een groene CI-suite en het vergelijken met RC7 bewijzen dat de distributie consistent en reproduceerbaar is, maar **niet** dat elke combinatie van Home Assistant-versie, netwerk en Android-toestel foutloos is. Automatische browserproeven zijn geen vervanging voor een langdurige praktijktest op echte hardware. Er zijn geen nieuwe externe Python-afhankelijkheden en er is geen wijziging van de licentie (MIT).

**Herkomst:** [Premium auditrapport](PREMIUM-AUDIT-2026-11-13.md) · [Alle releases](https://github.com/OnlyRobin/PalaSideBar/releases).
