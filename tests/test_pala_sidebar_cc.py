"""Run without Home Assistant using API-shaped stubs (not a real HA instance)."""
from __future__ import annotations
import sys, types, asyncio, tempfile, pathlib, json, importlib.util
from unittest.mock import MagicMock
path=pathlib.Path(__file__).resolve().parents[1] / 'custom_components' / 'pala_sidebar'

def mkmod(name):
    x=types.ModuleType(name);x.__path__=[];sys.modules[name]=x;return x
for mod in ('homeassistant','homeassistant.components','homeassistant.components.frontend','homeassistant.components.http','homeassistant.config_entries','homeassistant.core','homeassistant.helpers','homeassistant.helpers.typing'):
    mkmod(mod)
seen=[]
frontend=sys.modules['homeassistant.components.frontend'];frontend.add_extra_js_url=lambda h,u:seen.append(('add',u));frontend.remove_extra_js_url=lambda h,u:seen.append(('remove',u))
class StaticPathConfig:
    def __init__(self,url_path,path,cache_headers):self.url_path=url_path;self.path=path;self.cache_headers=cache_headers
sys.modules['homeassistant.components.http'].StaticPathConfig=StaticPathConfig
sys.modules['homeassistant.config_entries'].ConfigEntry=type('ConfigEntry',(),{})
sys.modules['homeassistant.core'].HomeAssistant=type('HomeAssistant',(),{})
sys.modules['homeassistant.helpers.typing'].ConfigType=dict
spec=importlib.util.spec_from_file_location('ha_pala_test',path/'__init__.py',submodule_search_locations=[str(path)])
m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
class HTTP:
    async def async_register_static_paths(self,paths):self.paths=paths
class FakeConfig:
    def __init__(self,dir):self.dir=dir
    def path(self,*args):return str(self.dir.joinpath(*args))
class FakeHass:
    def __init__(self,dir):self.data={};self.http=HTTP();self.config=FakeConfig(dir)
    async def async_add_executor_job(self,f,*args):return f(*args)
class Entry: version=1
async def test():
    with tempfile.TemporaryDirectory() as d:
        base=pathlib.Path(d);(base/'www').mkdir()
        original={'schema':1,'title':'Eigen dashboard','groups':[{'id':'start','title':'START','items':[]}]}
        (base/'www'/'pala-sidebar-config.json').write_text(json.dumps(original))
        preferred=path/'pala-sidebar-config.json'
        if preferred.exists(): preferred.unlink()
        hass=FakeHass(base)
        assert await m.async_setup(hass,{})
        assert await m.async_setup_entry(hass,Entry())
        assert ('add','/pala_sidebar/assets/pala-sidebar-loader.js') in seen
        assert {p.url_path for p in hass.http.paths} == {'/pala_sidebar/assets','/pala_sidebar/config.json'}
        assert preferred.exists() and json.loads(preferred.read_text())==original
        assert hass.data['pala_sidebar']['config_file']==str(preferred)
        assert all(not p.cache_headers for p in hass.http.paths)
        # repeating setup is idempotent; previous config is never overwritten
        (base/'www'/'pala-sidebar-config.json').write_text('{"schema":1,"title":"NEW"}')
        assert await m.async_setup_entry(hass,Entry())
        assert json.loads(preferred.read_text())==original
        assert sum(x[0]=='add' for x in seen)==1
        assert await m.async_unload_entry(hass,Entry())
        assert seen[-1]==('remove','/pala_sidebar/assets/pala-sidebar-loader.js')
        preferred.unlink()
    # no old config: bundle default config path is used
    with tempfile.TemporaryDirectory() as d:
        hass=FakeHass(pathlib.Path(d))
        await m.async_setup_entry(hass,Entry())
        assert hass.data['pala_sidebar']['config_file'].endswith('/frontend/default-config.json')
        assert json.loads(pathlib.Path(hass.data['pala_sidebar']['config_file']).read_text())=={'schema':1}
    print('PASS: integrate, idempotence, legacy migration, default config, unload')
asyncio.run(test())
