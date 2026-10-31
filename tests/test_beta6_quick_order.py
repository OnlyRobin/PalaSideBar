"""Beta6 dashboard quick modal order, real mouse/touch and non-regression."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
src=(root/'custom_components/pala_sidebar/frontend/pala-sidebar.js').read_text(encoding='utf-8')
fixture={'schema':1,'title':'PalaSidebar','groups':[{'id':'start','title':'START','items':[
    {'id':'one','label':'Eerste','path':'/lovelace/one','icon':'mdi:home'},
    {'id':'two','label':'Tweede','path':'/lovelace/two','icon':'mdi:flash'},
    {'id':'three','label':'Derde','path':'/lovelace/three','icon':'mdi:star'},
    {'id':'four','label':'Vierde','path':'/lovelace/four','icon':'mdi:heart'}]}]}

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (390,1280):
        is_mobile=width==390
        page=browser.new_page(viewport={'width':width,'height':900},has_touch=is_mobile,is_mobile=is_mobile)
        errors=[];page.on('pageerror',lambda exc:errors.append(str(exc)))
        page.set_content('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>')
        page.evaluate('''arg=>{
          window.fetch=async()=>({ok:true,text:async()=>JSON.stringify(arg.config)});
          const ha=document.createElement('home-assistant');ha.attachShadow({mode:'open'});
          const side=document.createElement('ha-sidebar');side.attachShadow({mode:'open'});
          side.shadowRoot.innerHTML='<slot name="main-navigation"></slot>';
          side.expanded=true;side.setAttribute('expanded','');ha.shadowRoot.append(side);document.body.append(ha);
          const hass={user:{id:'b6',name:'Test',is_admin:true},config:{version:'2026.10'},states:{},panels:{},entities:{},callService:async()=>{},connection:{sendMessagePromise:async()=>({value:null})}};
          ha.hass=side.hass=hass;
          const script=document.createElement('script');script.textContent=arg.src;document.head.append(script);
        }''',{'src':src,'config':fixture})
        page.wait_for_function("window.PalaSidebarDiagnostics?.().phase === 'gereed'",timeout=30000)
        page.wait_for_function("()=>{const s=document.querySelector('home-assistant')?.shadowRoot?.querySelector('ha-sidebar')?.querySelector('pala-sidebar');return s?._prefsStore?.ready===true}")
        page.evaluate("""()=>{
          window.__s=document.querySelector('home-assistant').shadowRoot.querySelector('ha-sidebar').querySelector('pala-sidebar');
          __s.showQuickDialog();
        }""")
        modal=page.locator('#pala-sidebar-dialog-portal').locator('.quick-dialog')
        tiles=modal.locator('.quick-tile')
        assert tiles.count()>=4, tiles.count()
        order=lambda:page.evaluate("[...__s.quickDialog.querySelectorAll('.quick-tile')].map(x=>x.dataset.id)")
        original=order()
        # Click normally navigates when not sorting (without real route navigation).
        assert page.evaluate('!__s._quickOrderMode')
        # toolbar edit + arrow, persistence + CSS follows active vars.
        modal.locator('[data-do="quick-order-toggle"]').click()
        assert page.evaluate('__s._quickOrderMode')
        tiles.first.click()
        modal.locator('[data-do="quick-order-next"]').click()
        after=order()
        assert after[1]==original[0],(width,'nudge',original,after)
        assert page.evaluate('__s.saved.quick_order[1]')==original[0]
        page.evaluate('''()=>{__s._quickOrderSetMode(false);__s._quickOrderCleanup(false)}''')
        assert not page.evaluate('__s._quickOrderMode')
        # Closing + reopening restores the new order without dropping settings.
        page.evaluate('''()=>__s._closeOwnedDialog(__s.quickDialog)''')
        page.wait_for_function('!__s.quickDialog.open',timeout=5000)
        page.wait_for_timeout(300)
        page.evaluate('''()=>__s.showQuickDialog()''')
        page.wait_for_function('''()=>__s.quickDialog.dataset.phase==='open'&&getComputedStyle(__s.quickDialog).pointerEvents!=='none' ''')
        assert order()==after,(width,'reopen',order(),after)
        # Desktop right click enters mode; mouse drag reorders while active.
        if not is_mobile:
            tiles.first.click(button='right')
            assert page.evaluate('__s._quickOrderMode')
            # move first visible tile to last by crossing centers
            first=tiles.first.bounding_box();last=tiles.last.bounding_box()
            x=first['x']+first['width']/2;y=first['y']+first['height']/2
            lx=last['x']+last['width']/2;ly=last['y']+last['height']/2
            page.mouse.move(x,y);page.mouse.down();page.mouse.move(lx,ly,steps=9);page.mouse.up()
            assert order()[-1]==after[0],('desktop drag',after,order())
            assert page.evaluate('__s.saved.quick_order.at(-1)')==after[0]
        else:
            # Native Android/WebView touch long hold, then drag across first->last
            first=tiles.first.bounding_box();last=tiles.last.bounding_box()
            x=round(first['x']+first['width']/2);y=round(first['y']+first['height']/2)
            lx=round(last['x']+last['width']/2);ly=round(last['y']+last['height']/2)
            touch=page.context.new_cdp_session(page)
            touch.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':41}]})
            page.wait_for_timeout(650)
            assert page.evaluate('__s._quickOrderMode&&__s._quickPress?.armed'),('touch long press',page.evaluate('({mode:__s._quickOrderMode,hold:!!__s._quickPress,armed:__s._quickPress?.armed})'))
            for i in range(1,9):
                touch.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':round(x+(lx-x)*i/8),'y':round(y+(ly-y)*i/8),'id':41}]})
                page.wait_for_timeout(35)
            touch.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
            page.wait_for_timeout(100)
            assert order()[-1]==after[0],('touch drag',after,order())
            assert page.evaluate('__s.saved.quick_order.at(-1)')==after[0]
        assert page.evaluate('!__s._quickGhost && !__s._quickPressTimer && !__s._quickPress')
        # No duplicate modal listeners from reopening.
        page.evaluate('''()=>__s._closeOwnedDialog(__s.quickDialog)''')
        page.wait_for_function('!__s.quickDialog.open',timeout=5000)
        page.wait_for_timeout(300)
        page.evaluate('''()=>__s.showQuickDialog()''')
        page.wait_for_function('''()=>__s.quickDialog.dataset.phase==='open' ''')
        assert order()==page.evaluate('__s._quickEntries().map(x=>x.id)')
        # A fast mobile swipe should scroll/cancel, NEVER start a sort.
        if is_mobile:
            first=tiles.first.bounding_box()
            x=round(first['x']+first['width']/2);y=round(first['y']+first['height']/2)
            last_order=order()
            touch.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':52}]})
            touch.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y+35,'id':52}]})
            touch.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
            page.wait_for_timeout(550)
            assert not page.evaluate('__s._quickOrderMode'),('scroll accidentally opened sort',order())
            assert order()==last_order,('scroll changed order',last_order,order())
        # Returning to normal mode restores navigation on a regular tile tap.
        page.evaluate('''()=>{__s._quickOrderSetMode(false);__s._quickSuppressClickUntil=0;__s.__quickVisited=[];__s._navigate=path=>__s.__quickVisited.push(path)}''')
        expected=tiles.first.get_attribute('data-path')
        tiles.first.click()
        page.wait_for_function('__s.__quickVisited.length===1',timeout=5000)
        assert page.evaluate('__s.__quickVisited[0]')==expected
        assert not errors,(width,errors)
        print('PASS beta6 quick order real gestures, persistence, reopen',width,'px')
        page.close()
    browser.close()
