from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1] / 'custom_components' / 'pala_sidebar' / 'frontend'
loader=(root/'pala-sidebar-loader.js').read_text()
main=(root/'pala-sidebar.js').read_text()
assert '/pala_sidebar/config.json' in main
assert "const MAIN = '/pala_sidebar/assets/pala-sidebar.js'" in loader
mock_loader=loader.replace('await import(MAIN + query)','await window.__testImport(MAIN + query)').replace('window.location.reload()','window.__testReload()')
fixture={'schema':1,'title':'Nieuw Home Assistant','groups':[{'id':'start','title':'START','items':[{'id':'home','label':'Overzicht','path':'/lovelace','icon':'mdi:view-dashboard-outline'}]}]}
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (390,1280):
        page=browser.new_page(viewport={'width':width,'height':840})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content('<html><body></body></html>')
        page.evaluate('''args => {
            window.__fixture=args.config;window.__source=args.source;
            window.__networkVersion='2.0.0-rc8';window.__networkCalls=[];window.__imports=[];window.__reloads=0;
            window.__testReload=()=>window.__reloads++;
            window.__testImport=async url=>{window.__imports.push(url);const s=document.createElement('script');s.textContent=window.__source;document.head.append(s);};
            window.fetch=async url=>{
              window.__networkCalls.push(String(url));
              if(String(url).includes('/pala_sidebar/assets/pala-sidebar-version.json'))return {ok:true,json:async()=>({schema:1,version:window.__networkVersion})};
              if(String(url).includes('/pala_sidebar/config.json'))return {ok:true,text:async()=>JSON.stringify(window.__fixture)};
              return {ok:false,status:404};
            };
            const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
            const side=document.createElement('ha-sidebar');side.attachShadow({mode:'open'});side.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
            side.expanded=true;side.setAttribute('expanded','');ha.shadowRoot.append(side);document.body.append(ha);
            const h={user:{id:'fixture-user',name:'Test',is_admin:true},config:{version:'2026.10'},states:{},entities:{},panels:{},connection:{sendMessagePromise:async req=>req.type==='frontend/get_user_data'?{value:null}:{}}};ha.hass=h;side.hass=h;
        }''', {'config':fixture,'source':main})
        page.evaluate(mock_loader)
        page.wait_for_function("window.PalaSidebarUpdater?.status().loaded==='2.0.0-rc8'",timeout=30000)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        r=page.evaluate('''()=>({version:window.PalaSidebarDiagnostics().version,imports:window.__imports, calls:window.__networkCalls})''')
        assert r['version']=='2.0.0-rc8',r
        assert r['imports']==['/pala_sidebar/assets/pala-sidebar.js?v=2.0.0-rc8'],r
        assert any('/pala_sidebar/config.json' in x for x in r['calls']),r
        typography=page.evaluate('''()=>{
          const n=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar');
          const css=n.shadowRoot.querySelector('style[data-pala-header]')?.textContent||'';
          return {size:n.style.getPropertyValue('--pala-native-text-size'),
            badge:n.style.getPropertyValue('--pala-native-badge-size'),
            scoped:css.includes('ha-list-item-button:is(.configuration,.notifications,.user) .item-text')};
        }''')
        assert typography=={'size':'12.0px','badge':'10.0px','scoped':True},typography
        # Native footer labels are not PalaSidebar children: CSS crosses to
        # the native HA sidebar shadow root, but nothing else in the footer changes.
        sizing=page.evaluate('''()=>{
          const n=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar');
          const item=document.createElement('ha-list-item-button');item.id='sidebar-config';item.className='configuration';
          const label=document.createElement('span');label.className='item-text';label.textContent='Instellingen';
          item.append(label);n.shadowRoot.append(item);
          const sidebar=n.querySelector('pala-sidebar');
          const original=getComputedStyle(label).fontSize;
          sidebar.saved.design.typography=125;
          sidebar._applyDesign();
          const scaled=getComputedStyle(label).fontSize;
          sidebar.saved.design.typography=100;
          sidebar._applyDesign();
          return {original,scaled,reset:getComputedStyle(label).fontSize};
        }''')
        assert sizing=={'original':'12px','scaled':'15px','reset':'12px'},sizing
        page.evaluate("window.__networkVersion='2.0.1'")
        page.evaluate('window.PalaSidebarUpdater.check()')
        page.wait_for_selector('#palasidebar-update-notice',timeout=10000)
        page.locator('#palasidebar-update-notice').evaluate('(el)=>el.shadowRoot.querySelector("#update").click()')
        assert page.evaluate('window.__reloads')==1
        assert not errors,errors
        print('PASS integration loader',width,'px startup config, update prompt')
        page.close()
    browser.close()
