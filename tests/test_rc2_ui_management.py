"""Regression: UI style settings, fallback subtitle, and BEHEER defaults on desktop/mobile."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
src = (root/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text(encoding='utf-8')

with sync_playwright() as pw:
    browser = pw.chromium.launch(
        headless=True, executable_path='/usr/bin/chromium',
        args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (390, 1280):
        page = browser.new_page(viewport={'width': width, 'height': 900})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.set_content('<html><body></body></html>')
        page.evaluate("""args => {
          window.fetch = async () => ({ok:true,text:async()=>JSON.stringify({schema:1})});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={
            user:{id:'rc2-admin',name:'Test',is_admin:true},config:{version:'2026.10'},
            states:{},entities:{},
            panels:{hacs:{url_path:'hacs',title:'HACS'},hassio:{url_path:'hassio',title:'Supervisor'}},
            callService:()=>Promise.resolve(),
            connection:{sendMessagePromise:async(req)=>req.type==='frontend/get_user_data'?{value:null}:{}}
          };
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=args;
          document.head.append(script);
        }""", src)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        got = page.evaluate("""() => {
          const sidebar=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          const subtitle=sidebar.shadowRoot.querySelector('.brand small')?.textContent;
          const beheer=sidebar._navData().find(x=>x.id==='beheer');
          sidebar.showSettings('ui_style');
          const ui=sidebar.dialog.querySelector('#pala-page-ui_style');
          return {
            subtitle,
            beheer:beheer?.items.map(i=>i.id),
            uiChildren:ui?.children.length,
            heading:ui?.querySelector('.pfx-intro h3')?.textContent,
            save:!!ui?.querySelector('[data-do="pfx-save"]'),
            shown:ui?.hidden===false,
            version:window.PalaSidebarDiagnostics().version
          };
        }""")
        assert got['subtitle']=='Mijn Home Assistant',got
        assert all(x in got['beheer'] for x in (
            'integraties','updates','apparaten','entiteiten','automatiseringen',
            'scripts','helpers','ontwikkelaar','hacs','add-ons')),got
        assert got['uiChildren']>=5 and got['heading'] and got['save'] and got['shown'],got
        assert got['version']=='2.0.0-rc6',got
        assert not errors,errors
        print('PASS rc4 styling tab, subtitle and BEHEER defaults',width,'px')
        page.close()
    browser.close()
