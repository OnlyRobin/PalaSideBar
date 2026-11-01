"""RC5: afbeelding in PalaSidebar-header, mobiel/desktop, opslag en herstel."""
from pathlib import Path
from playwright.sync_api import sync_playwright

source=(Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text(encoding='utf-8')
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (390,1280):
        page=browser.new_page(viewport={'width':width,'height':900})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content('<html><body></body></html>')
        page.evaluate("""src=>{
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify({schema:1})});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'rc5-image-test',name:'Test',is_admin:true},config:{version:'2026.10'},
            states:{},entities:{},panels:{},callService:()=>Promise.resolve(),
            connection:{sendMessagePromise:async req=>req.type==='frontend/get_user_data'?{value:null}:{}}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=src;document.head.append(script);
        }""",source)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        page.evaluate("""async ()=>{
          const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          window.testSidebar=s;s.showSettings('header');
          if(!s.dialog.querySelector('#pala-head-image-file'))throw Error('Bestandkiezer ontbreekt');
          if(s.dialog.querySelector('.header-image-thumbnail img'))throw Error('Foto staat al aan');
          const canvas=document.createElement('canvas');canvas.width=800;canvas.height=240;
          const ctx=canvas.getContext('2d');
          ctx.fillStyle='#244566';ctx.fillRect(0,0,800,240);
          ctx.fillStyle='#edc288';ctx.fillRect(0,0,800,80);
          const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
          const transfer=new DataTransfer();
          transfer.items.add(new File([blob],'mijn-header.png',{type:'image/png'}));
          const input=s.dialog.querySelector('#pala-head-image-file');
          input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
        }""")
        page.wait_for_function("window.testSidebar._headerImageBusy===false && !!window.testSidebar._headerImageDraft",timeout=15000)
        result=page.evaluate("""()=>{
          const s=window.testSidebar,d=s.dialog,q=id=>d.querySelector('#'+id);
          const preview=!!d.querySelector('.header-image-thumbnail img');
          const before=s.saved.header?.image||'';
          q('pala-head-title').value='Mijn huis';q('pala-head-image-position').value='bottom';
          d.querySelector('[data-do="save-header"]').click();
          const after=s.saved.header.image;
          const actual=!!s.head.style.backgroundImage.includes('data:image/jpeg;base64,');
          const position=s.head.style.backgroundPosition;
          s.showSettings('header');
          const restored=!!d.querySelector('.header-image-thumbnail img');
          d.querySelector('[data-do="header-image-remove"]').click();
          const removedPreview=!d.querySelector('.header-image-thumbnail img');
          const remainsBeforeSave=!!s.saved.header.image;
          d.querySelector('[data-do="save-header"]').click();
          const removed=s.saved.header.image===''&&s.head.dataset.headerPicture==='false';
          return {preview,before,afterLength:after.length,actual,position,restored,removedPreview,remainsBeforeSave,removed,
            title:s.saved.header.title,version:window.PalaSidebarDiagnostics().version};
        }""")
        assert result['preview'] and result['before']=='' and 0<result['afterLength']<=110000,result
        assert result['actual'] and result['position'] in ('bottom','center bottom') and result['restored'],result
        assert result['removedPreview'] and result['remainsBeforeSave'] and result['removed'],result
        assert result['title']=='Mijn huis' and result['version']=='2.0.0-rc6',result
        assert not errors,errors
        print('PASS RC5 foto upload/uitsnede/opslaan/terugzetten/geen regressie',width,'px')
        page.close()
    browser.close()
