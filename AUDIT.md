# Historische technische controle voor beta7

Dit document beschrijft de voorbereidingen voor de oorspronkelijke beta7. Het is een **historisch verslag**, geen beoordeling van de huidige beta8. Inmiddels zijn meerdere problemen uit beta7 verholpen en is [beta8 gepubliceerd](https://github.com/OnlyRobin/PalaSideBar/releases/tag/v2.0.0-beta8).

## Onderzochte punten

- De oorspronkelijke integratie werd opgebouwd vanuit het door de gebruiker aangeleverde beta6-archief. De bestaande integratiedomeinnaam, routes, configuratie en accountvoorkeuren bleven behouden.
- De zichtbare oude projectnaam werd vervangen door **PalaSidebar UI**, inclusief tabbladen, voorbeelden en labels.
- CSS-eigenschappen werden consistent hernoemd. De nieuwe stijlvoorkeur gebruikt `ui_style`; de vroegere `palafix`-voorkeur blijft als migratiebron leesbaar.
- Resterende oude namen in de code verwijzen naar **oude opslag- en resource-identificaties** die nodig zijn voor het herkennen of opruimen van eerder geladen scripts. Dit betekent geen externe afhankelijkheid.
- Oude verwijzingen naar een ander sidebarproject werden verwijderd uit commentaar. Het manifest heeft geen afhankelijkheid van die andere integratie.
- Er werd een MIT-licentie opgenomen voor materiaal waarvoor de auteurs daadwerkelijk de verspreidingsrechten bezitten. De herkomstbeoordeling staat in [PROVENANCE.md](PROVENANCE.md).
- De HACS-mapstructuur, het manifest, de logo's en de versiebestanden werden nagekeken.
- Destijds waren de werking op alle apparaten en alle rechten op eventuele externe onderdelen nog niet volledig bevestigd.

## Destijds uitgevoerde tests

De volgende twaalf testscripts zijn afzonderlijk geslaagd:

- `test_pala_sidebar_cc.py`
- `test_brand_files.py`
- `test_v2_migration.py`
- `test_beta4_stability.py`
- `test_beta3_unified_sections.py`
- `test_beta6_quick_order.py`
- `test_beta2_interaction.py`
- `test_v2_browser.py`
- `test_restart_browser.py`
- `test_beta5_real_gestures.py`
- `test_beta5_action_safety.py`
- `test_pala_sidebar_cc_browser.py`

Daarnaast slaagden `node --check`, de Python-compilatie en de eerste controle van de HACS-mapstructuur. Dit waren testresultaten van het toenmalige pakket; de latere GitHub-workflows en tests van de actuele releases hebben hun eigen resultaten.

**Latere ontdekking:** in beta7 bleef het tabblad PalaSidebar UI leeg, ontbrak de standaardondertitel en bevatte BEHEER te weinig standaardopties. De drie problemen zijn gereproduceerd in [de beta7-audit](https://github.com/OnlyRobin/PalaSideBar/actions/runs/41213687322) en hersteld in beta8.
