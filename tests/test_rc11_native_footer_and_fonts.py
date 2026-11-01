"""RC11: echte HA 2026.10 sidebar-footer ID's, mobiele schaal, veilige fontupload."""
from pathlib import Path
from playwright.sync_api import sync_playwright

src=(Path(__file__).resolve().parents[1]/"custom_components/pala_sidebar/frontend/pala-sidebar.js").read_text(encoding="utf-8")
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path="/usr/bin/chromium",
        args=["--no-sandbox","--disable-dev-shm-usage"])
    for width in (390,1280):
        page=browser.new_page(viewport={"width":width,"height":900})
        errors=[]
        page.on("pageerror",lambda error: errors.append(str(error)))
        page.set_content("<html><body></body></html>")
        page.evaluate("""source=>{
          const config={schema:1,title:'PalaSidebar',groups:[{id:'start',title:'START',items:[{id:'home',label:'Overzicht',path:'/lovelace',icon:'mdi:home'}]}]};
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(config)});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML=`
            <style>.item-text{font-size:14px}.test-label{font-size:14px}</style>
            <slot name="main-navigation"></slot>
            <ha-list-item-button id="sidebar-config" href="/config"><span class="item-text" slot="headline">Instellingen</span></ha-list-item-button>
            <ha-list-item-button id="sidebar-notifications"><span class="item-text" slot="headline">Meldingen</span></ha-list-item-button>
            <ha-list-item-button id="sidebar-profile" href="/profile"><span class="item-text" slot="headline">Mijn profiel</span></ha-list-item-button>
            <ha-list-item-button id="sidebar-panel-test" href="/test"><span class="item-text test-label" slot="headline">Ander paneel</span></ha-list-item-button>`;
          nav.expanded=true;nav.setAttribute('expanded','');ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'rc11-font-test',name:'Test',is_admin:true},config:{version:'2026.10.4'},
            states:{},entities:{},panels:{},connection:{sendMessagePromise:async req=>({value:null})}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=source;document.head.append(script);
        }""",src)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        page.wait_for_function("""()=>!!document.querySelector('home-assistant')?.shadowRoot?.querySelector('ha-sidebar')?.querySelector('pala-sidebar')?._prefsStore?.ready""",timeout=20000)
        result=page.evaluate("""async()=>{
          const nav=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar');
          const s=nav.querySelector('pala-sidebar');
          s.showSettings('ui_style');
          const get=(id)=>Number.parseFloat(getComputedStyle(nav.shadowRoot.querySelector('#'+id+' .item-text')).fontSize);
          const before=['sidebar-config','sidebar-notifications','sidebar-profile','sidebar-panel-test'].map(get);
          const set=(id,value)=>{const input=s.dialog.querySelector('#pala-pfx-'+id);if(!input)throw Error('Control ontbreekt: '+id);input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));};
          set('fontScale',130);set('mobileScale',115);set('footerScale',120);s._pfxPreview();
          const after=['sidebar-config','sidebar-notifications','sidebar-profile','sidebar-panel-test'].map(get);
          const input=s.dialog.querySelector('#pala-custom-font-upload');
          if(!input)throw Error('Fontupload ontbreekt');
          const file=new File([new Uint8Array([119,79,70,50,0,1,0,0,0,0])],'eigen.woff2',{type:'font/woff2'});
          const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;
          input.dispatchEvent(new Event('change',{bubbles:true}));
          for(let i=0;i<100&&!s._pfxDraft?.customFont;i++)await new Promise(resolve=>setTimeout(resolve,10));
          const uploaded=s._pfxDraft?.customFont?.startsWith('data:font/woff2;base64,')||false;
          const active=s.dialog.querySelector('#pala-pfx-font')?.value;
          const css=document.getElementById('pala-sidebar-ui-integrated-v200')?.textContent||'';
          return {before,after,uploaded,active,fontCSS:css.includes('PalaUserFont'),style:!!nav.shadowRoot.querySelector('style[data-pala-native-footer-typography]')};
        }""")
        factor=(1.15 if width<=700 else 1.30)*1.20
        for idx in range(3):
            wanted=result["before"][idx]*factor
            assert abs(result["after"][idx]-wanted)<0.5,(width,idx,wanted,result)
        assert abs(result["after"][3]-result["before"][3])<0.1,(width,"ander paneel meegeschaald",result)
        assert result["uploaded"] and result["active"]=="custom" and result["fontCSS"],result
        assert result["style"],result
        assert not errors,(width,errors)
        print("PASS RC11 native footer + font upload",width,result)
        page.close()
    browser.close()
