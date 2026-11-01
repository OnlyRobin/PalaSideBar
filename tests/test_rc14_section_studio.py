"""RC14: complete section borders, item styling, collapse and organised settings."""
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
        page.evaluate("""source=>{
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify({
            schema:1,title:'PalaSidebar',groups:[
              {id:'start',title:'START',items:[
                {id:'cv',label:'CV Verwarmen',path:'/lovelace',icon:'mdi:fire'},
                {id:'grid',label:'Netafname',path:'/energy',icon:'mdi:flash'}]},
              {id:'beheer',title:'BEHEER',items:[
                {id:'settings',label:'Mijn agenda',path:'/calendar',icon:'mdi:calendar'}]}
            ]})});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'rc14-section-tests',name:'Tester',is_admin:true},config:{version:'2026.10.4'},
            states:{},entities:{},panels:{},connection:{sendMessagePromise:async()=>({value:null})}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=source;document.head.append(script);
        }""",source)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        page.wait_for_function("""()=>!!document.querySelector('home-assistant')?.shadowRoot?.querySelector('ha-sidebar')?.querySelector('pala-sidebar')?._prefsStore?.ready""",timeout=20000)
        result=page.evaluate("""()=>{
          const nav=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar');
          const s=nav.querySelector('pala-sidebar'),root=s.shadowRoot;
          const get=id=>s.dialog.querySelector('#pala-pfx-'+id);
          const before=[...s.list.querySelectorAll('.section-frame')].map(el=>el.dataset.sectionId);
          if(!before.includes('start')||!before.includes('beheer'))throw Error('START/BEHEER missen sectieframe: '+before);
          const start=s.list.querySelector('.section-frame[data-section-id="start"]');
          if(!start.querySelector(':scope > .group-title')||!start.querySelector(':scope > .group-content'))
            throw Error('Header en inhoud horen in hetzelfde frame');
          const toggle=start.querySelector('.group-toggle');
          toggle.click();
          if(start.querySelector('.group-content').dataset.collapsed!=='true')throw Error('Inklappen werkt niet');
          toggle.click();
          if(start.querySelector('.group-content').dataset.collapsed!=='false')throw Error('Uitklappen werkt niet');
          s.showSettings('ui_style');
          const cats=[...s.dialog.querySelectorAll('[data-do="editor-category"]')].map(x=>x.dataset.category);
          if(cats.join(',')!=='basis,menu,vormgeving,beheer')throw Error('Hoofdcategorieën missen: '+cats);
          const visible=()=>[...s.dialog.querySelectorAll('[data-do="editor-tab"]:not([hidden])')].map(e=>e.dataset.tab);
          if(!visible().includes('ui_style')||visible().includes('diagnostic'))throw Error('Vormgevinggroep is niet correct geselecteerd');
          if(!s.dialog.querySelector('#pala-pfx-sectionMode'))throw Error('Sectie Design Studio ontbreekt');
          if(!s.dialog.querySelector('#pala-pfx-section-preview'))throw Error('Live sectievoorbeeld ontbreekt');
          get('sectionMode').value='glass';get('sectionBorderStyle').value='dashed';get('sectionBorderColor').value='#af22bb';
          get('sectionBorderWidth').value='3';get('sectionRadius').value='21';get('sectionPadding').value='11';
          get('sectionGap').value='12';get('sectionBgColor').value='#163548';get('sectionBgOpacity').value='55';
          get('sectionGlow').value='8';get('sectionTitleColorMode').value='custom';get('sectionTitleColor').value='#ffff00';
          get('sectionTitleSize').value='15';get('sectionHeaderColor').value='#203e50';get('sectionHeaderOpacity').value='40';
          get('navBorderWidth').value='2';get('navBorderColor').value='#123abc';
          get('itemRadius').value='13';get('itemPadding').value='11';get('itemGap').value='7';
          get('itemBgColor').value='#113355';get('itemBgOpacity').value='50';get('itemActiveBorderColor').value='#f13286';
          s._pfxPreview();
          const frameStyle=getComputedStyle(start),headerStyle=getComputedStyle(start.querySelector('.group-toggle'));
          const itemStyle=getComputedStyle(start.querySelector('.nav-row'));
          const innerStyle=getComputedStyle(start.querySelector('.group-content-inner'));
          if(s.getAttribute('data-pfx-section-mode')!=='glass')throw Error('Glasmodus niet geactiveerd');
          if(frameStyle.borderTopWidth!=='3px')throw Error('Sectierand niet toegepast '+frameStyle.borderTopWidth);
          if(frameStyle.borderTopStyle!=='dashed')throw Error('Randstijl niet toegepast '+frameStyle.borderTopStyle);
          if(frameStyle.borderTopColor!=='rgb(175, 34, 187)')throw Error('Randkleur niet toegepast '+frameStyle.borderTopColor);
          if(frameStyle.borderTopLeftRadius!=='21px')throw Error('Sectieradius niet toegepast');
          if(itemStyle.borderTopWidth!=='2px')throw Error('Itemrand niet toegepast: '+itemStyle.borderTopWidth);
          if(innerStyle.gap!=='7px')throw Error('Itemafstand niet toegepast: '+innerStyle.gap);
          if(!s.dialog.querySelector('#pala-pfx-section-card'))throw Error('Sectievoorbeeld ontbreekt');
          s._pfxSave();
          const saved=s.saved.ui_style;
          s.showSettings('ui_style');
          if(get('sectionMode').value!=='glass'||get('itemRadius').value!=='13')throw Error('Opgeslagen stijl komt niet terug');
          const categories={
            basis:['general','header','quick'],
            menu:['layout','menu','actions','sensors','agenda','live_center'],
            vormgeving:['themes','design','ui_style','badges'],
            beheer:['diagnostic','performance','backup']
          };
          for(const [id,expected] of Object.entries(categories)){
            s.dialog.querySelector('[data-do="editor-category"][data-category="'+id+'"]').click();
            if(visible().join(',')!==expected.join(','))throw Error('Categorie '+id+' wijkt af: '+visible());
            if(s.editorTab!==expected[0])throw Error('Categorie '+id+' opent verkeerde tab: '+s.editorTab);
          }
          // Reset to a known previous tab and make sure full page persistence isn't lost.
          s.showSettings('ui_style');
          return {before,border:saved.sectionBorderWidth,style:saved.sectionMode,
            color:saved.sectionBorderColor,radius:saved.sectionRadius,itemRadius:saved.itemRadius,
            itemGap:saved.itemGap,display:frameStyle.borderTopStyle,titleColor:headerStyle.color,
            tabs:s.dialog.querySelectorAll('[data-editor-page]').length};
        }""")
        assert result["border"]==3 and result["style"]=="glass",result
        assert result["radius"]==21 and result["itemRadius"]==13 and result["itemGap"]==7,result
        assert result["color"]=="#af22bb" and result["tabs"]==16,result
        assert not errors,(width,errors)
        print("PASS RC14 sectiekaarten en gegroepeerde instellingen",width,result)
        page.close()
    browser.close()
