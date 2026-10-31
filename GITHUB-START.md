# GitHub en HACS: hoe de eerste publicatie is uitgevoerd

> **Historisch document.** Deze stappen horen bij de eerste GitHub-publicatie van PalaSidebar. De repository is inmiddels openbaar en beta7, RC1, RC2 en beta8 zijn gepubliceerd. Voer deze stappen niet opnieuw uit voor dezelfde versietag.

Repository: https://github.com/OnlyRobin/PalaSideBar

## De oorspronkelijke GitHub-upload

1. Een lokale ZIP met de projectbestanden werd uitgepakt; de mapinhoud moest in de **hoofdmap van de repository** terechtkomen.
2. De broncode, `.github`-workflows, `custom_components`, `tests`, `README.md`, `hacs.json` en `LICENSE` werden geüpload.
3. Daarna zijn de GitHub-acties voor codecontrole, Hassfest en HACS-validatie ingericht.
4. De repository is openbaar gemaakt en de eerste prerelease is gepubliceerd.

## Licenties en bronherkomst

Lees [PROVENANCE.md](PROVENANCE.md) en het [publicatieonderzoek](docs/PUBLICATION-AUDIT-2026-10-31.md). De MIT-licentie geldt alleen voor materiaal dat de rechthebbenden daadwerkelijk onder MIT mogen verspreiden. Eventuele licenties van derden blijven geldig.

## Huidige installatie

De nieuwste beta is **[v2.0.0-beta8](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-beta8)**.

1. Voeg `https://github.com/OnlyRobin/PalaSideBar` toe bij **HACS → Aangepaste repositories** als type **Integratie**.
2. Open PalaSidebar, schakel testversies in en kies expliciet beta8.
3. Installeer de versie en herstart Home Assistant.
4. Maak vóór het bijwerken van een handmatige installatie altijd een back-up van de integratiemap en instellingen.

Alle verdere instructies staan in de [README](README.md).
