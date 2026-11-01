"""Issue #16: updatebericht en sectiekaarten mogen de native iconenrail niet oprekken."""
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
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify({schema:1,title:'PalaSidebar',
            groups:[{id:'start',title:'START',items:[{id:'cv',label:'CV',path:'/lovelace',icon:'mdi:fire'}]}]})});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'issue16-rail-test',name:'Tester',is_admin:true},
            config:{version:'2026.10.4'},states:{},entities:{},panels:{},
            connection:{sendMessagePromise:async()=>({value:null})}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=src;document.head.append(script);
        }""",source)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        page.wait_for_function("""()=>!!document.querySelector('home-assistant')?.shadowRoot?.querySelector('ha-sidebar')?.querySelector('pala-sidebar')?._prefsStore?.ready""",timeout=20000)
        page.evaluate("""()=>{
          const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          window.issue16=s;
          if(s.getAttribute('data-integration')!=='native')throw Error('Native integratie vereist');
          s.showSettings('ui_style');
          const get=id=>s.dialog.querySelector('#pala-pfx-'+id);
          get('sectionMode').value='glass';
          get('sectionBorderWidth').value='3';
          get('sectionPadding').value='12';
          get('sectionGap').value='9';
          s._pfxPreview();
          s._rcCheck.latest='v2.0.0-rc.15';
          s._rcCheck.channel='rc';
          s._paintRcNotice();
          if(s.rcNotice.hidden||!s.rcNotice.textContent.includes('rc.15'))throw Error('Updatebericht ontbreekt');
        }""")
        def styles():
            return page.evaluate("""()=>{
              const s=window.issue16,frame=s.list.querySelector('.section-frame'),notice=s.rcNotice;
              if(!frame)throw Error('Sectieframe ontbreekt');
              const f=getComputedStyle(frame),n=getComputedStyle(notice);
              return {compact:s.getAttribute('data-compact'),noticeHidden:notice.hidden,
                text:notice.textContent,visibility:n.visibility,maxHeight:n.maxHeight,
                noticePadding:n.paddingTop,noticeBorder:n.borderTopWidth,
                border:f.borderTopWidth,padding:f.paddingTop,margin:f.marginBottom,
                background:f.backgroundColor};
            }""")
        # Het sectieframe animeert zijn padding; meet pas na de overgang.
        page.wait_for_timeout(550)
        opened=styles()
        assert opened["border"]=="3px" and opened["padding"]=="12px",opened
        assert opened["visibility"]=="visible" and not opened["noticeHidden"],opened
        page.evaluate("""()=>{
          const s=window.issue16,nav=s.native;
          s.saved.device='desktop';nav.expanded=false;nav.removeAttribute('expanded');
          s._compactSync();
        }""")
        page.wait_for_timeout(550)
        collapsed=styles()
        assert collapsed["visibility"]=="hidden" and collapsed["maxHeight"]=="0px",collapsed
        assert collapsed["noticePadding"]=="0px" and collapsed["noticeBorder"]=="0px",collapsed
        assert collapsed["border"]=="0px" and collapsed["padding"]=="0px" and collapsed["margin"]=="0px",collapsed
        assert "rc.15" in collapsed["text"] and not collapsed["noticeHidden"],collapsed
        page.evaluate("""()=>{
          const s=window.issue16,nav=s.native;
          nav.expanded=true;nav.setAttribute('expanded','');
          s._compactSync();
        }""")
        page.wait_for_timeout(550)
        reopened=styles()
        assert reopened["border"]=="3px" and reopened["padding"]=="12px",reopened
        assert reopened["visibility"]=="visible" and "rc.15" in reopened["text"],reopened
        assert not errors,(width,errors)
        print("PASS issue #16: updatebericht en sectieranden verdwijnen en keren terug",width)
        page.close()
    browser.close()
