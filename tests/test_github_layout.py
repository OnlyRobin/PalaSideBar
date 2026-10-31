"""Basic standalone checks for HACS layout, versions and branding."""
from pathlib import Path
import json

root = Path(__file__).resolve().parent.parent
integration = root / 'custom_components' / 'pala_sidebar'
manifest = json.loads((integration / 'manifest.json').read_text(encoding='utf-8'))
version = json.loads((integration / 'frontend/pala-sidebar-version.json').read_text(encoding='utf-8'))
assert manifest['domain'] == 'pala_sidebar'
assert manifest['version'] == version['version']
assert (root / 'hacs.json').is_file()
assert (root / 'LICENSE').is_file()
assert (integration / 'frontend/pala-sidebar.js').is_file()
assert (integration / 'frontend/pala-sidebar-loader.js').is_file()
assert len(list((root / 'custom_components').iterdir())) == 1
assert (integration / 'brand/icon.png').is_file()
print('HACS layout, manifest, version, logo: OK')
