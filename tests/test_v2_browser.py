"""Smoke test PalaSidebar 2.0 beta new UX with minimal Home Assistant fixture."""
from pathlib import Path
from playwright.sync_api import sync_playwright
src=(Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text()
fixture={'schema':1,'title':'PalaSidebar','groups':[{'id':'start','title':'START','items':[{'id':'home','label':'Overzicht','path':'/lovelace','icon':'mdi:view-dashboard-outline'},{'id':'energie','label':'Energie','path':'/energy','icon':'mdi:flash'}]}]}
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (390,768,1280):
        page=browser.new_page(viewport={'width':width,'height':900})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content('<html><body></body></html>')
        page.evaluate('''arg=>{
          window.__calls=[];window.__alerts=[];window.confirm=()=>true;window.alert=x=>__alerts.push(x);
          window.fetch=async url=>({ok:true,text:async()=>JSON.stringify(arg.config)});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const side=document.createElement('ha-sidebar');side.attachShadow({mode:'open'});side.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          side.expanded=true;side.setAttribute('expanded','');ha.shadowRoot.append(side);document.body.append(ha);
          const hass={user:{id:'fixture-admin',name:'Test',is_admin:true},config:{version:'2026.10'},
            states:{'sensor.test_energy':{state:'125',attributes:{friendly_name:'Test Energie',unit_of_measurement:'W'}},
                    'sensor.f1_race':{state:'Vandaag',attributes:{friendly_name:'Grand Prix'}}},
            entities:{},panels:{},
            callService:(d,s,...rest)=>{__calls.push([d,s]);return Promise.resolve();},
            connection:{sendMessagePromise:async req=>req.type==='frontend/get_user_data'?{value:null}:{}}};
          ha.hass=hass;side.hass=hass;
          const script=document.createElement('script');script.textContent=arg.src;document.head.append(script);
        }''', {'src':src,'config':fixture})
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'", timeout=30000)
        # enable fresh features via settings and verify tabs exist and no unintended default feature changes
        result=page.evaluate('''()=>{
          const sidebar=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          window.__sidebar=sidebar;
          const defaults={live:sidebar.saved.live_center?.enabled,menu:sidebar.saved.context_menu?.enabled,perf:sidebar.saved.performance_center?.enabled};
          sidebar.showSettings('live_center');
          const dialog=sidebar.dialog;
          const pages=[...dialog.querySelectorAll('[data-editor-page]')].map(el=>el.dataset.editorPage);
          return {defaults,pages,loaded:sidebar.saved.theme_snapshots.length,version:window.PalaSidebarDiagnostics().version};
        }''')
        assert result['defaults']=={'live':False,'menu':True,'perf':False},result
        assert all(x in result['pages'] for x in ('live_center','themes','performance','quick')),result
        assert result['version']=='2.0.0-rc1',result
        result=page.evaluate('''()=>{
          const s=window.__sidebar,d=s.dialog;
          d.querySelector('#pala-v2-live-enabled').checked=true;
          d.querySelector('#pala-v2-live-entity-0').value='sensor.test_energy';
          d.querySelector('#pala-v2-live-label-0').value='Energie';
          s._saveLiveCenter();
          const tile=s.shadowRoot.querySelector('[data-do="v2-live-more"]');
          const first=tile?.querySelector('.badge')?.textContent;
          // In-place update after received HA state
          s.hass.states['sensor.test_energy']={state:'140',attributes:{unit_of_measurement:'W'}};
          s._refreshLiveCenter();
          const next=tile?.querySelector('.badge')?.textContent;
          const sameNode=tile===s.shadowRoot.querySelector('[data-do="v2-live-more"]');
          let toggler=s.shadowRoot.querySelector('[data-do="v2-live-collapse"]');toggler.click();
          const collapsed=s.saved.live_center.collapsed;
          toggler=s.shadowRoot.querySelector('[data-do="v2-live-collapse"]');toggler.click();
          return {first,next,sameNode,collapsed,expanded:!s.saved.live_center.collapsed};
        }''')
        assert result=={'first':'125 W','next':'140 W','sameNode':True,'collapsed':True,'expanded':True},result
        result=page.evaluate('''()=>{
          const s=window.__sidebar,d=s.dialog;
          s.saved.context_menu={enabled:true};if(s.dialog.open)s.dialog.close();s._openFavoriteMenu('home');
          const menu=s.actionDialog;
          const actions=[...menu.querySelectorAll('[data-do]')].map(x=>x.dataset.do);
          s._closeOwnedDialog(menu);
          return {actions,suppression:s._favoriteSuppressClickUntil||0};
        }''')
        assert 'v2-context-open' in result['actions'] and 'favorite-toggle' in result['actions'],result
        # performance sample cap, live loop without new timers
        result=page.evaluate('''()=>{
          const s=window.__sidebar;
          s.saved.performance_center={enabled:true};
          for(let i=0;i<145;i++)s.refreshStatus();
          s.showSettings('performance');
          const data=s._performanceSnapshot();
          return {samples:data.samples,shown:!!s.dialog.querySelector('#pala-v2-perf-stats'),draws:data.draws};
        }''')
        assert result['samples']==120 and result['shown'],result
        result=page.evaluate('''()=>{
          const s=window.__sidebar;
          s.showSettings('themes');
          const d=s.dialog;d.querySelector('#pala-v2-theme-name').value='Mijn test';
          s._saveThemeSnapshot();
          const saved=s.saved.theme_snapshots;
          s.showSettings('themes');
          const select=s.dialog.querySelector('#pala-v2-theme-select');
          select.value=saved[0].id;
          s._loadThemeSnapshot(saved[0].theme);
          s._themeCancel();
          return {snapshots:saved.length,name:saved[0].name,cancel:s.themeDraft===null};
        }''')
        assert result=={'snapshots':1,'name':'Mijn test','cancel':True},result
        assert not errors,errors
        print('PASS v2 browser',width,'px: defaults, live, hold menu, performance, theme snapshots')
        page.close()
    browser.close()
