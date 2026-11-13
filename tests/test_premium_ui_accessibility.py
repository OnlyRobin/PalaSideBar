"""Premium UI regression: touch targets, keyboard access and reduced motion.

Uses the real PalaSidebar component with Home Assistant-shaped browser stubs.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

SOURCE=(Path(__file__).resolve().parents[1]/
        "custom_components/pala_sidebar/frontend/pala-sidebar.js").read_text(encoding="utf-8")

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path="/usr/bin/chromium",
        args=["--no-sandbox","--disable-dev-shm-usage"])
    for width,touch,reduce_motion in [(390,True,False),(768,True,True),(1280,False,True)]:
        page=browser.new_page(viewport={"width":width,"height":900},
                              has_touch=touch,
                              reduced_motion="reduce" if reduce_motion else "no-preference")
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.set_content("<html><body></body></html>")
        page.evaluate("""source=>{
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify({schema:1})});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'premium-ui-'+window.innerWidth,name:'Test',is_admin:true},
            config:{version:'2026.11.0'},states:{},entities:{},
            panels:{'palaguard-security':{url_path:'palaguard-security',title:'PalaGuard',require_admin:true}},
            connection:{sendMessagePromise:async()=>({value:null})}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=source;
          document.head.append(script);
        }""",SOURCE)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        page.wait_for_function("""()=>!!document.querySelector('home-assistant')?.shadowRoot
          ?.querySelector('ha-sidebar')?.querySelector('pala-sidebar')?._prefsStore?.ready""",timeout=20000)
        result=page.evaluate("""()=>{
          const nav=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar');
          const sidebar=nav.querySelector('pala-sidebar');
          const guard=sidebar.footer.querySelector('[data-do="palaguard-footer"]');
          const restart=sidebar.footer.querySelector('[data-do="ha-restart"]');
          if(!guard||!restart)throw Error('Premium footer action missing');
          if(guard.tagName!=='BUTTON'||guard.getAttribute('aria-label')===null)
            throw Error('Security shortcut is not keyboard-accessible');
          const row=sidebar.shadowRoot.querySelector('.nav-row');
          if(!row)throw Error('Navigation row missing');
          row.classList.add('active');
          const shadow=getComputedStyle(row).boxShadow;
          if(shadow==='none')throw Error('Active row has no theme-aware visual border');
          const group=sidebar.shadowRoot.querySelector('.group-content');
          const transitions=group?getComputedStyle(group).transitionDuration:'';
          return {touch:matchMedia('(pointer:coarse)').matches,
            guardWidth:guard.getBoundingClientRect().width,
            guardHeight:guard.getBoundingClientRect().height,
            restartHeight:restart.getBoundingClientRect().height,
            reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,
            transitions,shadow};
        }""")
        if result["touch"]:
            assert result["guardWidth"]>=43 and result["guardHeight"]>=43,result
            assert result["restartHeight"]>=43,result
        if reduce_motion and result["transitions"]:
            assert all(float(part.strip().rstrip("s")) == 0
                       for part in result["transitions"].split(",")),result
        assert not errors,(width,errors)
        print("PASS premium accessible mobile/desktop UI", width, result)
        page.close()
    browser.close()
