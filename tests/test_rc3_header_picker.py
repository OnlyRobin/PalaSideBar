"""RC3: header-entiteitenkiezer en attribuutselectie; mobiel en desktop."""
from pathlib import Path
from playwright.sync_api import sync_playwright

src=(Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text(encoding='utf-8')
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (390,1280):
        page=browser.new_page(viewport={'width':width,'height':900})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.set_content('<html><body></body></html>')
        page.evaluate("""src => {
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify({schema:1})});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const states={
            'sensor.f1_race':{state:'Zondag',attributes:{friendly_name:'F1 volgende race',race_name:'Mexico GP',countdown:1800,unit_of_measurement:'s'}},
            'sensor.woonkamer':{state:'21.5',attributes:{friendly_name:'Woonkamer temperatuur',unit_of_measurement:'°C'}}
          };
          const hass={user:{id:'rc3-admin',is_admin:true,name:'Test'},config:{version:'2026.10'},
            states,entities:{},panels:{},callService:()=>Promise.resolve(),
            connection:{sendMessagePromise:async req=>req.type==='frontend/get_user_data'?{value:null}:{}}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=src;document.head.append(script);
        }""",src)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        data=page.evaluate("""()=>{
          const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          s.showSettings('header');
          const d=s.dialog;
          const picker=d.querySelector('#pala-head-token-entity');
          picker.value='F1 volgende';picker.dispatchEvent(new Event('input',{bubbles:true}));
          const matching=[...d.querySelectorAll('[data-do="choose-entity"]')].find(b=>b.dataset.entity==='sensor.f1_race');
          if(!matching)throw Error('Geen zoeksuggestie voor sensor.f1_race');
          matching.click();
          const attr=d.querySelector('#pala-head-token-attribute');
          const attrs=[...attr.options].map(o=>o.value);
          if(!attrs.includes('race_name')||!attrs.includes('countdown'))throw Error('Attributen ontbreken');
          attr.value='race_name';attr.dispatchEvent(new Event('change',{bubbles:true}));
          d.querySelector('#pala-head-token-target').value='extra';
          d.querySelector('[data-do="head-token-insert"]').click();
          const added=d.querySelector('#pala-head-extra').value;
          const preview=d.querySelector('#pala-head-token-preview').textContent;
          d.querySelector('[data-do="save-header"]').click();
          const saved=s.saved.header.extra;
          s._refreshHeaderText();
          const rendered=s.headerExtra.textContent;
          s.showSettings('header');
          const restored=d.querySelector('#pala-head-extra').value;
          // Controleer of dezelfde picker op andere sensorplaatsen aanwezig is.
          s._showEditorTab('badges');
          const badgePicker=d.querySelector('#pala-badge-entity');
          const badgeSearch=!!badgePicker?.dataset.entityPicker;
          const badgeOpen=!!d.querySelector('[data-do="entity-picker-open"][data-field="pala-badge-entity"]');
          // Veilig gedrag: ongeldige entity-ID niet invoegen en bestaande waarde bewaren.
          s._showEditorTab('header');
          d.querySelector('#pala-head-token-entity').value='ongeldig';
          s._insertHeaderToken();
          const safe=d.querySelector('#pala-head-extra').value===restored;
          return {added,preview,saved,rendered,restored,attrs,badgeSearch,badgeOpen,safe,version:window.PalaSidebarDiagnostics().version};
        }""")
        assert data['added']=='{sensor.f1_race#race_name}',data
        assert data['saved']==data['restored']==data['added'],data
        assert data['rendered']=='Mexico GP',data
        assert data['preview']=='Voorbeeld: Mexico GP',data
        assert data['badgeSearch'] and data['badgeOpen'] and data['safe'],data
        assert data['version']=='2.0.0-rc10',data
        assert not errors,errors
        print('PASS RC3 sensor zoeken, attributen, opslag en veilig invoegen',width,'px')
        page.close()
    browser.close()
