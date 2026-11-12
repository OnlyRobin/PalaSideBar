"""PalaSidebar RC4: branded PalaGuard footer is optional, clickable and admin-only."""
import json
from pathlib import Path
EXPECTED_VERSION=json.loads((Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/manifest.json').read_text())['version']
from playwright.sync_api import sync_playwright

SOURCE=(Path(__file__).resolve().parents[1]/
        "custom_components/pala_sidebar/frontend/pala-sidebar.js").read_text(encoding="utf-8")

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path="/usr/bin/chromium",
        args=["--no-sandbox","--disable-dev-shm-usage"])
    for width in (390,768,1280):
        page=browser.new_page(viewport={"width":width,"height":900})
        errors=[]
        page.on("pageerror",lambda e: errors.append(str(e)))
        page.set_content("<html><body></body></html>")
        page.evaluate("""args=>{
          const src=args.src;
          window.__expectedVersion=args.version;
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify({schema:1})});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'pg-footer-'+window.innerWidth,name:'Tester',is_admin:true},
            config:{version:'2026.11.0'},states:{},entities:{},panels:{},
            connection:{sendMessagePromise:async()=>({value:null})}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=src;document.head.append(script);
        }""", SOURCE)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        page.wait_for_function("""()=>!!document.querySelector('home-assistant')?.shadowRoot
          ?.querySelector('ha-sidebar')?.querySelector('pala-sidebar')?._prefsStore?.ready""",
          timeout=20000)
        result=page.evaluate("""() => {
          const nav=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar');
          const sidebar=nav.querySelector('pala-sidebar'),hass=nav.hass;
          const get=()=>sidebar.footer.querySelectorAll('[data-do="palaguard-footer"]');
          if(get().length!==0)throw Error('Footer button without PalaGuard');
          if(!sidebar.footer.querySelector('[data-do="settings"]'))
            throw Error('Existing footer settings missing');
          if(!sidebar.footer.querySelector('[data-do="ha-restart"]'))
            throw Error('Existing restart missing');
          if(!sidebar.footer.textContent.includes('PalaSidebar '+window.__expectedVersion))
            throw Error('Wrong version in footer');
          hass.panels['palaguard-security']={url_path:'palaguard-security',title:'PalaGuard Security',require_admin:true};
          sidebar._updateMenuIfChanged();
          if(get().length!==1)throw Error('Auto-discovered footer button missing/duplicated');
          const button=get()[0],img=button.querySelector('img.pala-guard-logo');
          if(button.tagName!=='BUTTON'||button.type!=='button')
            throw Error('Footer is not a native keyboard-accessible button');
          if(!button.title.includes('PalaGuard gekoppeld')||
             !button.getAttribute('aria-label')?.includes('Open PalaGuard'))
            throw Error('Missing tooltip/accessible label');
          if(img?.getAttribute('src')!=='/palaguard-assets/brand-icon.png')
            throw Error('PalaGuard integration brand logo not used');
          if(getComputedStyle(button).boxShadow==='none')
            throw Error('Subtle active golden glow missing');
          const routes=[];sidebar._navigate=path=>routes.push(path);
          button.click();
          if(routes.join(',')!=='/palaguard-security')throw Error('Click does not open Security Center');
          const fallback=button.querySelector('.pala-guard-fallback');
          img.dispatchEvent(new Event('error'));
          if(img.style.display!=='none'||fallback.style.display!=='inline-flex')
            throw Error('Missing shield fallback for inaccessible brand asset');
          hass.user.is_admin=false;sidebar._updateMenuIfChanged();
          if(get().length)throw Error('Non-admin can see footer link');
          sidebar._click({target:{closest:()=>({dataset:{do:'palaguard-footer'}})}});
          if(routes.length!==1)throw Error('Non-admin can navigate through stale footer action');
          hass.user.is_admin=true;sidebar._updateMenuIfChanged();
          if(get().length!==1)throw Error('Footer not restored to admin');
          sidebar.saved.footer_config.show_status=false;sidebar._drawFooter();
          if(get()[0]?.dataset.alone!=='true')
            throw Error('Footer link does not align without status shield');
          sidebar.saved.footer_config.show_status=true;sidebar._drawFooter();
          delete hass.panels['palaguard-security'];sidebar._updateMenuIfChanged();
          if(get().length!==0)throw Error('Footer still visible after PalaGuard unload');
          if(!sidebar.footer.querySelector('[data-do="ha-restart"]'))
            throw Error('Existing restart removed after PalaGuard unload');
          return {width:window.innerWidth,glow:true,route:routes[0],noDependency:true};
        }""")
        assert result["route"]=="/palaguard-security",result
        assert not errors,(width,errors)
        print("PASS RC4 PalaGuard footer",result)
        page.close()
    browser.close()
