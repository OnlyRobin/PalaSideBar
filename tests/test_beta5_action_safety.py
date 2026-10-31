"""Beta5: clicks keep navigation, section dialog action, disabled feature and touch-pointercancel."""
from pathlib import Path
from playwright.sync_api import sync_playwright
src=(Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text(encoding='utf8')
config={'schema':1,'title':'Test','groups':[{'id':'start','title':'START','items':[{'id':'home','label':'Home','path':'/lovelace','icon':'mdi:home'}]}]}
with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width in (390,1280):
    p=b.new_page(viewport={'width':width,'height':900},is_mobile=width==390,has_touch=width==390)
    errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
    p.set_content('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>')
    p.evaluate('''arg=>{window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(arg.config)});let h=document.createElement('home-assistant');h.attachShadow({mode:'open'});let d=document.createElement('ha-sidebar');d.attachShadow({mode:'open'});d.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';d.expanded=true;d.setAttribute('expanded','');h.shadowRoot.append(d);document.body.append(h);const hass={user:{id:'act',name:'Tester',is_admin:true},config:{version:'2026.10'},states:{},panels:{},entities:{},connection:{sendMessagePromise:async()=>({value:null})}};h.hass=d.hass=hass;const el=document.createElement('script');el.textContent=arg.src;document.head.append(el)}''',{'src':src,'config':config})
    p.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'")
    p.wait_for_function("()=>document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar')._prefsStore.ready")
    p.evaluate("()=>{window.s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');s._navigate=x=>(window.__navigated=x);s.saved.context_menu={enabled:true,configured:true}}")
    link=p.locator('home-assistant ha-sidebar pala-sidebar').locator('.nav-row .nav-link').first
    # Normal click before menu opens: must still navigate.
    link.evaluate('(el)=>el.addEventListener("click", ev=>{ window.__normalClick=true;ev.preventDefault(); }, {once:true})')
    link.click(force=True);assert p.evaluate('window.__normalClick')
    p.evaluate("()=>{window.__navigated=null;s._favoriteSuppressClickUntil=0}")
    # Keyboard shortcut opens same menu.
    link.focus();p.keyboard.press('Shift+F10');p.wait_for_timeout(260)
    assert p.evaluate('s.actionDialog.open')
    p.evaluate("()=>{s.actionDialog.close();s._favoriteSuppressClickUntil=0}");p.wait_for_timeout(350)
    # Disable only extended actions, retain essential menu for favorite editing.
    p.evaluate('''()=>{s.saved.context_menu={enabled:false,configured:true};const l=s.shadowRoot.querySelector('.nav-row .nav-link');l.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,composed:true,cancelable:true}));}''')
    result=p.evaluate("()=>({open:s.actionDialog.open,buttons:[...s.actionDialog.querySelectorAll('[data-do]')].map(x=>x.dataset.do)})")
    assert result['open'] and 'favorite-toggle' in result['buttons'] and 'v2-context-open' not in result['buttons'],result
    p.evaluate("()=>{s.actionDialog.close();s._favoriteSuppressClickUntil=0;s.saved.context_menu={enabled:true,configured:true}}");p.wait_for_timeout(350)
    # Section action closes modal, invokes original section button, saves existing preference.
    h=p.locator('home-assistant ha-sidebar pala-sidebar').locator('.list .group-toggle').first
    h.click(button='right',force=True);p.wait_for_timeout(350)
    p.evaluate("()=>s.actionDialog.querySelector('[data-do=v2-context-section-toggle]').click()")
    p.wait_for_timeout(450)
    assert p.evaluate("s.saved.closed.includes('start')"),'Section toggle action did not invoke original section'
    p.evaluate("()=>{s.list.querySelector('.group-toggle').click();s._favoriteSuppressClickUntil=0}")
    p.wait_for_timeout(600)
    # Real command from the modal must navigate, not merely render a button.
    p.evaluate("()=>{window.__navigated=null;s._favoriteSuppressClickUntil=0}")
    link.click(button='right',force=True);p.wait_for_timeout(350)
    p.evaluate("()=>s.actionDialog.querySelector('[data-do=v2-context-open]').click()")
    p.wait_for_timeout(850)
    assert p.evaluate('window.__navigated')=='/lovelace',('Open action from context menu failed',width)
    p.evaluate("()=>{s._favoriteSuppressClickUntil=0}")
    if width==390:
      link.scroll_into_view_if_needed();bb=link.bounding_box();x=int(bb['x']+35);y=int(bb['y']+bb['height']/2)
      touch=p.context.new_cdp_session(p)
      touch.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':74}]})
      p.evaluate('''()=>{const link=s.shadowRoot.querySelector('.nav-row .nav-link');link.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,composed:true,pointerId:1,pointerType:'touch'}));}''')
      p.wait_for_timeout(640)
      assert p.evaluate('s.actionDialog.open'),'Android pointercancel incorrectly cancels the continuing touch stream'
      touch.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    assert not errs,errs
    print('PASS beta5 keyboard, normal navigation, menu disable, original section action and pointercancel:',width)
    p.close()
  b.close()
