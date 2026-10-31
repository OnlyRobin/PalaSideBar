"""Beta4 hardening regression: recovery failure, selective badge ticks, stale holds, and gesture cancel.

Exercise actual JS in Chromium using a light Home Assistant shell fixture.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
src=(root/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text(encoding='utf8')
config={'schema':1,'title':'PalaSidebar','groups':[{'id':'start','title':'START','items':[
    {'id':'home','label':'Overzicht','path':'/lovelace','icon':'mdi:home'},
    {'id':'energy','label':'Energie','path':'/energy','icon':'mdi:flash'}]}]}

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (390,1280):
        page=browser.new_page(viewport={'width':width,'height':900},has_touch=(width==390),is_mobile=(width==390))
        errors=[]
        page.on('pageerror',lambda exc: errors.append(str(exc)))
        page.set_content('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>')
        page.evaluate('''arg=>{
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(arg.config)});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const side=document.createElement('ha-sidebar');side.attachShadow({mode:'open'});
          side.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          side.expanded=true;side.setAttribute('expanded','');ha.shadowRoot.append(side);document.body.append(ha);
          const hass={user:{id:'beta4-admin',name:'Test',is_admin:true},config:{version:'2026.10'},
            states:{},panels:{},entities:{},callService:async()=>{},
            connection:{sendMessagePromise:async r=>({value:null})}};
          ha.hass=side.hass=hass;
          const script=document.createElement('script');script.textContent=arg.src;document.head.append(script);
        }''', {'config':config,'src':src})
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase === 'gereed'",timeout=30000)
        page.wait_for_function("()=>{const s=document.querySelector('home-assistant')?.shadowRoot?.querySelector('ha-sidebar')?.querySelector('pala-sidebar');return s?._prefsStore?.ready===true}")

        result=page.evaluate('''async()=>{
          const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          // First backup write fails. The actual settings write MUST still succeed.
          let backupCalls=0,settingsCalls=0;
          s.hass.connection.sendMessagePromise=async req=>{
            if(req.key==='palasidebar.recovery.v1'){backupCalls++;throw new Error('Recovery tijdelijk onbereikbaar')}
            if(req.type==='frontend/set_user_data'&&req.key==='palasidebar.preferences.v1'){settingsCalls++;return {}}
            return {value:null};
          };
          const store=s._prefsStore;
          if(store.timer){clearTimeout(store.timer);store.timer=null}
          s.saved.links=[{id:'extra',label:'Extra',path:'/lovelace/extra',icon:'mdi:home'}];
          const old={...s.saved,links:[{id:'existing',label:'Bestaand',path:'/lovelace/existing',icon:'mdi:home'}]};
          store.lastSaved=JSON.stringify(old);store.ready=true;
          await s._flushServerSettings(store);
          const saved={backupCalls,settingsCalls,status:store.status,dirty:store.dirty,lastSaved:store.lastSaved===JSON.stringify(s.saved),recovery:s._recoveryStatus};
          // The 1s clock should only touch a known countdown, not regular badges.
          const normal=document.createElement('span'),timer=document.createElement('span');
          normal.className=timer.className='badge';
          for(const badge of [normal,timer]){const link=document.createElement('button');link.className='nav-link';const label=document.createElement('span');label.className='nav-label';const icon=document.createElement('span');icon.className='ico';link.append(label,icon,badge);}
          s._activeBadges=[{node:normal,spec:{entity:'sensor.energy'}},{node:timer,spec:{entity:'sensor.f1_countdown'}}];
          s._activeTickBadges=s._activeBadges.filter(x=>x.spec.entity.includes('countdown'));
          const original=s._badgeValue.bind(s);const badgeCalls=[];
          s._badgeValue=spec=>{badgeCalls.push(spec.entity);return '12'};
          s._refreshBadges(true);
          const tickCalls=[...badgeCalls];s._refreshBadges(false);
          const allCalls=[...badgeCalls];s._badgeValue=original;
          // An obsolete held item must not open after the navigation disappears.
          s.saved.context_menu={enabled:true};
          s._favoriteHoldArm(100,300,'not-in-menu',7);
          return {saved,tickCalls,allCalls,staleTimerArmed:!!s._favoriteHold};
        }''')
        assert result['saved']['backupCalls']>=1,result
        assert result['saved']['settingsCalls']==1,result
        assert result['saved']['status']=='opgeslagen' and result['saved']['lastSaved'] and not result['saved']['dirty'],result
        assert result['tickCalls']==['sensor.f1_countdown'],result
        assert result['allCalls']==['sensor.f1_countdown','sensor.energy','sensor.f1_countdown'],result
        page.wait_for_timeout(600)
        stale=page.evaluate('''()=>{const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');return {open:s.actionDialog.open,hold:s._favoriteHold,suppress:s._favoriteSuppressClickUntil}}''')
        assert not stale['open'] and stale['hold'] is None and stale['suppress']==0,stale
        # Repeated HA redraws must not spawn duplicate panels/listeners.
        redraw=page.evaluate('''()=>{
          const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          s.saved.live_center={enabled:true,collapsed:false,tiles:[{entity:'sensor.temperature',label:'Temperatuur',icon:'mdi:thermometer'}]};
          for(let i=0;i<30;i++)s.redraw();
          const heads=s.liveCenter.querySelectorAll('.group-toggle').length;
          const panelCount=s.shadowRoot.querySelectorAll('.pala-live-center').length;
          const portalCount=document.querySelectorAll('#pala-sidebar-dialog-portal').length;
          let saves=0;const original=s._saveSettings.bind(s);s._saveSettings=function(){saves++};
          s.liveCenter.querySelector('.group-toggle').click();
          const collapsed=s.saved.live_center.collapsed;
          s._saveSettings=original;
          return {heads,panelCount,portalCount,saves,collapsed};
        }''')
        assert redraw=={'heads':1,'panelCount':1,'portalCount':1,'saves':1,'collapsed':True},redraw
        assert not errors,errors
        print('PASS beta4 recovery-failure isolated, selective countdowns, stale longpress',width,'px')
        page.close()
    browser.close()
