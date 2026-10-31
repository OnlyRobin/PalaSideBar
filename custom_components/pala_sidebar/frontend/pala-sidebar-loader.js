/**
 * PalaSidebar AutoLoader (stable entrypoint, no third-party dependencies).
 * Automatically registered by the PalaSidebar Home Assistant integration.
 * Install a new pala-sidebar.js, then its version.json LAST.
 * Personal settings remain in Home Assistant, never stored here.
 */
(() => {
  'use strict';
  if (window.__PALA_SIDEBAR_AUTOLOADER__) return;
  window.__PALA_SIDEBAR_AUTOLOADER__ = true;

  const MAIN = '/pala_sidebar/assets/pala-sidebar.js';
  const MANIFEST = '/pala_sidebar/assets/pala-sidebar-version.json';
  const CHECK_INTERVAL = 10 * 60 * 1000;
  const MIN_ACTIVE_INTERVAL = 60 * 1000;
  const ACCEPTED_VERSION = /^\d{1,3}\.\d{1,3}\.\d{1,4}(?:[-.][A-Za-z0-9]+)?$/;
  const state = { loaded: null, latest: null, checking: false, checkedAt: 0, failed: false, skipped: null };
  let notice = null;

  async function fetchVersion() {
    // A unique URL plus no-store avoids stale regular browser HTTP caches.
    // This does not override an arbitrarily misconfigured proxy or HA service worker.
    const url = MANIFEST + '?pala_check=' + Date.now();
    const reply = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
    if (!reply.ok) throw new Error('HTTP ' + reply.status + ' bij versiecontrole');
    const body = await reply.json();
    if (!body || body.schema !== 1 || typeof body.version !== 'string' || !ACCEPTED_VERSION.test(body.version)) {
      throw new Error('Ongeldig PalaSidebar-versiebestand');
    }
    return body.version;
  }

  function clearNotice() {
    notice?.remove();
    notice = null;
  }

  function showNotice(version) {
    if (notice || state.skipped === version || document.hidden) return;
    const box = document.createElement('div');
    box.id = 'palasidebar-update-notice';
    box.setAttribute('role', 'status');
    box.setAttribute('aria-live', 'polite');
    // Shadow DOM keeps HA/PalaSidebar UI global font and button overrides out.
    const root = box.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      :host { position:fixed;z-index:2147483000;bottom:max(18px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(92vw,410px);font-family:var(--primary-font-family,Roboto,system-ui,sans-serif);box-sizing:border-box;pointer-events:auto; }
      .wrap { display:flex;align-items:center;gap:10px;padding:11px 12px;border:1px solid var(--divider-color,#6b8da780);border-radius:15px;background:var(--card-background-color,#1c2b3c);color:var(--primary-text-color,#f4f8ff);box-shadow:0 12px 35px #0005; }
      .text { flex:1;min-width:0;line-height:1.35; }
      strong { display:block;font-size:13px; }
      small { display:block;font-size:11px;color:var(--secondary-text-color,#b6c5d5); }
      button { background:var(--primary-color,#38bdf8);color:var(--text-primary-color,#071925);border:0;border-radius:9px;padding:8px 10px;font:700 12px var(--primary-font-family,Roboto,system-ui,sans-serif);cursor:pointer;white-space:nowrap;min-height:34px; }
      button.later { background:transparent;color:var(--secondary-text-color,#b6c5d5);border:1px solid var(--divider-color,#677987); }
      button:focus-visible { outline:2px solid var(--primary-color,#38bdf8);outline-offset:2px; }
      @media (prefers-reduced-motion:reduce) { * { transition:none!important;animation:none!important; } }
    </style><div class="wrap"><div class="text"><strong>Nieuwe PalaSidebar beschikbaar</strong><small>Versie <span id="v"></span> · Geen cache wissen nodig</small></div><button id="update" type="button">Bijwerken</button><button id="later" class="later" type="button" aria-label="Later bijwerken">Later</button></div>`;
    root.querySelector('#v').textContent = version;
    root.querySelector('#update').addEventListener('click', () => {
      clearNotice();
      // Plain reload stays inside the HA Companion WebView; do not append query
      // params to location because some Android versions open those externally.
      window.location.reload();
    });
    root.querySelector('#later').addEventListener('click', () => {
      state.skipped = version;
      clearNotice();
    });
    (document.body || document.documentElement).appendChild(box);
    notice = box;
  }

  async function check(force = false) {
    if (state.checking) return { ...state };
    if (!force && (document.hidden || Date.now() - state.checkedAt < MIN_ACTIVE_INTERVAL)) return { ...state };
    state.checking = true;
    state.checkedAt = Date.now();
    try {
      state.latest = await fetchVersion();
      state.failed = false;
      if (state.loaded && state.latest !== state.loaded) showNotice(state.latest);
      else if (state.loaded === state.latest) clearNotice();
    } catch (err) {
      state.failed = true;
      // One warning on load / manual check, not every background poll.
      if (force) console.warn('[PalaSidebar AutoLoader] Versiecontrole niet beschikbaar:', err.message);
    } finally { state.checking = false; }
    return { ...state };
  }

  async function start() {
    if (window.__PALA_SIDEBAR_RUNNING__) {
      console.warn('[PalaSidebar AutoLoader] Oude en nieuwe resource tegelijk geladen. Verwijder de directe pala-sidebar.js-verwijzing.');
      return;
    }
    let version = null;
    try { version = await fetchVersion(); }
    catch (err) {
      state.failed = true;
      console.warn('[PalaSidebar AutoLoader] Versiebestand niet gevonden; verse JavaScript rechtstreeks laden.', err.message);
    }
    state.checkedAt = Date.now();
    state.latest = version;
    // If version.json is temporarily absent, a unique query still ensures
    // a freshly fetched JS file on each app/page startup.
    const query = version ? '?v=' + encodeURIComponent(version) : '?fresh=' + Date.now();
    try {
      await import(MAIN + query);
      state.loaded = version;
      console.info('%c PalaSidebar AutoLoader %c ' + (version || 'laatste JS') + ' geladen · cachevriendelijk',
        'background:#183047;color:#e7f5ff;padding:3px 7px;border-radius:5px;font-weight:700',
        'color:inherit;font-weight:500');
    } catch (err) {
      console.error('[PalaSidebar AutoLoader] PalaSidebar kon niet worden geladen. Controleer of ' + MAIN + ' bestaat.', err);
    }
  }

  window.PalaSidebarUpdater = Object.freeze({
    check: () => check(true),
    status: () => ({ ...state }),
    reload: () => window.location.reload()
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) check();
  });
  window.addEventListener('pageshow', () => check());
  setInterval(() => { if (!document.hidden) check(); }, CHECK_INTERVAL);
  start();
})();
