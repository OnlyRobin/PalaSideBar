"""Issue #22: boven/midden/onder moet echte, bewaarde headerfoto kunnen positioneren.

De eerdere upload sneed de bron meteen tot een 3.1:1-strook. Daardoor
was er op mobiel vrijwel niets meer over om met background-position te schuiven.
Deze browsertest controleert beeldinhoud, live preview, opslaan en herstel.
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

SOURCE = (Path(__file__).resolve().parents[1] /
          "custom_components/pala_sidebar/frontend/pala-sidebar.js").read_text(encoding="utf-8")

with sync_playwright() as pw:
    browser = pw.chromium.launch(
        headless=True, executable_path="/usr/bin/chromium",
        args=["--no-sandbox", "--disable-dev-shm-usage"],
    )
    for width in (390, 768, 1280):
        page = browser.new_page(viewport={"width": width, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.set_content("<html><body></body></html>")
        page.evaluate("""src => {
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify({schema:1})});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          nav.expanded=true;nav.setAttribute('expanded','');
          ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'issue22-photo-'+window.innerWidth,name:'Test',is_admin:true},
            config:{version:'2026.10.4'},states:{},entities:{},panels:{},
            connection:{sendMessagePromise:async()=>({value:null})}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=src;document.head.append(script);
        }""", SOURCE)
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'", timeout=30000)
        page.wait_for_function("""()=>{
          const s=document.querySelector('home-assistant')?.shadowRoot
            ?.querySelector('ha-sidebar')?.querySelector('pala-sidebar');
          return !!s?._prefsStore?.ready;
        }""", timeout=20000)
        result = page.evaluate("""async () => {
          const s=document.querySelector('home-assistant').shadowRoot
            .querySelector('ha-sidebar').querySelector('pala-sidebar');
          s.showSettings('header');
          const q=id=>s.dialog.querySelector('#'+id);
          const topHeight=s.head.getBoundingClientRect().height;

          // Foto is drie keer zo hoog als breed; oude code sneed top en bottom weg.
          const canvas=document.createElement('canvas');canvas.width=300;canvas.height=900;
          const ctx=canvas.getContext('2d');
          for(const [y,color] of [[0,'#ff0000'],[300,'#00ff00'],[600,'#0000ff']]){
            ctx.fillStyle=color;ctx.fillRect(0,y,300,300);
          }
          const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
          await s._loadHeaderImage(new File([blob],'verticaal.png',{type:'image/png'}));
          if(!s._headerImageDraft?.startsWith('data:image/jpeg;base64,'))
            throw Error('Headerfoto niet geconverteerd');
          if(s._headerImageDraft.length>100000)
            throw Error('Foto groter dan opslaglimiet');
          const image=new Image();image.src=s._headerImageDraft;await image.decode();
          if(image.naturalHeight<image.naturalWidth*2.8)
            throw Error('Foto wordt nog steeds vóór positionering bijgesneden');
          const probe=document.createElement('canvas');
          probe.width=1;probe.height=3;
          const pc=probe.getContext('2d');
          for(let i=0;i<3;i++)pc.drawImage(image,
            0,Math.floor((i+.5)*image.naturalHeight/3),image.naturalWidth,1,
            0,i,1,1);
          const px=pc.getImageData(0,0,1,3).data;
          if(!(px[0]>180 && px[1]<80 && px[2]<80 &&
               px[4]<80 && px[5]>180 && px[6]<80 &&
               px[8]<80 && px[9]<80 && px[10]>180))
            throw Error('Boven/midden/onder zijn niet allemaal in opgeslagen foto aanwezig');

          const results=[];
          for(const position of ['top','center','bottom']){
            const picker=q('pala-head-image-position');
            picker.value=position;picker.dispatchEvent(new Event('change',{bubbles:true}));
            const preview=s.dialog.querySelector('.header-image-thumbnail img');
            const objectPosition=getComputedStyle(preview).objectPosition;
            if(!objectPosition.includes(position))
              throw Error('Preview volgt positie niet: '+position+' -> '+objectPosition);
            s._saveHeader();
            if(s.saved.header.image_position!==position)
              throw Error('Positie niet bewaard: '+position);
            if(!s.head.style.backgroundPosition.includes(position))
              throw Error('Header gebruikt positie niet: '+position);
            if(Math.abs(s.head.getBoundingClientRect().height-topHeight)>1.2)
              throw Error('Foto verschuift headerlayout');
            results.push({position,objectPosition,background:s.head.style.backgroundPosition});
            s.showSettings('header');
            if(q('pala-head-image-position').value!==position)
              throw Error('Positie niet hersteld in editor');
          }
          return {width:image.naturalWidth,height:image.naturalHeight,results,
            storedLength:s.saved.header.image.length};
        }""")
        assert len(result["results"]) == 3, result
        assert result["height"] >= result["width"] * 2.8, result
        assert result["storedLength"] <= 110000, result
        assert not errors, (width, errors)
        print("PASS issue #22: foto volledig, live preview, posities en opslag", width, result)
        page.close()
    browser.close()
