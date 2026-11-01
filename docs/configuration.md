# PalaSidebar configureren

PalaSidebar registreert de frontend automatisch via de Home Assistant-integratie. Voeg **geen** extra verwijzing naar `/local/pala-sidebar.js` toe aan `frontend.extra_module_url`: hierdoor kan de sidebar dubbel worden geladen.

## Installatie

1. Installeer PalaSidebar via HACS.
2. Herstart Home Assistant volledig.
3. Ga naar **Instellingen → Apparaten en diensten → Integratie toevoegen → PalaSidebar**, als de integratie nog niet aanwezig is.
4. Open het PalaSidebar-instellingenmenu om de sidebar naar wens in te stellen.

## Eigen instellingen behouden

Exporteer je persoonlijke instellingen voordat je bijwerkt. Bewaar een eventuele eigen `pala-sidebar-config.json` **buiten** de door HACS beheerde integratiemap. Accountvoorkeuren worden via de bestaande Home Assistant-opslag bewaard; oude instellingen voor het uiterlijk worden bij het inladen zo veel mogelijk overgenomen.

Controleer na installatie de versie via `/pala_sidebar/assets/pala-sidebar-version.json`.

## Welke versie kiezen?

De nieuwste beta is [v2.0.0-beta8](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-beta8). Selecteer die zo nodig handmatig via HACS → PalaSidebar → Download/Opnieuw downloaden. De eerder gepubliceerde RC1 en RC2 zijn eveneens testversies en kunnen anders in de versievolgorde worden geplaatst.

Lees de [Nederlandstalige README](../README.md) voor de volledige installatie- en update-instructies.
