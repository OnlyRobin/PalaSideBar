"""Beta5: actual Chromium right clicks, touchscreen long presses, cancellation and menu actions."""
from pathlib import Path
from playwright.sync_api import sync_playwright
src=(Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text(encoding='utf8')
fixture={'schema':1,'title':'PalaSidebar','groups':[{'id':'start','title':'START','items':[{'id':'home','label':'Overzicht','path':'/lovelace','icon':'mdi:home'}, {'id':'energy','label':'Energie','path':'/energy','icon':'mdi:flash'}]}]}
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (390,1280):
        page=browser.new_page(viewport={'width':width,'height':900},is_mobile=width==390,has_touch=width==390)
        errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
        page.set_content('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>')
        page.evaluate('''arg=>{
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(arg.config)});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const side=document.createElement('ha-sidebar');side.attachShadow({mode:'open'});
          side.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          side.expanded=true;side.setAttribute('expanded','');ha.shadowRoot.append(side);document.body.append(ha);
          const hass={user:{id:'b5',name:'Test',is_admin:true},config:{version:'2026.10'},states:{'sensor.temp':{state:'23',attributes:{unit_of_measurement:'°C'}}},panels:{},entities:{},callService:async()=>{},connection:{sendMessagePromise:async()=>({value:null})}};
          ha.hass=side.hass=hass;
          const script=document.createElement('script');script.textContent=arg.src;document.head.append(script);
        }''',{'src':src,'config':fixture})
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase === 'gereed'",timeout=30000)
        page.wait_for_function("()=>{const s=document.querySelector('home-assistant')?.shadowRoot?.querySelector('ha-sidebar')?.querySelector('pala-sidebar');return s?._prefsStore?.ready===true}")
        page.evaluate('''()=>{
          window.__s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          __s.saved.live_center={enabled:true,collapsed:false,tiles:[{entity:'sensor.temp',label:'Temperatuur',icon:'mdi:thermometer',action:'toggle'}]};
          __s._buildLiveCenter();
          __s.saved.context_menu={enabled:true,configured:true};
        }''')
        selector='home-assistant ha-sidebar pala-sidebar'
        link=page.locator(selector).locator('.list .nav-row .nav-link').first
        link.click(button='right',force=True)
        page.wait_for_timeout(360)
        result=page.evaluate("()=>({open:__s.actionDialog.open,opacity:getComputedStyle(__s.actionDialog).opacity,actions:[...__s.actionDialog.querySelectorAll('[data-do]')].map(x=>x.dataset.do)})")
        assert result['open'] and float(result['opacity'])>=.99 and 'v2-context-open' in result['actions'],(width,'rightclick',result)
        page.evaluate('''()=>{__s.actionDialog.close();__s._favoriteSuppressClickUntil=0}''');page.wait_for_timeout(360)
        # Real right-click on SAME section toggle, inherited from the shared section factory.
        heading=page.locator(selector).locator('.list .group-toggle').first
        heading.click(button='right',force=True);page.wait_for_timeout(360)
        result=page.evaluate("()=>({open:__s.actionDialog.open,actions:[...__s.actionDialog.querySelectorAll('[data-do]')].map(x=>x.dataset.do)})")
        assert result['open'] and 'v2-context-section-toggle' in result['actions'],(width,'section-right',result)
        page.evaluate('''()=>{__s.actionDialog.close();__s._favoriteSuppressClickUntil=0}''');page.wait_for_timeout(360)
        # Real right-click on live tile; handler is in shadowRoot not list only.
        tile=page.locator(selector).locator('.pala-live-center .nav-link').first
        tile.click(button='right',force=True);page.wait_for_timeout(360)
        result=page.evaluate("()=>({open:__s.actionDialog.open,actions:[...__s.actionDialog.querySelectorAll('[data-do]')].map(x=>x.dataset.do)})")
        assert result['open'] and 'v2-context-live-toggle' in result['actions'],(width,'live-right',result)
        page.evaluate('''()=>{__s.actionDialog.close();__s._favoriteSuppressClickUntil=0}''');page.wait_for_timeout(360)
        # Native Android touch sequence, including pointercancel while touch still active.
        # This was not covered by earlier synthetic PointerEvent-only tests.
        touch=page.context.new_cdp_session(page)
        # App fixture is a small centered non-drawer HA shell; get real link coordinates.
        link.scroll_into_view_if_needed()
        box=link.bounding_box(); x=int(box['x']+min(box['width']/2,100));y=int(box['y']+box['height']/2)
        if width==390:
            touch.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':42}]})
            page.wait_for_timeout(700)
            open_state=page.evaluate('''()=>({open:__s.actionDialog.open,menu:[...__s.actionDialog.querySelectorAll('[data-do]')].map(x=>x.dataset.do)})''')
            assert open_state['open'] and 'v2-context-open' in open_state['menu'],('real touch longpress',open_state)
            touch.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
            page.evaluate('''()=>{__s.actionDialog.close();__s._favoriteSuppressClickUntil=0}''');page.wait_for_timeout(350)
            # Swipe should cancel long press and should NOT open actions dialog.
            touch.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':43}]})
            touch.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y+66,'id':43}]})
            touch.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
            page.wait_for_timeout(650)
            assert not page.evaluate('__s.actionDialog.open'),'Swiping triggered a longpress'
        # No overhead on normal click (this runs after suppress window)
        assert not errors,(width,errors)
        print('PASS beta5 real rightclick / section / live / touch longpress / swipe:',width)
        page.close()
    browser.close()
