"""Local validation of PalaSidebar brand assets and installation archive layout."""
from pathlib import Path
import json
import struct
root=Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar'
meta=json.loads((root/'manifest.json').read_text(encoding='utf8'))
assert meta['domain']=='pala_sidebar'
assert __import__('re').fullmatch(r'\d+\.\d+\.\d+(?:-(?:beta|rc)[1-9]\d*)?', meta['version']), meta['version']
expect={
    'icon.png':(256,256), 'icon@2x.png':(512,512),
    'dark_icon.png':(256,256), 'dark_icon@2x.png':(512,512),
    'logo.png':(875,240), 'logo@2x.png':(1750,480),
    'dark_logo.png':(875,240), 'dark_logo@2x.png':(1750,480),
}
for name,dims in expect.items():
    data=(root/'brand'/name).read_bytes()
    assert data[:8]==b'\x89PNG\r\n\x1a\n',name
    assert struct.unpack('>II',data[16:24])==dims, (name,dims)
    assert len(data)>1000, name
print('PASS: PalaSidebar brand PNGs: eight images, correct dimensions')
