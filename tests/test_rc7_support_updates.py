"""RC7: privacyvriendelijk GitHub-bugformulier, lokale zelftest en RC-updatemelding."""
from pathlib import Path
from playwright.sync_api import sync_playwright

src=(Path(__file__).resolve().parents[1]/"custom_components/pala_sidebar/frontend/pala-sidebar.js").read_text(encoding="utf-8")

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path="/usr/bin/chromium",
      args=["--no-sandbox","--disable-dev-shm-usage"])
    for width in (390,768,1280):
        page=browser.new_page(viewport={"width":width,"height":900})
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.set_content("<html><body></body></html>")
        page.evaluate("""src=>{
          window.__opens=[];
          window.open=(url)=>{window.__opens.push(url);return {};};
          window.__requests=[];
          window.fetch=async (url,options={})=>{
            window.__requests.push({url:String(url),credentials:options.credentials||''});
            if(String(url).startsWith('https://api.github.com/')){
              return {ok:true,text:async()=>JSON.stringify([
                {tag_name:'v2.0.0-rc11',prerelease:true,draft:false},
                {tag_name:'v2.0.0-rc7',prerelease:true,draft:false},
                {tag_name:'v2.0.0-rc5',prerelease:true,draft:false}
              ])};
            }
            return {ok:true,text:async()=>JSON.stringify({schema:1})};
          };
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          nav.expanded=true;nav.setAttribute('expanded','');ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'private-ha-test',name:'Private User',is_admin:true},
            config:{version:'2026.10'},states:{'sensor.private_temperature':{state:'12345 SECRET',attributes:{}}},
            entities:{},panels:{},connection:{sendMessagePromise:async ()=>({value:null})}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=src;document.head.append(script);
        }""",src)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        page.wait_for_function("""()=>!!document.querySelector('home-assistant')?.shadowRoot?.querySelector('ha-sidebar')?.querySelector('pala-sidebar')?._prefsStore?.ready""",timeout=20000)
        result=page.evaluate("""async ()=>{
          const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          s.showSettings('diagnostic');
          const d=s.dialog;
          const test=s._supportTest();
          if(test.length<5||!d.querySelector('#pala-selftest-results')?.textContent.includes('PalaSidebar geladen'))throw Error('Zelftest ontbreekt');
          d.querySelector('#pala-issue-title').value='Terugknop defect';
          d.querySelector('#pala-issue-description').value='Sidebar sluit niet';
          d.querySelector('#pala-issue-steps').value='1. Open sidebar; 2. Druk terug';
          const preview=s._supportPreview();
          if(preview.body.includes('12345 SECRET')||preview.body.includes('private-ha-test')||preview.body.includes('private_temperature'))throw Error('Privégegevens lekken');
          s._supportSubmit();
          if(window.__opens.length)throw Error('Issue geopend zonder toestemming');
          d.querySelector('#pala-issue-consent').checked=true;
          s._supportSubmit();
          if(window.__opens.length!==1||!window.__opens[0].startsWith('https://github.com/OnlyRobin/PalaSideBar/issues/new?'))
            throw Error('Geen GitHub issue formulier');
          const u=new URL(window.__opens[0]);
          if(!u.searchParams.get('body').includes('Sidebar sluit niet'))throw Error('Geen issue inhoud');
          await s._checkRcUpdates(true);
          if(s._rcCheck.latest!=='v2.0.0-rc11'||s.rcNotice.hidden)throw Error('RC8 update niet herkend');
          if(!window.__requests.some(x=>x.url.includes('/releases?per_page=15')&&x.credentials==='omit'))throw Error('GitHub verzoek niet geanonimiseerd');
          s._click({target:{closest:()=>({dataset:{do:'rc-dismiss-update'}})}});
          if(!s.rcNotice.hidden)throw Error('Later verbergen mislukt');
          const before=window.__requests.length;
          await s._checkRcUpdates();
          if(window.__requests.length!==before)throw Error('Te vaak updatecontrole');
          return {tests:test.length,issue:window.__opens[0],latest:s._rcCheck.latest,version:window.PalaSidebarDiagnostics().version};
        }""")
        assert result["tests"]>=5 and result["version"]=="2.0.0-rc10",result
        assert not errors,{"width":width,"errors":errors}
        print("PASS RC7 zelftest, issue privacy, toestemming, release check en cache",width)
        page.close()
    browser.close()
