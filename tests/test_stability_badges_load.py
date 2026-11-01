"""Stabiele kandidaat: beperkte headless stresstest met 120 live badges.

Meet geen echte tabletprestaties, maar voorkomt dat iedere sensortik de
navigatiestructuur opnieuw opbouwt of JavaScript-fouten veroorzaakt.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

source=(Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text(encoding='utf-8')

items=[]
states={}
for i in range(120):
    name=f"sensor.f1_countdown_{i}" if i<12 else f"sensor.meting_{i}"
    items.append({"id":f"item-{i}","label":f"Sensor {i}","path":f"/lovelace/sensor-{i}","icon":"mdi:thermometer",
                  "badge":{"entity":name,"color":"accent","format":"clock" if i<12 else "number"}})
    states[name]={"entity_id":name,"state":"0d 0h 14m 30s" if i<12 else str(20+i/100),
                  "last_changed":"2026-11-01T00:00:00Z","attributes":{"unit_of_measurement":"°C"}}
groups=[{"id":"metingen","title":"METINGEN","items":items[:80]},
        {"id":"f1","title":"F1 LIVE","items":items[80:]}]
config={"schema":1,"title":"Test onder belasting","groups":groups}
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path="/usr/bin/chromium",args=["--no-sandbox","--disable-dev-shm-usage"])
    for width in (390,768,1280):
        page=browser.new_page(viewport={"width":width,"height":900})
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.set_content("<html><body></body></html>")
        page.evaluate("""data=>{
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(data.config)});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const nav=document.createElement('ha-sidebar');nav.attachShadow({mode:'open'});
          nav.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          nav.expanded=true;nav.setAttribute('expanded','');ha.shadowRoot.append(nav);document.body.append(ha);
          const hass={user:{id:'f1-stress',name:'Test',is_admin:true},config:{version:'2026.10'},
            states:data.states,entities:{},panels:{},
            connection:{sendMessagePromise:async req=>({value:null})}};
          ha.hass=hass;nav.hass=hass;
          const script=document.createElement('script');script.textContent=data.source;document.head.append(script);
        }""",{"source":source,"config":config,"states":states})
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
        result=page.evaluate("""()=>{
          const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          const before=s._perf.listDraws;
          const badgeCount=s._activeBadges?.length||0;
          const tickCount=s._activeTickBadges?.length||0;
          const beforeText=s._activeTickBadges?.[0]?.node?.textContent||'';
          const times=[],ticks=[];
          for(let j=0;j<75;j++){
            let t=performance.now();s.refreshStatus();times.push(performance.now()-t);
            t=performance.now();s._refreshBadges(true);ticks.push(performance.now()-t);
          }
          times.sort((a,b)=>a-b);ticks.sort((a,b)=>a-b);
          return {badges:badgeCount,ticking:tickCount,drawsBefore:before,drawsAfter:s._perf.listDraws,
            p95:times[Math.ceil(.95*times.length)-1],tickP95:ticks[Math.ceil(.95*ticks.length)-1],
            beforeText,afterText:s._activeTickBadges?.[0]?.node?.textContent||''};
        }""")
        assert not errors,{"width":width,"errors":errors}
        assert result["badges"]>=120,{"width":width,**result}
        assert result["ticking"]>=12,{"width":width,**result}
        assert result["drawsAfter"]==result["drawsBefore"],{"width":width,**result}
        assert result["afterText"] and result["afterText"]==result["beforeText"],{"width":width,**result}
        print(f"PASS badges={result['badges']} tickers={result['ticking']} p95={result['p95']:.1f} ms "+
              f"ticker-p95={result['tickP95']:.1f} ms, geen extra lijst-render ({width}px)")
        page.close()
    browser.close()
