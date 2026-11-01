"""Issue #6: echte berekende CSS-tekstgrootte, desktop/mobiel/tablet en behoud van Design Studio."""
from pathlib import Path
from playwright.sync_api import sync_playwright

src=(Path(__file__).resolve().parents[1]/"custom_components/pala_sidebar/frontend/pala-sidebar.js").read_text(encoding="utf-8")

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path="/usr/bin/chromium",args=["--no-sandbox","--disable-dev-shm-usage"])
    for width in (390,768,1280):
        page=browser.new_page(viewport={"width":width,"height":900})
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.set_content("<html><body></body></html>")
        page.evaluate("""source=>{
          const config={schema:1,title:'Test',groups:[{id:'start',title:'START',items:[
            {id:'home',label:'Overzicht',path:'/lovelace',icon:'mdi:home',
              badge:{entity:'sensor.test_temperature',color:'accent',format:'number'}}]}]};
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(config)});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'font-issue-test',name:'Test',is_admin:true},config:{version:'2026.10'},
            states:{'sensor.test_temperature':{entity_id:'sensor.test_temperature',state:'21.5',attributes:{unit_of_measurement:'°C'}}},
            entities:{},panels:{},
            connection:{sendMessagePromise:async req=>({value:null})}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=source;document.head.append(script);
        }""",src)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        page.wait_for_function("""()=>!!document.querySelector('home-assistant')?.shadowRoot?.querySelector('ha-sidebar')?.querySelector('pala-sidebar')?._prefsStore?.ready""",timeout=20000)
        result=page.evaluate("""()=>{
          const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          window.sidebar=s;
          const root=s.shadowRoot;
          const px=node=>Number.parseFloat(getComputedStyle(node).fontSize);
          const get=()=>({
            label:px(root.querySelector('.nav-label')),
            badge:px(root.querySelector('[data-item-badge="home"]')),
            group:px(root.querySelector('.group-toggle')),
            search:px(root.querySelector('.search input')),
            heading:px(root.querySelector('.brand strong'))
          });
          s.showSettings('ui_style');
          const old=get();
          const desktop=s.dialog.querySelector('#pala-pfx-fontScale');
          const mobile=s.dialog.querySelector('#pala-pfx-mobileScale');
          const apply=(el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));s._pfxPreview();};
          apply(desktop,80);apply(mobile,120);
          const after=get();
          const unitDesktop=desktop.parentElement.querySelector('output')?.textContent;
          const unitMobile=mobile.parentElement.querySelector('output')?.textContent;
          const css=document.getElementById('pala-sidebar-ui-integrated-v200')?.textContent||'';
          const actualDesktop=s.style.getPropertyValue('--pfx-desktop-text-scale');
          const actualMobile=s.style.getPropertyValue('--pfx-mobile-text-scale');
          const selectedWidth=window.innerWidth;
          // De aparte headertitel heeft een eigen instelling en schaalt niet dubbel.
          if(Math.abs(after.heading-old.heading)>0.1)throw Error('Header titel schaalde onbedoeld mee');
          if(unitDesktop!=='80%' || unitMobile!=='120%')
            throw Error('Waarden worden niet als percentage weergegeven: '+unitDesktop+' '+unitMobile);
          if(actualDesktop!=='0.80' || actualMobile!=='1.20')
            throw Error('Eigen sidebar krijgt geen afzonderlijke schalen');
          if(!css.includes('--pala-sidebar-ui-font-scale'))
            throw Error('Home Assistant typografie variabelen ontbreken');
          if(!s.dialog.querySelector('[data-do="pfx-save"]'))throw Error('Opslaan ontbreekt');
          s._pfxSave();
          if(s.saved.ui_style.fontScale!==80||s.saved.ui_style.mobileScale!==120)
            throw Error('Instellingen zijn niet bewaard bij het account');
          s.showSettings('ui_style');
          const restoredDesktop=s.dialog.querySelector('#pala-pfx-fontScale').value;
          const restoredMobile=s.dialog.querySelector('#pala-pfx-mobileScale').value;
          if(restoredDesktop!=='80'||restoredMobile!=='120')throw Error('Regelaars vergeten instellingen');
          return {old,after,unitDesktop,unitMobile,selectedWidth,restoredDesktop,restoredMobile};
        }""")
        wanted=1.20 if width<=700 else .80
        for field in ("label","badge","group","search"):
            measured=result["after"][field]
            baseline=result["old"][field]
            ratio=measured/baseline
            assert abs(ratio-wanted)<0.035,{"width":width,"field":field,"ratio":ratio,"wanted":wanted,"values":result}
        assert not errors,{"width":width,"errors":errors}
        resized=page.evaluate("""()=>{
          const s=window.sidebar,nav=s.shadowRoot.querySelector('.nav-label');
          return {label:Number.parseFloat(getComputedStyle(nav).fontSize),element:nav};
        }""")
        # Desktop/tablet must use desktop scale; phone uses mobile scale.
        new_width=1280 if width==390 else 390
        page.set_viewport_size({"width":new_width,"height":900})
        page.wait_for_timeout(150)
        changed=page.evaluate("""()=>{
          const s=window.sidebar;
          return Number.parseFloat(getComputedStyle(s.shadowRoot.querySelector('.nav-label')).fontSize);
        }""")
        desired=result["old"]["label"]*(1.20 if new_width<=700 else .80)
        assert abs(changed-desired)<0.6,{"width":width,"new_width":new_width,"desired":desired,"actual":changed}
        print("PASS Issue #6",width,"px ->",new_width,"px:",result["old"],"=>",result["after"],"resized label",changed)
        page.close()
    browser.close()
