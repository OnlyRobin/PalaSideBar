# PalaSidebar RC5-stabilisatie veilig testen

## Wat staat momenteel waar?

- **Gepubliceerde HACS-testrelease:** [v2.0.0-rc5](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-rc5).
- **Stabilisatiecode:** [stabilization/rc5-to-v2](https://github.com/OnlyRobin/PalaSideBar/tree/stabilization/rc5-to-v2) en [draft-pull-request #10](https://github.com/OnlyRobin/PalaSideBar/pull/10). Bevat RC5 met aanvullende reparaties en tests.
- **main:** bevat voorlopig nog Beta7-code met recentere documentatie.
- **release/v2.0.0:** voorbereidingsbranch voor de nog **niet gepubliceerde** stabiele versie.
- De huidige stabilisatie-testbouw heeft intern nog hetzelfde versienummer `2.0.0-rc5` als de oorspronkelijke RC5. Daarom is **een schone testomgeving verplicht**, zodat browsercaches niet tot verwarring leiden.

## Installatie in een afzonderlijke Home Assistant-testomgeving

1. Download een recente [Home Assistant-back-up](https://www.home-assistant.io/common-tasks/general/#backups), bewaar die buiten je HA-apparaat en exporteer je PalaSidebar-instellingen.
2. Bewaar eventueel een eigen `pala-sidebar-config.json` apart van de integratiemap.
3. Open op GitHub de workflow [PalaSidebar RC5 naar stabiel — integrale audit](https://github.com/OnlyRobin/PalaSideBar/actions/workflows/stabilization-audit.yml).
4. Kies de **nieuwste geslaagde run van `stabilization/rc5-to-v2`**. Onder *Artifacts* download je `PalaSidebar-stabilisatie-test`.
5. Pak de GitHub Actions-download uit en pak daarna `PalaSidebar-stabilisatie-test.zip` uit.
6. Kopieer de map `custom_components/pala_sidebar` naar de testinstallatie, zonder parallel een tweede PalaSidebar-integratie aan te maken.
7. Herstart Home Assistant volledig. Controleer de frontendconsole op opstartfouten en of de eigen header correct wordt getoond.
8. Voer de onderstaande praktijktesten uit en noteer per test of hij geslaagd is.

**Let op:** Omdat het interne versienummer nog RC5 is, kan een al eerder bezochte HA-installatie een verouderde gecachete JS-versie laden. Gebruik voor dit testpakket bij voorkeur een schone HA-testinstantie en een nieuwe browsercontext. Op je normale installatie blijft de gepubliceerde RC5 de veilige hersteloptie. Deze test-ZIP is geen HACS-release.

## Praktijkcontrole

- [ ] Verbergen oorspronkelijke Home Assistant-sidebarheader, met behoud van de eigen PalaSidebar-header.
- [ ] Mobiel: open/dicht swipen, lang indrukken, Android-backpress en veilige dialoogsluiting.
- [ ] Desktop: inklappen, uitklappen, scrollen met muiswiel, keyboardfocus en thema's.
- [ ] Tablet/PalaKiosk: compacte layout, lange lijsten, scrollen en vloeiende live sensoren/F1-countdown.
- [ ] Foto in header: selecteren, voorbeeld, opslaan, foutief bestand kiezen, verwijderen en herladen.
- [ ] Home Assistant-accountwisseling: instellingen blijven privé per account.
- [ ] Offline gaan en terugkomen: synchronisatie, export/import en herstelpunten.
- [ ] Favorieten, menuvolgorde, badges, contextmenu, snelmenu en Live Control Center.
- [ ] Upgrade van Beta8 en RC5 via een **aparte testinstallatie**; instellingen blijven behouden.
- [ ] Geen structurele geheugengroei of vastlopende UI na langdurig openen/sluiten.

## Wanneer mogen we v2.0.0 publiceren?

Zie [het stabilisatierapport](STABILISATIE-RC5-NAAR-V2-NL.md). Een geslaagde geautomatiseerde run is noodzakelijk, maar **niet voldoende** zonder praktijkbevestiging. Na die bevestiging werken we de versiebestanden tegelijk bij en laten we de definitieve commit opnieuw testen, voordat de GitHub-release `v2.0.0` wordt aangemaakt.
