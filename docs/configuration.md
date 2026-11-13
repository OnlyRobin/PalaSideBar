# Configuration notes

> **Historische beta-configuratie.** PalaSidebar wordt vanaf Home Assistant **2026.11** geïnstalleerd via **Instellingen → Marketplace**, niet via een losse HACS-integratie. Zoek PalaSidebar of kies **Toevoegen via link** en gebruik `https://github.com/OnlyRobin/PalaSideBar`. Zie de [huidige configuratiehandleiding](https://github.com/OnlyRobin/PalaSideBar/blob/main/docs/configuration.md) voor updates, RC's en herstel.


The integration automatically registers the frontend. Do **not** manually add `/local/pala-sidebar.js` to `frontend.extra_module_url`.

If you have a personal configuration file, keep a backup outside of HACS-managed directories. Your Home Assistant account preferences are preserved by PalaSidebar's existing backend storage; the UI appearance key is migrated from the legacy setting on read.

After install: Home Assistant → Settings → Devices & services → Add integration → PalaSidebar.
