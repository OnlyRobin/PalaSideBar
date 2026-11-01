"""Stabilisatie: mobiele/desktop foto-upload, accountisolatie en serveropslag.

Gebruik met de echte JS uit de checkout en een bewust beperkte fake Home Assistant
DOM. Een geslaagde test vervangt geen test op een echte HA-installatie.
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "custom_components/pala_sidebar/frontend/pala-sidebar.js").read_text(encoding="utf-8")

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium",
        args=["--no-sandbox", "--disable-dev-shm-usage"],
    )
    for width in (390, 768, 1280):
        page = browser.new_page(viewport={"width": width, "height": 900})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.set_content("<html><body></body></html>")
        page.evaluate(
            """src => {
              window.fetch=async()=>({
                ok:true, text:async()=>JSON.stringify({schema:1,title:'PalaSidebar'})
              });
              const ha=document.createElement('home-assistant');
              ha.attachShadow({mode:'open'});
              const nav=document.createElement('ha-sidebar');
              nav.attachShadow({mode:'open'});
              nav.shadowRoot.innerHTML='<div class="menu"></div><slot name="main-navigation"></slot>';
              nav.expanded=true;nav.setAttribute('expanded','');
              ha.shadowRoot.append(nav);document.body.append(ha);
              window.__server={};
              const connection={sendMessagePromise:async req=>{
                const user=window.__ha.hass.user.id;
                if(req.type==='frontend/get_user_data')return {value:window.__server[user]?.[req.key]||null};
                if(req.type==='frontend/set_user_data'){
                  (window.__server[user]??={})[req.key]=req.value;return {};
                }
                return {};
              }};
              const makeHass=id=>({user:{id,name:id,is_admin:true},
                config:{version:'2026.10'},states:{},entities:{},panels:{},connection});
              window.__ha=ha;window.__nav=nav;window.__makeHass=makeHass;
              ha.hass=makeHass('account-a');nav.hass=ha.hass;
              const script=document.createElement('script');
              script.textContent=src;document.head.append(script);
            }""",
            SOURCE,
        )
        page.wait_for_function(
            "window.PalaSidebarDiagnostics?.().phase==='gereed'",
            timeout=30000,
        )
        page.wait_for_function(
            """() => {
              const s=window.__nav.querySelector('pala-sidebar');
              return !!s?._prefsStore?.ready && !!s.dialog;
            }""",
            timeout=20000,
        )
        result = page.evaluate(
            """async () => {
              const sidebar=window.__nav.querySelector('pala-sidebar');
              const errors=[];
              sidebar.showSettings('header');
              const picker=sidebar.dialog.querySelector('#pala-head-image-file');
              if(!picker)throw Error('Header foto-bestandkiezer ontbreekt');

              // Reproduceer RC5 race: tweede ongeldige keuze terwijl vorige
              // afbeelding nog verwerkt wordt. Opslaan mag niet vastlopen.
              sidebar._headerImageBusy=true;
              sidebar._headerImageSequence++;
              await sidebar._loadHeaderImage(new File(['<svg/>'],'fout.svg',{type:'image/svg+xml'}));
              if(sidebar._headerImageBusy)errors.push('ongeldig bestand blokkeert bewaren');

              // Maak de afbeelding lokaal zonder externe servers.
              const canvas=document.createElement('canvas');
              canvas.width=850;canvas.height=310;
              const context=canvas.getContext('2d');
              context.fillStyle='#456789';
              context.fillRect(0,0,canvas.width,canvas.height);
              context.fillStyle='#ecb95d';
              context.fillRect(0,0,850,90);
              const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
              await sidebar._loadHeaderImage(new File([blob],'thuis.png',{type:'image/png'}));
              if(!sidebar._headerImageDraft?.startsWith('data:image/jpeg;base64,'))
                errors.push('conversie mislukt');
              if(!sidebar.dialog.querySelector('.header-image-thumbnail img'))
                errors.push('voorbeeld ontbreekt');
              const input=sidebar.dialog.querySelector('#pala-head-title');
              input.value='Persoonlijke woning';
              sidebar._saveHeader();
              if(sidebar._header().title!=='Persoonlijke woning'||sidebar.head.dataset.headerPicture!=='true')
                errors.push('header niet opgeslagen');
              await sidebar._flushServerSettings(sidebar._prefsStore);
              const key='palasidebar.preferences.v1';
              const saved=window.__server['account-a']?.[key]?.settings?.header;
              if(!saved?.image?.startsWith('data:image/jpeg;base64,'))
                errors.push('server bewaart foto niet');

              // Bij gebruiker wisselen mogen titel en foto niet lekken.
              const second=window.__makeHass('account-b');
              window.__ha.hass=second;window.__nav.hass=second;sidebar.setHass(second);
              await new Promise(resolve=>setTimeout(resolve,100));
              if(!sidebar._prefsStore?.ready)errors.push('tweede account niet geladen');
              if(sidebar._header().image||sidebar._header().title==='Persoonlijke woning')
                errors.push('gegevens ander account zichtbaar');

              // Terug naar account A: herstel uit servervoorkeuren.
              const first=window.__makeHass('account-a');
              window.__ha.hass=first;window.__nav.hass=first;sidebar.setHass(first);
              await new Promise(resolve=>setTimeout(resolve,100));
              if(!sidebar._prefsStore?.ready)errors.push('eerste account niet herladen');
              if(sidebar._header().image!==saved?.image)
                errors.push('foto niet hersteld na accountwissel');
              if(sidebar._header().title!=='Persoonlijke woning')
                errors.push('titel niet hersteld na accountwissel');
              return {errors,photoBytes:saved?.image?.length||0,accountRestored:sidebar._header().title};
            }"""
        )
        assert not errors, {"width": width, "page_errors": errors}
        assert not result["errors"], {"width": width, **result}
        assert 500 < result["photoBytes"] < 110000, result
        print(
            "PASS stabiele upload, ongeldige bestandskeuze, serveropslag, accountisolatie en herstel",
            width,
            "px",
        )
        page.close()
    browser.close()
