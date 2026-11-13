"""Issue #22: header photo must start at top, not below native HA menu."""
from pathlib import Path
from playwright.sync_api import sync_playwright

SOURCE=(Path(__file__).resolve().parents[1] /
        "custom_components/pala_sidebar/frontend/pala-sidebar.js").read_text(encoding="utf-8")

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path="/usr/bin/chromium",
        args=["--no-sandbox","--disable-dev-shm-usage"])
    for width in (390,768,1280):
        page=browser.new_page(viewport={"width":width,"height":900})
        errors=[]
        page.on("pageerror",lambda error:errors.append(str(error)))
        page.set_content("<html><body></body></html>")
        page.evaluate("""src => {
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify({schema:1})});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.style.cssText='display:block;width:330px';
          // Replicate the actual HA frontend structure, including
          // ha-list-nav { margin-block: var(--ha-space-2) }.
          // RC5 hid .menu but neglected this independent 16px gap.
          nav.shadowRoot.innerHTML='<style>:host{display:block}.menu{display:flex;height:52px;min-height:52px;align-items:center;box-sizing:border-box;padding:10px;background:#17202a}.menu button{width:36px;height:36px}ha-list-nav{display:block;margin-block:16px}::slotted(pala-sidebar){display:block}</style><div class="menu"><button aria-label="Home Assistant menu">☰</button><span class="title">Home Assistant</span></div><div class="panels-list"><div class="wrapper"><ha-list-nav class="before-spacer"><slot name="main-navigation"></slot></ha-list-nav></div><ha-list-nav class="after-spacer"></ha-list-nav></div>';
          nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'issue22-top-gap-'+window.innerWidth,name:'Test',is_admin:true},
            config:{version:'2026.11.0'},states:{},entities:{},panels:{},
            connection:{sendMessagePromise:async()=>({value:null})}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=src;document.head.append(script);
        }""", SOURCE)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        page.wait_for_function("""()=>!!document.querySelector('home-assistant')?.shadowRoot
          ?.querySelector('ha-sidebar')?.querySelector('pala-sidebar')?._prefsStore?.ready""",timeout=20000)
        result=page.evaluate("""() => {
          const nav=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar');
          const s=nav.querySelector('pala-sidebar'),menu=nav.shadowRoot.querySelector('.menu');
          const navList=nav.shadowRoot.querySelector('ha-list-nav.before-spacer');
          const fixedList=nav.shadowRoot.querySelector('ha-list-nav.after-spacer');
          const navMargin=()=>parseFloat(getComputedStyle(navList).marginBlockStart);
          if(s.integration!=='native')throw Error('Native HA sidebar not mounted');
          const canvas=document.createElement('canvas');canvas.width=400;canvas.height=900;
          const ctx=canvas.getContext('2d');
          for(const [top,col] of [[0,'#ed2222'],[300,'#22ed22'],[600,'#2222ed']]){
            ctx.fillStyle=col;ctx.fillRect(0,top,400,300);
          }
          const photo=canvas.toDataURL('image/jpeg',0.65);
          const head=()=>s.head.getBoundingClientRect();
          const relativeLogo=()=>s.head.querySelector('.logo').getBoundingClientRect().top-head().top;
          const menuVisible=()=>getComputedStyle(menu).display!=='none';
          const normal={...s._header(),ha:'normal',pala:'compact',image:'',image_position:'top',
            image_edge_to_edge:true};
          s.saved.header=normal;s.redraw();
          if(!menuVisible())throw Error('Normal native HA menu unexpectedly hidden');
          const before={headTop:head().top,headHeight:head().height,logoY:relativeLogo()};
          if(before.headTop-nav.getBoundingClientRect().top<65 || navMargin()!==16)
            throw Error('Fixture must include original 52px menu and 16px navigation top margin');

          s.saved.header={...normal,image:photo};s.redraw();
          if(menuVisible())throw Error('Photo did not remove native HA menu gap');
          if(s._effectiveHaHeader()!=='hidden')throw Error('Wrong effective HA header mode');
          if(s.head.dataset.headerPicture!=='true'||!s.head.style.backgroundImage.includes('data:image/jpeg;base64,'))
            throw Error('Header photo missing');
          const after={headTop:head().top,headHeight:head().height,logoY:relativeLogo()};
          if(Math.abs(after.headTop-nav.getBoundingClientRect().top)>2)
            throw Error('Gap still exists above photo: '+JSON.stringify(after));
          if(navMargin()!==0)throw Error('HA before-spacer margin not eliminated: '+navMargin());
          if(parseFloat(getComputedStyle(fixedList).marginBlockStart)!==16)
            throw Error('Native fixed navigation margin was modified');
          if(Math.abs(before.headHeight-after.headHeight)>1.2||
             Math.abs(before.logoY-after.logoY)>1.2)
            throw Error('Issue17 regression: photo shifted header layout');
          if(!s.head.querySelector('[data-do="ha-menu"]'))
            throw Error('Native menu toggle not retained in PalaSidebar');
          if(!s.head.style.backgroundPosition.includes('top'))
            throw Error('Original photo positioning changed');

          s.showSettings('header');
          const box=s.dialog.querySelector('#pala-head-image-edge');
          if(!box?.checked)throw Error('Edge-to-edge option absent/not selected');
          box.checked=false;s._saveHeader();
          if(!menuVisible()||s.saved.header.image_edge_to_edge!==false || navMargin()!==16)
            throw Error('Disabling edge-to-edge did not restore native top bar AND its margin');
          s.showSettings('header');
          const again=s.dialog.querySelector('#pala-head-image-edge');
          if(again.checked)throw Error('Edge-to-edge setting did not persist');
          again.checked=true;s._saveHeader();
          if(menuVisible()||navMargin()!==0)throw Error('Re-enabling edge-to-edge did not remove gap');
          if(s.saved.header.ha!=='normal')
            throw Error('Original native HA header preference was overwritten');
          s.saved.header={...s.saved.header,image:''};s.redraw();
          if(!menuVisible()||s._effectiveHaHeader()!=='normal'||navMargin()!==16)
            throw Error('Original HA header and top spacing did not return after photo removal');
          s.saved.header={...normal,pala:'hidden',image:photo};s.redraw();
          if(!menuVisible()||navMargin()!==16)throw Error('Both headers hidden with no menu or spacing');
          return {width:window.innerWidth,gapBefore:Math.round(before.headTop-nav.getBoundingClientRect().top),
            gapAfter:Math.round(after.headTop-nav.getBoundingClientRect().top),
            heightBefore:before.headHeight,heightAfter:after.headHeight,settingPersisted:true};
        }""")
        assert result["gapBefore"]>=65 and abs(result["gapAfter"])<=2,result
        assert abs(result["heightBefore"]-result["heightAfter"])<=1.2,result
        assert not errors,(width,errors)
        print("PASS issue22 native HA gap and photo edge-to-edge",result)
        page.close()
    browser.close()
