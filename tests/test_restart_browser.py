"""Playwright smoke test for the optional administrator-only restart UI."""
from pathlib import Path
from playwright.sync_api import sync_playwright

main=(Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text()
fixture={'schema':1,'title':'Test','groups':[{'id':'start','title':'START','items':[{'id':'home','label':'Overzicht','path':'/lovelace','icon':'mdi:view-dashboard-outline'}]}]}
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (390,1280):
        page=browser.new_page(viewport={'width':width,'height':900})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content('<html><body></body></html>')
        page.evaluate('''arg=>{
          window.__source=arg.src;
          window.__calls=[];window.__confirmation=false;
          window.__userAlerts=[];
          window.confirm=()=>window.__confirmation;
          window.alert=message=>window.__userAlerts.push(message);
          window.fetch=async url=>({ok:true,text:async()=>JSON.stringify(arg.config)});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const side=document.createElement('ha-sidebar');side.attachShadow({mode:'open'});
          side.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          side.expanded=true;side.setAttribute('expanded','');ha.shadowRoot.append(side);
          document.body.append(ha);
          const hass={user:{id:'fixture-admin',name:'Test',is_admin:true},
            config:{version:'2026.10'},states:{},entities:{},panels:{},
            callService:(d,s,...rest)=>{window.__calls.push([d,s]);return Promise.resolve();},
            connection:{sendMessagePromise:async req=>req.type==='frontend/get_user_data'?{value:null}:{}}};
          ha.hass=hass;side.hass=hass;
          const script=document.createElement('script');script.textContent=arg.src;document.head.append(script);
        }''',{'src':main,'config':fixture})
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        result=page.evaluate('''()=>{
          const root=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar');
          const sidebar=root.querySelector('pala-sidebar');
          const btn=sidebar.shadowRoot.querySelector('[data-do="ha-restart"]');
          return {btn:!!btn,label:btn?.textContent,admin:sidebar.hass.user.is_admin,
            footerConfig:sidebar.saved.footer_config};
        }''')
        assert result['btn'] and 'Home Assistant' in result['label'],result
        assert result['footerConfig']['show_restart'] is True,result
        # Cancel confirmation -> no HA command; accept -> exactly one command.
        result=page.evaluate('''async()=>{
          const sidebar=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          const btn=sidebar.shadowRoot.querySelector('[data-do="ha-restart"]');
          window.__confirmation=false;btn.click();await Promise.resolve();
          const cancelled=[...window.__calls];
          window.__confirmation=true;btn.click();btn.click();
          await new Promise(r=>setTimeout(r,0));
          const confirmed=[...window.__calls];
          return {cancelled,confirmed,disabled:btn.disabled};
        }''')
        assert result['cancelled']==[],result
        assert result['confirmed']==[['homeassistant','restart']],result
        assert result['disabled'] is True,result
        # Save editor setting with existing Save action, footer disappears.
        result=page.evaluate('''()=>{
          const sidebar=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          sidebar._restartBusy=false;
          sidebar.showSettings('layout');
          const box=sidebar.dialog.querySelector('#pala-layout-footer-show_restart');
          const old=box?.checked;
          box.checked=false;
          sidebar._layoutSaveGlobal();
          const hidden=!sidebar.shadowRoot.querySelector('[data-do="ha-restart"]');
          const persisted=sidebar.saved.footer_config.show_restart;
          const neverCalled=window.__calls.length;
          return {old,hidden,persisted,neverCalled};
        }''')
        assert result=={'old':True,'hidden':True,'persisted':False,'neverCalled':1},result
        # Even if called programmatically with setting off: no action.
        page.evaluate('''()=>{
          const sidebar=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          sidebar._requestHARestart();
        }''')
        assert page.evaluate('window.__calls.length')==1
        # Non-admin account should not see action even on fresh default prefs.
        result=page.evaluate('''()=>{
          const side=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          side.hass.user.is_admin=false;
          side.saved.footer_config.show_restart=true;
          side.redraw();
          side._requestHARestart();
          return {button:!!side.shadowRoot.querySelector('[data-do="ha-restart"]'),
            calls:window.__calls.length,alerts:[...window.__userAlerts]};
        }''')
        assert result['button'] is False and result['calls']==1,result
        assert any('beheerders' in a for a in result['alerts']),result
        assert not errors,errors
        print('PASS restart/permissions/cancel/toggle/doubleclick',width,'px')
        page.close()
    browser.close()
