"""Verify old 1.3.58 user-data persists with the quick menu now enabled (other new features remain off)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
src=(Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text()
old={'favorites':['home'], 'links':[{'id':'my-dashboard','label':'Mijn dashboard','path':'/lovelace/home','icon':'mdi:home'}],
     'section_order':['start'], 'item_labels':{'home':'Startpagina'},
     'theme':{'preset':'amoled','effects':'gentle','dynamic':'off','scene':'auto'},
     'design':{'typography':115,'icons':24,'spacing':'tight'},'footer_config':{'show_restart':False},
     'mobile_v131_migrated':True,'header_v133_migrated':True}
config={'schema':1,'title':'Test','groups':[{'id':'start','title':'START','items':[{'id':'home','label':'Overzicht','path':'/lovelace','icon':'mdi:view-dashboard-outline'}]}]}
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<html><body></body></html>')
 page.evaluate('''args=>{
   window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(args.config)});
   const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
   const side=document.createElement('ha-sidebar');side.attachShadow({mode:'open'});side.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
   side.expanded=true;side.setAttribute('expanded','');ha.shadowRoot.append(side);document.body.append(ha);
   const hass={user:{id:'upgrade-test',name:'Test',is_admin:true},config:{version:'2026.10'},states:{},entities:{},panels:{},
    connection:{sendMessagePromise:async req=>req.type==='frontend/get_user_data'&&req.key==='palasidebar.preferences.v1'?{value:{format:'PalaSidebar-v1',settings:args.old}}:{value:null}}};
   ha.hass=hass;side.hass=hass;
   const script=document.createElement('script');script.textContent=args.src;document.head.append(script);
 }''', {'config':config,'old':old,'src':src})
 page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'")
 page.wait_for_function('''()=>{
    const side=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
    return side?._prefsStore?.ready===true;
 }''')
 state=page.evaluate('''()=>{
  const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
  return {favorites:s.saved.favorites,links:s.saved.links.map(x=>x.id),item_labels:s.saved.item_labels,theme:s.saved.theme.preset,
          typography:s.saved.design.typography,icons:s.saved.design.icons,restart:s.saved.footer_config.show_restart,
          live:s.saved.live_center,context:s.saved.context_menu,performance:s.saved.performance_center};
 }''')
 assert state['favorites']==['home'],state
 assert state['links']==['my-dashboard'],state
 assert state['item_labels']['home']=='Startpagina',state
 assert state['theme']=='amoled' and state['typography']==115 and state['icons']==24 and state['restart'] is False,state
 assert state['live']['enabled'] is False and state['context']['enabled'] is True and state['performance']['enabled'] is False,state
 assert errors==[],errors
 print('PASS v2 upgrade preserves old favorites, links, design, theme, footer and beta5 quick menu migration')
 b.close()
