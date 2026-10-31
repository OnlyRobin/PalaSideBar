"""Beta3 regression: exact same section DOM/classes, computed theme style, animation.
Run: python tests/test_beta3_unified_sections.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
src=(Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text(encoding='utf-8')
fixture={'schema':1,'title':'PalaSidebar','groups':[
 {'id':'start','title':'START','items':[{'id':'home','label':'Thuis','path':'/lovelace','icon':'mdi:home'}]},
 {'id':'beheer','title':'BEHEER','items':[{'id':'int','label':'Integraties','path':'/config/integrations','icon':'mdi:puzzle'}]}]}
with sync_playwright() as pw:
    b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (320,390,768,1280):
        p=b.new_page(viewport={'width':width,'height':940},has_touch=width<600,is_mobile=width<600)
        errors=[];p.on('pageerror', lambda e:errors.append(str(e)))
        p.set_content('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>')
        p.evaluate('''args=>{
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(args.config)});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const side=document.createElement('ha-sidebar');side.attachShadow({mode:'open'});side.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          side.expanded=true;side.setAttribute('expanded','');ha.shadowRoot.append(side);document.body.append(ha);
          ha.hass=side.hass={user:{id:'beta3-admin',is_admin:true,name:'Test'},config:{version:'2026.10'},
           states:{'sensor.temp':{state:'23',attributes:{unit_of_measurement:'°C',friendly_name:'Temp'}}},panels:{},entities:{},
           connection:{sendMessagePromise:async()=>({value:null})}};
          const script=document.createElement('script');script.textContent=args.src;document.head.append(script);
        }''',{'src':src,'config':fixture})
        p.wait_for_function('window.PalaSidebarDiagnostics?.().phase === "gereed"',timeout=30000)
        for style in ['classic','glow','ios']:
          p.evaluate("style=>{const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');s.setAttribute('data-chevron-style',style)}",style)
          p.wait_for_timeout(450)  # CSS transition must settle before comparing computed colours
          result=p.evaluate('''style=>{
            const ha=document.querySelector('home-assistant'),s=ha.shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
            s.saved.live_center={enabled:true,collapsed:false,tiles:[{label:'Temperatuur',entity:'sensor.temp',icon:'mdi:thermometer'}]};
            s._buildLiveCenter();s.setAttribute('data-chevron-style',style);
            const cc=s.liveCenter,ct=cc.querySelector('.group-toggle'),arrow=ct.querySelector('.group-chevron');
            const g=s.list.querySelector('.group-toggle'),ga=g?.querySelector('.group-chevron');
            const ccBody=cc.querySelector('.group-content'),ccRow=cc.querySelector('.nav-row'),ccBtn=ccRow?.querySelector('.nav-link');
            const origBtn=s.list.querySelector('.nav-row .nav-link');
            const commonProps=el=>{
              const cs=getComputedStyle(el);
              return ['fontSize','fontWeight','borderRadius','backgroundColor','color','paddingTop','paddingBottom'].map(k=>cs[k]);
            };
            const result={sameHeaderStyle:JSON.stringify(commonProps(ct))===JSON.stringify(commonProps(g)),
              sameArrowStyle:JSON.stringify(commonProps(arrow))===JSON.stringify(commonProps(ga)),arrowOne:commonProps(arrow),arrowTwo:commonProps(ga),
              sameRowStyle:JSON.stringify(commonProps(ccBtn))===JSON.stringify(commonProps(origBtn)),
              sameArrowClasses:arrow.className===ga.className,
              noCard:getComputedStyle(cc).borderTopWidth==='0px' && getComputedStyle(cc).backgroundColor==='rgba(0, 0, 0, 0)',
              sameAnimation: getComputedStyle(ccBody).transitionDuration===getComputedStyle(s.list.querySelector('.group-content')).transitionDuration,
              noOldArrow:cc.querySelector('.pala-live-arrow')===null,
              before:ct.getAttribute('aria-expanded')};
            const tile=ccBtn;ct.click();result.collapsed=ccBody.dataset.collapsed==='true'&&ct.getAttribute('aria-expanded')==='false'&&ccBody.inert;
            result.sameTile=tile===cc.querySelector('.nav-link');ct.click();result.expanded=ccBody.dataset.collapsed==='false'&&ct.getAttribute('aria-expanded')==='true';
            return result;
          }''',style)
          assert all(result[k] for k in ["sameHeaderStyle","sameArrowStyle","sameRowStyle","sameArrowClasses","noCard","sameAnimation","noOldArrow","before","collapsed","sameTile","expanded"]),(width,style,result)
        assert not errors,(width,errors)
        print('PASS beta3 same styles/chevron/animation',width,'px')
        p.close()
    b.close()
