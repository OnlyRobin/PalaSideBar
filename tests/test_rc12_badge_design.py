"""RC12: badge palette/HA counters, background gallery and per-badge override integration."""
from pathlib import Path
from playwright.sync_api import sync_playwright

source=(Path(__file__).resolve().parents[1]/"custom_components/pala_sidebar/frontend/pala-sidebar.js").read_text(encoding="utf-8")
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path="/usr/bin/chromium",args=["--no-sandbox","--disable-dev-shm-usage"])
    for width in (390,1280):
        page=browser.new_page(viewport={"width":width,"height":850})
        errors=[]
        page.on("pageerror",lambda err:errors.append(str(err)))
        page.set_content("<html><body></body></html>")
        page.evaluate("""source=>{
          const data={schema:1,title:'PalaSidebar',groups:[{id:'start',title:'START',items:[{id:'home',label:'Verbruik',path:'/lovelace',icon:'mdi:flash'}]}]};
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(data)});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const n=document.createElement('ha-sidebar');n.attachShadow({mode:'open'});
          n.shadowRoot.innerHTML=`<slot name="main-navigation"></slot>
             <div class="panels-list"><ha-list-item-button id="sidebar-config" href="/config"><span slot="headline" class="item-text">Instellingen</span><span class="badge" slot="end">12</span></ha-list-item-button>
             <ha-list-item-button id="sidebar-notifications"><span slot="headline" class="item-text">Meldingen</span><span class="badge" slot="end">3</span></ha-list-item-button></div>`;
          n.expanded=true;n.setAttribute('expanded','');ha.shadowRoot.append(n);document.body.append(ha);
          const hass={user:{id:'rc12-design-test',name:'Tester',is_admin:true},config:{version:'2026.10.4'},
            states:{'sensor.energy':{entity_id:'sensor.energy',state:'4.2',attributes:{friendly_name:'Verbruik'}}},
            entities:{},panels:{},connection:{sendMessagePromise:async()=>({value:null})}};
          ha.hass=hass;n.hass=hass;
          const script=document.createElement('script');script.textContent=source;document.head.append(script);
        }""",source)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        page.wait_for_function("""()=>!!document.querySelector('home-assistant')?.shadowRoot?.querySelector('ha-sidebar')?.querySelector('pala-sidebar')?._prefsStore?.ready""",timeout=20000)
        result=page.evaluate("""()=>{
          const n=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar');
          const s=n.querySelector('pala-sidebar'),get=id=>s.dialog.querySelector('#pala-pfx-'+id);
          s.showSettings('ui_style');
          const options=[...get('background').options].map(e=>e.value);
          for(const value of ['ha','classic','glass','flat','solid','midnight','aurora','sunset','amoled'])
            if(!options.includes(value))throw Error('Ontbrekende achtergrond: '+value);
          const click=s.dialog.querySelector('[data-background="aurora"]');
          if(!click)throw Error('Galerij mist Aurora');
          click.click();
          if(get('background').value!=='aurora')throw Error('Galerij werkt niet');
          get('badgeMode').value='custom';get('badgeColor').value='#af22bb';get('badgeBorderWidth').value='2';
          get('badgeRadius').value='17';get('badgeGlow').value='12';get('badgeOpacity').value='65';
          get('navBorderWidth').value='1';get('navBorderColor').value='#00eeff';
          get('nativeBadgeMode').value='custom';get('nativeBadgeColor').value='#f0b400';get('nativeBadgeText').value='#171717';
          get('nativeBadgeRadius').value='14';s._pfxPreview();
          if(s.getAttribute('data-pfx-badge-custom')!=='true')throw Error('Badgepalet niet ingeschakeld');
          if(s.style.getPropertyValue('--pala-badge-fill')!=='#af22bb')throw Error('Badge kleur ontbreekt');
          if(s.style.getPropertyValue('--pala-badge-border-width')!=='2px')throw Error('Badge rand niet gezet');
          if(n.style.getPropertyValue('--pala-badge-accent')!=='#f0b400')throw Error('Native teller kleur ontbreekt');
          if(n.style.getPropertyValue('--pala-native-badge-radius')!=='14px')throw Error('Native teller radius ontbreekt');
          const root=s.shadowRoot;
          if(!root.querySelector('style[data-pala-badge-studio]'))throw Error('Shadow badge CSS ontbreekt');
          s._pfxSave();
          const saved=s.saved.ui_style;
          s.saved.badge_overrides.home={entity:'sensor.energy',color:'accent',style:'glass',border_width:3,border_radius:14,border_color:'#ff0000',badge_glow:'on'};
          s._drawList();s._refreshBadges();
          const badge=root.querySelector('[data-item-badge="home"]');
          if(!badge)throw Error('Badge ontbreekt');
          const perBadge={style:badge.dataset.style, width:badge.style.getPropertyValue('--pala-badge-border-width'),
            radius:badge.style.getPropertyValue('--pala-badge-radius'), color:badge.style.getPropertyValue('--pala-badge-border-color'),
            glow:badge.style.getPropertyValue('--pala-badge-glow')};
          s.showSettings('ui_style');
          return {options:options.length,background:saved.background,color:saved.badgeColor,
            opacity:saved.badgeOpacity,custom:saved.badgeMode,native:saved.nativeBadgeColor,
            border:saved.badgeBorderWidth,persisted:get('badgeColor').value,perBadge};
        }""")
        assert result["options"]>=9 and result["background"]=="aurora",result
        assert result["color"]=="#af22bb" and result["custom"]=="custom",result
        assert result["border"]==2 and result["opacity"]==65,result
        assert result["native"]=="#f0b400" and result["persisted"]=="#af22bb",result
        assert result["perBadge"]["style"]=="glass" and result["perBadge"]["width"]=="3px",result
        assert result["perBadge"]["radius"]=="14px" and result["perBadge"]["color"]=="#ff0000",result
        assert result["perBadge"]["glow"]!="",result
        assert not errors,(width,errors)
        print("PASS RC12 badge design",width,result)
        page.close()
    browser.close()
