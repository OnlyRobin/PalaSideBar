"""PalaSidebar RC3: optional, administrator-only PalaGuard integration.

The PalaGuard source is NOT bundled or required.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

SOURCE=(Path(__file__).resolve().parents[1]/
        "custom_components/pala_sidebar/frontend/pala-sidebar.js").read_text(encoding="utf-8")

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path="/usr/bin/chromium",
      args=["--no-sandbox","--disable-dev-shm-usage"])
    for width in (390,1280):
        page=browser.new_page(viewport={"width":width,"height":900})
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.set_content("<html><body></body></html>")
        page.evaluate("""src => {
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify({schema:1})});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'pg-link-'+window.innerWidth,name:'Test',is_admin:true},
            config:{version:'2026.11.0'},states:{},entities:{},panels:{},
            connection:{sendMessagePromise:async()=>({value:null})}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=src;document.head.append(script);
        }""",SOURCE)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        page.wait_for_function("""()=>!!document.querySelector('home-assistant')?.shadowRoot
          ?.querySelector('ha-sidebar')?.querySelector('pala-sidebar')?._prefsStore?.ready""",timeout=20000)
        result=page.evaluate("""() => {
          const host=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar');
          const s=host.querySelector('pala-sidebar'),hass=host.hass;
          const found=()=>s._navData().flatMap(x=>x.items).filter(x=>x.path==='/palaguard-security');
          if(s._palaGuardAvailable()||found().length)throw Error('Link shown without PalaGuard');
          s.showSettings('diagnostic');
          if(s.dialog.querySelector('#pala-palaguard-integration'))throw Error('Settings shown without PalaGuard');
          hass.panels['palaguard-security']={url_path:'palaguard-security',title:'PalaGuard',
            icon:'mdi:shield-lock-outline',require_admin:true};
          s._updateMenuIfChanged();
          if(!s._palaGuardAvailable()||found().length!==1)throw Error('PalaGuard must appear once');
          if(found()[0].id!=='palaguard'||!found()[0].admin_only)throw Error('Dedicated admin item missing');
          if(!s._navData().find(g=>g.id==='beheer')?.items.some(x=>x.id==='palaguard'))
            throw Error('PalaGuard should appear under BEHEER');
          s.showSettings('diagnostic');
          const link=s.dialog.querySelector('#pala-palaguard-integration');
          if(!link||!link.querySelector('[data-do="palaguard-open"]'))throw Error('Settings action missing');
          const dest=[];s._navigate=path=>dest.push(path);
          s._closeOwnedDialog=(_dialog,callback)=>{if(callback)callback();};
          link.querySelector('[data-do="palaguard-open"]').click();
          if(dest.join(',')!=='/palaguard-security')throw Error('Wrong navigation destination');
          s.saved.hidden.push('palaguard');
          if(found().length)throw Error('Hidden item duplicated by discovery');
          s.saved.hidden=s.saved.hidden.filter(x=>x!=='palaguard');
          if(found().length!==1)throw Error('Unhidden item not restored');
          hass.user.is_admin=false;s._updateMenuIfChanged();
          if(s._palaGuardAvailable()||found().length)throw Error('Non-admin sees PalaGuard');
          s.showSettings('diagnostic');
          if(s.dialog.querySelector('#pala-palaguard-integration'))throw Error('Non-admin settings visible');
          hass.user.is_admin=true;delete hass.panels['palaguard-security'];s._updateMenuIfChanged();
          if(found().length)throw Error('Item remains after uninstall');
          return {width:window.innerWidth,route:dest[0]};
        }""")
        assert result["route"]=="/palaguard-security",result
        assert not errors,(width,errors)
        print("PASS PalaGuard optional link",result)
        page.close()
    browser.close()
