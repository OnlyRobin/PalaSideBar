"""Indicative headless comparison, not a guarantee on the user's HA tablet."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/frontend'
import os, sys
old=Path(os.environ.get('PALA_SIDEBAR_BENCHMARK_BASELINE', ''))
if not old.is_file():
 print('SKIP: zet PALA_SIDEBAR_BENCHMARK_BASELINE naar een bestaand pala-sidebar.js-bestand')
 sys.exit(0)
new=root/'pala-sidebar.js'

config={'schema':1,'title':'Test','groups':[{'id':'start','title':'START','items':[{'id':'home','label':'Home','icon':'mdi:home','path':'/lovelace'},{'id':'energie','label':'Energie','icon':'mdi:flash','path':'/energy'}]}]}
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (390,1280):
  results={}
  for name,path in [('v1.3.58',old),('v2.0.0-beta2',new)]:
   page=b.new_page(viewport={'width':width,'height':840});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content('<html><body></body></html>')
   page.evaluate('''args=>{
    window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(args.config)});
    const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
    const side=document.createElement('ha-sidebar');side.attachShadow({mode:'open'});side.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
    side.expanded=true;side.setAttribute('expanded','');ha.shadowRoot.append(side);document.body.append(ha);
    const hass={user:{id:'benchmark',name:'Test',is_admin:true},config:{version:'2026.10'},states:{},entities:{},panels:{},
       connection:{sendMessagePromise:async req=>({value:null})}};
    ha.hass=hass;side.hass=hass;
    const script=document.createElement('script');script.textContent=args.src;document.head.append(script);
   }''',{'config':config,'src':path.read_text()})
   page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
   samples=page.evaluate('''()=>{
      const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
      for(let i=0;i<20;i++)s.refreshStatus();
      const data=[];
      for(let i=0;i<200;i++){const t=performance.now();s.refreshStatus();data.push(performance.now()-t);}
      data.sort((a,b)=>a-b);
      return {avg:data.reduce((a,b)=>a+b,0)/data.length,p95:data[Math.ceil(data.length*.95)-1]};
   }''')
   assert not errors,errors
   results[name]=samples
   page.close()
  before=results['v1.3.58']['p95'];after=results['v2.0.0-beta2']['p95']
  print(width,'px:',results,'p95 difference '+f'{(after-before)/before*100:.1f}%' if before else '—')
 b.close()
