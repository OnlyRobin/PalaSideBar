"""Issue #17: headerfoto is alleen achtergrond, nooit een verticale layoutverschuiving."""
from pathlib import Path
from playwright.sync_api import sync_playwright

source=(Path(__file__).resolve().parents[1]/"custom_components/pala_sidebar/frontend/pala-sidebar.js").read_text(encoding="utf-8")
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path="/usr/bin/chromium",
        args=["--no-sandbox","--disable-dev-shm-usage"])
    for width in (390,1280):
        page=browser.new_page(viewport={"width":width,"height":900})
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.set_content("<html><body></body></html>")
        page.evaluate("""src=>{
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify({schema:1,title:'PalaSidebar'})});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'issue17-image-test',name:'Tester',is_admin:true},
            config:{version:'2026.10.4'},states:{},entities:{},panels:{},
            connection:{sendMessagePromise:async()=>({value:null})}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=src;document.head.append(script);
        }""",source)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        page.wait_for_function("""()=>!!document.querySelector('home-assistant')?.shadowRoot?.querySelector('ha-sidebar')?.querySelector('pala-sidebar')?._prefsStore?.ready""",timeout=20000)
        result=page.evaluate("""()=>{
          const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          const canvas=document.createElement('canvas');canvas.width=500;canvas.height=160;
          const ctx=canvas.getContext('2d');ctx.fillStyle='#244566';ctx.fillRect(0,0,500,160);
          const photo=canvas.toDataURL('image/jpeg',0.6);
          const measure=()=>{
            const top=s.head.getBoundingClientRect(),logo=s.head.querySelector('.logo').getBoundingClientRect();
            const settings=s.head.querySelector('.top-settings').getBoundingClientRect();
            const css=getComputedStyle(s.head);
            return {height:top.height,padding:css.paddingTop,align:css.alignItems,
              logoY:logo.top-top.top,settingsY:settings.top-top.top};
          };
          const differences=[];
          for(const mode of ['normal','compact','minimal','app']){
            for(const collapsed of [false,true]){
              s.saved.header={...s._header(),pala:mode,image:''};
              s.redraw();s.setAttribute('data-compact',String(collapsed));
              const before=measure();
              s.saved.header={...s.saved.header,image:photo};
              s.redraw();s.setAttribute('data-compact',String(collapsed));
              const after=measure();
              if(s.head.dataset.headerPicture!=='true'||!s.head.style.backgroundImage.includes('data:image/jpeg;base64,'))
                throw Error('Foto wordt niet meer als achtergrond getoond');
              for(const key of ['height','logoY','settingsY']){
                if(Math.abs(before[key]-after[key])>1.2)
                  throw Error(mode+' '+collapsed+' '+key+' verspringt: '+before[key]+' -> '+after[key]);
              }
              if(before.padding!==after.padding||before.align!==after.align)
                throw Error('Header layout gewijzigd door foto: '+mode);
              differences.push({mode,collapsed,before,after});
            }
          }
          return {checks:differences.length,photoLength:photo.length};
        }""")
        assert result["checks"]==8 and result["photoLength"]>100,result
        assert not errors,(width,errors)
        print("PASS issue #17: foto verschuift headerinhoud niet",width,result)
        page.close()
    browser.close()
