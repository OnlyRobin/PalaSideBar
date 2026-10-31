"""PalaSidebar beta2 actual interaction tests for live styling/animations and long-press."""
from pathlib import Path
from playwright.sync_api import sync_playwright
src=(Path(__file__).resolve().parents[1]/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text()
fixture={'schema':1,'title':'PalaSidebar','groups':[{'id':'start','title':'START','items':[{'id':'home','label':'Overzicht','path':'/lovelace','icon':'mdi:view-dashboard-outline'},{'id':'energie','label':'Energie','path':'/energy','icon':'mdi:flash'}]}]}
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [390,1280]:
  page=browser.new_page(viewport={'width':width,'height':900},has_touch=width==390,is_mobile=width==390)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>')
  page.evaluate('''arg=>{
   window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(arg.config)});
   const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
   const side=document.createElement('ha-sidebar');side.attachShadow({mode:'open'});side.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
   side.expanded=true;side.setAttribute('expanded','');ha.shadowRoot.append(side);document.body.append(ha);
   const hass={user:{id:'beta2-user',name:'Test',is_admin:true},config:{version:'2026.10'},
    states:{'sensor.temp':{state:'23',attributes:{friendly_name:'Temp',unit_of_measurement:'°C'}}},
    entities:{},panels:{},callService:()=>Promise.resolve(),
    connection:{sendMessagePromise:async req=>req.type==='frontend/get_user_data'?{value:null}:{}}};
   ha.hass=hass;side.hass=hass;
   const script=document.createElement('script');script.textContent=arg.src;document.head.append(script);
  }''',{'src':src,'config':fixture})
  page.wait_for_function("window.PalaSidebarDiagnostics?.().phase==='gereed'",timeout=30000)
  init=page.evaluate('''()=>{
    const s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');window.__sidebar=s;
    s.saved.live_center={enabled:true,collapsed:false,tiles:[{label:'Temperatuur',entity:'sensor.temp',icon:'mdi:thermometer',action:'more-info'}]};
    s.saved.context_menu={enabled:true};s._buildLiveCenter();s._syncTheme(true);
    const c=s.liveCenter; const b=c.querySelector('.group-toggle');const tile=c.querySelector('.nav-link');
    const style=getComputedStyle(c);const css=getComputedStyle(tile);
    return {head:!!b,tile:!!tile,background:style.backgroundColor,radius:style.borderRadius,
      fontSize:css.fontSize,headerExpanded:b.getAttribute('aria-expanded'),tileWidth:tile.getBoundingClientRect().width};
  }''')
  assert init['head'] and init['tile'] and init['fontSize'] and init['tileWidth']>80,init
  # Click the actual header - verify retained DOM and animated panel, no display:none
  collapsed=page.evaluate('''()=>{
    const s=window.__sidebar, tile=s.liveCenter.querySelector('.nav-link'),head=s.liveCenter.querySelector('.group-toggle');
    head.click();const body=s.liveCenter.querySelector('.group-content');
    const result={collapsed:s.saved.live_center.collapsed,aria:head.getAttribute('aria-expanded'),inert:body.inert,
      same:tile===s.liveCenter.querySelector('.nav-link'),transition:getComputedStyle(body).transitionDuration,
      isDisplayNone:getComputedStyle(body).display==='none'};
    head.click();result.expanded=!s.saved.live_center.collapsed;result.ariaAfter=head.getAttribute('aria-expanded');return result;
  }''')
  assert collapsed['collapsed'] and collapsed['aria']=='false' and collapsed['inert'] and collapsed['same'] and collapsed['expanded'] and collapsed['ariaAfter']=='true' and not collapsed['isDisplayNone'],collapsed
  # Native desktop rail should consume zero width/height instead of hard display:none.
  if width==1280:
   page.evaluate("()=>{const s=window.__sidebar;s.setAttribute('data-integration','native');s.native.expanded=false;s.native.removeAttribute('expanded');s._compactSync()}")
   page.wait_for_timeout(350)
   compact=page.evaluate('''()=>{const c=getComputedStyle(window.__sidebar.liveCenter);return {display:c.display,maxHeight:c.maxHeight,opacity:c.opacity,integration:window.__sidebar.getAttribute('data-integration'),compact:window.__sidebar.getAttribute('data-compact'),styleText:window.__sidebar.shadowRoot.querySelector('style').textContent.includes(':host([data-integration="native"][data-compact="true"]) .pala-live-center')}}''')
   assert compact['display']!='none' and compact['maxHeight']=='0px',compact
   page.evaluate("()=>window.__sidebar.setAttribute('data-compact','false')")
  # Portal palette must inherit active sidebar theme, never a separate HA color.
  theme_result=page.evaluate('''()=>{
   const s=window.__sidebar;
   s.saved.theme={...s.saved.theme,preset:'ocean',dynamic:'off'};
   s._syncTheme(true);
   s._syncDialogPortal();
   return {sidebar:s.getAttribute('data-theme'),portal:s._dialogPortal.dataset.theme,
     active:s._dialogPortal.dataset.themeActive,
     accent:s._dialogPortal.style.getPropertyValue('--p-sidebar-accent'),
     sky:s._dialogPortal.style.getPropertyValue('--p-sky')};
  }''')
  assert theme_result['sidebar']=='ocean' and theme_result['portal']=='ocean' and theme_result['active']=='true' and theme_result['sky'],theme_result
    # Actual hold in the browser, not a direct call to a private function.
  sel="home-assistant ha-sidebar pala-sidebar" # shadow root access via evaluate
  rect=page.evaluate('''()=>{const r=window.__sidebar.shadowRoot.querySelector('.list .nav-row .nav-link').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}}''')
  # The native rail sits in a shadow DOM and is slotted into an HA sidebar fixture;
  # dispatch pointerdown/up through target for a faithful bubbling event.
  page.evaluate('''()=>{
     const link=window.__sidebar.shadowRoot.querySelector('.list .nav-row .nav-link');
     link.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,composed:true,pointerType:'touch',pointerId:5,isPrimary:true,clientX:55,clientY:320}));
  }''')
  page.wait_for_timeout(690)
  result=page.evaluate('''()=>{const s=window.__sidebar;return {open:s.actionDialog.open,
    actions:[...s.actionDialog.querySelectorAll('[data-do]')].map(x=>x.dataset.do),
    suppression:s._favoriteSuppressClickUntil>performance.now()}}''')
  assert result['open'] and 'v2-context-open' in result['actions'] and result['suppression'],result
  page.evaluate('''()=>{const s=window.__sidebar;s.actionDialog.close();s._favoriteSuppressClickUntil=0;}''')
  page.wait_for_timeout(350)
  # Moving far should cancel hold, not interfere with native scrolling/swipe.
  page.evaluate('''()=>{
   const l=window.__sidebar.shadowRoot.querySelector('.list .nav-row .nav-link');
   l.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,composed:true,pointerType:'touch',pointerId:6,isPrimary:true,clientX:40,clientY:320}));
   l.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,composed:true,pointerType:'touch',pointerId:6,isPrimary:true,clientX:120,clientY:320}));
  }''')
  page.wait_for_timeout(600)
  assert not page.evaluate('window.__sidebar.actionDialog.open'),'Swipe incorrectly triggered hold menu'
  assert not errors,errors
  print('PASS beta2 functional interaction',width,'px',init,collapsed)
  page.close()
 browser.close()
