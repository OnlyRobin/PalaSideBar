"""RC4: visual color picker + HEX sync, optional theme colors, safe saving."""
from pathlib import Path
from playwright.sync_api import sync_playwright

src=(Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text(encoding='utf-8')
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (390, 768, 1280):
        page=browser.new_page(viewport={'width':width,'height':900})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.set_content('<html><body></body></html>')
        page.evaluate("""src => {
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify({schema:1})});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'rc4-test',is_admin:true,name:'Tester'},config:{version:'2026.10'},
            states:{},entities:{},panels:{},callService:()=>Promise.resolve(),
            connection:{sendMessagePromise:async req=>req.type==='frontend/get_user_data'?{value:null}:{}}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=src;document.head.append(script);
        }""",src)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        data=page.evaluate("""()=>{
          const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          const d=s.dialog, event=name=>new Event(name,{bubbles:true});
          const q=id=>d.querySelector('#'+id);
          s.showSettings('general');
          const initial={hex:q('pala-color-hex')?.value,picker:q('pala-color')?.value};
          if(initial.hex!=='#38bdf8'||initial.picker!==initial.hex)throw Error('Algemeen begon niet met bestaande kleur');
          q('pala-color').value='#e23377';q('pala-color').dispatchEvent(event('input'));
          const fromPicker=q('pala-color-hex').value;
          q('pala-color-hex').value='#3366CC';q('pala-color-hex').dispatchEvent(event('input'));
          const fromHex=q('pala-color').value;
          const previewText=q('pala-general-accent-preview')?.querySelector('span')?.textContent;
          const notSavedYet=s.saved.accent!==fromHex;
          s._saveDialog();
          const saved=s.saved.accent;
          s.showSettings('header');
          const fields=['title-color','subtitle-color','extra-color','background-color','logo-bg','logo-color','clock-color'];
          const allPresent=fields.every(id=>q('pala-head-'+id)?.type==='color'&&q('pala-head-'+id+'-hex')?.type==='text');
          const emptyBefore=fields.every(id=>q('pala-head-'+id+'-hex')?.value==='');
          const initialTitle=s.saved.header?.title_color||'';
          q('pala-head-title-color').value='#112233';
          q('pala-head-title-color').dispatchEvent(event('input'));
          const headerFromPicker=q('pala-head-title-color-hex').value;
          q('pala-head-logo-bg-hex').value='#77AA22';
          q('pala-head-logo-bg-hex').dispatchEvent(event('input'));
          const headerFromHex=q('pala-head-logo-bg').value;
          q('pala-head-clock-color-hex').value='#zzzzzz';
          q('pala-head-clock-color-hex').dispatchEvent(event('input'));
          s._saveHeader();
          const invalidBlocked=(s.saved.header?.title_color||'')===initialTitle &&
            q('pala-head-clock-color-hex').getAttribute('aria-invalid')==='true';
          const reset=q('pala-head-clock-color-hex').closest('.optional-color-field').querySelector('[data-do="optional-color-clear"]');
          reset.click();
          const invalidCleared=q('pala-head-clock-color-hex').value==='' &&
            q('pala-head-clock-color-hex').getAttribute('aria-invalid')==='false';
          s._saveHeader();
          const headerSaved={title:s.saved.header.title_color,logo:s.saved.header.logo_bg,clock:s.saved.header.clock_color,
            subtitle:s.saved.header.subtitle_color};
          s.showSettings('header');
          const restored=q('pala-head-title-color-hex').value;
          q('pala-head-title-color-hex').closest('.optional-color-field')
            .querySelector('[data-do="optional-color-clear"]').click();
          s._saveHeader();
          const autoRestored=s.saved.header.title_color==='';
          s.showSettings('badges');
          const badgeUnchanged=!!q('pala-badge-custom_color') &&
            !!q('pala-badge-custom_color-hex');
          return {initial,fromPicker,fromHex,previewText,notSavedYet,saved,
            allPresent,emptyBefore,headerFromPicker,headerFromHex,invalidBlocked,
            invalidCleared,headerSaved,restored,autoRestored,badgeUnchanged,
            version:window.PalaSidebarDiagnostics().version};
        }""")
        assert data['initial']=={'hex':'#38bdf8','picker':'#38bdf8'},data
        assert data['fromPicker']=='#e23377' and data['fromHex']=='#3366cc',data
        assert data['previewText']=='#3366CC' and data['notSavedYet'],data
        assert data['saved']=='#3366cc',data
        assert data['allPresent'] and data['emptyBefore'],data
        assert data['headerFromPicker']=='#112233' and data['headerFromHex']=='#77aa22',data
        assert data['invalidBlocked'] and data['invalidCleared'],data
        assert data['headerSaved']=={'title':'#112233','logo':'#77aa22','clock':'','subtitle':''},data
        assert data['restored']=='#112233' and data['autoRestored'],data
        assert data['badgeUnchanged'] and data['version']=='2.0.0-rc8',data
        assert not errors,errors
        print('PASS RC4 kleurenkiezer Algemeen/Header, bewaren, wissen, validatie, badges',width,'px')
        page.close()
    browser.close()
