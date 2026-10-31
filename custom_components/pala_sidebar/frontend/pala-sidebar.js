/**
 * PalaSidebar 2.0.0 – custom_components integratie met AutoLoader.
 * Copyright (c) 2026 Robin Bouwman. See repository LICENSE and PROVENANCE.md. No external JavaScript dependencies.
 * Leest uitsluitend HA-status; voert geen services uit zonder interactie.
 * Integratie via native ha-sidebar slot indien beschikbaar; anders overlay.
 */
(() => {
  'use strict';
  const VERSION = '2.0.0';
  const SERVER_RECOVERY_KEY='palasidebar.recovery.v1';
  const RECOVERY_LIMIT=5;
  // Native Home Assistant server-side storage. Cleared browser data cannot remove this.
  const SERVER_PREFS_KEY = 'palasidebar.preferences.v1';
  const KEY = 'palas.sidebar.v1';
  const CONFIG_URL = '/pala_sidebar/config.json';
  // Production console: one startup record and meaningful warnings only.
  // Call PalaSidebarDiagnostics() manually for details. Never log user IDs,
  // private configuration, sensor values, access tokens or settings contents.
  const DIAG_PREFIX='[PalaSidebar '+VERSION+']';
  const bootInfo={phase:'start',config:'pending',integration:'pending',storage:'pending',oldModule:false,issue:null};
  const warnOnce=new Set();
  const logWarning=(code,message)=>{
    if(warnOnce.has(code))return;
    warnOnce.add(code);
    console.warn('%c ⚠ PalaSidebar '+VERSION+' %c '+message,
      'background:#92400e;color:#fff4db;padding:3px 7px;border-radius:5px;font-weight:700',
      'color:inherit;font-weight:500');
  };
  // DevTools shows one polished, expandable record instead of a stream of
  // startup lines. The actual HA/storage state is never guessed as "ready".
  const logStartup=(item)=>{
    const rows=[
      ['HOME ASSISTANT',item.hass?.config?.version||'verbinding wordt opgebouwd'],
      ['NAVIGATIE',item.integration==='native'?'native Home Assistant':item.integration==='overlay'?'sidebar-overlay':String(item.integration||'initialiseren')],
      ['CONFIGURATIE',bootInfo.config],
      ['ACCOUNTOPSLAG',item._prefsStore?.status||'wordt gekoppeld'],
      ['DIAGNOSE','PalaSidebarReport()']
    ];
    console.groupCollapsed(
      '%c ▦ PALASIDEBAR %c v'+VERSION+' %c ✓ geladen ',
      'background:#152439;color:#e8f2ff;padding:5px 9px;border-radius:6px 0 0 6px;font-weight:800',
      'background:#2563eb;color:#fff;padding:5px 8px;font-weight:700',
      'background:#065f46;color:#d1fae5;padding:5px 9px;border-radius:0 6px 6px 0;font-weight:700'
    );
    for(const [name,value] of rows){
      console.info('%c '+name+' %c '+value,
        'color:#67c8ff;font-weight:750','color:inherit;font-weight:500');
    }
    console.groupEnd();
  };
  const legacySources=()=>{
    const patterns=/PalaFix[_-]AllesInEen|palafix-ha-all.?in.?one/i;
    const urls=[...document.querySelectorAll('script[src]')].map(node=>node.getAttribute('src')||'');
    try{urls.push(...performance.getEntriesByType('resource').map(r=>r.name||''));}catch{}
    return [...new Set(urls.filter(v=>patterns.test(v)).map(v=>{
      try{return new URL(v,location.href).pathname;}catch{return v;}
    }))];
  };
  // A PerformanceResourceTiming entry means a request was ATTEMPTED, not
  // that the module was loaded. 404 requests must never be reported as active.
  const legacyModuleActive=()=>bootInfo.oldModule||!!window.__palafixHaAllInOneV110;
  const checkLegacySource=()=>{
    const old=legacySources();
    if(!old.length)return;
    if(legacyModuleActive()){
      logWarning('old-pfx-active','Oude losse vormgevingsmodule is ook actief ('+old.join(', ')+'). Verwijder de oude resourceverwijzing om stijlconflicten te voorkomen.');
    }else{
      logWarning('old-pfx-request','Verouderde verwijzing naar een losse vormgevingsmodule gevonden ('+old.join(', ')+'). De aanvraag kan een 404 geven. Verwijder de regel onder frontend.extra_module_url in configuration.yaml, herstart Home Assistant en herlaad de pagina.');
    }
  };
  if (window.__PALA_SIDEBAR_RUNNING__) return;
  window.__PALA_SIDEBAR_RUNNING__ = true;

  // v1.3.38: De oude, losse Alles-in-een-resource maakte een eigen zwevend
  // tandwiel aan. De functionaliteit is in PalaSidebar geïntegreerd: verwijder
  // uitsluitend die bekende legacy-host en zijn CSS, nooit andere HA-knoppen.
  const LEGACY_PALAFIX_IDS = new Set([
    'palafix-ha-settings-host',
    'palafix-ha-style-v110',
    'palafix-ha-user-settings-v110',
    'palafix-ha-style-v100'
  ]);
  const removeLegacyPalaFix = () => {
    let removed=false;
    for (const id of LEGACY_PALAFIX_IDS) {
      const node=document.getElementById(id);
      if(node){node.remove();removed=true;}
    }
    if(removed){bootInfo.oldModule=true;logWarning('old-pfx-dom','Een oude vormgevingsknop/stijllaag is opgeruimd. Verwijder ook de oude resource uit Home Assistant.');}
  };
  const watchLegacyPalaFix = () => {
    removeLegacyPalaFix();
    if (!document.body || !document.head || typeof MutationObserver !== 'function') return;
    // Alleen directe kinderen van body/head: geen dure volledige DOM-observer.
    // Nodig omdat HA een oude extra_module_url ook na PalaSidebar kan laden.
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === 1 && LEGACY_PALAFIX_IDS.has(node.id)) {
            node.remove();bootInfo.oldModule=true;
            logWarning('old-pfx-dom','Oude vormgevingsresource nog actief: zwevende knop/CSS opgeruimd. Verwijder de resourceverwijzing in Home Assistant.');
          }
        }
      }
    });
    observer.observe(document.body, {childList:true});
    observer.observe(document.head, {childList:true});
  };
  removeLegacyPalaFix();
  if (document.body) watchLegacyPalaFix();
  else document.addEventListener('DOMContentLoaded', watchLegacyPalaFix, {once:true});

  const FALLBACK = {
    schema: 1, title: 'PalaSidebar', subtitle: 'Mijn Home Assistant', mode: 'auto',
    appearance: {accent:'#38bdf8', density:'compact', show_clock:true, show_search:true, show_recent:true, show_favorites:true, show_update_count:true, repeat_recent:false},
    theme: {preset:'classic',dynamic:'off',scene:'auto',weather_entity:'',rain_sensor:'',effects:'gentle',accent_source:'theme',accent_color:'#38bdf8',weather_opacity:'balanced'},
    header: {ha:'hidden',ha_title:'',pala:'compact',title:'',subtitle:'',logo:true,logo_mode:'account',clock:true,extra:'',align:'left',title_color:'',subtitle_color:'',extra_color:'',title_size:12,subtitle_size:9,logo_text:'P',logo_icon:'',logo_bg:'',logo_color:'',background_color:'',clock_color:'',show_quick:true,show_settings:true},
    discovery: {enabled:true, title:'Andere dashboards', include_system_panels:false, exclude:['config','profile','developer-tools','notifications']},
    groups: [
      {id:'start',title:'START',items:[{id:'home',label:'Overzicht',path:'/lovelace',icon:'mdi:view-dashboard-outline'}]},
      {id:'beheer',title:'BEHEER',admin_only:true,items:[
        {id:'integraties',label:'Integraties',path:'/config/integrations',icon:'mdi:puzzle-outline'},
        {id:'updates',label:'Updates',path:'/config/updates',icon:'mdi:update',badge:'updates'},
        {id:'apparaten',label:'Apparaten',path:'/config/devices/dashboard',icon:'mdi:devices'},
        {id:'entiteiten',label:'Entiteiten',path:'/config/entities',icon:'mdi:format-list-bulleted'},
        {id:'automatiseringen',label:'Automatiseringen',path:'/config/automation',icon:'mdi:robot-outline'},
        {id:'scripts',label:'Scripts',path:'/config/script',icon:'mdi:script-text-outline'},
        {id:'helpers',label:'Helpers',path:'/config/helpers',icon:'mdi:hand-heart-outline'},
        {id:'ontwikkelaar',label:'Ontwikkelaarstools',path:'/developer-tools',icon:'mdi:hammer-wrench'},
        {id:'hacs',label:'HACS',path:'/hacs',icon:'mdi:store-outline',requires_panel:'hacs'},
        {id:'add-ons',label:'Add-ons',path:'/hassio/dashboard',icon:'mdi:puzzle',requires_panel:'hassio'}
      ]}
    ], quick_entities:[], profiles:[], mobile:{enabled:true,dock:false,dock_labels:true,dock_items:['home','energie','media'],back_button:true,back_closes_menu:true,swipe_open:true,swipe_close:true,haptics:false,tablet_dock:false}
  };
  // Snelkoppelingen zijn per HA-gebruiker instelbaar. Geen persoonlijke routes
  // of dashboards in de distributie: alleen bestaande HA-dashboards worden ontdekt.

  const DESIGN_DEFAULT={spacing:'normal',radius:12,typography:100,icons:21,rail_icons:'auto',shadow:'soft',dialog_width:'comfortable',chevrons:'glass'};
  const cleanDesign=(raw)=>{
    const v=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    return {
      spacing:['tight','normal','airy'].includes(v.spacing)?v.spacing:'normal',
      radius:clamp(Number.isFinite(Number(v.radius))?Math.round(Number(v.radius)):12,4,24),
      typography:clamp(Number.isFinite(Number(v.typography))?Math.round(Number(v.typography)):100,85,125),
      icons:clamp(Number.isFinite(Number(v.icons))?Math.round(Number(v.icons)):21,17,28),
      rail_icons:v.rail_icons==='auto'||v.rail_icons===undefined||v.rail_icons===null?'auto':clamp(Number.isFinite(Number(v.rail_icons))?Math.round(Number(v.rail_icons)):21,17,30),
      shadow:['none','soft','depth'].includes(v.shadow)?v.shadow:'soft',
      dialog_width:['compact','comfortable','wide'].includes(v.dialog_width)?v.dialog_width:'comfortable',
      chevrons:['glass','ios','glow'].includes(v.chevrons)?v.chevrons:'glass'
    };
  };
  // PalaSidebar 2.0: isolated, opt-in features. Existing v1 settings are not touched.
  const cleanLiveCenter=(raw)=>{
    const v=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    const tiles=Array.isArray(v.tiles)?v.tiles:[];
    return {enabled:v.enabled===true,collapsed:v.collapsed===true,tiles:tiles.slice(0,6).filter(x=>x&&typeof x==='object').map(x=>({
      label:String(x.label||'').trim().slice(0,36),
      entity:isEntity(x.entity)?x.entity:'',
      icon:isSafeIcon(x.icon)?x.icon:'mdi:information-outline',action:x.action==='toggle'?'toggle':'more-info'
    })).filter(x=>x.entity)};
  };
  // Beta5: previous beta shipped the menu switched off even after installation.
  // Migrate only the old unconfigured flag; once a user chooses off it stays off.
  const cleanContextMenu=(raw)=>({
    enabled:raw?.configured===true?raw.enabled===true:true,
    configured:raw?.configured===true
  });
  const cleanPerformanceCenter=(raw)=>({enabled:raw?.enabled===true,profile:['full','balanced','fast'].includes(raw?.profile)?raw.profile:'full'});
  const cleanThemeSnapshots=(raw)=>Array.isArray(raw)?raw.slice(0,8).filter(x=>x&&typeof x==='object'&&typeof x.name==='string'&&x.name.trim()).map(x=>({
    id:/^[a-z0-9_-]{1,36}$/.test(x.id||'')?x.id:String(x.name).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,36)||'preset',
    name:String(x.name).trim().slice(0,32),theme:cleanTheme(x.theme)
  })):[];
  // PalaSidebar UI is integrated here, not loaded as another HA resource.
  // No polling, style observers or second floating settings launcher.
  const PFX_STYLE_ID='pala-sidebar-ui-integrated-v200';
  // Original v1.1.0 style, loaded ONLY in the opt-in classic profile.
  // No settings button, listener or timer from the old standalone script.
  const PFX_CLASSIC_CSS=`/* PalaSidebar UI | Home Assistant theme resource v1.0.0
   Samengevoegd uit mijnfont.css, loadfonts.js, loadhacsfont.js
   en loadhacsfontandstyle.js.
   ESPHome-bestanden mijn_layout.js en mijn_layout.css worden bewust
   NIET geladen in Home Assistant: dit is een andere webapplicatie.
   Fontbestand blijft apart op /local/supercellmagic.ttf.
*/
@font-face {
  font-family: "Supercell-Magic";
  src: url("/local/supercellmagic.ttf") format("truetype");
  font-style: normal;
  font-display: swap;
}

/* Eén plek voor overerfbare typografie, kleur, energie en layout-tokens.
   CSS custom properties erven ook door open/closed shadow-root hosts. */
:root {
  --md-sys-color-background: rgba(25,25,30,0.32) !important;
  --md-sys-color-surface-variant: rgba(45,45,55,0.38) !important;
  --md-sys-color-surface-container: rgba(35,35,45,0.30) !important;
  --md-sys-color-surface-container-low: rgba(30,30,40,0.28) !important;
  --md-sys-color-surface-container-high: rgba(45,45,55,0.36) !important;
  --md-sys-color-surface-container-highest: rgba(55,55,65,0.40) !important;
  --md-sys-color-outline: rgba(255,255,255,0.08) !important;
  --md-sys-color-outline-variant: rgba(255,255,255,0.05) !important;
  --mdc-theme-surface: rgba(25,25,30,0.32) !important;
  --md-sys-color-inverse-surface: rgba(10,10,15,0.85) !important;
  --md-sys-color-inverse-on-surface: rgba(255,255,255,0.88) !important;
  --md-sys-color-on-background: rgba(240,240,245,0.96) !important;
  --md-sys-color-on-surface: rgba(240,240,245,0.95) !important;
  --ha-sidebar-background: rgba(25,25,30,0.34) !important;
  --ha-card-background: var(--lovelace-background) !important;
  --ha-card-border-color: rgba(255,255,255,0.06) !important;
  --ha-card-box-shadow: 0 6px 24px rgba(0,0,0,0.35) !important;
  --divider-color: rgba(255,255,255,0.08) !important;
  --state-icon-color: var(--md-sys-color-on-surface-variant) !important;
  --ha-card-header-font-size: var(--md-sys-typescale-headline-small-size) !important;
  --energy-line-glow: 0 0 8px rgba(255,210,130,0.25) !important;
  --gauge-glow: 0 0 10px rgba(255,195,100,0.35) !important;
  --lovelace-background: radial-gradient(circle at 30% 40%,rgba(255,255,255,0.10) 0%,rgba(245,235,220,0.07) 35%,rgba(40,35,28,0.04) 100%),linear-gradient(135deg,rgba(30,30,40,0.40) 0%,rgba(25,25,35,0.42) 50%,rgba(20,20,30,0.45) 100%),radial-gradient(circle at 80% 70%,rgba(225,180,90,0.08),transparent 70%) !important;
  --app-header-background-color: rgba(30,30,35,0.7) !important;
  --app-header-edit-background-color: rgba(35,35,40,0.75) !important;
  --app-header-edit-text-color: var(--auto-ink) !important;
  --app-header-border-bottom: 1px solid rgba(255,255,255,0.08) !important;
  --app-header-backdrop-filter: blur(14px) saturate(160%) brightness(0.9) !important;
  --md-menu-item-label-text-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-ref-typeface-plain: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --paper-font-subhead_-_font-weight: 300 !important;
  --md-sys-typescale-display-large-size: calc(32px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-display-medium-size: calc(27px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-display-small-size: calc(18px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-headline-large-size: calc(18px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-headline-medium-size: calc(17px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-headline-small-size: calc(12px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-title-large-size: calc(14px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-title-medium-size: calc(12px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-title-small-size: calc(10px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-body-large-size: calc(11px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-body-medium-size: calc(10px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-body-small-size: calc(9px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-label-large-size: calc(11px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-label-medium-size: calc(10px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --md-sys-typescale-label-small-size: calc(9px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --mdc-typography-body1-font-size: calc(11px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --mdc-typography-body2-font-size: calc(10px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --mdc-typography-subtitle1-font-size: calc(12px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --mdc-typography-subtitle2-font-size: calc(10px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --mdc-typography-button-font-size: calc(11px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --mdc-typography-caption-font-size: calc(9px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --mdc-typography-overline-font-size: calc(9px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --ha-font-size-s: calc(10px * var(--pala-sidebar-ui-font-scale, 1)) !important;
  --ha-font-size-m: var(--md-sys-typescale-headline-small-size) !important;
  --paper-font-body1_-_font-size: var(--mdc-typography-body1-font-size) !important;
  --paper-font-body2_-_font-size: var(--mdc-typography-body2-font-size) !important;
  --paper-font-subhead_-_font-size: var(--mdc-typography-subtitle1-font-size) !important;
  --paper-font-caption_-_font-size: var(--mdc-typography-caption-font-size) !important;
  --paper-font-headline_-_font-size: var(--mdc-typography-subtitle1-font-size) !important;
  --paper-font-title_-_font-size: var(--mdc-typography-subtitle2-font-size) !important;
  --paper-font-button_-_font-size: var(--mdc-typography-button-font-size) !important;
  --md-sys-color-primary: rgba(255,215,0,0.75) !important;
  --md-sys-color-secondary: rgba(255,190,60,0.75) !important;
  --md-sys-color-tertiary: rgba(255,150,0,0.75) !important;
  --md-sys-color-inverse-primary: rgba(255,235,120,0.75) !important;
  --md-sys-color-error: rgba(225,60,20,0.8) !important;
  --md-sys-color-on-error: rgba(255,255,255,0.95) !important;
  --md-sys-color-success: rgba(67,160,71,0.8) !important;
  --md-sys-color-warning: rgba(255,170,80,0.8) !important;
  --md-sys-color-info: rgba(0,180,210,0.8) !important;
  --energy-grid-consumption-color-0: rgba(255,130,130,0.95) !important;
  --energy-grid-consumption-color-1: rgba(255,100,100,0.95) !important;
  --energy-grid-consumption-color-2: rgba(245,70,70,0.95) !important;
  --energy-grid-consumption-color-3: rgba(225,45,60,0.95) !important;
  --energy-grid-consumption-color-4: rgba(195,35,55,0.95) !important;
  --energy-grid-consumption-color-5: rgba(165,25,45,0.95) !important;
  --energy-grid-consumption-color-6: rgba(130,20,35,0.95) !important;
  --energy-grid-consumption-color: rgba(235,60,65,0.95) !important;
  --energy-solar-color-0: rgba(240,170,60,0.95) !important;
  --energy-solar-color-1: rgba(245,180,75,0.95) !important;
  --energy-solar-color-2: rgba(250,190,95,0.95) !important;
  --energy-solar-color-3: rgba(255,205,115,0.95) !important;
  --energy-solar-color-4: rgba(255,220,135,0.95) !important;
  --energy-solar-color-5: rgba(255,230,155,0.95) !important;
  --energy-solar-color-6: rgba(255,240,175,0.95) !important;
  --energy-solar-color: rgba(245,182,66,0.95) !important;
  --energy-grid-return-color-0: rgba(0,150,160,0.95) !important;
  --energy-grid-return-color-1: rgba(0,165,175,0.95) !important;
  --energy-grid-return-color-2: rgba(0,180,190,0.95) !important;
  --energy-grid-return-color-3: rgba(25,195,205,0.95) !important;
  --energy-grid-return-color-4: rgba(55,215,220,0.95) !important;
  --energy-grid-return-color-5: rgba(95,235,235,0.95) !important;
  --energy-grid-return-color-6: rgba(145,250,245,0.95) !important;
  --energy-grid-return-color: rgba(0,180,200,0.95) !important;
  --energy-battery-in-color-0: rgba(0,120,245,0.95) !important;
  --energy-battery-in-color-1: rgba(0,145,255,0.95) !important;
  --energy-battery-in-color-2: rgba(35,170,255,0.95) !important;
  --energy-battery-in-color-3: rgba(70,195,255,0.95) !important;
  --energy-battery-in-color-4: rgba(110,220,255,0.95) !important;
  --energy-battery-in-color-5: rgba(150,240,255,0.95) !important;
  --energy-battery-in-color-6: rgba(190,255,255,0.95) !important;
  --energy-battery-in-color: rgba(0,160,255,0.95) !important;
  --energy-battery-out-color-0: rgba(255,205,120,0.95) !important;
  --energy-battery-out-color-1: rgba(245,185,105,0.95) !important;
  --energy-battery-out-color-2: rgba(235,170,90,0.95) !important;
  --energy-battery-out-color-3: rgba(225,155,80,0.95) !important;
  --energy-battery-out-color-4: rgba(210,135,65,0.95) !important;
  --energy-battery-out-color-5: rgba(190,115,55,0.95) !important;
  --energy-battery-out-color-6: rgba(170,95,45,0.95) !important;
  --energy-battery-out-color: rgba(225,175,85,0.95) !important;
  --energy-gas-color-0: rgba(210,70,20,0.9) !important;
  --energy-gas-color-1: rgba(230,85,30,0.9) !important;
  --energy-gas-color-2: rgba(250,100,45,0.9) !important;
  --energy-gas-color-3: rgba(255,120,65,0.9) !important;
  --energy-gas-color-4: rgba(255,140,85,0.9) !important;
  --energy-gas-color-5: rgba(255,165,105,0.9) !important;
  --energy-gas-color-6: rgba(255,185,125,0.9) !important;
  --energy-gas-color: rgba(230,90,30,0.9) !important;
  --energy-water-color-0: rgba(140,160,85,0.9) !important;
  --energy-water-color-1: rgba(155,175,100,0.9) !important;
  --energy-water-color-2: rgba(170,190,115,0.9) !important;
  --energy-water-color-3: rgba(185,205,130,0.9) !important;
  --energy-water-color-4: rgba(200,220,145,0.9) !important;
  --energy-water-color-5: rgba(215,235,160,0.9) !important;
  --energy-water-color-6: rgba(230,250,175,0.9) !important;
  --energy-water-color: rgba(170,195,120,0.9) !important;
  --energy-non-fossil-color-0: rgba(40,190,160,0.9) !important;
  --energy-non-fossil-color-1: rgba(55,205,170,0.9) !important;
  --energy-non-fossil-color-2: rgba(70,220,180,0.9) !important;
  --energy-non-fossil-color-3: rgba(90,235,190,0.9) !important;
  --energy-non-fossil-color-4: rgba(120,245,200,0.9) !important;
  --energy-non-fossil-color-5: rgba(150,255,210,0.9) !important;
  --energy-non-fossil-color-6: rgba(180,255,220,0.9) !important;
  --energy-non-fossil-color: rgba(51,214,176,0.9) !important;
  --gauge-color: var(--md-sys-color-success) !important;
  --gauge-warning-color: var(--md-sys-color-warning) !important;
  --gauge-critical-color: var(--md-sys-color-error) !important;
  --gauge-background-color: rgba(255,255,255,0.10) !important;
  --md-sys-elevation-level0: none !important;
  --md-sys-elevation-level1: rgba(from var(--md-sys-color-shadow) r g b / 0.2) 0px 2px 1px -1px, rgba(from var(--md-sys-color-shadow) r g b / 0.14) 0px 1px 1px 0px, rgba(from var(--md-sys-color-shadow) r g b / 0.12) 0px 1px 3px 0px !important;
  --md-sys-elevation-level2: rgba(from var(--md-sys-color-shadow) r g b / 0.2) 0px 3px 3px -2px, rgba(from var(--md-sys-color-shadow) r g b / 0.14) 0px 3px 4px 0px, rgba(from var(--md-sys-color-shadow) r g b / 0.12) 0px 1px 8px 0px !important;
  --md-sys-elevation-level3: rgba(from var(--md-sys-color-shadow) r g b / 0.2) 0px 3px 5px -1px, rgba(from var(--md-sys-color-shadow) r g b / 0.14) 0px 6px 10px 0px, rgba(from var(--md-sys-color-shadow) r g b / 0.12) 0px 1px 18px 0px !important;
  --md-sys-elevation-level4: rgba(from var(--md-sys-color-shadow) r g b / 0.2) 0px 5px 5px -3px, rgba(from var(--md-sys-color-shadow) r g b / 0.14) 0px 8px 10px 1px, rgba(from var(--md-sys-color-shadow) r g b / 0.12) 0px 3px 14px 2px !important;
  --md-sys-elevation-level5: rgba(from var(--md-sys-color-shadow) r g b / 0.2) 0px 7px 8px -4px, rgba(from var(--md-sys-color-shadow) r g b / 0.14) 0px 12px 17px 2px, rgba(from var(--md-sys-color-shadow) r g b / 0.12) 0px 5px 22px 4px !important;
  --md-sys-shape-corner-extra-large-top: 28px 28px 0 0 !important;
  --md-sys-shape-corner-large-top: 16px 16px 0 0 !important;
  --md-sys-shape-corner-large-end: 0 16px 16px 0 !important;
  --md-sys-shape-corner-large-start: 16px 0 0 16px !important;
  --md-sys-shape-corner-extra-small-top: 4px 4px 0 0 !important;
  --md-sys-shape-corner-none: 0 !important;
  --font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --primary-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --secondary-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --ha-card-header-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --ha-font-family-body: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --mdc-typography-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --mdc-theme-typography: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --mdc-theme-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-body-large-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-body-medium-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-body-small-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-label-large-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-label-medium-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-label-small-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-title-large-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-title-medium-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-title-small-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-headline-large-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-headline-medium-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-headline-small-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-display-large-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-display-medium-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-typescale-display-small-font: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --paper-font-common-base_-_font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --paper-font-common-code_-_font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --paper-font-body1_-_font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --paper-font-subhead_-_font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --paper-font-headline_-_font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --paper-font-caption_-_font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --paper-font-title_-_font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --mdc-typography-headline6-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --mdc-typography-subtitle1-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --mdc-typography-subtitle2-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --mdc-typography-button-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --mdc-typography-body1-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --mdc-typography-body2-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --mdc-typography-caption-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --mdc-typography-overline-font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic") !important;
  --md-sys-shape-corner-extra-small: 20px !important;
  --md-sys-shape-corner-small: 20px !important;
  --md-sys-shape-corner-medium: 20px !important;
  --md-sys-shape-corner-large: 20px !important;
  --md-sys-shape-corner-full: 999px !important;
  --text-light-primary-color: #ffffff !important;
  --md-sys-shape-corner-extra-large: 28px !important;
  --ha-card-border-radius: 28px !important;
  --ha-dialog-border-radius: 28px !important;
  --bubble-pop-up-border-radius: var(--md-sys-shape-corner-extra-large) !important;
  --pala-sidebar-border-color: #00a88400 !important;
  --card-background-color: rgba(0,0,0,0.73) !important;
}

/* Gerichte lettertype-overrides: geen dure \`*\`-selector en geen
   tekstschaduw op duizenden dashboardelementen. */
html, body, home-assistant,
ha-app-layout, ha-main, ha-panel-lovelace,
ha-sidebar, ha-panel-hacs, hacs-entry-panel,
ha-settings-dashboard, ha-dialog, ha-more-info-dialog,
ha-card, .formulaone-font {
  font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic"), sans-serif !important;
}
button, input, select, textarea, md-list-item, md-menu-item,
md-filled-text-field, md-outlined-text-field,
mwc-button, mwc-tab, mwc-list-item, mwc-menu-item,
hacs-entry-panel .mdc-data-table__header-cell {
  font-family: var(--pala-sidebar-ui-font-family, "Supercell-Magic"), sans-serif !important;
}

/* Sidebar: transparant glas op de achtergrond, zonder extra DOM-mutaties. */
ha-sidebar {
  --mdc-drawer-surface-background-color: var(--pala-sidebar-ui-sidebar-surface, rgba(20,20,25,.45)) !important;
  --ha-sidebar-background: var(--pala-sidebar-ui-sidebar-surface, rgba(20,20,25,.45)) !important;
}
ha-sidebar .mdc-drawer,
ha-sidebar .mdc-drawer__surface {
  background-color: var(--pala-sidebar-ui-sidebar-surface, rgba(20,20,25,.45)) !important;
  backdrop-filter: var(--pala-sidebar-ui-sidebar-filter, blur(10px) saturate(140%));
  -webkit-backdrop-filter: var(--pala-sidebar-ui-sidebar-filter, blur(10px) saturate(140%));
}
ha-sidebar .mdc-list-item:hover,
ha-sidebar .mdc-list-item--activated {
  background-color: rgba(255,255,255,.08) !important;
}
ha-user-badge {
  --text-light-primary-color: #fff !important;
  --_light-primary-color: rgba(0,0,0,.55) !important;
}
ha-user-badge::part(initials) {
  text-shadow: 0 1px 2px #000;
}

/* Kaarten behouden uitstraling, geen backdrop-filter op ieder kaartje.
   Dat laatste veroorzaakt vooral bij PalaKiosk extra GPU-compositing. */
ha-card {
  border-radius: var(--ha-card-border-radius, 28px) !important;
  --ha-card-background: var(--lovelace-background);
}

/* Dialog is een afzonderlijke overlay; blur hier heeft beperkte impact. */
ha-dialog .mdc-dialog__surface,
.mdc-dialog .mdc-dialog__surface {
  background: rgba(25,25,35,.6) !important;
  backdrop-filter: var(--pala-sidebar-ui-dialog-filter, blur(12px) saturate(135%)) !important;
  -webkit-backdrop-filter: var(--pala-sidebar-ui-dialog-filter, blur(12px) saturate(135%)) !important;
  border-radius: var(--ha-dialog-border-radius, 28px) !important;
  border: 1px solid rgba(255,255,255,.08) !important;
  box-shadow: 0 8px 30px rgba(0,0,0,.45) !important;
}
.mdc-dialog .mdc-dialog__scrim {
  background: rgba(0,0,0,.55) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Consistente ronde elementen uit originele stijl. */
.mdc-data-table,
.mdc-menu-surface,
.mdc-text-field,
.mdc-chip,
.mdc-snackbar,
.md-icon-button,
.mdc-button,
mwc-menu,
md-outlined-select,
md-filled-select {
  border-radius: var(--pala-sidebar-ui-control-radius, 20px) !important;
}
.mdc-data-table {
  box-sizing: border-box !important;
  overflow: auto !important;
}
.mdc-data-table__cell,
.mdc-data-table__header-cell {
  border-radius: 0 !important;
}
.mdc-data-table__row:hover {
  background-color: color-mix(in srgb, var(--primary-color) 15%, transparent) !important;
}
.mdc-data-table__header-cell.sortable.not-sorted {
  font-size: .875rem !important;
  line-height: 1.375rem !important;
  font-weight: 500 !important;
}

/* Zachte lichtaccenten waar deze classes werkelijk gebruikt worden. */
.energy-line { filter: drop-shadow(var(--energy-line-glow, 0 0 8px rgba(255,210,130,.25))) !important; }
.gauge { filter: drop-shadow(var(--gauge-glow, 0 0 10px rgba(255,195,100,.35))) !important; }

/* Toegankelijkheid: eigen instellingen minder beweging respecteren. */
@media (prefers-reduced-motion: reduce) {
  .energy-line, .gauge { filter: none !important; }
}
`;
  const PFX_OLD_LOCAL_KEY='palafix.ha.allinone.settings.v1';
  const PFX_ENERGY={
    energyGrid:['energy-grid-consumption','#eb3c41','Netafname'],
    energySolar:['energy-solar','#f5b642','Zonnepanelen'],
    energyReturn:['energy-grid-return','#00b4c8','Teruglevering'],
    energyBatteryIn:['energy-battery-in','#00a0ff','Batterij laden'],
    energyBatteryOut:['energy-battery-out','#e1af55','Batterij ontladen'],
    energyGas:['energy-gas','#e65a1e','Gas'],
    energyWater:['energy-water','#aac378','Water'],
    energyGreen:['energy-non-fossil','#33d6b0','Niet-fossiel']
  };
  const PFX_FONTS={
    ha:'var(--primary-font-family, var(--ha-font-family-body, system-ui, sans-serif))',
    supercell:'"Supercell-Magic", system-ui, sans-serif',
    roboto:'Roboto, Arial, sans-serif',
    system:'system-ui, -apple-system, sans-serif',
    arial:'Arial, Helvetica, sans-serif'
  };
  const PFX_DEFAULT=Object.freeze({
    enabled:true,font:'ha',fontScale:100,mobileScale:100,accentMode:'ha',accent:'#ffd700',
    background:'ha',glass:45,cardRadius:20,controlRadius:14,
    sidebarBlur:true,dialogBlur:true,shadows:true,energyGlow:true,energyMode:'ha',
    ...Object.fromEntries(Object.entries(PFX_ENERGY).map(([key,val])=>[key,val[1]]))
  });
  const pfxClean=(raw)=>{
    const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    const v={...PFX_DEFAULT};
    if(Object.prototype.hasOwnProperty.call(PFX_FONTS,r.font))v.font=r.font;
    if(['ha','glass','flat','amoled','classic'].includes(r.background))v.background=r.background;
    if(['ha','custom'].includes(r.accentMode))v.accentMode=r.accentMode;
    if(['ha','custom'].includes(r.energyMode))v.energyMode=r.energyMode;
    for(const [key,min,max] of [['fontScale',75,160],['mobileScale',75,160],['glass',15,95],['cardRadius',0,44],['controlRadius',0,32]]){
      if(r[key]!==''&&r[key]!=null&&Number.isFinite(Number(r[key])))v[key]=clamp(Math.round(Number(r[key])),min,max);
    }
    for(const k of ['enabled','sidebarBlur','dialogBlur','shadows','energyGlow'])if(typeof r[k]==='boolean')v[k]=r[k];
    for(const key of ['accent',...Object.keys(PFX_ENERGY)])if(/^#[a-f0-9]{6}$/i.test(r[key]||''))v[key]=r[key].toLowerCase();
    return v;
  };
  const pfxLegacy=(raw)=>{
    const a=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:null;
    if(!a)return null;
    const p={...a};
    if(!['ha','glass','flat','amoled','classic'].includes(p.background))p.background=p.background==='original'?'classic':'ha';
    p.accentMode='custom';p.energyMode='custom';p.mobileScale=p.fontScale||100;
    return pfxClean(p);
  };
  // Controls the entire HA frontend only when explicitly configured. Original
  // fixed dark Material colors are intentionally NOT copied: they broke light
  // themes and could override PalaSidebar's own animated weather background.
  // Global styling is controlled entirely through the integrated PalaSidebar
  // settings. Unlike the v1.3.37 renderer, this covers BOTH modern Material 3
  // tokens and legacy MDC/HA typography variables which are still used by
  // custom dashboards. Variables are set on the Home Assistant host as well
  // as documentElement because HA themes may define values on the host.
  const pfxStyles=(raw)=>{
    const v=pfxClean(raw);if(!v.enabled)return '';
    const rules=[];const vars=[];
    const classic=v.background==='classic';
    const needsTypography=classic||v.font!=='ha'||v.fontScale!==100||v.mobileScale!==100;
    const font=PFX_FONTS[v.font];
    if(v.font!=='ha'){
      const tokens=['--pala-sidebar-ui-font-family','--primary-font-family','--secondary-font-family',
        '--font-family','--ha-font-family-body','--ha-card-header-font-family','--mdc-typography-font-family',
        '--mdc-theme-typography','--mdc-theme-font-family','--md-ref-typeface-plain',
        '--md-ref-typeface-brand','--md-menu-item-label-text-font'];
      for(const token of tokens)vars.push(token+':'+font+'!important;');
      for(const type of ['body','label','title','headline','display'])for(const size of ['small','medium','large']){
        vars.push('--md-sys-typescale-'+type+'-'+size+'-font:'+font+'!important;');
      }
      for(const type of ['body1','body2','subtitle1','subtitle2','button','caption','headline6','overline']){
        vars.push('--mdc-typography-'+type+'-font-family:'+font+'!important;');
      }
      for(const type of ['body1','body2','subhead','headline','caption','title','button','common-base','common-code']){
        vars.push('--paper-font-'+type+'_-_font-family:'+font+'!important;');
      }
      rules.push('html,html body,home-assistant,ha-main,ha-panel-lovelace,ha-card,ha-dialog,ha-more-info-dialog,md-list-item,md-menu-item,md-filled-text-field,md-outlined-text-field,mwc-button,input,select,textarea{font-family:'+font+'!important;}');
    }
    // The HA-default profile at 100% leaves the current HA theme untouched.
    // Scale all tokens used by v1.1.0 and newer HA versions for consistent UI.
    const scaleTokens=[
      ['--md-sys-typescale-display-large-size',classic?32:45],
      ['--md-sys-typescale-display-medium-size',classic?27:36],
      ['--md-sys-typescale-display-small-size',classic?18:29],
      ['--md-sys-typescale-headline-large-size',classic?18:32],
      ['--md-sys-typescale-headline-medium-size',classic?17:28],
      ['--md-sys-typescale-headline-small-size',classic?12:24],
      ['--md-sys-typescale-title-large-size',classic?14:22],
      ['--md-sys-typescale-title-medium-size',classic?12:16],
      ['--md-sys-typescale-title-small-size',classic?10:14],
      ['--md-sys-typescale-body-large-size',classic?11:16],
      ['--md-sys-typescale-body-medium-size',classic?10:14],
      ['--md-sys-typescale-body-small-size',classic?9:12],
      ['--md-sys-typescale-label-large-size',classic?11:14],
      ['--md-sys-typescale-label-medium-size',classic?10:12],
      ['--md-sys-typescale-label-small-size',classic?9:11],
      ['--mdc-typography-body1-font-size',classic?11:16],
      ['--mdc-typography-body2-font-size',classic?10:14],
      ['--mdc-typography-subtitle1-font-size',classic?12:16],
      ['--mdc-typography-subtitle2-font-size',classic?10:14],
      ['--mdc-typography-button-font-size',classic?11:14],
      ['--mdc-typography-caption-font-size',classic?9:12],
      ['--mdc-typography-overline-font-size',classic?9:12],
      ['--ha-font-size-s',classic?10:12],['--ha-font-size-m',classic?12:14],
      ['--ha-font-size-l',classic?14:18]
    ];
    const typography=(scale)=>{
      const vscale=scale/100;
      return '--pala-sidebar-ui-font-scale:'+vscale.toFixed(3)+'!important;'+scaleTokens.map(([name,px])=>name+':'+(px*vscale).toFixed(2)+'px!important;').join('');
    };
    // In classic mode the original CSS has lower specificity (:root) than our
    // overrides below. This makes each slider immediately effective.
    if(needsTypography){
      vars.push(typography(v.fontScale));
      if(v.mobileScale!==v.fontScale)rules.push('@media(max-width:700px){html:root,home-assistant{'+typography(v.mobileScale)+'}}');
    }
    if(v.accentMode==='custom'){
      vars.push('--primary-color:'+v.accent+'!important;');
      vars.push('--md-sys-color-primary:'+v.accent+'!important;');
      vars.push('--md-sys-color-secondary:color-mix(in srgb,'+v.accent+' 75%,white 25%)!important;');
      vars.push('--md-sys-color-tertiary:color-mix(in srgb,'+v.accent+' 75%,#ff7600 25%)!important;');
    }
    if(v.background==='glass'){
      vars.push('--lovelace-background:linear-gradient(145deg,color-mix(in srgb,var(--primary-background-color,#18202b) '+(100-v.glass*.12).toFixed(1)+'%,var(--card-background-color,#263442)),var(--primary-background-color,#18202b))!important;');
    }else if(v.background==='flat'){
      vars.push('--lovelace-background:var(--primary-background-color)!important;');
    }else if(v.background==='amoled'){
      vars.push('--lovelace-background:#050506!important;--card-background-color:#09090c!important;');
      vars.push('--md-sys-color-background:#050506!important;--app-header-background-color:#09090c!important;');
    }
    if(v.background==='classic'){
      // The original opacity was controlled by --pala-sidebar-ui-sidebar-surface.
      // This token was lost in the first integration.
      vars.push('--pala-sidebar-ui-sidebar-surface:rgba(20,20,25,'+(v.glass/100).toFixed(2)+')!important;');
    }
    if(classic||v.cardRadius!==20){vars.push('--ha-card-border-radius:'+v.cardRadius+'px!important;--ha-dialog-border-radius:'+v.cardRadius+'px!important;--md-sys-shape-corner-extra-large:'+v.cardRadius+'px!important;');}
    if(classic||v.controlRadius!==14){
      vars.push('--md-sys-shape-corner-small:'+v.controlRadius+'px!important;--md-sys-shape-corner-medium:'+v.controlRadius+'px!important;--md-sys-shape-corner-large:'+v.controlRadius+'px!important;--pala-sidebar-ui-control-radius:'+v.controlRadius+'px!important;');
    }
    if(v.energyMode==='custom')for(const [key,[prefix]] of Object.entries(PFX_ENERGY)){
      const c=v[key];vars.push('--'+prefix+'-color:'+c+'!important;');
      for(let i=0;i<=6;i++)vars.push('--'+prefix+'-color-'+i+':color-mix(in srgb,'+c+' '+(100-Math.abs(i-3)*9)+'%,'+(i<3?'#05070a':'white')+')!important;');
    }
    if(!v.sidebarBlur){vars.push('--pala-sidebar-ui-sidebar-filter:none!important;');rules.push('ha-sidebar .mdc-drawer__surface{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}');}
    else if(v.background!=='ha'&&!classic){rules.push('ha-sidebar .mdc-drawer__surface{backdrop-filter:blur(8px) saturate(130%);-webkit-backdrop-filter:blur(8px) saturate(130%)}');}
    if(!v.dialogBlur){vars.push('--pala-sidebar-ui-dialog-filter:none!important;');if(classic)rules.push('ha-dialog .mdc-dialog__surface,.mdc-dialog .mdc-dialog__surface{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}');}
    else if(!classic)rules.push('ha-dialog .mdc-dialog__surface,.mdc-dialog .mdc-dialog__surface{backdrop-filter:blur(10px) saturate(130%);-webkit-backdrop-filter:blur(10px) saturate(130%)}');
    if(!v.shadows){vars.push('--ha-card-box-shadow:none!important;');rules.push('ha-card{box-shadow:none!important}');}
    if(v.energyGlow&&!classic)rules.push('.energy-line{filter:drop-shadow(0 0 7px color-mix(in srgb,var(--energy-solar-color,#f5b642) 28%,transparent))}.gauge{filter:drop-shadow(0 0 7px color-mix(in srgb,var(--energy-grid-consumption-color,#eb3c41) 25%,transparent))}');
    if(!v.energyGlow){rules.push('.energy-line,.gauge{filter:none!important;}');}
    const fontFace=v.font==='supercell'&&!classic?'@font-face{font-family:"Supercell-Magic";src:url("/local/supercellmagic.ttf") format("truetype");font-style:normal;font-display:swap;}':'';
    // The active HA theme remains untouched unless the user opts into classic
    // or changes a property. Existing v1.1.0 classic CSS is retained in its
    // own opt-in profile for visual parity with the previous standalone JS.
    return (classic?PFX_CLASSIC_CSS:'')+'\n'+fontFace+'\nhtml:root,home-assistant{'+vars.join('')+'}\n'+rules.join('\n');
  };
  // Agenda is deliberately opt-in: upgrading never changes existing navigation.
  const AGENDA_WASTE_CALENDARS = ['calendar.afval_gft','calendar.afval_pmd','calendar.afval_papier','calendar.afval_restafval'];
  // Exact dezelfde kleuren als sensor.op_welke_kleur_staat_afvalbeheer.
  // Die sensor geeft alleen de kleur van de eerstvolgende afvalsoort terug;
  // de agenda kleurt daarom elk eigen agendaitem met het corresponderende palet.
  const AGENDA_WASTE_COLORS=Object.freeze({gft:'#1ffa02',papier:'#c4c4c4',pmd:'#05eafa',restafval:'#fa6305'});
  function agendaWasteColor(id,summary){
    const key=String(id||'').toLowerCase();
    if(key==='calendar.afval_gft')return AGENDA_WASTE_COLORS.gft;
    if(key==='calendar.afval_pmd')return AGENDA_WASTE_COLORS.pmd;
    if(key==='calendar.afval_papier')return AGENDA_WASTE_COLORS.papier;
    if(key==='calendar.afval_restafval')return AGENDA_WASTE_COLORS.restafval;
    // Andere agenda's mogen ook afvalitems bevatten; herken alleen de titel.
    const title=String(summary||'').toLowerCase();
    if(/\b(gft|groen[\s,]+tuin[\s,]+en[\s,]+fruit)\b/.test(title))return AGENDA_WASTE_COLORS.gft;
    if(/\b(pmd|plastic[\s,]+metaal[\s,]+en[\s,]+drinkpakken)\b/.test(title))return AGENDA_WASTE_COLORS.pmd;
    if(/\bpapier\b/.test(title))return AGENDA_WASTE_COLORS.papier;
    if(/\brestafval\b/.test(title))return AGENDA_WASTE_COLORS.restafval;
    return '';
  }

  const AGENDA_DEFAULT = {enabled:false,calendars:[],days:30,limit:3,title:'Mijn agenda',collapsed:false,theme:'sidebar',size:'normal',showCalendar:true};
  function cleanAgenda(value){
    const v=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    return {
      enabled:v.enabled===true,
      calendars:[...new Set(arr(v.calendars).filter(id=>/^calendar\.[a-z0-9_]+$/.test(id)))].slice(0,20),
      days:[7,14,30,60].includes(Number(v.days))?Number(v.days):30,
      limit:[1,2,3,4,5].includes(Number(v.limit))?Number(v.limit):3,
      title:text(v.title||'Mijn agenda').slice(0,40)||'Mijn agenda',
      collapsed:v.collapsed===true,
      theme:['sidebar','soft','glass'].includes(v.theme)?v.theme:'sidebar',
      size:['mini','compact','normal','comfortable'].includes(v.size)?v.size:'normal',
      showCalendar:v.showCalendar!==false
    };
  }
  const EMPTY_PREFS = () => ({favorites:[], recent:[], closed:[], links:[], quick_links:[], quick_auto:true, badge_overrides:{}, action_overrides:{}, quick_entities:null,
    section_overrides:{},section_order:[],custom_groups:[],item_groups:{},item_labels:{},item_icons:{},item_dynamic:{},item_order:[],
    search_config:{visible:true,placeholder:'Zoeken in menu…   Ctrl + K'},footer_config:{show_settings:true,show_version:true,show_status:true,show_restart:true,ha_settings:true,ha_notifications:true,ha_profile:true,link:''},show_quick_link:true,repeat_recent:false, accent:'', density:'', mode:'', device:'auto', hidden:[], quick_order:[],quick_hidden:[], mobile_dock:null, mobile_swipe:null, dialog_motion:'smooth', dialog_style:'lift', dialog_backdrop:'normal', rail_motion:'smooth', agenda:cleanAgenda(AGENDA_DEFAULT), design:cleanDesign(DESIGN_DEFAULT), ui_style:null,     mobile_v131_migrated:false,header_v133_migrated:false, header:null, theme:null,
    live_center:cleanLiveCenter(null), context_menu:cleanContextMenu(null), performance_center:cleanPerformanceCenter(null), theme_snapshots:[]});
  const $ = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = String(text);
    return el;
  };
  // One mathematically centered chevron icon for sections, agenda and live preview.
  // Unlike font glyphs and CSS border-corners its geometry does not depend on
  // Supercell Magic, text metrics or optical translateX/translateY offsets.
  const makeChevron = cls => {
    const holder=$('span',cls);
    holder.setAttribute('aria-hidden','true');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 20 20');
    svg.setAttribute('width','14');
    svg.setAttribute('height','14');
    svg.setAttribute('focusable','false');
    svg.setAttribute('aria-hidden','true');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d','M5.5 7.75L10 12.25L14.5 7.75');
    path.setAttribute('fill','none');
    path.setAttribute('stroke','currentColor');
    path.setAttribute('stroke-width','1.9');
    path.setAttribute('stroke-linecap','round');
    path.setAttribute('stroke-linejoin','round');
    svg.append(path);holder.append(svg);
    return holder;
  };
  const text = value => String(value ?? '').trim();
  const arr = value => Array.isArray(value) ? value : [];
  const clamp = (n,min,max) => Math.max(min, Math.min(max, n));
  const colour = value => /^#[0-9a-f]{6}$/i.test(value||'') ? value : '#38bdf8';
  const safeHex = value => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(text(value))?text(value):'';
  const colorNames={red:'#ef4444',green:'#22c55e',orange:'#f59e0b',yellow:'#eab308',blue:'#3b82f6',cyan:'#06b6d4',purple:'#a855f7',pink:'#ec4899',white:'#ffffff',black:'#000000',gray:'#9ca3af',grey:'#9ca3af'};
  // Home Assistant template sensors can return literal RGB strings (e.g.
  // rgb(31,250,2)), not only HEX codes or named colours. Validate each channel
  // strictly before using any sensor value as a CSS colour. Return canonical HEX
  // to keep the existing badge, icon and title colour paths in sync.
  const sensorColor = value => {
    const raw=String(value??'').trim();
    const hex=safeHex(raw);
    if(hex)return hex.length===4?'#'+[...hex.slice(1)].map(c=>c+c).join(''):hex.toLowerCase();
    const named=colorNames[raw.toLowerCase()];
    if(named)return named;
    const match=/^rgb(a)?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1(?:\.0+)?|0?\.\d+))?\s*\)$/i.exec(raw);
    if(!match || (!!match[1] !== (match[5]!==undefined)))return '';
    const channels=[Number(match[2]),Number(match[3]),Number(match[4])];
    if(channels.some(c=>!Number.isInteger(c)||c<0||c>255))return '';
    if(match[5]!==undefined && (Number(match[5])<0||Number(match[5])>1))return '';
    // Badge colours are solid; for rgba values the validated RGB channels win.
    return '#'+channels.map(c=>c.toString(16).padStart(2,'0')).join('');
  };
  const hex6 = value => {
    const hex=safeHex(value);
    return hex.length===4?'#'+[...hex.slice(1)].map(c=>c+c).join(''):hex;
  };
  // Contrast only for a SOLID badge. Light greens/oranges need dark letters;
  // very dark user/sensor colours need light letters. Compare contrast ratios.
  // No per-frame observers or DOM measurement needed.
  const readableBadgeText = value => {
    const hex=hex6(value);
    if(!hex)return '#06141e';
    const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
      .map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));
    const luminance=.2126*c[0]+.7152*c[1]+.0722*c[2];
    const darkLum=.006; // approximate luminance of the chosen dark ink (#06141e)
    const darkContrast=(luminance+.05)/(darkLum+.05);
    const lightContrast=1.05/(luminance+.05);
    return darkContrast>=lightContrast?'#06141e':'#ffffff';
  };
  // Vloeiend kleurverloop: numerieke sensorwaarden tussen instelbare kleurpunten.
  // Buiten het bereik wordt het dichtstbijzijnde eindpunt gebruikt.
  // Geen eval, geen willekeurige CSS uit de sensor: uitsluitend gecontroleerde HEX-kleuren.
  const numericSensorValue = raw => {
    const value=String(raw??'').trim().replace(',','.');
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value))return NaN;
    const n=Number(value);return Number.isFinite(n)?n:NaN;
  };
  const parseColorStops = value => {
    const byNumber=new Map();
    for(const entry of text(value).split(/[;\n]/).slice(0,15)){
      const split=entry.indexOf('=');if(split<=0)continue;
      const n=numericSensorValue(entry.slice(0,split));
      const hex=hex6(entry.slice(split+1).trim());
      if(Number.isFinite(n)&&Math.abs(n)<=1e9&&hex)byNumber.set(n,hex);
    }
    return [...byNumber].sort((a,b)=>a[0]-b[0]);
  };
  const interpolateColor = (stops,raw) => {
    const n=numericSensorValue(raw);
    if(!Number.isFinite(n)||!stops.length)return '';
    if(n<=stops[0][0])return stops[0][1];
    if(n>=stops[stops.length-1][0])return stops[stops.length-1][1];
    for(let i=1;i<stops.length;i++){
      const [high,highHex]=stops[i], [low,lowHex]=stops[i-1];
      if(n>high)continue;
      const t=clamp((n-low)/(high-low),0,1);
      const part=(hex,offset)=>parseInt(hex.slice(offset,offset+2),16);
      const channel=offset=>Math.round(part(lowHex,offset)+(part(highHex,offset)-part(lowHex,offset))*t).toString(16).padStart(2,'0');
      return '#'+channel(1)+channel(3)+channel(5);
    }
    return '';
  };
  const gradientColor = (stops,raw) => interpolateColor(parseColorStops(stops),raw);
  const stopsFromRules = rules => {
    const result=new Map();
    for(const rule of text(rules).split(/[;\n]/).slice(0,15)){
      const split=rule.lastIndexOf('=');if(split<1)continue;
      const condition=rule.slice(0,split).trim();
      const color=hex6(rule.slice(split+1).trim())||hex6(sensorColor(rule.slice(split+1).trim()));
      const match=/^(?:>=|<=|>|<)?\s*([+-]?\d+(?:[.,]\d+)?)$/.exec(condition);
      if(!match||!color)continue;
      const n=numericSensorValue(match[1]);if(Number.isFinite(n))result.set(n,color);
    }
    return [...result].sort((a,b)=>a[0]-b[0]).map(([n,color])=>n+'='+color).join(';');
  };
  const badgeColor = (spec,states) => {
    if(!spec||typeof spec!=='object')return '';
    if(spec.color==='custom')return hex6(spec.custom_color)||'';
    if(spec.color!=='sensor')return '';
    const entity=spec.color_entity||spec.entity;
    const state=states?.[entity];
    const raw=spec.color_attribute?state?.attributes?.[spec.color_attribute]:state?.state;
    if(spec.color_transition==='direct')return sensorColor(raw)||hex6(spec.color_fallback)||'';
    if(spec.color_transition==='gradient')return gradientColor(spec.color_stops,raw)||hex6(spec.color_fallback)||'';
    return colorRules(spec.color_rules,raw)||sensorColor(raw)||hex6(spec.color_fallback)||'';
  };
  // No eval, HTML or style strings from sensors: only validated solid colours.
  const colorRules = (rules,state) => {
    const needle=String(state??'').trim().toLowerCase();
    for(const rule of text(rules).split(/[;\n]/).slice(0,15)){
      const pos=rule.lastIndexOf('=');if(pos<1)continue;
      const condition=rule.slice(0,pos).trim().toLowerCase();
      const chosen=sensorColor(rule.slice(pos+1));
      if(!chosen)continue;
      if(condition===needle)return chosen;
      // Numeric conditions are entered just like ordinary states: >25, <=10.
      // No eval or regex execution on sensor-controlled input.
      const match=/^(>=|<=|>|<)(-?\d+(?:[.,]\d+)?)$/.exec(condition);
      const between=/^(-?\d+(?:[.,]\d+)?)\s*\.\.\s*(-?\d+(?:[.,]\d+)?)$/.exec(condition);
      const numeric=Number(String(state).replace(',','.'));
      if(between && needle && Number.isFinite(numeric)){
        const low=Number(between[1].replace(',','.'));
        const high=Number(between[2].replace(',','.'));
        if(low<=numeric && numeric<high)return chosen;
      }
      if(match && needle && Number.isFinite(numeric) &&
        (match[1]==='>='?numeric>=Number(match[2].replace(',','.')):match[1]==='<='?numeric<=Number(match[2].replace(',','.')):
         match[1]==='>'?numeric>Number(match[2].replace(',','.')):numeric<Number(match[2].replace(',','.'))))return chosen;
    }
    return '';
  };
  const isSafeIcon = value => /^mdi:[a-z0-9-]{2,65}$/.test(value||'');
  const cleanId = value => text(value).replace(/[^\w-]/g,'-').slice(0,75);
  const validPath = value => {
    if (typeof value !== 'string' || !value || value.length > 512 || /[\u0000-\u001f\\]/.test(value)) return false;
    // Geen protocol-relatieve routes, geen javascript:-URLs of ingebedde credentials.
    if (value.startsWith('/') && !value.startsWith('//')) return true;
    try { const u = new URL(value); return /^https?:$/.test(u.protocol) && !u.username && !u.password; } catch {return false;}
  };
  // Only cross-origin URLs are external. Reading an <a>.href always yields an
  // absolute URL, including for /lovelace and /dashboard/... inside Home Assistant.
  // Checking for an 'http' prefix marked EVERY internal sidebar link as external.
  const pathIsExternal = value => {
    if (!validPath(value)) return false;
    try {
      const base = location.origin === 'null' ? document.baseURI : location.href;
      const appOrigin = location.origin === 'null' ? new URL(base).origin : location.origin;
      return new URL(value, base).origin !== appOrigin;
    } catch { return false; }
  };
  const routeKey = path => {
    if(!validPath(path))return '';
    try {
      const url=new URL(path,location.href);
      return (url.origin===location.origin?'local':url.origin)+url.pathname.replace(/\/+$/,'')+(url.search||'');
    }catch{return path;}
  };
  const own = (o,k) => Object.prototype.hasOwnProperty.call(o||{},k);
  const safeGet = (key) => {try{return localStorage.getItem(key)}catch{return null}};
  const safeSet = (key,value) => {try{localStorage.setItem(key,value)}catch{ /* privacy mode */ }};
  const safeRemove = key => {try{localStorage.removeItem(key)}catch{ /* privacy mode */ }};
  const readJSON = (s, fb) => {try {return JSON.parse(s)}catch{return fb}};
  const defaults = () => structuredClone(FALLBACK);
  const isEntity = value => /^[a-z0-9_]+\.[a-z0-9_]+$/.test(value||'');
  const serviceName = value => /^[a-z][a-z0-9_]{1,63}$/.test(value||'');
  // Override only known display options; values are plain text and never HTML.
  function cleanHeader(v){
    const x=v&&typeof v==='object'&&!Array.isArray(v)?v:{};
    return {
      ha:['normal','title-hidden','compact','hidden'].includes(x.ha)?x.ha:'hidden',
      ha_title:text(x.ha_title).slice(0,55),
      pala:['normal','compact','minimal','app','hidden'].includes(x.pala)?x.pala:'compact',
      title:text(x.title).slice(0,60),subtitle:text(x.subtitle).slice(0,90),
      logo:x.logo!==false,logo_mode:x.logo_mode==='custom'?'custom':'account',clock:x.clock!==false,
      extra:text(x.extra).slice(0,240),
      align:['left','center','right'].includes(x.align)?x.align:'left',
      title_color:safeHex(x.title_color),subtitle_color:safeHex(x.subtitle_color),extra_color:safeHex(x.extra_color),
      title_size:clamp(Number(x.title_size)||12,9,24),subtitle_size:clamp(Number(x.subtitle_size)||9,8,20),
      logo_text:text(x.logo_text||'P').slice(0,3),logo_icon:isSafeIcon(x.logo_icon)?x.logo_icon:'',
      logo_bg:safeHex(x.logo_bg),logo_color:safeHex(x.logo_color),
      background_color:safeHex(x.background_color),clock_color:safeHex(x.clock_color),
      show_quick:x.show_quick!==false,show_settings:x.show_settings!==false
    };
  }
  // Recognize only the v1.3.2 *shipped defaults*, not a deliberately selected
  // alternative. Custom titles, another layout or saved post-migration choices
  // remain untouched; they can always be changed back in the visual editor.
  function wasLegacyDefaultHeader(raw) {
    return !!raw && raw.ha==='title-hidden' && !text(raw.ha_title) &&
      (!raw.pala || raw.pala==='compact') && !text(raw.title) &&
      !text(raw.subtitle) && raw.logo!==false && raw.clock!==false;
  }
  function upgradeLegacyHeader(raw) {
    return wasLegacyDefaultHeader(raw) ? {...raw,ha:'hidden'} : raw;
  }
  const THEME_PRESETS=['classic','glass','ocean','forest','sunset','midnight','amoled','aurora','graphite','copper'];
  const THEME_DYNAMIC=['off','weather','daynight','season'];
  const THEME_EFFECTS=['off','gentle','normal','high'];
  const THEME_SCENES=['auto','rain','snow','sun','night','storm','clouds','mist','wind','spring','summer','autumn','winter'];
  const cleanTheme=(value) => {
    const x=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    return {
      preset:THEME_PRESETS.includes(x.preset)?x.preset:'classic',
      scene:THEME_SCENES.includes(x.scene)?x.scene:'auto',
      dynamic:THEME_DYNAMIC.includes(x.dynamic)?x.dynamic:'off',
      weather_entity:/^weather\.[a-z0-9_]+$/.test(x.weather_entity||'')?x.weather_entity:'',
      rain_sensor:isEntity(x.rain_sensor)?x.rain_sensor:'',
      effects:THEME_EFFECTS.includes(x.effects)?x.effects:'gentle',
      accent_source:['theme','custom','picker'].includes(x.accent_source)?x.accent_source:'theme',
      accent_color:hex6(x.accent_color)||'#38bdf8',
      weather_opacity:['subtle','balanced','vivid'].includes(x.weather_opacity)?x.weather_opacity:'balanced'
    };
  };
  const THEMES={
    classic:['#38bdf8','#243444','#172331','#edf5ff'],
    glass:['#8edaff','#273d55','#182a3b','#f4faff'],
    ocean:['#3be0d3','#124f67','#0b263a','#f1feff'],
    forest:['#85dc8a','#2b5046','#142a25','#f2fff2'],
    sunset:['#ffb072','#77475f','#34263c','#fff1e7'],
    midnight:['#a5a6ff','#272854','#10142e','#f3f0ff'],
    amoled:['#72d4ff','#111722','#000000','#f5faff'],
    aurora:['#85ffdf','#4c3f7b','#171a40','#f5f2ff'],
    graphite:['#c4d4e5','#293744','#111820','#f0f4f8'],
    copper:['#ffb878','#68433b','#241c22','#fff2e5']
  };
  const WEATHER_PALETTES={
    rain:['#71c9ff','#254962','#0c2336'],snow:['#badffd','#627e97','#30475e'],
    sun:['#ffd37d','#6078a1','#1e405f'],night:['#9caaff','#343c71','#151b3b'],
    clouds:['#b6d4f1','#425b73','#223749'],storm:['#baafff','#393954','#141b35'],
    mist:['#bbe1d8','#506e75','#293b48'],wind:['#8ed7d8','#315875','#162d40'],
    spring:['#94e7ad','#426a70','#213e44'],summer:['#ffd07d','#507fa4','#204b77'],
    autumn:['#ffc08a','#80513d','#382d29'],winter:['#c4dcff','#4c6a84','#25374a']
  };
  // v1.3.33: weather is an accent to the selected theme, not a completely
  // new bright background on every KNMI condition change. Share this palette
  // across the native HA drawer, floating drawer and the editor preview.
  function resolvedThemePalette(theme,scene){
    const base=THEMES[theme.preset]||THEMES.classic;
    const weather=theme.dynamic!=='off'&&scene?WEATHER_PALETTES[scene]:null;
    let accent=weather?weather[0]:base[0];
    let sky=base[1],ground=base[2];
    if(weather){
      const isLiveWeather=theme.dynamic==='weather';
      // Keep the user's selected preset dominant for live weather.
      // The other automatic modes retain their stronger palettes.
      sky=interpolateColor([[0,sky],[1,weather[1]]],isLiveWeather?.26:1);
      ground=interpolateColor([[0,ground],[1,weather[2]]],isLiveWeather?.19:1);
    }
    if(theme.preset==='amoled'){sky='#05070a';ground='#000000';}
    return {accent,sky,ground,fg:base[3]};
  }
  // Regenintensiteit in mm/u is iets anders dan een temperatuur of totale mm.
  // Negeer eenheden die geen neerslagintensiteit voorstellen. Een bron zonder
  // eenheid blijft mogelijk voor bestaande zelfgemaakte Buienalarm-sensoren.
  function validRainIntensity(entity){
    if(!entity)return false;
    const unit=String(entity.attributes?.unit_of_measurement||'').trim().toLowerCase().replace(/\s+/g,'');
    return !unit || ['mm/h','mm/u','mm/uur','mm/hr','in/h','in/hr','in/u'].includes(unit);
  }
  function seasonFor(month){return month<3||month===12?'winter':month<6?'spring':month<9?'summer':'autumn';}
  function weatherEffect(condition){
    if(['rainy','pouring','snowy-rainy'].includes(condition))return condition==='snowy-rainy'?'snow':'rain';
    if(condition==='snowy')return 'snow';
    if(condition==='hail')return 'snow';
    if(['lightning','lightning-rainy','exceptional'].includes(condition))return 'storm';
    if(condition==='sunny')return 'sun';
    if(condition==='clear-night')return 'night';
    if(condition==='fog')return 'mist';
    if(condition==='windy'||condition==='windy-variant')return 'wind';
    if(condition==='cloudy'||condition==='partlycloudy')return 'clouds';
    return '';
  }
  const badgeSpec = (value) => {
    if(value === 'updates')return 'updates';
    if(!value||typeof value!=='object')return '';
    // Optionele, begrensde statusregels; opgeslagen in dezelfde bestaande badgevoorkeur.
    const switch_entity=isEntity(value.switch_entity)?value.switch_entity:'';
    const switch_cases=switch_entity?arr(value.switch_cases).slice(0,3).map(row=>({
      state:text(row?.state).slice(0,70),entity:isEntity(row?.entity)?row.entity:'',
      prefix:text(row?.prefix).slice(0,24),text:text(row?.text).slice(0,80)
    })).filter(row=>row.state && (row.entity || row.text)):[];
    if(!isEntity(value.entity)&&!text(value.template)&&!switch_cases.length)return '';
    return {entity:isEntity(value.entity)?value.entity:'', attribute:text(value.attribute).slice(0,80),
      switch_entity:switch_cases.length?switch_entity:'',switch_cases,
      template:text(value.template).slice(0,500),auto_lines:value.auto_lines!==false,
      show:['always','on','nonzero','available'].includes(value.show)?value.show:'always',
      prefix:text(value.prefix).slice(0,24), suffix:text(value.suffix).slice(0,24),
      color:['accent','success','warning','danger','custom','sensor'].includes(value.color)?value.color:'accent',
      custom_color:hex6(value.custom_color)||'#38bdf8',
      color_entity:isEntity(value.color_entity)?value.color_entity:'',color_attribute:text(value.color_attribute).slice(0,80),
      color_rules:text(value.color_rules).slice(0,900),color_stops:text(value.color_stops).slice(0,900),color_transition:['gradient','direct'].includes(value.color_transition)?value.color_transition:'steps',color_fallback:hex6(value.color_fallback)||'',label_color_from_badge:value.label_color_from_badge===true,icon_color_from_badge:value.icon_color_from_badge===true,
      format:['auto','compact','days-hours','hours-minutes','clock','number'].includes(value.format)?value.format:'auto',
      layout:['right','below','above','left'].includes(value.layout)?value.layout:'right',
      style:['solid','soft','outline','plain','dot'].includes(value.style)?value.style:'solid',
      size:['small','normal','large'].includes(value.size)?value.size:'normal',
      max_chars:Number.isFinite(Number(value.max_chars))?clamp(Math.floor(Number(value.max_chars)),0,60):0,
      decimals:Number.isFinite(Number(value.decimals))?clamp(Math.floor(Number(value.decimals)),0,3):1};
  };
  const actionSpec = (value) => {
    if(!value||typeof value!=='object')return null;
    const type=value.type;
    if(type==='more-info'||type==='toggle')return isEntity(value.entity)?{type,entity:value.entity}:null;
    if(type==='dialog')return {type,title:text(value.title).slice(0,80),message:text(value.message).slice(0,1000),entity:isEntity(value.entity)?value.entity:''};
    if(type==='navigate')return validPath(value.path)?{type,path:value.path}:null;
    if(type==='service'){
      const domain=text(value.domain),service=text(value.service);
      return serviceName(domain)&&serviceName(service)&&isEntity(value.entity)?{type,domain,service,entity:value.entity,confirm:true}:null;
    }
    return null;
  };
  // Live status entities preserve old labels/icons. Dynamic sources are optional and
  // use the same safe MDI, entity_picture and emoji resolvers as menu items.
  const quickEntity = (x) => x && isEntity(x.entity_id) ? {
    entity_id:x.entity_id,
    label:text(x.label||x.entity_id).slice(0,60),
    icon:isSafeIcon(x.icon)?x.icon:'mdi:information-outline',
    title_entity:isEntity(x.title_entity)?x.title_entity:'',
    title_attribute:/^[a-zA-Z0-9_-]{1,80}$/.test(x.title_attribute||'')?x.title_attribute:'',
    icon_entity:isEntity(x.icon_entity)?x.icon_entity:'',
    icon_attribute:/^[a-zA-Z0-9_-]{1,80}$/.test(x.icon_attribute||'')?x.icon_attribute:'auto'
  }:null;
  const configItem = (i) => {
    if (!i || typeof i !== 'object') return null;
    const action=actionSpec(i.action),path=validPath(i.path)?i.path:'';
    if (!path && !action) return null;
    const id = cleanId(i.id || i.label || i.path);
    if (!id) return null;
    return {id,label:text(i.label || id).slice(0,90),path,icon:isSafeIcon(i.icon)?i.icon:'mdi:link-variant',
      group:text(i.group).slice(0,60),action,
      admin_only:!!i.admin_only, hide_mobile:!!i.hide_mobile, requires_panel:text(i.requires_panel),
      badge:badgeSpec(i.badge),visible_when:i.visible_when && typeof i.visible_when==='object'?i.visible_when:null};
  };
  function parseConfig(raw) {
    if (!raw || typeof raw!=='object'||Array.isArray(raw) || raw.schema !== 1) throw Error('Configuratie heeft schema: 1 nodig');
    const groups = arr(raw.groups).filter(g=>g && typeof g==='object' && !Array.isArray(g)).slice(0,32).map(g=>({
      id:cleanId(g.id || g.title),title:text(g.title||'Menu').slice(0,64),icon:isSafeIcon(g.icon)?g.icon:'mdi:folder-outline',
      admin_only:!!g.admin_only, collapsed:!!g.collapsed,
      items:arr(g.items).slice(0,100).map(configItem).filter(Boolean)
    })).filter(g=>g.id && g.items.length);
    // Restore newly added default management links for an untouched legacy BEHEER
    // group. User-customized groups are never expanded or overwritten.
    const defaultBeheer=FALLBACK.groups.find(g=>g.id==='beheer');
    for(const group of groups){
      if(group.id!=='beheer'||group.items.length!==2)continue;
      const legacy=[['integraties','/config/integrations'],['updates','/config/updates']];
      if(!legacy.every(([id,path])=>group.items.some(item=>item.id===id&&item.path===path)))continue;
      group.items.push(...defaultBeheer.items.slice(2).map(configItem));
    }
    const appearance={...FALLBACK.appearance,...(raw.appearance && typeof raw.appearance==='object' && !Array.isArray(raw.appearance)?raw.appearance:{})};
    const discovery={...FALLBACK.discovery,...(raw.discovery && typeof raw.discovery==='object' && !Array.isArray(raw.discovery)?raw.discovery:{})};
    const profiles=arr(raw.profiles).slice(0,25).filter(x=>x && typeof x==='object');
    const mobileInput=raw.mobile && typeof raw.mobile==='object' && !Array.isArray(raw.mobile)?raw.mobile:{};
    const mobile={...FALLBACK.mobile};
    for(const k of ['enabled','dock','dock_labels','back_button','back_closes_menu','swipe_open','swipe_close','haptics','tablet_dock'])
      if(typeof mobileInput[k]==='boolean')mobile[k]=mobileInput[k];
    if(Array.isArray(mobileInput.dock_items))mobile.dock_items=mobileInput.dock_items.filter(x=>typeof x==='string').map(cleanId).slice(0,3);
    return {schema:1,title:text(raw.title||'PalaSidebar').slice(0,60),subtitle:text(raw.subtitle ?? FALLBACK.subtitle).slice(0,90),
      mode:['auto','integrated','floating'].includes(raw.mode)?raw.mode:'auto',
      appearance,theme:cleanTheme(raw.theme||FALLBACK.theme),header:cleanHeader(upgradeLegacyHeader(raw.header||FALLBACK.header)),discovery,groups:groups.length?groups:defaults().groups,
      quick_entities:arr(raw.quick_entities).slice(0,8).map(quickEntity).filter(Boolean),
      profiles,mobile};
  }
  const CSS = `
:host{all:initial;--p-accent:#38bdf8;color:var(--primary-text-color,#e5ebf6);font:500 13px/1.4 var(--primary-font-family,Arial,sans-serif);box-sizing:border-box;}
/* v1.3.29: no accidental text selection when swiping or long-pressing.
   The same CSS is mounted in the sidebar and in its independent dialog portal.
   Keep actual inputs and editable regions selectable for copy/paste and editing. */
:host,:host *{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none}
:host :is(input,textarea,[contenteditable]:not([contenteditable="false"]),[role="textbox"]){
  -webkit-user-select:text!important;user-select:text!important;-webkit-touch-callout:default
}
*{box-sizing:border-box}[hidden]{display:none!important}button,input,select,textarea{font:inherit}button{cursor:pointer}button:disabled{opacity:.5;cursor:default}
:host([data-integration="native"]){display:block;width:100%;min-width:0}
:host([data-integration="floating"]){position:fixed;z-index:2147483000;inset:0;pointer-events:none}
.shell{color:var(--primary-text-color,#ecf0f9);width:100%;min-width:0;display:flex;flex-direction:column;--p-soft:color-mix(in srgb,var(--p-accent) 13%,transparent)}
:host([data-integration="floating"]) .shell{position:absolute;top:72px;left:12px;bottom:16px;width:min(306px,calc(100vw - 24px));border:1px solid var(--divider-color,#455060);border-radius:16px;background:var(--sidebar-background-color,var(--card-background-color,#1e2635));box-shadow:0 16px 48px #0006;pointer-events:auto;overflow:hidden;transform:translate3d(calc(-100% - 22px),0,0);opacity:0;transition:transform .32s cubic-bezier(.22,.8,.25,1),opacity .22s ease;will-change:transform}
:host([data-integration="floating"][data-open="true"]) .shell{transform:translate3d(0,0,0);opacity:1}
:host([data-integration="floating"]) .launch{position:absolute;left:12px;top:16px;background:var(--p-accent);color:#07121c;border:0;border-radius:14px;padding:12px;min-height:46px;min-width:46px;font-weight:850;box-shadow:0 4px 18px #0004;pointer-events:auto}
.launch{display:none}:host([data-integration="floating"]) .launch{display:flex;align-items:center;justify-content:center}
:host([data-integration="floating"]) .scrim{position:absolute;inset:0;pointer-events:none;background:#0000;transition:background .28s ease}
:host([data-integration="floating"][data-open="true"]) .scrim{pointer-events:auto;background:#0007}
.top{padding:13px 10px 8px;display:flex;align-items:center;gap:9px;min-width:0}
.logo{display:grid;place-items:center;color:#06151e;background:var(--p-accent);border-radius:11px;width:34px;height:34px;flex:0 0 34px;font-weight:900;font-size:16px}
/* Account avatar uses HA's own person/user badge, never a duplicate image lookup. */
.logo[data-do="profile"]{border:0;padding:0;cursor:pointer;overflow:hidden;background:transparent!important;border-radius:50%}
.logo[data-do="profile"]:hover{outline:2px solid var(--p-accent);outline-offset:1px}
.logo[data-do="profile"]:focus-visible{outline:2px solid var(--p-accent);outline-offset:2px}
.logo ha-user-badge{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;overflow:hidden;background:var(--light-primary-color,var(--p-accent));color:var(--text-light-primary-color,#10202b);font-size:12px;font-weight:800}
.brand{min-width:0;flex:1}.brand strong{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.brand small{display:block;color:var(--secondary-text-color,#9ca9b9);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.iconbtn{border:0;color:inherit;background:transparent;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;flex:0 0 32px}.iconbtn:hover,.group-toggle:hover,.nav-link:hover{background:var(--p-soft)}.iconbtn:focus-visible,.group-toggle:focus-visible,.nav-link:focus-visible{outline:2px solid var(--p-accent);outline-offset:-2px}
.ico{display:inline-flex;align-items:center;justify-content:center;width:23px;height:23px;flex:0 0 23px}.ico ha-icon{--mdc-icon-size:21px;width:21px;height:21px}.ico .fallback{font-size:16px}
.clock{font-variant-numeric:tabular-nums;color:var(--secondary-text-color,#9ca9b9);font-size:11px;padding:0 10px 8px}
.search{margin:3px 9px 10px;display:flex;align-items:center;gap:6px;border-radius:9px;background:var(--secondary-background-color,#2b3645);padding:7px 9px;border:1px solid var(--divider-color,#445);}
.search input{background:transparent;border:0;outline:none;color:inherit;min-width:0;width:100%;font-size:12px}.search input::placeholder{color:var(--secondary-text-color,#9ba6b7)}
.list{display:flex;flex-direction:column;gap:3px;padding:0 7px 8px;min-width:0}
:host([data-integration="floating"]) .list{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain}
/* Hide scrollbar chrome only. Wheel, touch and keyboard scrolling remain native. */
.list{scrollbar-width:none;-ms-overflow-style:none}
.list::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}
.group-title{display:flex;align-items:center;margin:11px 2px 4px;min-width:0;gap:4px}
.group-toggle{background:transparent;border:0;color:var(--secondary-text-color,#aab5c5);text-align:left;letter-spacing:.09em;font-size:10px;font-weight:750;flex:1;min-width:0;padding:6px 5px;border-radius:8px;display:flex;gap:8px;align-items:center;justify-content:space-between;transition:background-color 180ms ease,color 180ms ease}
/* Stable section DOM: animate the actual content rather than recreating menu rows. */
.group-content{display:grid;grid-template-rows:minmax(0,1fr);opacity:1;transition:grid-template-rows 380ms cubic-bezier(.2,.8,.2,1),opacity 260ms ease;min-width:0}
.group-content-inner{min-width:0;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:3px;transform:translateY(0);transition:transform 380ms cubic-bezier(.2,.8,.2,1)}
.group-content[data-collapsed="true"]{grid-template-rows:minmax(0,0fr);opacity:0;pointer-events:none}
.group-content[data-collapsed="true"] .group-content-inner{transform:translateY(-8px)}

.nav-row{display:flex;align-items:center;border-radius:10px;min-height:36px;min-width:0;position:relative}
.nav-row.active{background:var(--p-soft);color:var(--p-accent)}.nav-row.active:before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;background:var(--p-accent);border-radius:4px}
.nav-link{background:transparent;border:0;text-align:left;font:inherit;cursor:pointer;display:flex;align-items:center;gap:10px;padding:8px 9px;min-width:0;flex:1;text-decoration:none!important;color:inherit!important;border-radius:9px;min-height:36px;overflow:hidden}
.nav-label{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:550;font-size:12px;flex:1;min-width:62px}
.badge{transition:background-color .32s ease,color .32s ease;background:var(--p-accent);color:#04121b;font-size:10px;font-weight:850;line-height:1.4;min-width:18px;max-width:min(46%,120px);padding:2px 5px;border-radius:7px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:0 1 auto;font-variant-numeric:tabular-nums}
/* Multiline composite badges: keep explicit / automatic sensor line breaks at every placement. */
.nav-link .badge[data-multiline="true"]{white-space:pre-line;overflow-wrap:anywhere;word-break:normal;text-overflow:clip;line-height:1.35}
.nav-link[data-badge-layout="right"] .badge[data-multiline="true"]{max-width:min(59%,195px);flex:0 1 auto}
.nav-link[data-badge-layout="right"]:has(.badge[data-multiline="true"]) .nav-label{min-width:40px}
.nav-link[data-badge-layout="left"] .badge[data-multiline="true"]{max-width:120px}
.nav-link[data-badge-layout="below"] .badge[data-multiline="true"],.nav-link[data-badge-layout="above"] .badge[data-multiline="true"]{max-width:100%}
/* Wide sensor badges must never consume the entire navigation label. */
.nav-link[data-badge-layout="below"]{display:grid;grid-template-columns:23px minmax(0,1fr);grid-template-rows:auto auto;column-gap:10px;row-gap:3px;align-items:center;min-height:51px}
.nav-link[data-badge-layout="below"] .ico{grid-column:1;grid-row:1/3}
.nav-link[data-badge-layout="below"] .nav-label{grid-column:2;grid-row:1;min-width:0;width:100%}
.nav-link[data-badge-layout="below"] .badge{grid-column:2;grid-row:2;justify-self:start;max-width:100%;margin:0}
/* Composite badges retain real newlines for two-line F1/temperature summaries. */
.nav-link[data-badge-layout="below"] .badge,.nav-link[data-badge-layout="above"] .badge{white-space:pre-line;text-align:left;line-height:1.35}
.nav-link[data-badge-layout="above"]{display:grid;grid-template-columns:23px minmax(0,1fr);grid-template-rows:auto auto;column-gap:10px;row-gap:3px;align-items:center;min-height:51px}
.nav-link[data-badge-layout="above"] .ico{grid-column:1;grid-row:1/3}
.nav-link[data-badge-layout="above"] .nav-label{grid-column:2;grid-row:2;min-width:0;width:100%}
.nav-link[data-badge-layout="above"] .badge{grid-column:2;grid-row:1;justify-self:start;max-width:100%;margin:0}
.nav-link[data-badge-layout="left"]{display:grid;grid-template-columns:23px minmax(0,max-content) minmax(0,1fr);column-gap:7px;align-items:center}
.nav-link[data-badge-layout="left"] .ico{grid-column:1}
.nav-link[data-badge-layout="left"] .badge{grid-column:2;max-width:85px}
.nav-link[data-badge-layout="left"] .nav-label{grid-column:3;min-width:0}
.badge:is([data-color="sensor"],[data-color="custom"]){background:var(--p-badge-color,var(--p-accent));color:var(--p-badge-text,#06141e)}
.badge:is([data-color="sensor"],[data-color="custom"])[data-style="soft"]{background:color-mix(in srgb,var(--p-badge-color,var(--p-accent)) 27%,transparent);color:inherit}
.badge:is([data-color="sensor"],[data-color="custom"])[data-style="plain"],.badge:is([data-color="sensor"],[data-color="custom"])[data-style="outline"]{background:transparent;color:var(--p-badge-color,var(--p-accent))}
.nav-link .nav-label[data-dynamic-color="true"]{color:var(--p-label-color,inherit)!important;transition:color .32s ease}
.nav-link .ico[data-dynamic-color="true"]{color:var(--p-icon-color,inherit)!important;transition:color .32s ease}
.badge[data-size="small"]{font-size:9px;padding:1px 4px}.badge[data-size="large"]{font-size:12px;padding:3px 7px}
.badge[data-style="soft"]{background:color-mix(in srgb,var(--p-accent) 26%,transparent);color:inherit}
.badge[data-style="outline"]{background:transparent;color:var(--p-accent);outline:1px solid currentColor;outline-offset:-1px}
.badge[data-style="plain"]{background:transparent;color:var(--p-accent);padding-inline:0}
.badge[data-style="dot"]{width:10px;height:10px;min-width:10px;max-width:10px;padding:0;border-radius:50%;font-size:0;color:transparent}
.badge[data-style="dot"]:after{content:""}
.badge[data-color="success"][data-style="outline"],.badge[data-color="success"][data-style="plain"]{color:#4ade80}
.badge[data-color="warning"][data-style="outline"],.badge[data-color="warning"][data-style="plain"]{color:#fbbf24}
.badge[data-color="danger"][data-style="outline"],.badge[data-color="danger"][data-style="plain"]{color:#f87171}
.badge[data-color="success"][data-style="soft"]{background:#15803d45}
.badge[data-color="warning"][data-style="soft"]{background:#b4530945}
.badge[data-color="danger"][data-style="soft"]{background:#b91c1c45}
.nav-link[data-badge-layout="below"] .badge[data-style="dot"]{grid-row:2}
.empty{font-size:12px;color:var(--secondary-text-color,#9aa5b3);padding:15px 10px}.health{margin:8px 9px;border-top:1px solid var(--divider-color,#6675);padding:10px 0 5px;display:flex;flex-direction:column;gap:5px}.health-title{font-size:10px;font-weight:800;letter-spacing:.09em;color:var(--secondary-text-color,#9ba8b5)}
.entity{width:100%;border:0;background:transparent;color:inherit;padding:5px;display:flex;align-items:center;gap:7px;text-align:left;border-radius:7px}.entity:hover{background:var(--p-soft)}
.entity .health-icon{flex:0 0 23px;width:23px;height:23px;display:inline-flex;align-items:center;justify-content:center}
.entity .health-icon img.pala-sensor-picture{width:22px;height:22px;object-fit:contain;border-radius:5px}
.entity .health-label{min-width:0;flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.entity .value{margin-left:auto;font-weight:800;white-space:nowrap;font-size:11px;max-width:58%;text-overflow:ellipsis;overflow:hidden}
.footer{padding:9px;display:flex;align-items:center;flex-wrap:wrap;gap:5px;border-top:1px solid var(--divider-color,#6675);font-size:11px;color:var(--secondary-text-color,#9ba8b5)}.footer .right{margin-left:auto}
/* Own optional HA restart action: native HA footer + badges are untouched. */
.footer .pala-restart{width:100%;flex:1 1 100%;display:flex;align-items:center;justify-content:flex-start;gap:var(--p-ui-item-gap,10px);padding:9px 10px;min-height:40px;border:1px solid var(--divider-color,#ffffff24);background:var(--p-soft,#ffffff0a);color:var(--primary-text-color,inherit);border-radius:var(--p-ui-radius,12px);cursor:pointer;text-align:left;font:600 var(--p-ui-text-size,12px)/1.3 var(--primary-font-family,Roboto,Arial,sans-serif);transition:background .15s ease,border-color .15s ease}
.footer .pala-restart:hover{background:var(--p-accent-soft,#ffffff1a);border-color:var(--p-accent,#38bdf8)}
.footer .pala-restart:focus-visible{outline:2px solid var(--p-accent,#38bdf8);outline-offset:2px}
.footer .pala-restart:disabled{opacity:.55;cursor:wait}
.footer .pala-restart>.ico{width:var(--p-ui-icon-slot,23px);min-width:var(--p-ui-icon-slot,23px);height:var(--p-ui-icon-size,21px);display:inline-flex;align-items:center;justify-content:center}
.footer .pala-restart-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
:host([data-integration="native"][data-compact="true"]) .footer .pala-restart{flex:0 0 39px;width:39px;height:39px;min-height:39px;padding:0;gap:0;justify-content:center}
:host([data-integration="native"][data-compact="true"]) .footer .pala-restart-label{display:none}
@media(prefers-reduced-motion:reduce){.footer .pala-restart{transition:none}}

.message{font-size:11px;color:var(--p-accent);padding:6px 9px;line-height:1.35}
:host([data-density="compact"]) .nav-link{padding:6px 8px;min-height:33px}:host([data-density="compact"]) .nav-row{min-height:33px}
/* v1.3.14: native HA drawer owns WIDTH and opening/closing. Never hide labels
   using display:none at the beginning of that width transition: it causes the
   text, badges and section headings to snap out while icons still slide.
   Animate opacity AND occupied space together; keep the icon's leading edge
   stable, on both opening and closing. No JavaScript timers / redraws needed. */
:host([data-integration="native"]){--p-rail-duration:280ms;--p-rail-ease:cubic-bezier(.22,.8,.25,1)}
:host([data-integration="native"]) .top{transition:padding var(--p-rail-duration) var(--p-rail-ease),gap var(--p-rail-duration) var(--p-rail-ease)}
:host([data-integration="native"]) .logo{
  transition:width var(--p-rail-duration) var(--p-rail-ease),flex-basis var(--p-rail-duration) var(--p-rail-ease),opacity 170ms ease,transform var(--p-rail-duration) var(--p-rail-ease)
}
:host([data-integration="native"]) .brand{
  max-width:260px;transition:opacity 185ms ease,transform var(--p-rail-duration) var(--p-rail-ease),max-width var(--p-rail-duration) var(--p-rail-ease),flex-grow var(--p-rail-duration) var(--p-rail-ease)
}
:host([data-integration="native"]) .top .iconbtn{
  max-width:44px;transition:opacity 170ms ease,width var(--p-rail-duration) var(--p-rail-ease),min-width var(--p-rail-duration) var(--p-rail-ease),max-width var(--p-rail-duration) var(--p-rail-ease),flex-basis var(--p-rail-duration) var(--p-rail-ease),padding var(--p-rail-duration) var(--p-rail-ease)
}
:host([data-integration="native"]) .nav-link{transition:gap var(--p-rail-duration) var(--p-rail-ease),padding var(--p-rail-duration) var(--p-rail-ease),background .18s ease}
:host([data-integration="native"]) .nav-label{
  max-width:240px;visibility:visible;transition:opacity 180ms ease,transform var(--p-rail-duration) var(--p-rail-ease),max-width var(--p-rail-duration) var(--p-rail-ease),flex-grow var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear
}
:host([data-integration="native"]) .badge{
  visibility:visible;transition:opacity 150ms ease,max-width var(--p-rail-duration) var(--p-rail-ease),min-width var(--p-rail-duration) var(--p-rail-ease),padding var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear
}
:host([data-integration="native"]) .group-title{
  max-height:55px;overflow:hidden;visibility:visible;transition:opacity 160ms ease,max-height var(--p-rail-duration) var(--p-rail-ease),margin var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear
}
:host([data-integration="native"]) .clock{
  max-height:38px;overflow:hidden;visibility:visible;transition:opacity 165ms ease,max-height var(--p-rail-duration) var(--p-rail-ease),padding var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear
}
:host([data-integration="native"]) .search{
  max-height:62px;overflow:hidden;visibility:visible;transition:opacity 165ms ease,max-height var(--p-rail-duration) var(--p-rail-ease),margin var(--p-rail-duration) var(--p-rail-ease),padding var(--p-rail-duration) var(--p-rail-ease),border-width var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear
}
:host([data-integration="native"]) .health{
  max-height:460px;overflow:hidden;visibility:visible;transition:opacity 160ms ease,max-height var(--p-rail-duration) var(--p-rail-ease),margin var(--p-rail-duration) var(--p-rail-ease),padding var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear
}
:host([data-integration="native"]) .footer .footlabel{
  max-width:165px;overflow:hidden;white-space:nowrap;visibility:visible;transition:opacity 160ms ease,max-width var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear
}
:host([data-integration="native"]) .nav-row{transition:margin-bottom var(--p-rail-duration) var(--p-rail-ease)}

/* PalaSidebar motion preferences: only content transitions, never HA drawer width. */
:host([data-integration="native"][data-rail-motion="fast"]){--p-rail-duration:185ms}
:host([data-integration="native"][data-rail-motion="relaxed"]){--p-rail-duration:390ms}
:host([data-integration="native"][data-rail-motion="off"]){--p-rail-duration:0ms}
:host([data-integration="native"][data-rail-motion="off"]) :is(.top,.logo,.brand,.top .iconbtn,.nav-link,.nav-label,.badge,.group-title,.clock,.search,.health,.footer .footlabel,.nav-row){transition:none!important}
/* Icon-only desktop rail: fades out text *during* HA's native width animation. */
:host([data-compact="true"][data-integration="native"]) .top{padding:8px 2px;gap:0}
:host([data-compact="true"][data-integration="native"]) .brand{
  opacity:0;max-width:0;flex-grow:0;transform:translateX(-6px);pointer-events:none;visibility:hidden;transition:opacity 160ms ease,transform var(--p-rail-duration) var(--p-rail-ease),max-width var(--p-rail-duration) var(--p-rail-ease),flex-grow var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear var(--p-rail-duration)
}
:host([data-compact="true"][data-integration="native"]) .top .iconbtn:not([data-do="ha-menu"]){
  opacity:0;width:0;min-width:0;max-width:0;flex-basis:0;padding:0;overflow:hidden;pointer-events:none
}
:host([data-compact="true"][data-integration="native"]) .nav-label{
  opacity:0;max-width:0;min-width:0;flex-grow:0;flex-basis:0;transform:translateX(-5px);pointer-events:none;visibility:hidden;
  transition:opacity 160ms ease,transform var(--p-rail-duration) var(--p-rail-ease),max-width var(--p-rail-duration) var(--p-rail-ease),flex-grow var(--p-rail-duration) var(--p-rail-ease),flex-basis var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear var(--p-rail-duration)
}
:host([data-compact="true"][data-integration="native"]) .badge{
  opacity:0;min-width:0;max-width:0;padding:0;pointer-events:none;visibility:hidden;transition:opacity 140ms ease,max-width var(--p-rail-duration) var(--p-rail-ease),min-width var(--p-rail-duration) var(--p-rail-ease),padding var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear var(--p-rail-duration)
}
:host([data-compact="true"][data-integration="native"]) .group-title{
  opacity:0;max-height:0;margin-block:0;pointer-events:none;visibility:hidden;transition:opacity 160ms ease,max-height var(--p-rail-duration) var(--p-rail-ease),margin var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear var(--p-rail-duration)
}
:host([data-compact="true"][data-integration="native"]) .clock{
  opacity:0;max-height:0;padding-block:0;pointer-events:none;visibility:hidden;transition:opacity 160ms ease,max-height var(--p-rail-duration) var(--p-rail-ease),padding var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear var(--p-rail-duration)
}
:host([data-compact="true"][data-integration="native"]) .search{
  opacity:0;max-height:0;margin-block:0;padding-block:0;border-width:0;pointer-events:none;visibility:hidden;transition:opacity 160ms ease,max-height var(--p-rail-duration) var(--p-rail-ease),margin var(--p-rail-duration) var(--p-rail-ease),padding var(--p-rail-duration) var(--p-rail-ease),border-width var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear var(--p-rail-duration)
}
:host([data-compact="true"][data-integration="native"]) .health{
  opacity:0;max-height:0;margin-block:0;padding-block:0;pointer-events:none;visibility:hidden;transition:opacity 160ms ease,max-height var(--p-rail-duration) var(--p-rail-ease),margin var(--p-rail-duration) var(--p-rail-ease),padding var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear var(--p-rail-duration)
}
:host([data-compact="true"][data-integration="native"]) .footer .footlabel{
  opacity:0;max-width:0;pointer-events:none;visibility:hidden;transition:opacity 160ms ease,max-width var(--p-rail-duration) var(--p-rail-ease),visibility 0s linear var(--p-rail-duration)
}
:host([data-compact="true"][data-integration="native"]) .list{padding:0 3px}
:host([data-compact="true"][data-integration="native"]) .nav-link{padding:9px 9px;gap:0}
:host([data-compact="true"][data-integration="native"]) .nav-row{margin-bottom:4px}
:host([data-compact="true"][data-integration="native"]) .footer{padding:5px 2px;justify-content:center}
:host([data-compact="true"][data-integration="native"]) .footer .right{margin:0}

/* v1.3.29 — Icon-only rail: one uniform hit target per item.
   A badge can retain multiple lines (white-space: pre-line) while its width
   shrinks to zero. Its min-content height then expands a 41px link to 200px+.
   The desktop rail must explicitly suppress that layout, regardless of the
   full-width badge placement or the live sensor's contents. */
:host([data-integration="native"][data-compact="true"]) .nav-row{
  height:42px;min-height:42px;max-height:42px;
  flex:0 0 42px;overflow:hidden;margin-bottom:3px;
}
:host([data-integration="native"][data-compact="true"]) .nav-link,
:host([data-integration="native"][data-compact="true"]) .nav-link[data-badge-layout]{
  display:flex;flex-direction:row;align-items:center;justify-content:flex-start;
  width:100%;height:42px;min-height:42px;max-height:42px;
  flex:1 1 auto;overflow:hidden;padding:0 9px;gap:0;
}
:host([data-integration="native"][data-compact="true"]) .nav-link .ico{
  display:inline-flex;align-items:center;justify-content:center;
  width:var(--p-ui-rail-slot,23px);height:var(--p-ui-rail-slot,23px);
  min-width:var(--p-ui-rail-slot,23px);min-height:var(--p-ui-rail-slot,23px);
  max-width:var(--p-ui-rail-slot,23px);max-height:var(--p-ui-rail-slot,23px);
  flex:0 0 var(--p-ui-rail-slot,23px);grid-column:auto;grid-row:auto;overflow:hidden;
}
:host([data-integration="native"][data-compact="true"]) .nav-link .ico ha-icon,
:host([data-integration="native"][data-compact="true"]) .nav-link .ico img.pala-sensor-picture{
  --mdc-icon-size:var(--p-ui-rail-icon-size,21px);
  width:var(--p-ui-rail-icon-size,21px);height:var(--p-ui-rail-icon-size,21px);
  max-width:var(--p-ui-rail-icon-size,21px);max-height:var(--p-ui-rail-icon-size,21px);
  flex:0 0 var(--p-ui-rail-icon-size,21px);object-fit:contain;
}
:host([data-integration="native"][data-compact="true"]) .nav-link .ico svg{
  width:var(--p-ui-rail-icon-size,21px);height:var(--p-ui-rail-icon-size,21px);
  max-width:var(--p-ui-rail-icon-size,21px);max-height:var(--p-ui-rail-icon-size,21px);
}
:host([data-integration="native"][data-compact="true"]) .nav-link .ico :is(.pala-sensor-emoji,.fallback){
  font-size:var(--p-ui-rail-icon-size,21px);line-height:1;
}
/* Keep fading smoothly but give all hidden badge layouts zero block-size.
   This stops multi-line sensor text from forcing 100px+ tall icon buttons. */
:host([data-integration="native"][data-compact="true"]) .nav-link .nav-label,
:host([data-integration="native"][data-compact="true"]) .nav-link .badge,
:host([data-integration="native"][data-compact="true"]) .nav-link .badge[data-multiline="true"]{
  width:0;min-width:0;max-width:0;height:0;min-height:0;max-height:0;
  flex:0 0 0;grid-column:auto;grid-row:auto;
  overflow:hidden;white-space:nowrap;line-height:0;padding:0;margin:0;
  pointer-events:none;
}
/* Long-press and focus ring remain on the entire, consistently sized button. */
:host([data-integration="native"][data-compact="true"]) .nav-row.active:before{
  top:7px;bottom:7px;
}
:host([data-integration="native"][data-compact="true"]) .footer{
  flex-direction:column;gap:3px;align-items:center;padding:5px 2px;
}
:host([data-integration="native"][data-compact="true"]) .footer .iconbtn{
  width:34px;height:34px;min-width:34px;max-width:34px;flex:0 0 34px;
}
:host([data-integration="native"][data-compact="true"]) .footer .right{
  margin:0;max-width:34px;max-height:34px;overflow:hidden;
}
/* Icon-only rail: scale icons and pictures only, not the 42px navigation hits.
   The header profile avatar and notification count retain their own sizes. */
:host([data-integration="native"][data-compact="true"]) :is(.top .iconbtn,.footer .iconbtn,.footer .right) .ico{
  width:var(--p-ui-rail-slot,23px);height:var(--p-ui-rail-slot,23px);
  min-width:var(--p-ui-rail-slot,23px);min-height:var(--p-ui-rail-slot,23px);
  flex:0 0 var(--p-ui-rail-slot,23px);display:inline-flex;align-items:center;justify-content:center;
}
:host([data-integration="native"][data-compact="true"]) :is(.top .iconbtn,.footer .iconbtn,.footer .right) .ico ha-icon,
:host([data-integration="native"][data-compact="true"]) :is(.top .iconbtn,.footer .iconbtn,.footer .right) .ico svg{
  --mdc-icon-size:var(--p-ui-rail-icon-size,21px);
  width:var(--p-ui-rail-icon-size,21px);height:var(--p-ui-rail-icon-size,21px);
  max-width:var(--p-ui-rail-icon-size,21px);max-height:var(--p-ui-rail-icon-size,21px);
}

:host([data-compact="true"][data-integration="native"][data-ha-header="hidden"]) .top .logo{
  opacity:0;width:0;flex-basis:0;transform:translateX(-6px);overflow:hidden;pointer-events:none
}
:host([data-compact="true"][data-integration="native"][data-ha-header="hidden"]) .top{justify-content:center;padding:6px 0}
@media (pointer:coarse){:host([data-integration="floating"]) .shell{top:max(10px,env(safe-area-inset-top));left:max(0px,env(safe-area-inset-left));bottom:max(8px,env(safe-area-inset-bottom));border-radius:0 18px 18px 0;width:min(340px,calc(100vw - 50px))}}
:host([data-mobile="true"]) .nav-link{min-height:44px;padding:10px}:host([data-mobile="true"]) .nav-row{min-height:44px}:host([data-mobile="true"]) .iconbtn{min-width:42px;min-height:42px}
:host([data-mobile="true"][data-integration="floating"]) .list{overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
/* Smalle, niet-blokkerende randgreep in plaats van een permanent zwevend P-blok. */
:host([data-mobile="true"][data-integration="floating"][data-open="false"]) .launch{
  width:15px;min-width:15px;height:65px;min-height:65px;padding:0;left:0;
  top:40%;border-radius:0 12px 12px 0;font-size:0;opacity:.68;
  box-shadow:0 2px 10px #0004;transform:none
}
:host([data-mobile="true"][data-integration="floating"][data-open="true"]) .launch{display:none}
:host([data-header-mode="compact"]) .top{padding:6px 8px 3px;gap:6px}
:host([data-header-mode="compact"]) .logo{width:29px;height:29px;flex-basis:29px;border-radius:8px}
:host([data-header-mode="compact"]) .brand strong{font-size:12px}
:host([data-header-mode="compact"]) .brand small{font-size:9px}
:host([data-header-mode="minimal"]) .brand{display:none}
:host([data-header-mode="app"]) .top{padding:8px 9px;gap:7px}
:host([data-header-mode="app"]) .brand{display:none}
:host([data-header-mode="app"]) .top .iconbtn{min-width:38px;min-height:38px}
/* Personal header style variables applied only within PalaSidebar. */
.top{background:var(--p-header-background,transparent)}
.top .logo{background:var(--p-header-logo-background,var(--p-accent));color:var(--p-header-logo-color,#06151e)}
.clock{color:var(--p-header-clock-color,var(--secondary-text-color,#9ca9b9))}
:host([data-header-mode="hidden"]) .header-extra{display:none}
.top[data-align="center"] .brand{text-align:center}
.top[data-align="right"] .brand{text-align:right}
.brand strong{color:var(--p-header-title-color,inherit);font-size:var(--p-header-title-size,14px)!important}
.brand small{color:var(--p-header-subtitle-color,var(--secondary-text-color,#9ca9b9));font-size:var(--p-header-subtitle-size,10px)!important}
.header-extra{color:var(--p-header-extra-color,var(--secondary-text-color,#aab6c8));font-size:11px;line-height:1.4;padding:0 10px 7px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:96px;opacity:1;transition:opacity 160ms ease,max-height var(--p-rail-duration,300ms) ease,padding var(--p-rail-duration,300ms) ease}
:host([data-compact="true"][data-integration="native"]) .header-extra{opacity:0;max-height:0;padding:0;overflow:hidden;pointer-events:none}
.header-shortcuts{display:flex;align-items:center;gap:5px;flex:1;min-width:0;overflow:hidden}
.header-shortcuts .iconbtn{flex-shrink:1;min-width:30px}

/* If both headers are hidden, retain a tiny accessible menu/settings row. */
:host([data-header-recovery="true"]) .brand,:host([data-header-recovery="true"]) .logo,:host([data-header-recovery="true"]) .header-shortcuts{display:none!important}
:host([data-header-mode="hidden"]) .top{display:none}
:host([data-header-recovery="true"][data-integration="native"]) .top{display:flex!important;min-height:40px;justify-content:space-between;padding:3px 6px}
:host([data-header-recovery="true"]) .top .top-settings{display:inline-flex!important}
:host([data-compact="true"][data-integration="native"][data-ha-header="hidden"]) .top .logo{display:none}
:host([data-compact="true"][data-integration="native"][data-ha-header="hidden"]) .top{justify-content:center;padding:6px 0}
:host([data-hide-logo="true"]) .top .logo{display:none}

:host([data-integration="floating"]) .health{max-height:min(30vh,190px);overflow-y:auto;overscroll-behavior:contain}
@media(max-height:520px){:host([data-integration="floating"]) .clock{display:none}:host([data-integration="floating"]) .health{max-height:90px}}
:host([data-mobile="true"]) .dialog{max-height:calc(100dvh - 20px)}
:host([data-mobile="true"]) .dialog-content{overflow-y:auto;max-height:calc(100dvh - 25px);padding-bottom:max(20px,env(safe-area-inset-bottom))}
@media (prefers-reduced-motion:reduce){
  :host([data-integration="floating"]) .shell,:host([data-integration="floating"]) .scrim{transition:none}
  :host([data-integration="native"]) :is(.top,.logo,.brand,.top .iconbtn,.nav-link,.nav-label,.badge,.group-title,.clock,.search,.health,.footer .footlabel,.nav-row){transition:none!important}
}
.dialog{pointer-events:auto;border:1px solid var(--divider-color,#556);border-radius:18px;background:var(--card-background-color,var(--ha-card-background,var(--primary-background-color,#171e29)));color:var(--primary-text-color,#eee);color-scheme:var(--p-ha-scheme,normal);width:min(540px,calc(100vw - 20px));max-height:min(90vh,860px);overflow-y:auto;box-shadow:0 20px 90px #0008;padding:0}
.quick-dialog{width:min(690px,calc(100vw - 22px));padding:0;max-height:min(84dvh,820px)}
.quick-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px;max-height:min(64dvh,650px);overflow-y:auto;overscroll-behavior:contain;padding:5px}
.quick-tile{display:flex;align-items:center;gap:9px;padding:10px;min-height:53px;color:inherit;background:var(--secondary-background-color,#283647);border-radius:12px;text-align:left;border:1px solid transparent;font-size:12px;min-width:0}
.quick-tile:hover,.quick-tile:focus-visible{border-color:var(--p-accent)}
.quick-tile .name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Quick dashboard order mode uses existing HA colors/buttons; no new theme engine. */
.quick-title-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}
.quick-title-actions .btn{font-size:12px;padding:8px 10px}
.quick-sort-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 4px;color:var(--secondary-text-color,#aab6c4);font-size:12px}
.quick-sort-controls[hidden]{display:none!important}
.quick-sort-controls .btn{min-width:38px;min-height:38px;padding:6px 10px}
.quick-sort-controls .quick-sort-selection{flex:1 1 175px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.quick-sort-controls .btn:disabled{opacity:.4;cursor:default}
.quick-grid.is-sorting .quick-tile{cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none}
.quick-grid.is-sorting .quick-tile.quick-selected{border-color:var(--p-accent,var(--primary-color,#03a9f4));box-shadow:inset 3px 0 0 var(--p-accent,var(--primary-color,#03a9f4))}
.quick-grid .quick-tile.quick-dragging{opacity:.33}
.quick-grid .quick-tile.quick-drop-target{outline:2px dashed var(--p-accent,var(--primary-color,#03a9f4));outline-offset:1px}
.quick-drag-ghost{position:fixed;pointer-events:none;z-index:2147483640;box-sizing:border-box;opacity:.94;box-shadow:0 12px 28px #0006;border:1px solid var(--p-accent,var(--primary-color,#03a9f4));font:inherit;transform:scale(1.03);cursor:grabbing}
.quick-title{display:flex;align-items:center;justify-content:space-between;gap:12px}
.quick-title h2{font-size:18px;margin:0}
@media(max-width:440px){.quick-title{align-items:flex-start}.quick-title h2{font-size:16px}.quick-title-actions .btn{font-size:11px;padding:7px 8px}.quick-sort-controls{gap:5px}}
.quick-count{color:var(--secondary-text-color,#9ca9b9);font-size:11px}
.quick-rows{display:flex;flex-direction:column;gap:5px}
.quick-row{display:flex;gap:6px;align-items:center;justify-content:space-between;padding:4px;border:1px solid var(--divider-color,#556);border-radius:9px}
.quick-row .name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
.quick-row button{padding:6px;min-width:32px;border-radius:7px;border:1px solid var(--divider-color,#556);color:inherit;background:transparent}
@media(max-width:440px){.quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.quick-dialog .dialog-content{padding:13px}}

/* Both enter and exit share the same native <dialog> element. No clones,
   requestAnimationFrame loops or external overlay which might intercept Back. */
:host{--p-dialog-duration:220ms;--p-dialog-ease:cubic-bezier(.22,.8,.25,1);--p-dialog-y:12px;--p-dialog-scale:.985;--p-dialog-scrim:rgba(0,0,0,.60)}
:host([data-dialog-motion="off"]){--p-dialog-duration:0ms}
:host([data-dialog-motion="fast"]){--p-dialog-duration:140ms}
:host([data-dialog-motion="relaxed"]){--p-dialog-duration:320ms}
:host([data-dialog-style="zoom"]){--p-dialog-y:0px;--p-dialog-scale:.94}
:host([data-dialog-style="fade"]){--p-dialog-y:0px;--p-dialog-scale:1}
:host([data-dialog-backdrop="soft"]){--p-dialog-scrim:rgba(0,0,0,.34)}
:host([data-dialog-backdrop="strong"]){--p-dialog-scrim:rgba(0,0,0,.77)}
.dialog{opacity:1;transform:translate3d(0,0,0) scale(1);transition:opacity var(--p-dialog-duration) ease,transform var(--p-dialog-duration) var(--p-dialog-ease)}
.dialog[data-phase="enter"],.dialog[data-phase="exit"]{opacity:0;transform:translate3d(0,var(--p-dialog-y),0) scale(var(--p-dialog-scale));pointer-events:none}
.dialog::backdrop{background:var(--p-dialog-scrim);transition:background var(--p-dialog-duration) ease}
.dialog[data-phase="enter"]::backdrop,.dialog[data-phase="exit"]::backdrop{background:rgba(0,0,0,0)}
@media(prefers-reduced-motion:reduce){.dialog,.dialog::backdrop{transition:none!important}}
.dialog-content{padding:20px;display:flex;flex-direction:column;gap:12px}.dialog h2{margin:0;font-size:19px}.dialog p{margin:0;color:var(--secondary-text-color,#aab3c0);font-size:12px}.field{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:700}.field input,.field select,.field textarea{color:inherit;background:var(--secondary-background-color,#283647);border:1px solid var(--divider-color,#566);border-radius:9px;padding:9px;width:100%;outline-offset:2px}.field textarea{height:110px;resize:vertical;font:12px monospace}
.check{display:flex;gap:8px;align-items:center;font-size:12px}.check input{accent-color:var(--p-accent)}.btnrow{display:flex;flex-wrap:wrap;gap:7px}.btn{padding:9px 12px;border-radius:8px;border:1px solid var(--divider-color,#667);background:var(--secondary-background-color,#334154);color:inherit}.btn.primary{background:var(--p-accent);color:#061219;border-color:transparent;font-weight:750}.hr{height:1px;background:var(--divider-color,#6677)}.warning{color:#f4bd77;font-size:11px}

.badge[data-color="success"]{background:#15803d;color:white}.badge[data-color="warning"]{background:#b45309;color:white}.badge[data-color="danger"]{background:#b91c1c;color:white}
.badge[data-color][data-style="outline"],.badge[data-color][data-style="plain"]{background:transparent}
.badge[data-color][data-style="soft"]{color:inherit}
.editor-tabs{display:flex;flex-wrap:wrap;gap:6px;position:sticky;top:0;z-index:1;background:var(--card-background-color,#222d3d);padding:8px 0;border-bottom:1px solid var(--divider-color,#556)}
.editor-tabs .btn{padding:8px 10px}.editor-page{display:flex;flex-direction:column;gap:11px;padding:6px 0;min-width:0}
.editor-page[hidden],.field[hidden]{display:none!important}.editor-page h3{font-size:15px;margin:8px 0 0}
.editor-record{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;border-bottom:1px solid var(--divider-color,#6677);padding:8px 0;overflow-wrap:anywhere}
.editor-record .btn{flex-shrink:0}.entity-suggestions{display:flex;flex-direction:column;gap:3px;max-height:170px;overflow:auto}
.entity-suggestions .btn{font-size:11px;text-align:left;padding:6px 8px;overflow-wrap:anywhere}
.popup-message{font-size:14px!important;white-space:pre-wrap;overflow-wrap:anywhere}
.dialog .btn{min-height:36px}@media (pointer:coarse){.dialog .btn,.dialog .field input,.dialog .field select{min-height:44px}}
.editor-notice{color:var(--p-accent)!important;font-weight:700}
/* Form fields remain independently editable; buttons never force a form rebuild. */
.field-control{display:flex;align-items:stretch;gap:6px;min-width:0}.field-control>input,.field-control>select{min-width:0;flex:1;width:auto}
.field-clear{flex:0 0 39px;min-width:39px;min-height:39px;border:1px solid var(--divider-color,#667);border-radius:9px;color:inherit;background:var(--secondary-background-color,#334154);font-size:18px;line-height:1}
.field-clear:focus-visible{outline:2px solid var(--p-accent)}
/* Composite badge builder: separate real lines, searchable HA entities, no manual braces. */
.badge-template-builder{display:flex;flex-direction:column;gap:10px;padding:12px;border:1px solid var(--divider-color,#6678);border-radius:13px;background:color-mix(in srgb,var(--secondary-background-color,#263442) 83%,transparent);min-width:0}
.badge-template-builder>strong{font-size:13px}
.badge-switch-panel{border:1px solid var(--divider-color,#6678);border-radius:12px;padding:10px 12px;background:var(--secondary-background-color,#263442);margin:4px 0}
.badge-switch-panel>summary{cursor:pointer;font-size:12px;font-weight:800;padding:3px;list-style-position:inside;user-select:none}
.badge-switch-panel[open]>summary{margin-bottom:11px}
.badge-switch-case{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;border-top:1px solid var(--divider-color,#6677);padding:12px 0}
.badge-switch-case>strong{grid-column:1/-1;font-size:12px}
@media(max-width:520px){.badge-switch-case{grid-template-columns:minmax(0,1fr)}}
.badge-template-builder .field-note{line-height:1.5}
.badge-template-builder .builder-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:9px}
.badge-template-builder .builder-grid .field:first-child{grid-column:1/-1}
.badge-template-builder .entity-suggestions{position:relative;max-height:150px}
.badge-template-builder .btnrow .btn{flex:1 1 145px}
.badge-template-editor textarea{min-height:115px;height:auto;resize:vertical;line-height:1.5;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
.badge-template-builder .builder-hint{font-size:11px;color:var(--secondary-text-color,#b7c5d3);line-height:1.5}
.badge-line-preview{display:flex;flex-direction:column;gap:4px;border:1px solid var(--divider-color,#6678);border-radius:10px;padding:9px;background:var(--secondary-background-color,#23303d)}
.badge-line-preview>strong{font-size:11px}
.badge-line-preview .line{display:flex;gap:9px;align-items:baseline;min-width:0;font-size:12px;overflow-wrap:anywhere;line-height:1.45}
.badge-line-preview .line .number{flex:0 0 16px;opacity:.6;font-variant-numeric:tabular-nums}
@media(max-width:520px){.badge-template-builder .builder-grid{grid-template-columns:minmax(0,1fr)}.badge-template-builder .builder-grid .field:first-child{grid-column:auto}}
.badge-live-preview{padding:12px;border:1px solid var(--divider-color,#6678);border-radius:11px;background:color-mix(in srgb,var(--p-accent) 7%,var(--secondary-background-color,#263442));display:flex;flex-direction:column;gap:5px;overflow-wrap:anywhere}
.badge-live-preview .value{font-size:15px;font-weight:750;font-variant-numeric:tabular-nums;background:var(--p-accent);color:#05151e;padding:5px 9px;border-radius:9px;align-self:flex-start;max-width:100%;overflow-wrap:anywhere}
.badge-live-preview[data-color="success"] .value{background:#15803d;color:#fff}
.badge-live-preview[data-color="warning"] .value{background:#b45309;color:#fff}
.badge-live-preview[data-color="danger"] .value{background:#b91c1c;color:#fff}
.badge-live-preview:is([data-color="sensor"],[data-color="custom"]) .value{background:var(--p-badge-color,var(--p-accent));color:var(--p-badge-text,#06141e)}
.badge-live-preview:is([data-color="sensor"],[data-color="custom"]) .value[data-style="soft"]{background:color-mix(in srgb,var(--p-badge-color,var(--p-accent)) 25%,transparent);color:inherit}
.badge-live-preview:is([data-color="sensor"],[data-color="custom"]) .value[data-style="plain"],.badge-live-preview:is([data-color="sensor"],[data-color="custom"]) .value[data-style="outline"]{color:var(--p-badge-color,var(--p-accent));background:transparent}
.badge-live-preview .value[data-style="outline"]{color:var(--p-accent);background:transparent;outline:1px solid currentColor}
.badge-live-preview .value[data-style="plain"]{color:var(--p-accent);background:transparent;padding:0}
.badge-live-preview .value[data-style="soft"]{background:color-mix(in srgb,var(--p-accent) 25%,transparent);color:inherit}
.badge-live-preview .value[data-style="dot"]{width:12px;height:12px;min-height:12px;background:var(--p-accent);border-radius:50%;font-size:0;padding:0;overflow:hidden}
.badge-live-preview .value[data-size="small"]{font-size:11px}.badge-live-preview .value[data-size="large"]{font-size:17px}
.badge-live-preview .hint{font-size:11px;color:var(--secondary-text-color,#bdc7d1)}
.badge-live-preview .preview-menu{display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid var(--divider-color,#6676);border-radius:10px;min-width:0;font-size:12px}
.badge-live-preview .preview-menu .preview-icon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 22px;color:inherit}
.badge-live-preview .preview-menu .preview-icon ha-icon{--mdc-icon-size:20px;width:20px;height:20px}
.badge-live-preview .preview-menu .preview-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.badge-live-preview .preview-menu .preview-icon[data-dynamic-color="true"],.badge-live-preview .preview-menu .preview-label[data-dynamic-color="true"]{color:var(--p-badge-color,var(--p-accent))}

.field .field-note{font-size:11px;font-weight:400;color:var(--secondary-text-color,#bdc7d1)}
/* Easy badge colour editor: native palette + status-to-colour rules. */
.badge-color-config{display:flex;flex-direction:column;gap:10px;min-width:0;border:1px solid var(--divider-color,#6678);border-radius:13px;padding:12px;background:color-mix(in srgb,var(--card-background-color,#1a2230) 92%,var(--p-accent))}
.badge-color-config[hidden]{display:none!important}
.badge-color-heading{font-weight:800;font-size:12px}
.badge-color-control{display:flex;align-items:center;gap:9px;min-width:0}
.badge-color-control input[type="color"]{width:49px;height:44px;padding:3px;flex:0 0 49px;border:1px solid var(--divider-color,#667);border-radius:10px;background:transparent;cursor:pointer}
.badge-color-control input[type="text"]{min-width:0;flex:1;max-width:145px;min-height:42px;border-radius:9px;background:var(--secondary-background-color,#263442);border:1px solid var(--divider-color,#667);padding:8px;color:inherit;font:600 13px monospace;letter-spacing:.02em}
.badge-color-swatches{display:flex;flex-wrap:wrap;gap:7px}
.badge-color-swatch{width:30px;height:30px;border:2px solid #fff6;border-radius:9px;cursor:pointer;box-shadow:0 1px 3px #0004}
.badge-color-swatch:focus-visible{outline:2px solid var(--p-accent);outline-offset:2px}
.badge-color-rule{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:7px;border:1px solid var(--divider-color,#6676);border-radius:10px;padding:7px}
.badge-color-rule .badge-color-control input[type="text"]{width:92px;max-width:92px}
.badge-color-rule button{min-width:39px;min-height:44px}
.badge-rule-condition{display:flex;gap:6px;min-width:0;align-items:center}
.badge-rule-condition select{width:130px;max-width:45%;flex:0 1 130px;min-height:44px;padding:7px 5px;border-radius:8px;background:var(--secondary-background-color,#263442);color:inherit;border:1px solid var(--divider-color,#667)}
.badge-rule-condition input{flex:1;min-width:0;min-height:44px;padding:8px;border-radius:8px;background:var(--secondary-background-color,#263442);color:inherit;border:1px solid var(--divider-color,#667)}
/* Gradient anchors reuse the native colour picker and do not animate via timers. */
.badge-gradient-stop{display:grid;grid-template-columns:minmax(90px,1fr) auto auto;gap:7px;align-items:center;border:1px solid var(--divider-color,#6676);padding:7px;border-radius:10px}
.badge-gradient-stop input[data-badge-stop-value]{min-width:0;min-height:43px;width:100%;background:var(--secondary-background-color,#263442);color:inherit;border:1px solid var(--divider-color,#667);border-radius:8px;padding:8px}
.badge-gradient-stop button{min-width:39px;min-height:43px}
.badge-gradient-bar{position:relative;height:18px;border-radius:9px;border:1px solid #ffffff33;background:var(--p-accent)}
.badge-gradient-bar[data-indicator="true"]:after{content:"";position:absolute;top:-4px;bottom:-4px;left:var(--p-gradient-pos,50%);width:4px;border-radius:3px;background:white;box-shadow:0 0 0 1px #0008,0 1px 6px #0007;transform:translateX(-50%);pointer-events:none}
.badge-gradient-status .chip{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-1px;margin-right:6px;border:1px solid #ffffff33}
@media(prefers-reduced-motion:reduce){.badge,.nav-link .nav-label[data-dynamic-color="true"],.nav-link .ico[data-dynamic-color="true"]{transition:none!important}}
.badge-gradient-status{padding:8px 10px;border-radius:9px;border:1px solid var(--divider-color,#6677);font-size:12px;line-height:1.5}
@media(max-width:550px){.badge-gradient-stop{grid-template-columns:minmax(0,1fr) auto}.badge-gradient-stop .badge-color-control{grid-column:1}.badge-gradient-stop>button{grid-column:2;grid-row:1/3}}
.badge-color-rule[data-active="true"]{border-color:var(--p-accent);background:color-mix(in srgb,var(--p-accent) 8%,transparent)}
.badge-color-result{font-size:12px;padding:9px 11px;border-radius:9px;border:1px solid var(--divider-color,#6678);background:var(--secondary-background-color,#263442);line-height:1.55}
.badge-color-result .chip{display:inline-block;width:12px;height:12px;border-radius:4px;vertical-align:-1px;margin-right:6px;border:1px solid #ffffff33}

.badge-color-status{display:block;font-size:12px;font-weight:700;color:var(--primary-text-color,#eee);overflow-wrap:anywhere}
.badge-color-description{font-size:11px;color:var(--secondary-text-color,#bdc7d1);font-weight:400;line-height:1.5}
@media(max-width:550px){.badge-color-rule{grid-template-columns:minmax(0,1fr) auto}.badge-color-rule .badge-color-control{grid-column:1}.badge-color-rule>button{grid-column:2;grid-row:1/3}.badge-color-rule .badge-color-control input[type="text"]{width:112px;max-width:112px}}
.badge-live-preview:is([data-color="sensor"],[data-color="custom"]) .value[data-style="dot"]{background:var(--p-badge-color,var(--p-accent))}
@media(max-width:520px){.dialog-content{padding:14px}.editor-tabs{gap:5px}.editor-tabs .btn{padding:7px 9px}.badge-live-preview{padding:10px}}

/* Regression guard: native dialog.close() removes [open]. Do not display
   a closed dialog as a normal DOM element even if a theme overrides CSS. */
.dialog:not([open]){display:none!important}
/* v1.3.18: Settings editor is one contained scroll region, no overlapping tab rows. */
/* A closed native <dialog> must NEVER stay painted. v1.3.18 applied
   display:flex even after close(), leaving a fake, non-modal settings window. */
.dialog.settings-dialog[open]{width:min(820px,calc(100vw - 24px));max-height:min(92dvh,920px);display:flex;flex-direction:column;overflow:hidden;background:var(--card-background-color,var(--ha-card-background,#171e29))}
.settings-dialog .dialog-content{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-gutter:stable;scroll-padding-top:72px;gap:15px;background:var(--card-background-color,#171e29)}
.settings-dialog .settings-intro{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:5px;padding:19px 0 5px}
.settings-dialog .settings-intro h2{font-size:19px;line-height:1.3}
.settings-dialog .settings-intro p{font-size:11px;line-height:1.5;grid-column:1/-1}.settings-dialog .settings-close-top{width:39px;min-width:39px;height:39px;border-radius:11px;padding:0;font-size:18px}
.settings-dialog .editor-tabs-wrap{display:flex;position:sticky;top:0;z-index:12;align-items:stretch;gap:5px;min-width:0;background:var(--card-background-color,#171e29);border-bottom:1px solid var(--divider-color,#ffffff23);box-shadow:0 8px 12px -12px #000b}
.settings-dialog .editor-tabs-wrap .tabs-scroll-btn{align-self:center;flex:0 0 30px;width:30px;min-width:30px;height:37px;min-height:37px;border-radius:9px;padding:0;font-size:20px;font-family:sans-serif;line-height:1}
.settings-dialog .editor-tabs{display:flex;flex:1;min-width:0;flex-wrap:nowrap;align-items:center;position:static;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none;gap:7px;white-space:nowrap;flex-shrink:0;background:var(--card-background-color,#171e29);padding:10px 2px 12px;margin:0;border-bottom:0;box-shadow:none}
.settings-dialog .editor-tabs::-webkit-scrollbar{display:none}
.settings-dialog .editor-tabs .btn{flex:0 0 auto;border-radius:12px;font-weight:700;padding:10px 13px;min-height:39px;transition:background .16s ease,color .16s ease,border-color .16s ease}
.settings-dialog .editor-tabs .btn.primary{box-shadow:0 2px 9px #0002}
.settings-dialog .editor-page{gap:15px;padding:5px 0 15px}
.settings-dialog .editor-page h3{font-size:15px;line-height:1.4;margin:10px 0 0}
.settings-dialog .editor-page p{line-height:1.5}
.settings-dialog .field{line-height:1.5;min-width:0;gap:7px}
.settings-dialog .field>span{font-size:12px}
.settings-dialog .field input,.settings-dialog .field select,.settings-dialog .field textarea{border-radius:11px;padding:11px 12px;font-size:14px;min-height:44px;max-width:100%}
.settings-dialog .btnrow .btn{border-radius:11px;min-height:42px}
.settings-dialog .btn:focus-visible{outline:2px solid var(--p-accent);outline-offset:2px}
.settings-dialog .check{min-height:32px;line-height:1.5;align-items:flex-start;padding:4px 0}
.settings-dialog .check input{width:18px;height:18px;flex:0 0 18px;margin-top:2px}
@keyframes pala-settings-toast-in{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
.settings-dialog .editor-notice{animation:pala-settings-toast-in .18s ease-out;position:fixed;bottom:max(25px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(460px,calc(100vw - 48px));box-sizing:border-box;z-index:15;background:color-mix(in srgb,var(--p-accent) 18%,var(--card-background-color,#171e29));padding:11px 13px;border:1px solid var(--p-accent);border-radius:11px;box-shadow:0 5px 20px #0006;font-size:12px;line-height:1.4;margin:0;pointer-events:none}
.layout-workspace{display:grid;grid-template-columns:minmax(0,1fr);gap:15px;min-width:0}
.layout-editor-panel{display:flex;flex-direction:column;gap:13px;padding:16px;border:1px solid var(--divider-color,#ffffff25);border-radius:16px;background:color-mix(in srgb,var(--secondary-background-color,#202938) 75%,transparent);min-width:0}
.layout-editor-panel>h3{margin:0!important;font-size:16px!important}
.layout-editor-panel>.field-note{line-height:1.5}
.layout-order-header{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0}
.layout-order-header strong{font-size:13px}
.layout-order-header small{color:var(--secondary-text-color,#aab3c0);font-size:11px;white-space:nowrap}
.layout-order-list{display:flex;flex-direction:column;gap:6px;min-width:0}
.layout-items-order{max-height:340px;overflow-y:auto;overscroll-behavior:contain;padding-right:3px;scrollbar-width:thin}
.layout-order-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:7px;border:1px solid var(--divider-color,#ffffff25);background:var(--card-background-color,#171e29);border-radius:12px;padding:5px 6px;min-width:0}
.layout-order-row[data-selected="true"]{border-color:var(--p-accent);background:color-mix(in srgb,var(--p-accent) 10%,var(--card-background-color,#171e29));box-shadow:inset 3px 0 0 var(--p-accent)}
.layout-order-pick{display:flex;align-items:center;min-width:0;gap:9px;text-align:left;background:transparent;border:0;color:inherit;padding:7px 5px;border-radius:8px;cursor:pointer;min-height:42px;font:inherit}
.layout-order-pick .layout-row-number{color:var(--secondary-text-color,#b7c1cf);font-size:11px;min-width:20px;text-align:center;font-variant-numeric:tabular-nums;flex:0 0 auto}
.layout-order-pick .layout-row-title{font-size:12px;font-weight:750;min-width:0;overflow-wrap:anywhere;line-height:1.4}
.layout-order-pick .layout-row-meta{display:block;font-size:10px;font-weight:500;color:var(--secondary-text-color,#b7c1cf);margin-top:3px}
.layout-order-controls{display:flex;align-items:center;gap:4px}
.layout-order-controls .btn{padding:0;width:35px;height:38px;min-height:38px;display:grid;place-items:center;font:700 17px/1 sans-serif;border-radius:9px}
.layout-order-controls .btn:disabled{opacity:.28;cursor:default}
.layout-order-row:focus-within{outline:1px solid var(--p-accent);outline-offset:1px}
.layout-editor-panel .btnrow{gap:8px}
.layout-editor-panel .btnrow .primary{flex-grow:1}
@media(min-width:720px){.settings-dialog .dialog-content{padding:0 28px 22px}.layout-workspace{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}.layout-editor-panel{padding:18px 16px}.layout-items-order{max-height:390px}}
@media(max-width:600px){.dialog.settings-dialog{width:calc(100vw - 14px);max-height:calc(100dvh - 14px);border-radius:16px}.settings-dialog .dialog-content{padding:0 15px 15px;scrollbar-gutter:auto;scroll-padding-top:66px}.settings-dialog .settings-intro{padding-top:14px}.settings-dialog .settings-intro p{display:none}.settings-dialog .editor-tabs{gap:6px;padding:8px 0 10px}.settings-dialog .editor-tabs .btn{font-size:12px;padding:9px 11px;min-height:42px}.settings-dialog .editor-tabs-wrap .tabs-scroll-btn{flex-basis:32px;width:32px;min-width:32px;min-height:40px}.layout-editor-panel{padding:13px 11px;gap:11px}.layout-order-row{padding:4px;gap:5px}.layout-order-controls .btn{width:39px;height:41px;min-height:41px}.layout-order-pick{padding:6px 2px;gap:5px}.layout-order-pick .layout-row-title{font-size:11px}.layout-items-order{max-height:270px}.layout-editor-panel>.btnrow .btn{flex:1 1 100%}}
@media(prefers-reduced-motion:reduce){.settings-dialog .editor-tabs .btn{transition:none}.settings-dialog .editor-notice{animation:none}}



/* v1.3.42 — toegankelijke uitleg, zichtbare serverstatus en consistente focus. */
.pala-help{border:1px solid color-mix(in srgb,var(--primary-text-color,#e8f2ff) 13%,transparent);border-radius:12px;background:color-mix(in srgb,var(--secondary-background-color,#1c2734) 82%,transparent);padding:0;min-width:0}
.pala-help summary{cursor:pointer;padding:11px 13px;color:var(--primary-text-color,#e8f2ff);font-size:12px;font-weight:700;line-height:1.4;list-style:none;display:flex;align-items:center;gap:8px}
.pala-help summary::-webkit-details-marker{display:none}
.pala-help summary::after{content:'⌄';margin-left:auto;font:18px sans-serif;transition:transform .18s ease}
.pala-help[open] summary::after{transform:rotate(180deg)}
.pala-help>p{padding:0 13px 13px!important;margin:0!important;line-height:1.6!important;font-size:12px!important;overflow-wrap:anywhere}
.pala-help summary:focus-visible,.settings-dialog .btn:focus-visible,.quick-tile:focus-visible{outline:2px solid var(--p-accent,#38bdf8);outline-offset:2px}
.pala-sync-status{font-size:11px;font-weight:700;line-height:1.4;padding:8px 11px;border:1px solid var(--divider-color,#ffffff25);border-radius:10px;background:var(--secondary-background-color,#253344);color:var(--secondary-text-color,#c1cddc);width:fit-content;max-width:100%;overflow-wrap:anywhere}
.pala-sync-status[data-state="saved"]{color:var(--primary-text-color,#e8f2ff);border-color:#55dba64d;background:#55dba60e}
.pala-sync-status[data-state="offline"]{color:var(--primary-text-color,#e8f2ff);border-color:#ffba7a60;background:#ffba7a10}
@media(max-width:600px){.pala-sync-status{width:100%;font-size:11px}.pala-help summary{min-height:43px}.pala-help>p{font-size:12px!important}}
@media(prefers-reduced-motion:reduce){.pala-help summary::after{transition:none}}

/* v1.3.36: independent body-level dialogs still inherit the ACTUAL HA theme.
   Only HA tokens are used, not the selected PalaSidebar weather background. */
.dialog{--p-accent:var(--p-dialog-accent,#38bdf8);--p-primary-ink:var(--p-dialog-ink,#06141e)}
.dialog,.quick-dialog,.settings-dialog .dialog-content,.settings-dialog .editor-tabs-wrap,
.settings-dialog .editor-tabs{color:var(--primary-text-color,#f0f4fa);background-color:var(--card-background-color,var(--ha-card-background,var(--primary-background-color,#20242b)))}
.dialog .btn,.dialog .field :is(input,select,textarea),.quick-tile{
  background-color:var(--secondary-background-color,var(--input-fill-color,var(--card-background-color,#252b34)));
  border-color:var(--divider-color,#ffffff27);color:var(--primary-text-color,#f0f4fa)}
.dialog .btn.primary,.dialog .editor-tabs .btn.primary{background:var(--p-accent);color:var(--p-primary-ink,#07141d);border-color:transparent}
.dialog :is(h2,h3,h4,.field>span){color:var(--primary-text-color,#f0f4fa)}
.dialog :is(p,.field-note,small){color:var(--secondary-text-color,#b0bac4)}
.dialog .btn:hover,.quick-tile:hover{filter:brightness(1.08)}
/* Design Studio v1.3.49. All the main sidebar components share the same
   tokens. The collapsed HA icon rail remains its own fixed, safe 42px layout;
   Header-specific settings and Agenda compact/mini retain their controls. */
:host(:not([data-compact="true"])) .nav-row{border-radius:var(--p-ui-radius,12px)}
:host(:not([data-compact="true"])) .nav-link{border-radius:var(--p-ui-radius,12px);padding-block:var(--p-ui-item-pad,8px);gap:var(--p-ui-item-gap,10px)}
:host(:not([data-compact="true"])) .nav-label{font-size:var(--p-ui-text-size,12px)}
:host(:not([data-compact="true"])) .list{gap:var(--p-ui-list-gap,3px)}
:host(:not([data-compact="true"])) .group-title{margin-top:var(--p-ui-group-margin,11px)}
:host(:not([data-compact="true"])) .health{gap:var(--p-ui-health-gap,5px)}
:host(:not([data-compact="true"])) :is(.group-toggle,.search,.entity){border-radius:var(--p-ui-radius,12px)}
:host(:not([data-compact="true"])) .nav-link .ico{
  display:inline-flex;align-items:center;justify-content:center;overflow:visible;
  width:var(--p-ui-icon-slot,23px);height:var(--p-ui-icon-slot,23px);
  min-width:var(--p-ui-icon-slot,23px);min-height:var(--p-ui-icon-slot,23px);
  flex:0 0 var(--p-ui-icon-slot,23px);
}
:host(:not([data-compact="true"])) .nav-link .ico ha-icon,
:host(:not([data-compact="true"])) .nav-link .ico img.pala-sensor-picture,
:host(:not([data-compact="true"])) .nav-link .ico svg{
  --mdc-icon-size:var(--p-ui-icon-size,21px);
  width:var(--p-ui-icon-size,21px);height:var(--p-ui-icon-size,21px);
  max-width:var(--p-ui-icon-size,21px);max-height:var(--p-ui-icon-size,21px);
  flex:0 0 var(--p-ui-icon-size,21px);object-fit:contain;
}
:host(:not([data-compact="true"])) .nav-link .ico .pala-sensor-emoji,
:host(:not([data-compact="true"])) .nav-link .ico .fallback{
  font-size:var(--p-ui-icon-size,21px);line-height:1;display:inline-flex;align-items:center;justify-content:center;
}
/* Above/below/left badges need the real icon slot, not their old 23px column. */
:host(:not([data-compact="true"])) .nav-link[data-badge-layout="below"],
:host(:not([data-compact="true"])) .nav-link[data-badge-layout="above"]{
  grid-template-columns:var(--p-ui-icon-slot,23px) minmax(0,1fr);
  column-gap:var(--p-ui-item-gap,10px);
}
:host(:not([data-compact="true"])) .nav-link[data-badge-layout="left"]{
  grid-template-columns:var(--p-ui-icon-slot,23px) minmax(0,max-content) minmax(0,1fr);
}
:host(:not([data-compact="true"])) .nav-link .badge{border-radius:calc(var(--p-ui-radius,12px)*.55)}
:host(:not([data-compact="true"])) .nav-link .badge:is(:not([data-size]),[data-size="normal"]){font-size:var(--p-ui-badge-font,10px)}
:host(:not([data-compact="true"])) .nav-link .badge[data-size="small"]{font-size:var(--p-ui-badge-small,9px)}
:host(:not([data-compact="true"])) .nav-link .badge[data-size="large"]{font-size:var(--p-ui-badge-large,12px)}
/* Section headings, search, header clock, live sensor labels, footer and agenda
   headers follow text scaling without overriding individual header design. */
:host(:not([data-compact="true"])) .group-toggle,
:host(:not([data-compact="true"])) .health-title{font-size:var(--p-ui-group-font,10px)}
:host(:not([data-compact="true"])) .clock,
:host(:not([data-compact="true"])) .footer,
:host(:not([data-compact="true"])) .entity,
:host(:not([data-compact="true"])) .entity .value{font-size:var(--p-ui-small-font,11px)}
:host(:not([data-compact="true"])) .pala-agenda-head .pala-agenda-title{font-size:var(--p-ui-small-font,11px)}
:host(:not([data-compact="true"])) .pala-agenda-entry .pala-agenda-copy strong{font-size:var(--p-ui-small-font,11px)}
:host(:not([data-compact="true"])) .pala-agenda-entry .pala-agenda-copy small,
:host(:not([data-compact="true"])) .pala-agenda-entry .pala-agenda-relative{font-size:var(--p-ui-agenda-small,9px)}
:host(:not([data-compact="true"])) .pala-agenda-entry .pala-agenda-date strong{font-size:var(--p-ui-agenda-date,13px)}
/* Keep mini and compact calendar densities smaller while still responding
   to the global typography slider. */
:host(:not([data-compact="true"])) .pala-agenda[data-size="compact"] .pala-agenda-copy strong,
:host(:not([data-compact="true"])) .pala-agenda[data-size="mini"] .pala-agenda-copy strong{font-size:var(--p-ui-compact-font,10px)}
:host(:not([data-compact="true"])) .pala-agenda[data-size="mini"] .pala-agenda-title{font-size:var(--p-ui-compact-font,10px)}
:host(:not([data-compact="true"])) .pala-agenda[data-size="compact"] .pala-agenda-date strong{font-size:var(--p-ui-small-font,11px)}
:host(:not([data-compact="true"])) .pala-agenda[data-size="mini"] .pala-agenda-date strong{font-size:var(--p-ui-compact-font,10px)}
/* Main toolbar/footer and live status use the same icon-size token. Avatar,
   actions and 20px expand chevrons deliberately retain their own dimensions. */
:host(:not([data-compact="true"])) :is(.top .iconbtn,.footer .iconbtn) .ico,
:host(:not([data-compact="true"])) .entity .health-icon{
  width:var(--p-ui-icon-slot,23px);height:var(--p-ui-icon-slot,23px);flex:0 0 var(--p-ui-icon-slot,23px);
  display:inline-flex;align-items:center;justify-content:center;
}
:host(:not([data-compact="true"])) :is(.top .iconbtn,.footer .iconbtn) .ico ha-icon,
:host(:not([data-compact="true"])) .entity .health-icon ha-icon,
:host(:not([data-compact="true"])) .entity .health-icon img.pala-sensor-picture{
  --mdc-icon-size:var(--p-ui-icon-size,21px);
  width:var(--p-ui-icon-size,21px);height:var(--p-ui-icon-size,21px);
  max-width:var(--p-ui-icon-size,21px);max-height:var(--p-ui-icon-size,21px);object-fit:contain;
}
:host(:not([data-compact="true"])) .entity .health-icon .pala-sensor-emoji{font-size:var(--p-ui-icon-size,21px);line-height:1}
/* Agenda header is part of the same sidebar, but its compact/mini appearance
   and action buttons remain bounded so they cannot crowd the dates. */
:host(:not([data-compact="true"])) .pala-agenda[data-size="normal"] .pala-agenda-title ha-icon,
:host(:not([data-compact="true"])) .pala-agenda[data-size="comfortable"] .pala-agenda-title ha-icon{
  --mdc-icon-size:var(--p-ui-icon-size,21px);
  width:var(--p-ui-icon-size,21px);height:var(--p-ui-icon-size,21px);
}
:host(:not([data-compact="true"])) .pala-agenda[data-size="compact"] .pala-agenda-title ha-icon{
  --mdc-icon-size:min(var(--p-ui-icon-size,21px),20px);
  width:min(var(--p-ui-icon-size,21px),20px);height:min(var(--p-ui-icon-size,21px),20px);
}
:host([data-ui-shadow="none"]) .nav-row.active{box-shadow:none}
:host([data-ui-shadow="soft"]) .nav-row.active{box-shadow:0 2px 9px #0002}
:host([data-ui-shadow="depth"]) .nav-row.active{box-shadow:0 5px 16px #0005}
.dialog{border-radius:var(--p-ui-dialog-radius,18px)}
:host([data-ui-dialog-width="compact"]) .settings-dialog[open]{width:min(650px,calc(100vw - 24px))}
:host([data-ui-dialog-width="wide"]) .settings-dialog[open]{width:min(1020px,calc(100vw - 24px))}
.design-preview{display:flex;flex-direction:column;gap:6px;padding:15px;border-radius:var(--p-ui-radius,12px);background:var(--card-background-color,#20242c);border:1px solid var(--divider-color,#ffffff33)}
.design-preview-row{display:flex;align-items:center;gap:var(--p-ui-item-gap,10px);padding:var(--p-ui-item-pad,8px);border-radius:var(--p-ui-radius,12px);font-size:var(--p-ui-text-size,12px);background:color-mix(in srgb,var(--p-accent) 12%,transparent)}
.design-preview-row .ico{width:var(--p-ui-icon-slot,23px);height:var(--p-ui-icon-slot,23px);min-width:var(--p-ui-icon-slot,23px);display:inline-flex;align-items:center;justify-content:center;font-size:var(--p-ui-icon-size,21px)}
.design-preview-row .ico ha-icon,.design-preview-row .ico img{--mdc-icon-size:var(--p-ui-icon-size,21px);width:var(--p-ui-icon-size,21px);height:var(--p-ui-icon-size,21px)}
.design-preview-row .preview-badge{margin-left:auto;background:var(--p-accent);color:var(--p-primary-ink,#06141e);padding:3px 8px;border-radius:calc(var(--p-ui-radius,12px)*.55)}
.design-preview-rail{display:flex;align-items:center;gap:10px;font-size:11px;color:var(--secondary-text-color,#b1c8d8)}
.design-preview-rail-box{display:grid;place-items:center;width:42px;height:42px;border-radius:11px;background:color-mix(in srgb,var(--p-accent,#38bdf8) 13%,transparent)}
.design-preview-rail-box .ico{display:inline-flex;align-items:center;justify-content:center;width:var(--p-ui-rail-slot,23px);height:var(--p-ui-rail-slot,23px)}
.design-preview-rail-box .ico ha-icon,.design-preview-rail-box .ico img,.design-preview-rail-box .ico svg{--mdc-icon-size:var(--p-ui-rail-icon-size,21px);width:var(--p-ui-rail-icon-size,21px);height:var(--p-ui-rail-icon-size,21px)}
.diagnostic-stat{padding:12px;border:1px solid var(--divider-color,#ffffff28);border-radius:12px;background:var(--secondary-background-color,#232a33);min-width:0;overflow-wrap:anywhere}
.diagnostic-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.diagnostic-list{display:flex;flex-direction:column;gap:7px;max-height:280px;overflow-y:auto}
.diagnostic-line{padding:8px 10px;border-left:3px solid var(--p-accent);background:var(--secondary-background-color,#25303b);border-radius:7px;font-size:12px;overflow-wrap:anywhere}
/* PalaSidebar UI integrated editor; HA theme colors, no hard-coded dark surfaces. */
.pfx-intro{margin:0;padding:15px;border:1px solid var(--divider-color,#ffffff2a);border-radius:17px;background:color-mix(in srgb,var(--card-background-color,#1c2530) 92%,var(--primary-color,#38bdf8) 8%);margin:12px 0 16px}
.pfx-intro h3{margin:0 0 6px}.pfx-intro p{margin:0;color:var(--secondary-text-color,#64748b)}
.pfx-preview{margin:0;padding:12px;border:1px solid var(--divider-color,#ffffff33);border-radius:15px;background:var(--card-background-color,#26303b);display:grid;gap:10px}
.pfx-preview .pfx-sample{border-radius:var(--pfx-card-radius,20px);padding:13px;border:1px solid var(--divider-color,#ffffff38);background:var(--primary-background-color,#18232d);font-family:var(--pfx-font,inherit);font-size:var(--pfx-size,14px)}
.pfx-sample .pfx-title{font-size:1.16em;font-weight:750}.pfx-sample small{font-size:.75em;color:var(--secondary-text-color,#64748b)}
.pfx-presets{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0 2px}.pfx-presets .btn{font-size:12px;min-height:36px}.pfx-pills{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.pfx-pill{display:inline-block;background:var(--pfx-accent,#38bdf8);color:var(--pfx-ink,#06141e);padding:5px 9px;border-radius:var(--pfx-control-radius,13px);font-size:.85em;font-weight:750}
.pfx-section{margin:0;border-top:1px solid var(--divider-color,#ffffff24);padding:12px 0 2px}.pfx-section>h3{margin:0 0 5px}.pfx-description{margin:0 0 12px;color:var(--secondary-text-color,#96a7b8)}
.pfx-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:14px;row-gap:8px}.pfx-field{min-width:0;display:flex;flex-direction:column;gap:7px;padding:6px 0}.pfx-field>label{font-size:12px;font-weight:650}.pfx-field select,.pfx-field input:not([type=checkbox]):not([type=color]):not([type=range]){width:100%;min-width:0}
.pfx-field select{min-height:39px}.pfx-color{display:flex;gap:7px;align-items:center}.pfx-color input[type=color]{width:51px;height:41px;padding:3px;border-radius:10px;flex:0 0 51px;cursor:pointer;border:1px solid var(--divider-color,#777)}.pfx-color output{font-family:ui-monospace,monospace;overflow:hidden;text-overflow:ellipsis}
.pfx-range{display:flex;align-items:center;gap:12px}.pfx-range input[type=range]{flex:1;min-width:0;accent-color:var(--p-accent,#38bdf8)}.pfx-range output{min-width:47px;text-align:right;font-variant-numeric:tabular-nums}
.pfx-toggle{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}.pfx-toggle input{width:19px;height:19px;accent-color:var(--p-accent,#38bdf8)}
.pfx-actions{position:relative;background:var(--card-background-color,var(--primary-background-color,#202733));border-top:1px solid var(--divider-color,#7773);padding:10px 0;display:flex;gap:8px;flex-wrap:wrap}
@media(max-width:620px){.pfx-grid{grid-template-columns:1fr}.pfx-intro{padding:12px}}

/* v1.3.44: lightweight, theme-aware optional calendar preview. */
/* v1.3.44 — The agenda uses the SAME theme tokens as the sidebar. A dark fixed
   card is never injected over the user's live weather palette. Sizing happens
   through CSS attributes: no new intervals, observers or calendar requests. */
.pala-agenda{
  --p-agenda-surface:color-mix(in srgb,var(--sidebar-background-color,var(--card-background-color,#202a36)) 92%,var(--p-accent,#38bdf8) 8%);
  --p-agenda-ink:inherit;
  --p-agenda-muted:var(--secondary-text-color,#b7c7d8);
  --p-agenda-space:5px;
  margin:5px 8px 10px;padding:9px 9px 8px;min-width:0;
  border:1px solid color-mix(in srgb,var(--p-accent,#38bdf8) 24%,var(--divider-color,#ffffff26));
  border-radius:var(--p-design-radius,14px);
  background:var(--p-agenda-surface);color:var(--p-agenda-ink);
  transition:background-color .22s ease,border-color .22s ease;
}
/* Home Assistant theme = fallback; live PalaSidebar palette wins when enabled. */
:host([data-theme-active="true"]) .pala-agenda[data-theme="sidebar"]{
  --p-agenda-surface:linear-gradient(150deg,color-mix(in srgb,var(--p-sky,#29415e) 64%,var(--p-ground,#142230) 36%),color-mix(in srgb,var(--p-ground,#142230) 87%,var(--p-sky,#29415e) 13%));
  --p-agenda-ink:var(--p-text,#f5faff);
  --p-agenda-muted:var(--p-muted,#c4d5e5);
  border-color:color-mix(in srgb,var(--p-accent,#38bdf8) 22%,transparent);
}
.pala-agenda[data-theme="soft"]{
  --p-agenda-surface:color-mix(in srgb,var(--p-accent,#38bdf8) 9%,var(--sidebar-background-color,var(--card-background-color,#202a36)));
  border-color:color-mix(in srgb,var(--p-accent,#38bdf8) 16%,transparent);
}
:host([data-theme-active="true"]) .pala-agenda[data-theme="soft"]{
  --p-agenda-surface:color-mix(in srgb,var(--p-sky,#29415e) 36%,var(--p-ground,#142230) 64%);
  --p-agenda-ink:var(--p-text,#f5faff);--p-agenda-muted:var(--p-muted,#c4d5e5);
}
.pala-agenda[data-theme="glass"]{
  --p-agenda-surface:color-mix(in srgb,var(--p-accent,#38bdf8) 10%,transparent);
  border-color:color-mix(in srgb,var(--p-accent,#38bdf8) 20%,var(--divider-color,#ffffff25));
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
}
:host([data-theme-active="true"]) .pala-agenda[data-theme="glass"]{
  --p-agenda-ink:var(--p-text,#f5faff);--p-agenda-muted:var(--p-muted,#c4d5e5);
  --p-agenda-surface:color-mix(in srgb,var(--p-sky,#29415e) 24%,transparent);
}
.pala-agenda[hidden]{display:none!important}
.pala-agenda-head{display:flex;gap:5px;align-items:center;min-width:0;margin-bottom:5px}
.pala-agenda-head .pala-agenda-title{display:flex;align-items:center;min-width:0;gap:6px;flex:1;background:none;border:0;color:inherit;font:inherit;font-size:11px;font-weight:800;text-align:left;padding:5px 2px;cursor:pointer}
.pala-agenda-title>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pala-agenda-title ha-icon{width:18px;height:18px;--mdc-icon-size:18px;color:var(--p-accent,#38bdf8);flex:0 0 auto}
.pala-agenda-button{display:inline-grid;place-items:center;width:27px;height:29px;border:0;border-radius:9px;background:transparent;color:var(--p-agenda-muted);cursor:pointer;padding:0;flex:0 0 auto}
.pala-agenda-button:hover,.pala-agenda-title:hover{background:color-mix(in srgb,var(--p-accent,#38bdf8) 12%,transparent)}
.pala-agenda-button:focus-visible,.pala-agenda-title:focus-visible,.pala-agenda-entry:focus-visible{outline:2px solid var(--p-accent,#38bdf8);outline-offset:1px}
.pala-agenda-button ha-icon{--mdc-icon-size:17px;width:17px;height:17px}
.pala-agenda-entries{display:grid;grid-template-rows:minmax(0,1fr);opacity:1;min-width:0;transition:grid-template-rows 380ms cubic-bezier(.2,.8,.2,1),opacity 260ms ease}
.pala-agenda-entries-inner{display:flex;flex-direction:column;gap:var(--p-agenda-space);min-height:0;min-width:0;overflow:hidden;transform:translateY(0);transition:transform 380ms cubic-bezier(.2,.8,.2,1)}
.pala-agenda[data-collapsed="true"] .pala-agenda-entries{grid-template-rows:minmax(0,0fr);opacity:0;pointer-events:none}
.pala-agenda[data-collapsed="true"] .pala-agenda-entries-inner{transform:translateY(-8px)}
.pala-agenda-entry{display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:8px;text-align:left;width:100%;min-width:0;border:1px solid color-mix(in srgb,var(--p-agenda-color,var(--p-accent,#38bdf8)) 18%,transparent);background:color-mix(in srgb,var(--p-agenda-color,var(--p-accent,#38bdf8)) 7%,transparent);border-radius:10px;color:inherit;font:inherit;padding:7px 6px;cursor:pointer}
.pala-agenda-entry:hover{background:color-mix(in srgb,var(--p-agenda-color,var(--p-accent,#38bdf8)) 15%,transparent)}
.pala-agenda-date{display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px;background:color-mix(in srgb,var(--p-agenda-color,var(--p-accent,#38bdf8)) 20%,transparent);padding:5px 1px;line-height:1.2;min-width:36px}
.pala-agenda-date strong{font-size:13px;font-weight:850}.pala-agenda-date small{font-size:9px;font-weight:750;opacity:.85}
.pala-agenda-copy{display:flex;flex-direction:column;gap:2px;min-width:0}.pala-agenda-copy strong{font-size:11px;font-weight:750;line-height:1.3;white-space:normal;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.pala-agenda-copy small{font-size:9px;color:var(--p-agenda-muted);opacity:.9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pala-agenda-relative{font-size:9px;font-weight:800;white-space:nowrap;color:var(--p-agenda-color,var(--p-accent,#38bdf8));font-variant-numeric:tabular-nums}
.pala-agenda-empty{font-size:10px;line-height:1.5;color:var(--p-agenda-muted);padding:6px 3px 9px}
.pala-agenda-status{font-size:9px;color:var(--p-agenda-muted);margin:7px 2px 0;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
:host([data-compact="true"][data-integration="native"]) .pala-agenda{display:none!important}
/* v1.3.48 — Single centered SVG chevron: no font metrics, pseudo-border glyph
   offsets or competing transforms. 20px controls leave more visual breathing room.
   The existing 380ms collapse animation remains completely independent. */
.group-chevron,.pala-agenda-chevron,.design-chevron-demo{
  --p-chevron-bg:color-mix(in srgb,var(--p-accent,#38bdf8) 7%,transparent);
  --p-chevron-border:color-mix(in srgb,var(--p-accent,#38bdf8) 20%,transparent);
  --p-chevron-ink:color-mix(in srgb,var(--p-accent,#38bdf8) 77%,var(--primary-text-color,#fff));
  display:inline-grid;place-items:center;box-sizing:border-box;
  width:20px;height:20px;min-width:20px;flex:0 0 20px;
  padding:0;margin:0;line-height:0;font-size:0;border-radius:8px;
  background:var(--p-chevron-bg);border:1px solid var(--p-chevron-border);
  color:var(--p-chevron-ink);box-shadow:none;
  transform:translateZ(0);
  transition:background-color .18s ease,border-color .18s ease,box-shadow .18s ease,transform .22s cubic-bezier(.2,.8,.2,1);
}
.group-chevron>svg,.pala-agenda-chevron>svg,.design-chevron-demo>svg{
  display:block;width:14px;height:14px;min-width:14px;min-height:14px;
  flex:0 0 14px;overflow:visible;transform:rotate(0deg);
  transform-origin:50% 50%;transition:transform .34s cubic-bezier(.22,1,.36,1);
}
.group-toggle[aria-expanded="false"] .group-chevron>svg,
.pala-agenda[data-collapsed="true"] .pala-agenda-chevron>svg,
.design-chevron-demo[data-expanded="false"]>svg{transform:rotate(-90deg)}
.group-toggle:hover .group-chevron,.pala-agenda-title:hover .pala-agenda-chevron{
  background:color-mix(in srgb,var(--p-accent,#38bdf8) 13%,transparent);
  border-color:color-mix(in srgb,var(--p-accent,#38bdf8) 34%,transparent);
}
.group-toggle:active .group-chevron,.pala-agenda-title:active .pala-agenda-chevron{transform:scale(.95)}
:host([data-chevron-style="ios"]) :is(.group-chevron,.pala-agenda-chevron),
.design-preview[data-chevron-style="ios"] .design-chevron-demo{
  --p-chevron-bg:transparent;
  --p-chevron-border:transparent;
  --p-chevron-ink:var(--secondary-text-color,#bdc9d9);
  border-radius:7px;box-shadow:none;
}
:host([data-chevron-style="glow"]) :is(.group-chevron,.pala-agenda-chevron),
.design-preview[data-chevron-style="glow"] .design-chevron-demo{
  --p-chevron-bg:color-mix(in srgb,var(--p-accent,#38bdf8) 13%,transparent);
  --p-chevron-border:color-mix(in srgb,var(--p-accent,#38bdf8) 37%,transparent);
  --p-chevron-ink:var(--p-accent,#38bdf8);
  border-radius:8px;
  box-shadow:0 0 8px color-mix(in srgb,var(--p-accent,#38bdf8) 12%,transparent);
}
:host([data-chevron-style="glow"]) :is(.group-toggle:hover .group-chevron,.pala-agenda-title:hover .pala-agenda-chevron){
  box-shadow:0 0 10px color-mix(in srgb,var(--p-accent,#38bdf8) 24%,transparent);
}
.design-preview-chevron-list{display:flex;flex-direction:column;gap:5px;margin:4px 0 3px}
.design-preview-chevron-row{display:flex;align-items:center;justify-content:space-between;gap:8px;background:color-mix(in srgb,var(--p-accent,#38bdf8) 5%,transparent);border:1px solid var(--divider-color,#8884);padding:6px 8px;border-radius:10px;font-size:11px;font-weight:700}
.design-preview-chevron-row .design-chevron-demo{pointer-events:none}
@media(prefers-reduced-motion:reduce){.group-chevron,.pala-agenda-chevron,.design-chevron-demo,.group-chevron>svg,.pala-agenda-chevron>svg,.design-chevron-demo>svg{transition:none!important;animation:none!important;will-change:auto!important}}

/* Compact — 30–40% shorter than the original for multi-line waste events. */
.pala-agenda[data-size="compact"]{--p-agenda-space:4px;margin:3px 6px 7px;padding:6px;border-radius:12px}
.pala-agenda[data-size="compact"] .pala-agenda-head{margin-bottom:3px}
.pala-agenda[data-size="compact"] .pala-agenda-entry{grid-template-columns:31px minmax(0,1fr) auto;gap:5px;padding:4px;border-radius:8px}
.pala-agenda[data-size="compact"] .pala-agenda-date{min-width:29px;padding:3px 0;border-radius:6px}
.pala-agenda[data-size="compact"] .pala-agenda-date strong{font-size:11px}
.pala-agenda[data-size="compact"] .pala-agenda-date small{font-size:8px}
.pala-agenda[data-size="compact"] .pala-agenda-copy strong{font-size:10px;-webkit-line-clamp:2}
.pala-agenda[data-size="compact"] .pala-agenda-copy small{font-size:8px}
.pala-agenda[data-size="compact"] .pala-agenda-relative{font-size:8px}
/* Mini — one line per appointment, with the full title retained as a tooltip. */
.pala-agenda[data-size="mini"]{--p-agenda-space:3px;margin:2px 5px 6px;padding:5px 5px 4px;border-radius:10px}
.pala-agenda[data-size="mini"] .pala-agenda-head{margin-bottom:2px;gap:2px}
.pala-agenda[data-size="mini"] .pala-agenda-head .pala-agenda-title{font-size:10px;padding:2px 1px;gap:4px}
.pala-agenda[data-size="mini"] .pala-agenda-title ha-icon{width:15px;height:15px;--mdc-icon-size:15px}
.pala-agenda[data-size="mini"] .pala-agenda-button{width:22px;height:25px}
.pala-agenda[data-size="mini"] .pala-agenda-button ha-icon{width:15px;height:15px;--mdc-icon-size:15px}
.pala-agenda[data-size="mini"] .pala-agenda-entry{grid-template-columns:26px minmax(0,1fr) auto;gap:5px;padding:3px 4px;border-radius:7px;min-height:31px}
.pala-agenda[data-size="mini"] .pala-agenda-date{min-width:25px;padding:1px 0;border-radius:5px;line-height:1.1}
.pala-agenda[data-size="mini"] .pala-agenda-date strong{font-size:10px}
.pala-agenda[data-size="mini"] .pala-agenda-date small{font-size:7px}
.pala-agenda[data-size="mini"] .pala-agenda-copy strong{font-size:10px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pala-agenda[data-size="mini"] .pala-agenda-copy small{display:none}
.pala-agenda[data-size="mini"] .pala-agenda-relative{font-size:8px}
.pala-agenda[data-size="comfortable"]{--p-agenda-space:8px;margin:7px 9px 13px;padding:12px}
.pala-agenda[data-size="comfortable"] .pala-agenda-entry{padding:10px 8px;gap:9px}
.pala-agenda[data-size="comfortable"] .pala-agenda-copy strong{font-size:12px}
.pala-agenda[data-show-calendar="false"] .pala-agenda-copy small{display:none}
.pala-agenda-editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
.pala-agenda-choice{display:flex;align-items:center;gap:9px;border:1px solid var(--divider-color,#ffffff28);border-radius:11px;padding:10px;min-width:0;background:var(--secondary-background-color,#1d2530);font-size:12px}
.pala-agenda-choice input{width:17px;height:17px;accent-color:var(--p-accent,#38bdf8);flex:0 0 auto}
.pala-agenda-choice span{overflow-wrap:anywhere;min-width:0}.pala-agenda-preview{border:1px solid var(--divider-color,#ffffff28);border-radius:13px;padding:12px;background:color-mix(in srgb,var(--p-accent,#38bdf8) 8%,transparent);font-size:12px}
@media(max-width:600px){.pala-agenda-editor-grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.pala-agenda *{transition:none!important}.pala-agenda-entries{transition:none!important}}

.recovery-row{display:flex;align-items:center;gap:10px;justify-content:space-between;padding:11px;border-radius:10px;border:1px solid var(--divider-color,#ffffff30);background:var(--secondary-background-color,#29303a)}
.recovery-row>span{flex:1;min-width:0;overflow-wrap:anywhere}
@media(max-width:520px){.diagnostic-grid{grid-template-columns:1fr}.recovery-row{flex-wrap:wrap}}

/* Snelmenu follows sidebar palette, even when portaled outside HA's drawer. */
:host .action-dialog{--p-accent:var(--p-sidebar-accent,#38bdf8)}
:host([data-theme-active="true"]) .action-dialog{
  background:linear-gradient(150deg,var(--p-sky,#263a4e),var(--p-ground,#142230));
  border-color:color-mix(in srgb,var(--p-sidebar-accent,#38bdf8) 25%,transparent);
  color:var(--p-text,#f5faff)}
:host([data-theme-active="true"]) .action-dialog p{color:var(--p-muted,#c4d5e5)}
:host([data-theme="amoled"]) .action-dialog{background:#060606}
/* v2.0 beta3 — ONE section system: the Control Center uses the exact same
   .group-title/.group-toggle/.group-chevron/.group-content/.nav-row/.nav-link/
   .nav-label/.badge components as START, BEHEER and the sidebar menu.
   Only positioning differs because the Control Center precedes the menu list. */
.pala-live-center{display:block;min-width:0;margin:0 7px var(--p-ui-list-gap,3px)}
.pala-live-center .group-content-inner{padding-bottom:var(--p-ui-list-gap,3px)}
.pala-live-center .nav-link[data-offline="true"]{opacity:.6}
/* Same native icon rail transition as other section headings and menu items. */
:host([data-integration="native"][data-compact="true"]) .pala-live-center{
  max-height:0;margin:0;opacity:0;visibility:hidden;pointer-events:none;overflow:hidden;
  transition:max-height var(--p-rail-duration,280ms) var(--p-rail-ease,ease),opacity .16s ease,visibility 0s linear var(--p-rail-duration,280ms)}
:host([data-integration="native"]:not([data-compact="true"])) .pala-live-center{
  max-height:800px;opacity:1;visibility:visible;
  transition:max-height var(--p-rail-duration,280ms) var(--p-rail-ease,ease),opacity .16s ease}
:host([data-rail-motion="off"]) .pala-live-center{transition:none!important}
@media(prefers-reduced-motion:reduce){.pala-live-center{transition:none!important}}
.pala-v2-editor-row{border:1px solid var(--divider-color,#ffffff25);border-radius:11px;padding:10px;margin:8px 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.pala-v2-editor-row>strong{grid-column:1/-1}
.pala-v2-editor-row label{min-width:0}
.pala-v2-editor-row input{max-width:100%}
.pala-v2-editor-row .entity-suggestions{z-index:3}
.pala-v2-caption{font-size:11px;opacity:.75;margin:8px 0}
.pala-v2-status{font-variant-numeric:tabular-nums;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}
.pala-v2-stat{border:1px solid var(--divider-color,#ffffff28);border-radius:10px;padding:10px;overflow-wrap:anywhere}
.pala-v2-stat strong{display:block;font-size:17px;color:var(--p-accent,#38bdf8)}
.pala-v2-stat small{font-size:10px;opacity:.85}
.pala-v2-import{width:100%;min-height:110px;resize:vertical;box-sizing:border-box;margin:10px 0}
@media(max-width:550px){.pala-v2-editor-row{grid-template-columns:1fr}.pala-v2-status{gap:5px}}


`;


  const THEME_CSS = `
/* Thema raakt alleen PalaSidebar, nooit het Home Assistant dashboard of de browser. */
.shell{position:relative;isolation:isolate}
:host([data-theme-active="true"]) .shell{
  color:var(--p-text,#edf5ff);
  background:linear-gradient(150deg,var(--p-sky,#263a4e),var(--p-ground,#142230))!important;
}
:host([data-theme-active="true"]) .brand small,
:host([data-theme-active="true"]) .clock,
:host([data-theme-active="true"]) .group-toggle,
:host([data-theme-active="true"]) .health-title,
:host([data-theme-active="true"]) .footer{color:var(--p-muted,#b1c8d8)}
:host([data-theme-active="true"]) .search{background:#ffffff12;border-color:#ffffff28}
:host([data-theme-active="true"]) .nav-row.active{background:#ffffff1c}
:host([data-theme-active="true"]) .nav-link{color:inherit!important}
:host([data-theme-active="true"]) .shell > :not(.weather-layer){position:relative;z-index:1}
:host([data-theme-active="true"][data-integration="floating"]) .shell{border-color:#ffffff38}
:host([data-theme-active="true"][data-integration="native"]) .shell{background:transparent!important}
:host([data-theme="amoled"]) .shell{background:#000!important}
:host([data-theme="glass"]) .shell{background:linear-gradient(150deg,#29415ecf,#162539ed)!important}
:host([data-theme="aurora"]) .shell{background:linear-gradient(160deg,#41447a,#1d4260 55%,#162739)!important}
.weather-layer{position:absolute!important;inset:0;z-index:0;overflow:hidden;pointer-events:none;contain:paint;opacity:var(--p-weather-opacity,.6)}
.weather-layer[hidden]{display:none!important}
.weather-layer::before,.weather-layer::after{content:'';position:absolute;pointer-events:none}
:host([data-weather="sun"]) .weather-layer::before{width:82px;height:82px;top:32px;right:-22px;border-radius:50%;background:radial-gradient(circle,#ffe3a65c 0%,#ffbf5633 34%,transparent 73%)}
:host([data-weather="night"]) .weather-layer::before{width:54px;height:54px;top:32px;right:18px;border-radius:50%;background:radial-gradient(circle at 37% 36%,#dbe6ff55 0%,#dbe6ff22 36%,transparent 72%)}
/* v1.3.34: geen kunstmatige witte wolkenvlek bij bewolking, regen of onweer.
   De rustige achtergrondkleuren en echte neerslaganimaties blijven bestaan. */
:host([data-weather="mist"]) .weather-layer::before{inset:10% -20%;opacity:.4;background:repeating-linear-gradient(175deg,transparent 0 38px,#ffffff12 47px,transparent 72px)}
:host([data-weather="storm"]) .weather-layer::after{content:'ϟ';font:bold 64px/1 Arial;right:9%;top:8%;color:#ead4ff;opacity:.17}
:host([data-weather="spring"]) .weather-layer::before{inset:0;background:radial-gradient(ellipse at 85% 7%,#f8bdea55,transparent 40%)}
:host([data-weather="summer"]) .weather-layer::before{width:100px;height:100px;right:-20px;top:25px;border-radius:50%;background:radial-gradient(circle,#ffefab49,transparent 73%)}
:host([data-weather="autumn"]) .weather-layer::before{inset:0;background:radial-gradient(ellipse at 90% 0,#ffa45b4a,transparent 48%)}
:host([data-weather="winter"]) .weather-layer::before{inset:0;background:linear-gradient(#ffffff12,transparent 55%)}
.weather-layer .particle{position:absolute;top:-10%;left:var(--p-x);width:var(--p-w,2px);height:var(--p-h,16px);opacity:var(--p-opacity,.6);animation-delay:var(--p-delay,0s);animation-duration:var(--p-duration,5s);animation-iteration-count:infinite;animation-timing-function:linear;will-change:transform}
.weather-layer[data-effect="rain"] .particle,.weather-layer[data-effect="storm"] .particle{border-radius:3px;background:linear-gradient(transparent,#e0f5ff);transform:rotate(13deg);animation-name:pala-rain}
.weather-layer[data-effect="snow"] .particle,.weather-layer[data-effect="winter"] .particle{width:var(--p-w,4px);height:var(--p-w,4px);border-radius:50%;background:#edfaff;animation-name:pala-snow}
.weather-layer[data-effect="autumn"] .particle{background:#ffd087;border-radius:0 90% 0 90%;animation-name:pala-leaf}
.weather-layer[data-effect="spring"] .particle{background:#ffc8dd;border-radius:60% 0 60% 20%;animation-name:pala-leaf}
.weather-layer[data-effect="wind"] .particle{width:var(--p-w,23px);height:1px;background:#cfebfa9c;animation-name:pala-wind}
@keyframes pala-rain{from{transform:translate3d(0,-15vh,0) rotate(12deg)}to{transform:translate3d(-85px,110vh,0) rotate(12deg)}}
@keyframes pala-snow{from{transform:translate3d(0,-12vh,0)}to{transform:translate3d(48px,110vh,0)}}
@keyframes pala-leaf{from{transform:translate3d(0,-12vh,0) rotate(0)}to{transform:translate3d(65px,110vh,0) rotate(260deg)}}
@keyframes pala-wind{from{transform:translate3d(-250px,0,0)}to{transform:translate3d(370px,14px,0)}}
:host([data-integration="floating"][data-open="false"]) .particle,
:host([data-compact="true"]) .particle,
:host([data-document-hidden="true"]) .particle{animation-play-state:paused!important}
:host([data-compact="true"]) .weather-layer{display:none!important}
@media(prefers-reduced-motion:reduce){.particle{animation:none!important}.weather-layer{opacity:.3!important}}
@media(max-width:480px){.weather-layer{opacity:var(--p-weather-opacity,.6)}}
.theme-preview{height:83px;display:flex;align-items:center;gap:10px;border:1px solid #ffffff32;border-radius:14px;padding:14px;color:#fff;background:linear-gradient(125deg,var(--preview-sky,#263a4e),var(--preview-ground,#142230));position:relative;overflow:hidden}
.theme-preview strong{font-size:16px}.theme-preview small{display:block;font-size:11px;opacity:.86}
.theme-preview .preview-icon{font-size:30px;min-width:34px}.theme-preview .preview-copy{position:relative;z-index:1}
.theme-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;max-width:760px}
.theme-preset{display:flex;flex-direction:column;align-items:stretch;justify-content:space-between;gap:9px;min-width:0;min-height:83px;background:var(--secondary-background-color,#283647);border:1px solid #ffffff24;border-radius:13px;padding:11px;color:var(--primary-text-color,#edf5ff);font-size:12px;font-weight:750;text-align:left;cursor:pointer;transition:border-color .15s ease,background .15s ease}
.theme-preset:hover{border-color:var(--p-accent);background:color-mix(in srgb,var(--p-accent) 9%,var(--secondary-background-color,#283647))}
.theme-preset:focus-visible{outline:2px solid var(--p-accent);outline-offset:2px}
.theme-preset[aria-pressed="true"]{border:2px solid var(--p-accent);padding:10px;background:color-mix(in srgb,var(--p-accent) 15%,var(--secondary-background-color,#283647))}
.theme-preset[aria-pressed="true"] .theme-preset-label:after{content:" ✓";color:var(--p-accent)}
.theme-preset .theme-preset-label{overflow-wrap:anywhere;line-height:1.3}
.theme-preset .swatch{display:flex;align-self:stretch;gap:3px}.theme-preset .swatch span{height:17px;flex:1;border-radius:4px;border:1px solid #ffffff14}
/* Sensor pictogrammen volgen hetzelfde raster als MDI-iconen. */
.nav-link .ico img.pala-sensor-picture{display:block;width:21px;height:21px;max-width:100%;object-fit:contain;border-radius:4px}
.nav-link .ico .pala-sensor-emoji{font-size:19px;line-height:1}
.layout-dynamic-panel{border:1px solid color-mix(in srgb,var(--p-accent) 22%,transparent);border-radius:12px;padding:12px;margin:12px 0;background:color-mix(in srgb,var(--p-accent) 5%,transparent)}
.layout-dynamic-panel h4{margin:0 0 6px;font-size:13px}
.layout-dynamic-preview{display:flex;align-items:center;gap:10px;min-height:43px;margin-top:10px;padding:10px;border:1px solid #ffffff26;border-radius:10px;overflow-wrap:anywhere}
.layout-dynamic-preview .ico{flex:0 0 24px;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center}
.layout-dynamic-preview img.pala-sensor-picture{width:22px;height:22px;object-fit:contain;border-radius:4px}
.layout-dynamic-panel .field-note{font-size:11px;line-height:1.45;opacity:.85}


/* v1.3.30: rustige, overzichtelijke thema-editor (alleen eigen dialog). */
.theme-editor-v2{display:flex;flex-direction:column;gap:14px;min-width:0}
.theme-editor-v2 .theme-editor-intro{color:var(--secondary-text-color,#a9b5c1);font-size:12px;line-height:1.5}
.theme-section{display:flex;flex-direction:column;gap:13px;padding:15px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 12%,transparent);border-radius:16px;background:color-mix(in srgb,var(--card-background-color,#141c28) 92%,transparent);min-width:0}
.theme-section[hidden],.theme-color-picker[hidden]{display:none!important}
.theme-section-head{display:flex;align-items:center;gap:10px;min-width:0}
.theme-section-icon{width:35px;height:35px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--p-accent,#38bdf8) 12%,transparent);border-radius:10px;flex:0 0 auto;font-size:20px}
.theme-section-head h4{margin:0 0 2px!important;font-size:15px!important;line-height:1.3}
.theme-section-head p{font-size:11px!important;line-height:1.4}
.theme-editor-v2 .theme-preview{height:auto;min-height:150px;display:flex;flex-direction:column;align-items:stretch;gap:12px;padding:16px;background:linear-gradient(125deg,var(--preview-sky,#263a4e),var(--preview-ground,#142230))}
.theme-preview-top{display:flex;gap:12px;align-items:center;min-width:0}
.theme-preview-top .preview-icon{font-size:27px;line-height:1;min-width:39px}
.theme-preview-top .preview-copy{flex:1;min-width:0}
.theme-preview .preview-copy strong{font-size:14px}
.theme-preview .preview-copy small{font-size:11px;line-height:1.5;overflow-wrap:anywhere}
.theme-preview-status{align-self:flex-start;font-size:10px;font-weight:650;color:#fff;border:1px solid #ffffff40;padding:4px 9px;border-radius:999px;background:#07101d50}
.theme-preview-menu{display:flex;align-items:center;gap:9px;background:#07101d58;border:1px solid #ffffff25;padding:8px 9px;border-radius:10px;min-width:0}
.theme-preview-menu .mock-ico{font-size:19px;flex:0 0 auto}
.theme-preview-menu .mock-name{min-width:0;flex:1;font-size:12px;font-weight:750;color:white}
.theme-preview-menu .mock-badge{font-size:10px;font-weight:750;border-radius:7px;padding:4px 7px;background:var(--preview-accent,#38bdf8);color:#06111a;flex:0 0 auto}
.theme-presets{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;max-width:none}
.theme-editor-v2 .theme-preset{min-height:78px;padding:11px 12px;border-radius:13px;background:linear-gradient(135deg,var(--preset-sky,#283647),var(--preset-ground,#161b29));color:#fff;border:1px solid #ffffff3d;box-shadow:inset 0 1px 0 #ffffff12;transition:border-color .17s ease,transform .17s ease}
.theme-editor-v2 .theme-preset:hover{transform:translateY(-1px);background:linear-gradient(135deg,var(--preset-sky,#283647),var(--preset-ground,#161b29));border-color:var(--p-accent,#38bdf8)}
.theme-editor-v2 .theme-preset[aria-pressed="true"]{border:2px solid var(--p-accent,#38bdf8);padding:10px 11px;box-shadow:0 0 0 2px color-mix(in srgb,var(--p-accent,#38bdf8) 20%,transparent),inset 0 1px 0 #ffffff22;background:linear-gradient(135deg,var(--preset-sky,#283647),var(--preset-ground,#161b29))}
.theme-editor-v2 .theme-preset .swatch span{height:8px}
.theme-editor-v2 .theme-preset .theme-preset-label{font-size:12px;text-shadow:0 1px 4px #0009}
.theme-field-note{font-size:11px!important;line-height:1.45!important;color:var(--secondary-text-color,#b1becb)!important}
.theme-editor-v2 .field>span{font-size:12px!important;line-height:1.4}.theme-editor-v2 select{min-height:45px!important}.theme-editor-v2 .theme-section p{max-width:75ch}
.theme-live-source{display:flex;align-items:flex-start;gap:8px;border:1px solid #ffffff24;border-radius:10px;padding:10px 11px;background:#111b2880;color:var(--primary-text-color,#fff);font-size:11px;line-height:1.5;overflow-wrap:anywhere}
.theme-live-source .dot{width:7px;height:7px;border-radius:50%;background:#60d394;flex:0 0 auto;margin-top:5px}
.theme-live-source[data-warning="true"] .dot{background:#f59e0b}
.theme-color-picker{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.theme-color-picker input[type=color]{height:42px;width:64px;padding:3px;border:1px solid #ffffff38;background:transparent;border-radius:9px;cursor:pointer}
.theme-color-picker code{font-size:12px;min-width:75px;color:var(--primary-text-color,#fff)}
.theme-actions{position:relative;padding:12px 0 4px;background:transparent;border-top:1px solid #ffffff25;display:flex;flex-wrap:wrap;gap:8px}
.theme-actions .btn{flex:1 1 130px}
@media(min-width:620px){.theme-presets{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:480px){.theme-section{padding:11px}.theme-actions .btn{flex:1 1 110px}.theme-preview-menu{gap:5px}}
@media(prefers-reduced-motion:reduce){.theme-editor-v2 .theme-preset{transition:none}.theme-editor-v2 .theme-preset:hover{transform:none}}

.theme-note{font-size:11px!important;color:var(--secondary-text-color,#b3c5d3)!important}
@media(min-width:620px){.theme-presets{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:330px){.theme-presets{grid-template-columns:1fr}}
`;

  const safeEntityPicture=value=>{
    const raw=String(value??'').trim();
    if(raw.length>1100||/[\s<>"'`]/.test(raw)||raw.startsWith('//'))return '';
    if(/^\/(?:local|api|media|static|auth|frontend_latest)(?:\/|\?|$)/.test(raw))return raw;
    if(/^https:\/\/[^/]+/i.test(raw))return raw;
    return '';
  };
  const safeSensorEmoji=value=>{
    const raw=String(value??'').trim();
    return raw.length>0&&raw.length<=16&&/^[\p{Extended_Pictographic}\p{Regional_Indicator}\u200D\uFE0F\u20E3]+$/u.test(raw)?raw:'';
  };
  function makeIcon(icon, fallback='•') {
    const holder=$('span','ico');
    if (isSafeIcon(icon) && customElements.get('ha-icon')) {
      const i=$('ha-icon'); i.setAttribute('icon',icon); holder.append(i);
    } else holder.append($('span','fallback',fallback));
    return holder;
  }
  const prettify = value => text(value||'').replace(/[-_]/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  function deepFindSidebar() {
    const queue=[document];let scanned=0;
    while(queue.length && scanned < 600){
      const scope=queue.shift(); if(!scope?.querySelectorAll)continue;
      // Gerichte scan, geen MutationObserver over de hele HA DOM.
      const all=scope.querySelectorAll('home-assistant, home-assistant-main, ha-drawer, ha-sidebar, ha-panel-lovelace, ha-panel-config');
      for(const node of all){ scanned++;if(node.localName==='ha-sidebar')return node;if(node.shadowRoot)queue.push(node.shadowRoot); }
    }return null;
  }
  async function fetchConfig() {
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),5000);
    try {
      const response=await fetch(CONFIG_URL+'?v='+VERSION,{cache:'no-store',signal:controller.signal,credentials:'same-origin'});
      if(!response.ok)throw Error('HTTP '+response.status);
      const body=await response.text(); if(body.length>200000)throw Error('Config is te groot');
      return {config:parseConfig(JSON.parse(body)),error:''};
    } catch(e){return {config:parseConfig(defaults()),error:'Config niet geladen ('+e.message+'). Standaardnavigatie actief.'};}
    finally{clearTimeout(timeout);}
  }
  function getSavedUserKey(hass){const id=hass?.user?.id||'onbekend';return KEY+':'+id;}
  function parsePrefs(value) {
    const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    const dict=(v,max=200)=>Object.fromEntries(Object.entries(v&&typeof v==='object'&&!Array.isArray(v)?v:{}).slice(0,max).filter(([id])=>/^[\w-]{1,80}$/.test(id)));
    const sections=dict(input.section_overrides,80);
    const fieldMap=(v,max=200)=>Object.fromEntries(Object.entries(dict(v,max)).map(([id,val])=>[id,text(val).slice(0,90)]));
    const footer=input.footer_config&&typeof input.footer_config==='object'?input.footer_config:{};
    const search=input.search_config&&typeof input.search_config==='object'?input.search_config:{};
    return {
      section_overrides:Object.fromEntries(Object.entries(sections).map(([id,v])=>[id,{title:text(v?.title).slice(0,64),visible:v?.visible!==false}])),
      section_order:arr(input.section_order).filter(v=>/^[\w-]{1,80}$/.test(v)).slice(0,80),
      custom_groups:arr(input.custom_groups).filter(v=>v&&typeof v==='object').slice(0,30).map(v=>({id:cleanId(v.id),title:text(v.title).slice(0,64)})).filter(v=>v.id&&v.title),
      item_groups:Object.fromEntries(Object.entries(fieldMap(input.item_groups)).filter(([,g])=>/^[\w-]{1,80}$/.test(g))),
      item_labels:fieldMap(input.item_labels),item_icons:Object.fromEntries(Object.entries(fieldMap(input.item_icons)).filter(([,v])=>isSafeIcon(v))),
      item_dynamic:Object.fromEntries(Object.entries(dict(input.item_dynamic,120)).map(([id,raw])=>[id,{
        title_entity:isEntity(raw?.title_entity)?raw.title_entity:'',
        title_attribute:/^[a-zA-Z0-9_-]{1,80}$/.test(raw?.title_attribute||'')?raw.title_attribute:'',
        icon_entity:isEntity(raw?.icon_entity)?raw.icon_entity:'',
        icon_attribute:/^[a-zA-Z0-9_-]{1,80}$/.test(raw?.icon_attribute||'')?raw.icon_attribute:'auto'
      }]).filter(([,v])=>v.title_entity||v.icon_entity)),
      item_order:arr(input.item_order).filter(v=>/^[\w-]{1,80}$/.test(v)).slice(0,300),
      search_config:{visible:search.visible!==false,placeholder:text(search.placeholder||'Zoeken in menu…   Ctrl + K').slice(0,80)},
      footer_config:{show_settings:footer.show_settings!==false,show_version:footer.show_version!==false,show_status:footer.show_status!==false,show_restart:footer.show_restart!==false,
        ha_settings:footer.ha_settings!==false,ha_notifications:footer.ha_notifications!==false,ha_profile:footer.ha_profile!==false,
        link:cleanId(footer.link||'')},show_quick_link:input.show_quick_link!==false,repeat_recent:input.repeat_recent===true,favorites:arr(input.favorites).filter(x=>typeof x==='string').slice(0,100),recent:arr(input.recent).filter(x=>typeof x==='string').slice(0,10),
      closed:arr(input.closed).filter(x=>typeof x==='string').slice(0,50), links:arr(input.links).map(configItem).filter(Boolean).slice(0,50),
      quick_links:arr(input.quick_links).map(configItem).filter(i=>i&&i.path).slice(0,50),quick_auto:input.quick_auto!==false,
      badge_overrides:Object.fromEntries(Object.entries(input.badge_overrides&&typeof input.badge_overrides==='object'?input.badge_overrides:{}).slice(0,120).filter(([id])=>/^[\w-]{1,75}$/.test(id)).map(([id,value])=>[id,value===null?null:badgeSpec(value)])),
      action_overrides:Object.fromEntries(Object.entries(input.action_overrides&&typeof input.action_overrides==='object'?input.action_overrides:{}).slice(0,120).filter(([id])=>/^[\w-]{1,75}$/.test(id)).map(([id,value])=>[id,actionSpec(value)])),
      quick_entities:Array.isArray(input.quick_entities)?input.quick_entities.slice(0,20).map(quickEntity).filter(Boolean):null,
      accent:/^#[0-9a-f]{6}$/i.test(input.accent||'')?input.accent:'',density:['normal','compact'].includes(input.density)?input.density:'',
      mode:['auto','integrated','floating'].includes(input.mode)?input.mode:'',device:['auto','desktop','tablet','phone'].includes(input.device)?input.device:'auto',hidden:arr(input.hidden).filter(x=>typeof x==='string').slice(0,100),
      quick_order:arr(input.quick_order).filter(v=>typeof v==='string').slice(0,150),
      quick_hidden:arr(input.quick_hidden).filter(v=>typeof v==='string').slice(0,150),
      mobile_dock:typeof input.mobile_dock==='boolean'?input.mobile_dock:null,
      mobile_swipe:typeof input.mobile_swipe==='boolean'?input.mobile_swipe:null,
      dialog_motion:['off','fast','smooth','relaxed'].includes(input.dialog_motion)?input.dialog_motion:'smooth',
      dialog_style:['lift','zoom','fade'].includes(input.dialog_style)?input.dialog_style:'lift',
      dialog_backdrop:['soft','normal','strong'].includes(input.dialog_backdrop)?input.dialog_backdrop:'normal',
      rail_motion:['fast','smooth','relaxed','off'].includes(input.rail_motion)?input.rail_motion:'smooth',
      agenda:cleanAgenda(input.agenda),
      design:cleanDesign(input.design),
      ui_style:(input.ui_style&&typeof input.ui_style==='object'?pfxClean(input.ui_style):(input.palafix&&typeof input.palafix==='object'?pfxClean(input.palafix):null)),
      mobile_v131_migrated:input.mobile_v131_migrated===true,header_v133_migrated:input.header_v133_migrated===true,header:input.header&&typeof input.header==='object'?cleanHeader(input.header):null,
      theme:input.theme && typeof input.theme==='object'?cleanTheme(input.theme):null,
      live_center:cleanLiveCenter(input.live_center),context_menu:cleanContextMenu(input.context_menu),
      performance_center:cleanPerformanceCenter(input.performance_center), theme_snapshots:cleanThemeSnapshots(input.theme_snapshots)};
  }
  function profileApplied(config,hass,prefs){
    const mode=prefs.device==='auto'?(window.matchMedia('(max-width: 700px)').matches?'phone':(window.matchMedia('(pointer:coarse)').matches?'tablet':'desktop')):prefs.device;
    const profile=arr(config.profiles).find(p=>{
      if(!p.match||typeof p.match!=='object')return false;
      if(p.match.user && text(p.match.user).toLowerCase()!==text(hass?.user?.name).toLowerCase())return false;
      if(p.match.admin!==undefined && !!p.match.admin!==!!hass?.user?.is_admin)return false;
      if(p.match.device && p.match.device!==mode)return false;
      return true;
    });
    if(!profile)return config;
    const next={...config,appearance:{...config.appearance,...(profile.appearance||{})},mobile:{...config.mobile,...(profile.mobile||{})},theme:cleanTheme(profile.theme||config.theme),header:cleanHeader(profile.header||config.header)};
    if(['auto','integrated','floating'].includes(profile.mode))next.mode=profile.mode;
    if(Array.isArray(profile.groups)) {
      try { next.groups=parseConfig({...config,groups:profile.groups}).groups; } catch {/* keep base */}
    }
    return next;
  }
  function relativeLabel(state,entity) {
    if(!state)return '—';
    const unit=text(state.attributes?.unit_of_measurement);
    const value=text(state.state);
    if(value==='unavailable'||value==='unknown')return '—';
    return (value+' '+unit).trim().slice(0,64);
  }
  class PalaSidebar extends HTMLElement {
    constructor(){
      super();this.attachShadow({mode:'open'});
      const style=$('style');style.textContent=CSS;
      this.shadowRoot.append(style);const themeStyle=$('style');themeStyle.textContent=THEME_CSS;this.shadowRoot.append(themeStyle);
      this.config=defaults();this.error='';this.saved=EMPTY_PREFS();this.hass=null;this._pfxDraft=null;
      // Per HA account: the in-browser copy is a fallback, NOT the source of truth.
      // No extra HA integration needed: frontend/get_user_data is built into Core.
      this._prefsStore=null;this._recoveryPoints=[];this._recoveryStatus="nog geladen";this._lastDialogHaTheme="";
      // Live HA updates are coalesced to at most one visual refresh per frame.
      // The slow structural health check remains a fallback, not a second renderer.
      this._lastHassStates=null;this._liveFrame=0;this._lastFullRefreshAt=0;
      this._perf={liveUpdates:0,fullRefreshes:0,lastRefreshMs:0,lastStateAt:0,samples:[],listDraws:0,lastListRows:0};
      this._agendaCache={key:'',at:0,events:[],status:'',pending:false,generation:0};this._agendaRenderSignature='';
      this.native=null;this.integration='floating';this.open=false;this.search='';this.route='';this.lastStateSnapshot='';this.lastVersion='';this.tempFloating=false;
      this.mobileDock=null;this.mobileDockSignature='';this.touchStart=null;this._favoriteHoldTimer=undefined;this._favoriteHold=null;this._favoriteSuppressClickUntil=0;this._quickOrderMode=false;this._quickPress=null;this._quickPressTimer=null;this._quickGhost=null;this._quickSuppressClickUntil=0;this._quickSelectedId=null;this.editorTab='general';this.themeSignature='';this.themeDraft=null;
      this._haHeaderSidebar=null;this._haHeaderOriginal=null;this._haHeaderStyle=null;this._gesture=null;this._gestureTimer=null;this._historyMarker=false;this._historyReleasing=false;this._historyCallbacks=[];
      this._dialogMarker='';this._dialogReleasing=false;this._dialogCallbacks=[];this._dialogCloseTimers=new Map();this._nativeClosePending=false;this._observedDrawer=null;this._onDrawerClosed=()=>queueMicrotask(()=>this._syncMenuHistory());
      this._mount();
      // Dialogs must not be descendants of HA's collapsible native drawer.
      // They live in a single stable body-level shadow host with the SAME CSS.
      this._dialogPortal=document.createElement('div');
      this._dialogPortal.id='pala-sidebar-dialog-portal';
      this._dialogPortal.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2147483001';
      this._dialogPortalRoot=this._dialogPortal.attachShadow({mode:'open'});
      const dialogStyle=document.createElement('style');dialogStyle.textContent=CSS;
      // The portal must receive the theme editor stylesheet as well: otherwise
      // the eight preset cards appear as unstyled inline grey browser buttons.
      const dialogThemeStyle=document.createElement('style');dialogThemeStyle.textContent=THEME_CSS;
      this._dialogPortalRoot.append(dialogStyle,dialogThemeStyle,this.dialog,this.actionDialog,this.quickDialog);
      // Quick Dashboard tile gestures live on the existing modal, not in a
      // second overlay. Only a single delegated set of handlers is installed.
      this._setupQuickOrdering();
      this._dialogPortalRoot.addEventListener('click',e=>this._click(e));
      this._dialogPortalRoot.addEventListener('input',e=>this._input(e));
      this._dialogPortalRoot.addEventListener('change',e=>this._change(e));
      this._dialogPortalRoot.addEventListener('focusin',e=>{if(e.target?.dataset?.entityPicker)this._updateSuggestions(e.target);});
      this.shadowRoot.addEventListener('click',e=>this._click(e));
      // One delegated quick-menu gesture system for the sidebar's existing
      // navigation, section headers and Live Control Center. No per-row listeners.
      // Listen in OUR shadowRoot: the old list-only listener could never see
      // the Control Center, and Android pointercancel could discard touch holds.
      this.shadowRoot.addEventListener('contextmenu',e=>{
        const target=this._quickMenuTarget(e);
        if(!target)return;
        e.preventDefault();e.stopPropagation();
        this._favoriteHoldClear();
        this._favoriteSuppressClickUntil=performance.now()+900;
        this._openQuickMenuTarget(target);
      });
      this.shadowRoot.addEventListener('keydown',e=>{
        if(e.key!=='ContextMenu'&&!(e.key==='F10'&&e.shiftKey))return;
        const target=this._quickMenuTarget(e);
        if(!target)return;
        e.preventDefault();e.stopPropagation();this._openQuickMenuTarget(target);
      });
      this.shadowRoot.addEventListener('pointerdown',e=>this._favoriteHoldPointerStart(e),{passive:true});
      this.shadowRoot.addEventListener('pointermove',e=>this._favoriteHoldPointerMove(e),{passive:true});
      this.shadowRoot.addEventListener('pointerup',e=>this._favoriteHoldPointerEnd(e),{passive:true});
      this.shadowRoot.addEventListener('pointercancel',e=>this._favoriteHoldPointerEnd(e),{passive:true});
      // A real touchstart is authoritative on Android, including WebViews
      // exposing PointerEvent but cancelling its pointer stream mid-hold.
      this.shadowRoot.addEventListener('touchstart',e=>this._favoriteHoldStart(e),{passive:true});
      this.shadowRoot.addEventListener('touchmove',e=>this._favoriteHoldMove(e),{passive:true});
      this.shadowRoot.addEventListener('touchcancel',()=>this._favoriteHoldClear(),{passive:true});
      this.shadowRoot.addEventListener('touchend',e=>{
        if(performance.now()<(this._favoriteSuppressClickUntil||0)&&e.cancelable)e.preventDefault();
        if(this._favoriteHold?.source==='touch')this._favoriteHoldClear();
      },{passive:false});
      this.list.addEventListener('scroll',()=>this._favoriteHoldClear(),{passive:true});
      this.shadowRoot.addEventListener('click',e=>{
        if(e.isTrusted&&performance.now()<(this._favoriteSuppressClickUntil||0)&&this._quickMenuTarget(e)){
          e.preventDefault();e.stopImmediatePropagation();
        }
      },true);
      this.shadowRoot.addEventListener('input',e=>this._input(e));
      this.shadowRoot.addEventListener('change',e=>this._change(e));
      this.shadowRoot.addEventListener('focusin',e=>{if(e.target?.dataset?.entityPicker)this._updateSuggestions(e.target);});
      for(const [node,kind] of [[this.dialog,'settings'],[this.quickDialog,'quick'],[this.actionDialog,'action']]){
        // A manual close (X, Escape, native dialog cancel) must consume ONLY
        // the browser entry created for this exact PalaSidebar dialog.
        node.addEventListener('close',()=>{
          this._clearDialogCloseTimer(node);
          if(kind==='quick')this._quickOrderCleanup(true);
          delete node.dataset.phase;
          this._onOwnedDialogClose(kind);
        });
        // Escape normally closes <dialog> immediately (without a transition).
        // Route it through the same animated close and history handler.
        node.addEventListener('cancel',e=>{e.preventDefault();this._closeOwnedDialog(node);});
      }
      this.dialog.addEventListener('close',()=>{this._pfxDraft=null;this._pfxApply();this._applyDesign();if(this._editorNoticeTimer){clearTimeout(this._editorNoticeTimer);this._editorNoticeTimer=null;}if(this.themeDraft){this.themeDraft=null;this._syncTheme(true);}});
      // Ook lokale WebView-gebaren binnen onze eigen shadow DOM opvangen:
      // sommige kiosk-builds sturen deze niet als composed event naar window.
      this.shadowRoot.addEventListener('touchstart',e=>this.handleGestureStart(e),{passive:true});
      this.shadowRoot.addEventListener('touchend',e=>this.handleGestureEnd(e),{passive:true});
      this.shadowRoot.addEventListener('touchcancel',()=>this.handleGestureCancel(),{passive:true});
    }
    _mount(){
      this.scrim=$('div','scrim');this.shell=$('div','shell');this.launch=$('button','launch','P');
      this.launch.type='button';this.launch.title='PalaSidebar openen';this.launch.setAttribute('aria-label','PalaSidebar openen');
      this.list=$('nav','list');this.list.setAttribute('aria-label','PalaSidebar navigatie');
      this.searchBox=$('div','search');const sIcon=makeIcon('mdi:magnify','⌕');this.searchInput=$('input');
      this.searchInput.placeholder='Zoeken in menu…   Ctrl + K';this.searchInput.setAttribute('aria-label','Zoek een pagina');
      this.searchBox.append(sIcon,this.searchInput);
      this.head=$('div','top');this.headerExtra=$('div','header-extra');this.clock=$('div','clock');this.liveCenter=$('section','pala-live-center');this.liveCenter.hidden=true;this.liveCenter.setAttribute('aria-label','Live Control Center');this.agenda=$('section','pala-agenda');this.agenda.hidden=true;this.agenda.setAttribute('aria-label','Aankomende agenda-afspraken');this.health=$('div','health');this.footer=$('div','footer');
      this.banner=$('div','message');this.banner.hidden=true;
      const dlg=$('dialog','dialog');dlg.setAttribute('aria-label','PalaSidebar instellingen');this.dialog=dlg;
      this.weatherLayer=$('div','weather-layer');this.weatherLayer.hidden=true;this.weatherLayer.setAttribute('aria-hidden','true');
      this.shell.append(this.weatherLayer,this.head,this.headerExtra,this.clock,this.searchBox,this.liveCenter,this.banner,this.list,this.agenda,this.health,this.footer);
      this.actionDialog=$('dialog','dialog action-dialog');this.actionDialog.setAttribute('aria-label','PalaSidebar dialoog');
      this.quickDialog=$('dialog','dialog quick-dialog');this.quickDialog.setAttribute('aria-label','Van alles · Dashboardkeuze');
      this.shadowRoot.append(this.scrim,this.launch,this.shell);
    }
    connectedCallback(){
      if(!this._dialogPortal.isConnected && document.body)document.body.append(this._dialogPortal);
      if(!this.hasAttribute('data-integration'))this._applyIntegration('floating');
    }
    // The body portal is deliberately independent of HA drawer mounting.
    // It is removed only when this module really disconnects, not during a
    // synchronous native->floating move (where it may hold an open dialog).
    _syncDialogPortal(){
      if(!this._dialogPortal.isConnected&&document.body)document.body.append(this._dialogPortal);
      this._dialogPortal.setAttribute('data-mobile',this.getAttribute('data-mobile')||'false');
      this._dialogPortal.dataset.dialogMotion=this.saved.dialog_motion||'smooth';
      this._dialogPortal.dataset.dialogStyle=this.saved.dialog_style||'lift';
      this._dialogPortal.dataset.dialogBackdrop=this.saved.dialog_backdrop||'normal';
      // Keep every NEW surface on the sidebar's active design system.
      this._dialogPortal.dataset.themeActive=this.getAttribute('data-theme-active')||'false';
      this._dialogPortal.dataset.theme=this.getAttribute('data-theme')||'classic';
      for(const name of ['--p-accent','--p-sky','--p-ground','--p-text','--p-muted']){
        const value=this.style.getPropertyValue(name).trim();
        if(value)this._dialogPortal.style.setProperty(name,value);
      }
      this._dialogPortal.style.setProperty('--p-sidebar-accent',this.style.getPropertyValue('--p-accent').trim()||'#38bdf8');
      if(this.dialog?.open||this.quickDialog?.open||this.actionDialog?.open)this._syncHaDialogTheme();
      this._applyDesign();
    }
    _syncHaDialogTheme(force=false){
      // Home Assistant may install themes on the <home-assistant> host rather
      // than documentElement. The body-level portal otherwise misses them.
      if(!this._dialogPortal)return;
      const now=Date.now();
      if(!force&&now-(this._lastDialogHaCheck||0)<950)return;
      this._lastDialogHaCheck=now;
      const source=document.querySelector('home-assistant');
      const nodes=[source?.shadowRoot?.querySelector('home-assistant-main'),source,document.documentElement].filter(Boolean);
      const properties=['--primary-text-color','--secondary-text-color','--card-background-color',
        '--ha-card-background','--primary-background-color','--secondary-background-color',
        '--divider-color','--primary-color','--light-primary-color','--input-fill-color',
        '--mdc-theme-surface','--rgb-primary-color','--primary-font-family'];
      const values={};
      for(const node of nodes){
        const style=getComputedStyle(node);
        for(const key of properties){
          if(!values[key]){const v=style.getPropertyValue(key).trim();if(v)values[key]=v;}
        }
      }
      // Resolve colors through HA computed color-scheme when possible.
      const scheme=getComputedStyle(source||document.documentElement).colorScheme||'normal';
      const signature=JSON.stringify([values,scheme]);
      if(!force&&this._lastDialogHaTheme===signature)return;
      this._lastDialogHaTheme=signature;
      for(const key of properties){
        if(values[key])this._dialogPortal.style.setProperty(key,values[key]);
        else this._dialogPortal.style.removeProperty(key);
      }
      this._dialogPortal.style.setProperty('--p-ha-scheme',scheme);
      const haAccent=sensorColor(values['--primary-color'])||sensorColor(this.style.getPropertyValue('--p-accent'))||'#38bdf8';
      this._dialogPortal.style.setProperty('--p-dialog-accent',haAccent);
      this._dialogPortal.style.setProperty('--p-dialog-ink',readableBadgeText(haAccent));
    }
    _applyDesign(){
      const d=cleanDesign(this.saved.design);
      const spacing={tight:[5,7],normal:[8,10],airy:[12,13]}[d.spacing];
      const railIconSize=d.rail_icons==='auto'?d.icons:d.rail_icons;
      for(const el of [this,this._dialogPortal].filter(Boolean)){
        el.style.setProperty('--p-ui-radius',d.radius+'px');
        el.style.setProperty('--p-ui-dialog-radius',Math.max(12,d.radius+6)+'px');
        el.style.setProperty('--p-ui-item-pad',spacing[0]+'px');
        el.style.setProperty('--p-ui-item-gap',spacing[1]+'px');
        el.style.setProperty('--p-ui-list-gap',({tight:2,normal:3,airy:5}[d.spacing])+'px');
        el.style.setProperty('--p-ui-group-margin',({tight:8,normal:11,airy:16}[d.spacing])+'px');
        el.style.setProperty('--p-ui-health-gap',({tight:3,normal:5,airy:8}[d.spacing])+'px');
        el.style.setProperty('--p-ui-text-size',(12*d.typography/100).toFixed(1)+'px');
        for(const [key,px] of [['--p-ui-badge-font',10],['--p-ui-badge-small',9],['--p-ui-badge-large',12],['--p-ui-group-font',10],['--p-ui-small-font',11],['--p-ui-agenda-small',9],['--p-ui-agenda-date',13],['--p-ui-compact-font',10]]){
          el.style.setProperty(key,(px*d.typography/100).toFixed(1)+'px');
        }
        el.style.setProperty('--p-ui-icon-size',d.icons+'px');
        el.style.setProperty('--p-ui-icon-slot',(d.icons+2)+'px');
        el.style.setProperty('--p-ui-rail-icon-size',railIconSize+'px');
        el.style.setProperty('--p-ui-rail-slot',(railIconSize+2)+'px');
        el.dataset.uiShadow=d.shadow;
        el.dataset.uiDialogWidth=d.dialog_width;
        el.dataset.chevronStyle=d.chevrons;
      }
      this._syncNativeTypography(this.native);
    }
    _designReadForm(){
      const q=id=>this.dialog.querySelector('#pala-design-'+id)?.value;
      return cleanDesign({spacing:q('spacing'),radius:q('radius'),typography:q('typography'),icons:q('icons'),rail_icons:q('rail_icons'),shadow:q('shadow'),dialog_width:q('dialog_width'),chevrons:q('chevrons')});
    }
    _designPreview(){
      this._applyDesignDraft(this._designReadForm());
      const el=this.dialog.querySelector('#pala-design-preview');if(el){el.dataset.chevronStyle=this._designReadForm().chevrons;el.querySelector('.design-preview-hint').textContent='Voorbeeld · wijzigingen nog niet opgeslagen';}
    }
    _applyDesignDraft(d){
      if(!this._dialogPortal)return;
      const spacing={tight:[5,7],normal:[8,10],airy:[12,13]}[d.spacing];
      const el=this._dialogPortal;
      el.style.setProperty('--p-ui-radius',d.radius+'px');el.style.setProperty('--p-ui-dialog-radius',Math.max(12,d.radius+6)+'px');
      el.style.setProperty('--p-ui-item-pad',spacing[0]+'px');el.style.setProperty('--p-ui-item-gap',spacing[1]+'px');
        el.style.setProperty('--p-ui-list-gap',({tight:2,normal:3,airy:5}[d.spacing])+'px');
        el.style.setProperty('--p-ui-group-margin',({tight:8,normal:11,airy:16}[d.spacing])+'px');
        el.style.setProperty('--p-ui-health-gap',({tight:3,normal:5,airy:8}[d.spacing])+'px');
      el.style.setProperty('--p-ui-text-size',(12*d.typography/100).toFixed(1)+'px');
        for(const [key,px] of [['--p-ui-badge-font',10],['--p-ui-badge-small',9],['--p-ui-badge-large',12],['--p-ui-group-font',10],['--p-ui-small-font',11],['--p-ui-agenda-small',9],['--p-ui-agenda-date',13],['--p-ui-compact-font',10]]){
          el.style.setProperty(key,(px*d.typography/100).toFixed(1)+'px');
        }
      el.style.setProperty('--p-ui-icon-size',d.icons+'px');el.style.setProperty('--p-ui-icon-slot',(d.icons+2)+'px');
      const railIconSize=d.rail_icons==='auto'?d.icons:d.rail_icons;
      el.style.setProperty('--p-ui-rail-icon-size',railIconSize+'px');el.style.setProperty('--p-ui-rail-slot',(railIconSize+2)+'px');
      el.dataset.uiShadow=d.shadow;el.dataset.uiDialogWidth=d.dialog_width;
    }
    _designSave(){
      this.saved.design=this._designReadForm();this._saveSettings();this._applyDesign();this._editorNotice('Design opgeslagen.');
    }
    _designReset(){
      this.saved.design=cleanDesign(DESIGN_DEFAULT);this._saveSettings();this._applyDesign();this._rebuildSettingsAtSamePosition('design');this._editorNotice('Standaarddesign hersteld.');
    }
    _pfxPrefs(){return pfxClean(this._pfxDraft||this.saved.ui_style||PFX_DEFAULT);}
    _pfxTryMigration(){
      if(this.saved.ui_style)return false;
      const old=readJSON(safeGet(PFX_OLD_LOCAL_KEY),null);
      if(!old||typeof old!=='object'||!Object.keys(old).some(k=>k in PFX_DEFAULT))return false;
      this.saved.ui_style=pfxLegacy(old);return true;
    }
    _pfxApply(raw=this.saved.ui_style||PFX_DEFAULT){
      const newCss=pfxStyles(raw);
      let node=document.getElementById(PFX_STYLE_ID);
      if(!newCss){node?.remove();return;}
      if(!node){node=document.createElement('style');node.id=PFX_STYLE_ID;document.head?.append(node);}
      if(node.textContent!==newCss)node.textContent=newCss;
    }
    _pfxField(type,key,label,options){
      const box=$('div','pfx-field');const lbl=$('label',null,label);lbl.htmlFor='pala-pfx-'+key;box.append(lbl);
      const prefs=this._pfxPrefs(),value=prefs[key];let input;
      if(type==='select'){
        input=$('select');for(const [v,t] of options){const opt=$('option',null,t);opt.value=v;input.append(opt);}input.value=String(value);
      }else if(type==='color'){
        const wrap=$('div','pfx-color');input=$('input');input.type='color';input.value=value;
        const out=$('output',null,value);out.htmlFor='pala-pfx-'+key;wrap.append(input,out);box.append(wrap);
      }else if(type==='range'){
        const wrap=$('div','pfx-range');input=$('input');input.type='range';input.min=options[0];input.max=options[1];input.step=options[2]||1;input.value=String(value);
        const out=$('output',null,String(value)+(options[3]||''));out.htmlFor='pala-pfx-'+key;wrap.append(input,out);box.append(wrap);
      }else if(type==='toggle'){
        box.classList.add('pfx-toggle');input=$('input');input.type='checkbox';input.checked=!!value;
      }
      input.id='pala-pfx-'+key;input.dataset.pfxKey=key;if(type==='select'||type==='toggle')box.append(input);
      return box;
    }
    _pfxSection(page,title,desc,fields){
      const section=$('section','pfx-section');section.append($('h3',null,title),$('p','pfx-description',desc));
      const grid=$('div','pfx-grid');for(const item of fields)grid.append(this._pfxField(...item));
      section.append(grid);page.append(section);
    }
    _pfxEditor(page){
      const intro=$('div','pfx-intro');intro.append($('h3',null,'PalaSidebar UI · Vormgeving'),
        $('p',null,'Eén geïntegreerde ontwerpstudio voor Home Assistant. Volgt standaard je actieve HA-thema; kies alleen wat je wilt aanpassen. Geen tweede zwevende knop of los instellingenbestand.'));
      page.append(intro);
      page.append(this._help('PalaSidebar UI versus Home Assistant-thema',
        'HA standaard gebruikt de kleuren van je gekozen Home Assistant-thema. Klassieke stijl overschrijft meer globale kleuren en lettergroottes. De PalaSidebar-weereffecten en dynamische badges stel je apart in. Verminder glasvervaging op oudere tablets voor lagere GPU-belasting.'));
      const profiles=$('div','pfx-presets');
      for(const [key,label] of [['ha','HA standaard'],['classic','Klassieke stijl'],['premium','Premium glas'],['compact','Compact'],['amoled','AMOLED']]){
        const btn=this._button(label,'pfx-preset');btn.dataset.profile=key;profiles.append(btn);
      }
      page.append(profiles);
      const preview=$('div','pfx-preview');preview.id='pala-pfx-preview';preview.append($('strong',null,'Live voorbeeld'));
      const sample=$('div','pfx-sample');sample.append($('div','pfx-title','PalaSidebar · Mijn Home Assistant'),$('small',null,'Een voorbeeldkaart met energiekleuren, vormgeving en typografie'));
      const pills=$('div','pfx-pills');for(const key of ['energyGrid','energySolar','energyReturn']){const t=$('span','pfx-pill',PFX_ENERGY[key][2]);t.dataset.pfxSwatch=key;pills.append(t);}sample.append(pills);preview.append(sample);page.append(preview);
      this._pfxSection(page,'Lettertype en responsieve grootte','De grootte werkt voor Home Assistant op mobiel en desktop. Met ‘Klassieke stijl’ herstel je ook de oude compacte lettergroottes.',[
        ['toggle','enabled','PalaSidebar-vormgeving actief'],
        ['select','font','Lettertype',Object.entries({ha:'Home Assistant-thema',supercell:'Supercell Magic',roboto:'Roboto',system:'Systeemfont',arial:'Arial'})],
        ['range','fontScale','Desktop tekstgrootte',[75,160,5,'%']],
        ['range','mobileScale','Mobiel tekstgrootte',[75,160,5,'%']]
      ]);
      this._pfxSection(page,'Thema en achtergrond','‘Home Assistant’ respecteert het actieve thema. ‘Klassieke vormgeving’ herstelt de oude volledige styling. AMOLED is een donkere override.',[
        ['select','background','Dashboardachtergrond',[['ha','Volg Home Assistant'],['classic','Klassieke vormgeving'],['glass','Glas · zacht verloop'],['flat','Effen · HA-achtergrond'],['amoled','AMOLED zwart']]],
        ['select','accentMode','Accentkleur',[['ha','Volg Home Assistant'],['custom','Eigen accentkleur']]],
        ['color','accent','Eigen accentkleur'],['range','glass','Glassterkte',[15,95,5,'%']]
      ]);
      this._pfxSection(page,'Vormgeving en beweging','Kaarten, knoppen, schaduwen en subtiele effecten.',[
        ['range','cardRadius','Kaarten en dialogen',[0,44,2,'px']],
        ['range','controlRadius','Knoppen en invoervelden',[0,32,2,'px']],
        ['toggle','sidebarBlur','Glasvervaging van HA-sidebar'],['toggle','dialogBlur','Glasvervaging van HA-dialogen'],
        ['toggle','shadows','Kaartschaduwen'],['toggle','energyGlow','Subtiele energie-gloed']
      ]);
      const energy=$('section','pfx-section');energy.append($('h3',null,'Energiepalet'),$('p','pfx-description','Stel de acht Home Assistant Energy Dashboard-kleuren in. Alle zeven kleurtrappen lopen automatisch mee.'));
      const grid=$('div','pfx-grid');grid.append(this._pfxField('select','energyMode','Energiekleuren',[['ha','Volg Home Assistant'],['custom','Eigen kleurenpalet']]));
      for(const key of Object.keys(PFX_ENERGY))grid.append(this._pfxField('color',key,PFX_ENERGY[key][2]));energy.append(grid);page.append(energy);
      const actions=$('div','pfx-actions');actions.append(this._button('Vormgeving opslaan','pfx-save','primary'),this._button('Voorbeeld stoppen','pfx-cancel'),this._button('Standaardinstellingen','pfx-reset'));page.append(actions);
      page.append($('p','field-note','Je instellingen worden per Home Assistant-account opgeslagen in PalaSidebar, inclusief backup en serverherstelpunten. Een eventueel oud los vormgevingsscript moet uit Dashboardbronnen worden verwijderd om CSS-conflicten te voorkomen.'));
      this._pfxPreview();
    }
    _pfxPreset(profile){
      const base={...PFX_DEFAULT,...(this._pfxDraft||this.saved.ui_style||{})};
      const chosen={
        ha:{background:'ha',font:'ha',accentMode:'ha',energyMode:'ha',fontScale:100,mobileScale:100,dialogBlur:false},
        classic:{background:'classic',font:'supercell',accentMode:'custom',energyMode:'custom',fontScale:100,mobileScale:100,glass:45,cardRadius:28,controlRadius:20,sidebarBlur:true,dialogBlur:true,shadows:true,energyGlow:true},
        premium:{background:'glass',font:'supercell',accentMode:'ha',energyMode:'custom',fontScale:105,mobileScale:100,glass:55,cardRadius:28,controlRadius:18,dialogBlur:true},
        compact:{background:'ha',font:'roboto',fontScale:90,mobileScale:95,cardRadius:14,controlRadius:10,dialogBlur:false,sidebarBlur:false},
        amoled:{background:'amoled',font:'system',fontScale:100,mobileScale:100,glass:90,sidebarBlur:false,dialogBlur:false,shadows:false,energyGlow:false}
      }[profile];
      if(!chosen)return;
      const next=pfxClean({...base,...chosen,enabled:true});
      for(const el of this.dialog.querySelectorAll('[data-pfx-key]')){
        const value=next[el.dataset.pfxKey];if(el.type==='checkbox')el.checked=!!value;else el.value=String(value);
      }
      this._pfxPreview();this._editorNotice('Profiel '+profile+' als voorbeeld toegepast; druk op Opslaan om te bewaren.');
    }
    _pfxReadForm(){
      const changes={...this._pfxPrefs()};
      for(const el of this.dialog.querySelectorAll('[data-pfx-key]')){
        const key=el.dataset.pfxKey;
        changes[key]=el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value;
      }
      return pfxClean(changes);
    }
    _pfxPreview(){
      if(!this.dialog?.querySelector('#pala-pfx-preview'))return;
      this._pfxDraft=this._pfxReadForm();
      const v=this._pfxDraft,preview=this.dialog.querySelector('#pala-pfx-preview');
      preview.style.setProperty('--pfx-card-radius',v.cardRadius+'px');
      preview.style.setProperty('--pfx-control-radius',v.controlRadius+'px');
      preview.style.setProperty('--pfx-font',PFX_FONTS[v.font]);
      preview.style.setProperty('--pfx-size',(14*(this._isMobile()?v.mobileScale:v.fontScale)/100).toFixed(2)+'px');
      const accent=v.accentMode==='custom'?v.accent:(sensorColor(getComputedStyle(document.documentElement).getPropertyValue('--primary-color'))||'#38bdf8');
      preview.style.setProperty('--pfx-accent',accent);preview.style.setProperty('--pfx-ink',readableBadgeText(accent));
      preview.querySelectorAll('[data-pfx-swatch]').forEach(el=>{
        const k=el.dataset.pfxSwatch;el.style.background=v.energyMode==='custom'?v[k]:PFX_ENERGY[k][1];
        el.style.color=readableBadgeText(el.style.background);
      });
      this.dialog.querySelectorAll('[data-pfx-key]').forEach(el=>{
        const out=el.parentElement.querySelector('output');if(out){
          out.textContent=el.type==='range'?el.value+(el.max<=100&&el.dataset.pfxKey!=='cardRadius'&&el.dataset.pfxKey!=='controlRadius'?'%':'px'):el.value;
        }
      });
      this._pfxApply(v);
    }
    _pfxSave(){
      if(!this._prefsStore?.ready){this._editorNotice('Wacht tot Home Assistant je persoonlijke instellingen heeft geladen.');return;}
      this.saved.ui_style=this._pfxReadForm();this._pfxDraft=null;this._saveSettings();this._pfxApply();this._editorNotice('Vormgeving opgeslagen bij je account.');
    }
    _pfxReset(){
      if(!this._prefsStore?.ready){this._editorNotice('Wacht op de serveropslag voordat je instellingen herstelt.');return;}
      this.saved.ui_style=pfxClean(PFX_DEFAULT);this._pfxDraft=null;this._saveSettings();this._pfxApply();this._rebuildSettingsAtSamePosition('ui_style');this._editorNotice('Standaardvormgeving toegepast.');
    }
    _designEditor(page){
      page.append($('h3',null,'Design Studio'),$('p',null,'Pas de sidebar veilig aan met één set ontwerpregels. Het voorbeeld reageert meteen; opslaan verandert de echte sidebar.'));
      page.append(this._help('Voorbeeld, opslag en apparaten',
        'Design Studio verandert de eigen sidebar: ruimte, iconen, rondingen en de breedte van de dialoog. De PalaSidebar UI-tab past de rest van Home Assistant aan. Het voorbeeld is tijdelijk; na Opslaan wordt het per HA-account bewaard.'));
 
      const d=cleanDesign(this.saved.design);
      const preview=$('div','design-preview');preview.id='pala-design-preview';preview.dataset.chevronStyle=d.chevrons;
      preview.append($('strong',null,'Live voorbeeld'),$('div','design-preview-row'));
      const row=preview.querySelector('.design-preview-row');row.append(this._icon('mdi:flash','⚡'),$('strong',null,'Netafname'),$('span','preview-badge','4,82 kWh'));
      const railPreview=$('div','design-preview-rail');railPreview.append($('span',null,'Ingeschoven iconenbalk'));
      const railBox=$('div','design-preview-rail-box');railBox.append(this._icon('mdi:home-variant','⌂'));railPreview.append(railBox);preview.append(railPreview);
      const collapseDemo=$('div','design-preview-chevron-list');for(const [label,expanded] of [['START',true],['BEHEER',false],['Mijn agenda',true]]){const sample=$('div','design-preview-chevron-row');const arrow=makeChevron('design-chevron-demo');arrow.dataset.expanded=String(expanded);arrow.setAttribute('aria-hidden','true');sample.append($('span',null,label),arrow);collapseDemo.append(sample);}preview.append(collapseDemo,$('small','design-preview-hint','Voorbeeld van je actieve instellingen'));page.append(preview);
      page.append(this._formField('Ruimte tussen elementen','pala-design-spacing',d.spacing,[['tight','Compact'],['normal','Gebalanceerd'],['airy','Ruim']]));
      page.append(this._formField('Hoekafronding','pala-design-radius',String(d.radius),[[4,'4 px · strak'],[8,'8 px'],[12,'12 px'],[16,'16 px'],[20,'20 px'],[24,'24 px · extra rond']].map(([k,v])=>[String(k),v])));
      page.append(this._formField('Tekstgrootte','pala-design-typography',String(d.typography),[['85','85%'],['90','90%'],['100','100%'],['110','110%'],['115','115%'],['125','125%']]));
      page.append(this._formField('Menu- en statusiconen','pala-design-icons',String(d.icons),[['17','Klein · 17 px'],['19','19 px'],['21','Normaal · 21 px'],['24','24 px'],['28','Groot · 28 px']]));
      page.append(this._formField('Iconen ingeschoven sidebar','pala-design-rail_icons',String(d.rail_icons),[['auto','Automatisch · zelfde als normale iconen'],['17','Extra klein · 17 px'],['21','Normaal · 21 px'],['24','24 px'],['27','27 px'],['30','Extra groot · 30 px']]));
      page.append($('p','field-note','MDI-, PNG-, SVG- en emoji-iconen veranderen mee. De knophoogte blijft altijd 42 px, zodat de ingeschoven sidebar netjes blijft.'));
      page.append(this._formField('Stijl open-/dichtknoppen','pala-design-chevrons',d.chevrons,[['glass','Premium Glass · zacht glas en accent'],['ios','iOS Minimal · subtiel en strak'],['glow','PalaUI Glow · accent met lichte gloed']]));
      page.append($('p','field-note','Geldt voor START, BEHEER, eigen secties en Mijn agenda. De pijl volgt je accentkleur; de open-/dicht-animatie blijft hetzelfde.'));
      page.append(this._formField('Schaduwen bij selectie','pala-design-shadow',d.shadow,[['none','Geen'],['soft','Subtiel'],['depth','Meer diepte']]));
      page.append(this._formField('Breedte instellingendialoog','pala-design-dialog_width',d.dialog_width,[['compact','Compact'],['comfortable','Gebalanceerd'],['wide','Breed op desktop']]));
      const buttons=$('div','btnrow');buttons.append(this._button('Design opslaan','design-save','primary'),this._button('Standaarddesign','design-reset'));page.append(buttons);
      page.append($('p','field-note','Icoongrootte geldt nu voor MDI, PNG/SVG en emoji in menu, headerknoppen en Live Status. Tekstschaal werkt ook voor secties, badges en agenda. Het avatarformaat en de eigen badgegroottes, agendadichtheid en koptekst-instellingen blijven afzonderlijk; de ingeklapte iconenbalk heeft een eigen veilige icoongrootte, met vaste klikvlakken van 42 px. PalaSidebar UI beheert de overige Home Assistant-schermen.'));
    }
    _diagnosticData(){
      const states=this.hass?.states||{};
      const refs=new Set();const add=id=>{if(isEntity(id))refs.add(id)};
      for(const q of this.saved.quick_entities||this._resolved().quick_entities||[]){add(q.entity_id);add(q.title_entity);add(q.icon_entity);}
      for(const tile of this.saved.live_center?.tiles||[])add(tile.entity);
      for(const x of Object.values(this.saved.item_dynamic||{})){add(x.title_entity);add(x.icon_entity);}
      for(const x of Object.values(this.saved.badge_overrides||{})){
        if(!x||typeof x!=='object')continue;
        add(x.entity);add(x.color_entity);add(x.switch_entity);
        for(const c of arr(x.switch_cases))add(c.entity);
        for(const m of String(x.template||'').matchAll(/\{((?:sensor|binary_sensor|input_number|weather|sun|update|number|switch|light)\.[a-z0-9_]+)(?:[#:]|\})/gi))add(m[1]);
      }
      const t=this._themePrefs();add(t.weather_entity);add(t.rain_sensor);
      if(this.saved.agenda?.enabled)for(const id of this._agendaSelected())add(id);
      const missing=[...refs].filter(id=>!states[id]).sort();
      const offline=[...refs].filter(id=>states[id]&&['unknown','unavailable'].includes(states[id].state)).sort();
      const nav=this._navData(true,true);const routes=new Map();
      const rawItems=[...this._resolved().groups.flatMap(g=>g.items),...this.saved.links];
      for(const item of rawItems){if(!item.path)continue;const a=routes.get(item.path)||[];a.push(item.label);routes.set(item.path,a);}
      const duplicates=[...routes].filter(([,items])=>items.length>1).map(([path,items])=>path+' · '+items.join(', '));
      return {refs:[...refs],missing,offline,duplicates,items:nav.reduce((n,g)=>n+g.items.length,0),sections:nav.length};
    }
    _diagnosticEditor(page){
      page.append($('h3',null,'Diagnosecentrum'),$('p',null,'Alle controles worden lokaal uit je huidige Home Assistant-gegevens berekend. Er worden geen externe servers benaderd.'));
      page.append(this._help('Wat betekenen de meldingen?',
        'Ontbrekend: de sensor bestaat niet onder die entity_id. Niet beschikbaar: Home Assistant meldt unknown of unavailable. Dubbele route: twee knoppen verwijzen naar dezelfde pagina; soms is dat bewust. Opslagstatus geeft aan of jouw persoonlijke instellingen veilig naar Home Assistant zijn geschreven.'));

      const holder=$('div');holder.id='pala-diagnostic-results';page.append(holder);
      const actions=$('div','btnrow');actions.append(this._button('Opnieuw controleren','diagnostic-refresh','primary'),this._button('Rapport kopiëren','diagnostic-copy'));page.append(actions);
      page.append($('p','field-note','De controle toont alleen entiteiten die PalaSidebar zelf gebruikt, niet alle Home Assistant-entiteiten. Een verdwenen dashboardlink is niet altijd een dubbele menuverwijzing.'));
      this._fillDiagnostic(holder);
    }
    _fillDiagnostic(holder=this.dialog.querySelector('#pala-diagnostic-results')){
      if(!holder)return;holder.replaceChildren();const d=this._diagnosticData(),store=this._prefsStore;
      const grid=$('div','diagnostic-grid');
      for(const [label,value] of [['Menu-items',d.items],['Secties',d.sections],['Gecontroleerde sensoren',d.refs.length],['Ontbrekend',d.missing.length],['Niet beschikbaar',d.offline.length],['Serveropslag',store?.status||'niet verbonden'],['Laatste bevestiging',store?.lastSuccessfulAt?new Date(store.lastSuccessfulAt).toLocaleTimeString('nl-NL'):'—'],['Laatste UI-update',this._perf.lastRefreshMs+' ms'],['Live updates',this._perf.liveUpdates]]){
        const c=$('div','diagnostic-stat');c.append($('strong',null,String(value)),$('div',null,label));grid.append(c);
      }
      holder.append(grid);
      // Only report verifiable PalaSidebar issues here. Other HACS resources
      // (e.g. Neerslag Card) have separate owners and are not masked.
      const issues=[...d.missing.map(id=>'Ontbreekt: '+id),...d.offline.map(id=>'Niet beschikbaar: '+id),...d.duplicates.map(id=>'Dubbele route: '+id)];
      if(bootInfo.config==='standaardconfig (bestand niet geladen)')issues.unshift('Sidebarconfig niet geladen: controleer custom_components/pala_sidebar/pala-sidebar-config.json');
      if(legacyModuleActive())issues.unshift('Oude losse vormgevingsmodule actief. Verwijder de oude resourceverwijzing.');
      else if(legacySources().length)issues.unshift('Verouderde vormgevingsscriptverwijzing gevonden (mogelijk 404). Controleer frontend.extra_module_url in configuration.yaml en herstart HA.');
      if(bootInfo.phase==='fout')issues.unshift('Opstartfout: '+(bootInfo.issue||'onbekend'));
      holder.append($('h3',null,'Aandachtspunten ('+issues.length+')'));
      const list=$('div','diagnostic-list');for(const issue of issues.slice(0,60))list.append($('div','diagnostic-line',issue));
      if(!issues.length)list.append($('p',null,'Geen ontbrekende sensoren of dubbele menuverwijzingen gevonden.'));
      holder.append(list);
      holder.append($('p','field-note','Home Assistant '+(this.hass?.config?.version||'onbekend')+' · PalaSidebar '+VERSION+' · '+(store?.ready?'Serveropslag geladen':'Serveropslag nog niet geladen')));
      holder.append($('p','field-note','Laatste UI-update is een lokale meting van de PalaSidebar-statusverversing, niet de laadtijd van alle Home Assistant-kaarten. Live updates worden per animatieframe samengevoegd.'));
    }
    _diagnosticText(){const d=this._diagnosticData();return ['PalaSidebar '+VERSION,'Opstart: '+bootInfo.phase,
      'Configuratie: '+bootInfo.config,'Integratie: '+this.integration,
      'Oude vormgevingsresource: '+(legacyModuleActive()?'actief':legacySources().length?'verwezen / mogelijk 404':'niet aangetroffen'),
      'Opslag: '+(this._prefsStore?.status||'onbekend'),
      'Laatste UI-update: '+this._perf.lastRefreshMs+' ms',
      'Live updates: '+this._perf.liveUpdates,
      'Menu-items: '+d.items,'Secties: '+d.sections,'Sensorkoppelingen: '+d.refs.length,
      'Ontbrekend: '+d.missing.join(', '),'Niet beschikbaar: '+d.offline.join(', '),'Dubbele routes: '+d.duplicates.join('; ')].join('\n');}
    _settingsKey(){return getSavedUserKey(this.hass)}
    _pendingSettingsKey(){return this._settingsKey()+':unsynced';}
    _migratePrefs(){
      // Migrate both local AND remotely loaded preferences without causing a
      // premature server write. Older migrations saved while the server load
      // was still in flight and could overwrite the canonical configuration.
      if(!this.saved.mobile_v131_migrated){this.saved.mobile_dock=false;this.saved.mobile_v131_migrated=true;}
      if(!this.saved.header_v133_migrated){
        if(wasLegacyDefaultHeader(this.saved.header))this.saved.header=cleanHeader({...this.saved.header,ha:'hidden'});
        this.saved.header_v133_migrated=true;
      }
    }
    _loadSettings(){
      const userId=this.hass?.user?.id;
      if(!userId)return;
      const previous=this._prefsStore;
      if(previous?.timer)clearTimeout(previous.timer);
      if(previous?.retryTimer)clearTimeout(previous.retryTimer);
      const local=safeGet(this._settingsKey());
      // Survives a refresh made while Home Assistant was temporarily offline.
      // Only an explicit unsynced edit takes precedence over server state.
      const pending=safeGet(this._pendingSettingsKey());
      this.saved=parsePrefs(readJSON(pending||local,{}));
      this._migratePrefs();
      this._pfxTryMigration();this._pfxApply();
      safeSet(this._settingsKey(),JSON.stringify(this.saved));
      // Record which preference categories were really edited before the server
      // snapshot arrived. Without this, saving only a theme could overwrite
      // unrelated remote dashboard links with an incomplete local menu.
      const deltaKey=this._pendingSettingsKey()+':fields';
      const pendingFields=arr(readJSON(safeGet(deltaKey),[])).filter(k=>Object.prototype.hasOwnProperty.call(this.saved,k));
      const store={userId,ready:false,dirty:pending!==null,loading:false,timer:null,retryTimer:null,
        inflight:false,lastSaved:'',status:'laden',attempts:0,localFound:local!==null||this.saved.ui_style!==null,
        preloadBase:structuredClone(this.saved),modifiedKeys:new Set(pendingFields),hadPending:pending!==null};
      this._prefsStore=store;
      this._loadServerSettings(store);
    }
    async _loadServerSettings(store,force=false){
      if(this._prefsStore!==store||store.loading)return;
      const connection=this.hass?.connection;
      if(!connection?.sendMessagePromise){this._serverStoreError(store,'Nog geen Home Assistant-verbinding');return;}
      store.loading=true;store.status='laden';this._showStorageStatus();
      try{
        const result=await connection.sendMessagePromise({type:'frontend/get_user_data',key:SERVER_PREFS_KEY});
        if(this._prefsStore!==store)return;
        const remote=result?.value;
        const hasRemote=!!(remote&&typeof remote==='object'&&!Array.isArray(remote)&&remote.format==='PalaSidebar-v1'&&remote.settings&&typeof remote.settings==='object');
        if(remote!==null&&remote!==undefined&&!hasRemote)throw Error('Onbekend serverformaat: niet overschreven');
        store.ready=true;store.attempts=0;
        void this._loadRecoveryPoints();
        if(hasRemote&&(!store.dirty||force)){
          if(force)store.dirty=false;
          this.saved=parsePrefs(remote.settings);this._migratePrefs();this._pfxTryMigration();this._pfxApply();
          const snapshot=JSON.stringify(this.saved);
          store.lastSaved=snapshot;store.lastSuccessfulAt=Date.now();
          safeSet(this._settingsKey(),snapshot);
          store.status='opgeslagen';
          this.redraw();this.ensurePlacement();
          // Migrations of an older server preference are persisted once.
          if(JSON.stringify(remote.settings)!==snapshot){store.dirty=true;this._scheduleServerSave();}
        }else if(hasRemote){
          // Merge just the categories changed before the initial remote read.
          // A theme save must NOT replace remotely stored dashboard links,
          // custom sections, badges or item order with initial defaults.
          const server=parsePrefs(remote.settings),local=this.saved;
          const changes=new Set(store.modifiedKeys);
          if(store.hadPending && !changes.size){
            // Compatibility with pending saves created by older releases which
            // did not record an edit delta. Keep substantive local changes but
            // preserve remote menu data where local fields are merely defaults.
            const empty=EMPTY_PREFS();
            for(const k of Object.keys(server)){
              if(JSON.stringify(local[k])!==JSON.stringify(empty[k]) &&
                 JSON.stringify(local[k])!==JSON.stringify(server[k]))changes.add(k);
            }
          }
          const merged={...server};
          const dictKeys=new Set(['item_groups','item_labels','item_icons','item_dynamic','badge_overrides',
            'action_overrides','section_overrides']);
          for(const key of changes){
            if(key==='links'||key==='custom_groups'){
              const existing=arr(server[key]),updated=arr(local[key]);
              merged[key]=[...new Map([...existing,...updated].map(entry=>[entry.id,entry])).values()];
            }else if(dictKeys.has(key))merged[key]={...server[key],...local[key]};
            else merged[key]=local[key];
          }
          this.saved=parsePrefs(merged);this._migratePrefs();this._pfxTryMigration();this._pfxApply();
          const snapshot=JSON.stringify(this.saved);
          safeSet(this._settingsKey(),snapshot);
          safeSet(this._pendingSettingsKey(),snapshot);
          store.lastSaved=JSON.stringify(server);store.status='synchroniseren';
          this.redraw();this.ensurePlacement();this._scheduleServerSave();
        }else{
          // First-time migration from v1.3.16 localStorage, only if actual
          // local data existed (never seed factory defaults after cache clear).
          store.status='opgeslagen';
          if(store.localFound||store.dirty){store.dirty=true;this._scheduleServerSave();}
        }
        this._showStorageStatus();
        if(!bootInfo.accountReadyReported){
          bootInfo.accountReadyReported=true;bootInfo.storage='geladen';
          console.info('%c ▦ PalaSidebar '+VERSION+' %c ✓ persoonlijke instellingen geladen · '+
            (store.status==='opgeslagen'?'opgeslagen bij Home Assistant':'synchronisatie wordt afgerond'),
            'background:#152439;color:#e8f2ff;padding:3px 7px;border-radius:5px;font-weight:700',
            'color:#059669;font-weight:650');
        }
      }catch(error){
        if(this._prefsStore===store)this._serverStoreError(store,error?.message||'Opslag niet bereikbaar');
      }finally{store.loading=false;}
    }
    _recoveryNavigation(settings){
      const p=parsePrefs(settings);return p.links.length+p.custom_groups.length+Object.keys(p.badge_overrides).length+Object.keys(p.item_labels).length+Object.keys(p.item_groups).length;
    }
    async _loadRecoveryPoints(showNotice=false){
      const store=this._prefsStore,conn=this.hass?.connection;
      if(!store?.ready||!conn?.sendMessagePromise)return;
      try{
        const response=await conn.sendMessagePromise({type:'frontend/get_user_data',key:SERVER_RECOVERY_KEY});
        if(store!==this._prefsStore)return;
        const value=response?.value;
        if(value!=null && (value.format!=='PalaSidebar-recovery-v1'||!Array.isArray(value.points)))throw Error('Onbekend formaat herstelpunten');
        this._recoveryPoints=arr(value?.points).filter(p=>p&&p.settings&&typeof p.settings==='object'&&Number.isFinite(p.at)).slice(0,RECOVERY_LIMIT);
        this._recoveryStatus='gereed';this._renderRecoveryPoints();
        if(showNotice)this._editorNotice('Herstelpunten vernieuwd.');
      }catch(error){
        if(store!==this._prefsStore)return;
        this._recoveryStatus='offline';this._renderRecoveryPoints();
        if(showNotice)this._editorNotice('Herstelpunten niet beschikbaar: '+String(error.message).slice(0,90));
      }
    }
    async _protectServerSnapshot(previous,store){
      if(!previous||store!==this._prefsStore)return;
      let parsed;try{parsed=JSON.parse(previous)}catch{return;}
      // Never replace the last useful snapshot with an empty factory state.
      if(this._recoveryNavigation(parsed)<1)return;
      const conn=this.hass?.connection;if(!conn?.sendMessagePromise)throw Error('Geen verbinding voor herstelpunt');
      // First read the current server backup; never overwrite another client's
      // newer restore points with a stale local list.
      const existing=await conn.sendMessagePromise({type:'frontend/get_user_data',key:SERVER_RECOVERY_KEY});
      if(store!==this._prefsStore)throw Error('Account is gewijzigd');
      const data=existing?.value;
      if(data!=null&&(data.format!=='PalaSidebar-recovery-v1'||!Array.isArray(data.points)))throw Error('Onbekend herstelpuntformaat');
      const records=arr(data?.points).filter(p=>p?.settings&&Number.isFinite(p.at)).slice(0,RECOVERY_LIMIT);
      const stamp=records[0];
      // Avoid extra writes for frequent sensor/animation settings changes.
      if(stamp&&JSON.stringify(stamp.settings)===previous){this._recoveryPoints=records;return;}
      const snapshot={at:Date.now(),version:VERSION,settings:parsed};
      const points=[snapshot,...records].slice(0,RECOVERY_LIMIT);
      await conn.sendMessagePromise({type:'frontend/set_user_data',key:SERVER_RECOVERY_KEY,value:{format:'PalaSidebar-recovery-v1',points}});
      if(store!==this._prefsStore)throw Error('Account is gewijzigd');
      this._recoveryPoints=points;this._recoveryStatus='gereed';this._renderRecoveryPoints();
    }
    _renderRecoveryPoints(){
      const holder=this.dialog?.querySelector('#pala-recovery-list');if(!holder)return;
      holder.replaceChildren();
      if(!this._recoveryPoints.length){holder.append($('p','field-note',this._recoveryStatus==='offline'?'Herstelpunten niet bereikbaar.':'Nog geen serverherstelpunten. Maak voor de zekerheid een JSON-export.'));return;}
      this._recoveryPoints.forEach((r,i)=>{
        const item=$('div','recovery-row');const label=$('span',null,new Date(r.at).toLocaleString('nl-NL')+' · '+(r.version||'PalaSidebar')+' · '+this._recoveryNavigation(r.settings)+' persoonlijke onderdelen');
        const b=this._button('Herstellen','recovery-restore');b.dataset.index=String(i);item.append(label,b);holder.append(item);
      });
    }
    _restoreRecoveryPoint(index){
      const store=this._prefsStore,point=this._recoveryPoints[index];
      if(!point?.settings||!store?.ready){this._editorNotice('Wacht totdat de serveropslag geladen is.');return;}
      if(!confirm('Instellingen herstellen van '+new Date(point.at).toLocaleString('nl-NL')+'? De huidige versie wordt eerst als herstelpunt bewaard.'))return;
      this.saved=parsePrefs(point.settings);this._migratePrefs();this._pfxDraft=null;this._pfxApply();this._saveSettings();
      this._applyDesign();this.redraw();this._rebuildSettingsAtSamePosition('backup');this._editorNotice('Herstel geladen. Synchronisatie met Home Assistant gestart.');
    }
    _serverStoreError(store,message){
      if(this._prefsStore!==store)return;
      // Retain the last settings locally, never silently replace it with defaults
      // or attempt a destructive write before a successful server read.
      store.status='offline';store.error=String(message).slice(0,180);
      bootInfo.storage='offline';
      logWarning('server-storage','Home Assistant-opslag tijdelijk niet bereikbaar; lokale kopie behouden. Controleer Instellingen → Diagnose.');
      this._showStorageStatus();
      if(store.retryTimer)clearTimeout(store.retryTimer);
      const wait=Math.min(60000,12000*Math.pow(2,Math.min(store.attempts++,3)));
      store.retryTimer=setTimeout(()=>{
        store.retryTimer=null;
        if(this._prefsStore!==store)return;
        if(store.ready)this._flushServerSettings(store);
        else this._loadServerSettings(store);
      },wait);
    }
    _saveSettings(){
      // Synchronous fallback so opening another dashboard cannot lose a click.
      // Also mark this snapshot unsynced until HA confirms server persistence.
      const snapshot=JSON.stringify(this.saved);
      const store=this._prefsStore;
      if(store&&store.userId===this.hass?.user?.id&&!store.ready){
        for(const key of Object.keys(this.saved)){
          if(JSON.stringify(this.saved[key])!==JSON.stringify(store.preloadBase?.[key]))
            store.modifiedKeys.add(key);
        }
        safeSet(this._pendingSettingsKey()+':fields',JSON.stringify([...store.modifiedKeys]));
      }
      // A local recovery snapshot is only refreshed when personal navigation
      // actually exists; an accidental empty menu cannot destroy that backup.
      if(this.saved.links.length||this.saved.custom_groups.length)
        safeSet(this._settingsKey()+':navigation-backup',snapshot);
      safeSet(this._settingsKey(),snapshot);
      safeSet(this._pendingSettingsKey(),snapshot);
      if(!store||store.userId!==this.hass?.user?.id)return;
      store.dirty=true;
      if(store.ready)this._scheduleServerSave();
    }
    _scheduleServerSave(now=false){
      const store=this._prefsStore;
      if(!store?.ready)return;
      if(store.timer)clearTimeout(store.timer);
      store.status='synchroniseren';this._showStorageStatus();
      store.timer=setTimeout(()=>{store.timer=null;this._flushServerSettings(store);},now?0:650);
    }
    async _flushServerSettings(store=this._prefsStore){
      if(!store||store!==this._prefsStore||!store.ready||store.inflight)return;
      const value=JSON.stringify(this.saved);
      if(value===store.lastSaved){store.dirty=false;store.status='opgeslagen';safeRemove(this._pendingSettingsKey());safeRemove(this._pendingSettingsKey()+':fields');this._showStorageStatus();return;}
      const connection=this.hass?.connection;
      if(!connection?.sendMessagePromise){this._serverStoreError(store,'Geen Home Assistant-verbinding');return;}
      store.inflight=true;
      try{
        if(store.lastSaved && store.lastSaved!==value){
          try{
            await this._protectServerSnapshot(store.lastSaved,store);
          }catch(error){
            // Recovery is best-effort: a failed backup write must never prevent
            // saving the new preferences. Keep the previous known-good state
            // locally, show backup as offline and retry on the next save.
            if(store!==this._prefsStore)return;
            safeSet(this._settingsKey()+':last-server-recovery',store.lastSaved);
            this._recoveryStatus='offline';this._renderRecoveryPoints();
            logWarning('recovery-unavailable','Serverherstelpunt tijdelijk niet beschikbaar; de actuele accountinstellingen worden wel opgeslagen.');
          }
        }
        if(store!==this._prefsStore)return;
        await connection.sendMessagePromise({type:'frontend/set_user_data',key:SERVER_PREFS_KEY,
          value:{format:'PalaSidebar-v1',settings:JSON.parse(value)}});
        if(store!==this._prefsStore)return;
        store.lastSaved=value;store.lastSuccessfulAt=Date.now();
        if(value===JSON.stringify(this.saved)){
          store.dirty=false;store.status='opgeslagen';safeRemove(this._pendingSettingsKey());safeRemove(this._pendingSettingsKey()+':fields');
        }else this._scheduleServerSave(true);
        this._showStorageStatus();
      }catch(error){
        if(store===this._prefsStore)this._serverStoreError(store,error?.message||'Opslaan mislukt');
      }finally{store.inflight=false;}
    }
    _showStorageStatus(){
      const node=this.dialog?.querySelector('#pala-server-storage-status');
      const header=this.dialog?.querySelector('#pala-storage-pill');
      if(!node&&!header)return;
      const st=this._prefsStore;
      const info=st?.status==='opgeslagen'?'✓ Opgeslagen bij Home Assistant (per gebruikersaccount)':
        st?.status==='synchroniseren'?'Synchroniseren met Home Assistant…':
        st?.status==='offline'?'⚠ Serveropslag niet bereikbaar; lokale kopie behouden. '+(st.error||''):
        'Instellingen ophalen van Home Assistant…';
      if(node&&node.textContent!==info)node.textContent=info;
      if(header){
        const state=st?.status==='opgeslagen'?'saved':st?.status==='offline'?'offline':'pending';
        const label=state==='saved'?'✓ Instellingen gesynchroniseerd':state==='offline'?'⚠ Alleen lokaal bewaard':'◌ Instellingen laden / synchroniseren';
        if(header.dataset.state!==state)header.dataset.state=state;
        if(header.textContent!==label)header.textContent=label;
        header.title=info;
      }
    }
    _isMobile(){
      return this.saved.device==='phone'||this.saved.device==='tablet'||
        (this.saved.device==='auto'&&(window.matchMedia('(max-width: 700px)').matches||window.matchMedia('(pointer:coarse)').matches));
    }
    _mobile(){return this._resolved().mobile || FALLBACK.mobile;}
    _header(){return this.saved.header||this._resolved().header||FALLBACK.header;}
    _isTablet(){
      if(this.saved.device==='tablet')return true;
      if(this.saved.device!=='auto')return false;
      return !window.matchMedia('(max-width:700px)').matches && window.matchMedia('(pointer:coarse)').matches;
    }
    _dockEnabled(){const m=this._mobile();return this.saved.mobile_dock??(this._isTablet()?m.tablet_dock:m.dock);}
    _vibrate(){if(this._mobile().haptics && this._isMobile())try{navigator.vibrate?.(8)}catch{}}
    _syncMobile(){
      // Een wijziging van apparaatprofiel moet ook de compacte modus herzien.
      this._compactSync();
      const enabled=this._mobile().enabled && this._isMobile();
      this.setAttribute('data-mobile',String(!!enabled));
      this._syncDialogPortal();
      if(enabled && this._dockEnabled())this._updateMobileDock();
      else if(this.mobileDock){this.mobileDock.remove();this.mobileDock=null;this.mobileDockSignature='';}
      this._keyboardVisibility();
    }
    _keyboardVisibility(){
      if(!this.mobileDock)return;
      const vv=window.visualViewport;
      const keyboard=vv && vv.height < window.innerHeight * .7;
      this.mobileDock.toggleAttribute('data-keyboard',!!keyboard);
    }
    _updateMobileDock(){
      if(!document.body)return;
      if(!this.mobileDock){this.mobileDock=document.createElement('pala-mobile-dock');document.body.append(this.mobileDock);}
      const m=this._mobile(),items=this._allItems(),allowed=items.filter(i=>i.path&&!pathIsExternal(i.path)&&(!this._actionForItem(i)||this._actionForItem(i).type==='navigate'));
      const selected=[];
      for(const id of m.dock_items){const item=allowed.find(x=>x.id===id);if(item&&!selected.some(x=>x.id===item.id))selected.push(item);}
      for(const item of allowed){if(selected.length>=3)break;if((item.admin_only || /^\/(config|developer-tools)(\/|$)/.test(item.path)) && !m.dock_items.includes(item.id))continue;if(!selected.some(x=>x.id===item.id))selected.push(item);}
      const signature=JSON.stringify([m.dock_labels,m.back_button,selected.map(x=>[x.id,x.label,x.icon,x.path]),this.saved.accent,this.config.appearance.accent]);
      if(signature!==this.mobileDockSignature){
        this.mobileDockSignature=signature;
        this.mobileDock.update(selected, m, colour(this.saved.accent||this._resolved().appearance.accent),this);
      }
      this.mobileDock.markRoute();
    }
    _weatherEntity(theme){
      if(theme.weather_entity && this.hass?.states?.[theme.weather_entity])return theme.weather_entity;
      if(theme.weather_entity)return ''; // No silent substitution when user explicitly selected an entity.
      // Weather discovery can touch thousands of HA states. Cache a known entity,
      // and limit the empty-case probe to once per 30s rather than every refresh.
      const states=this.hass?.states||{};
      if(this._autoWeatherEntity && states[this._autoWeatherEntity])return this._autoWeatherEntity;
      if(Date.now()<(this._nextWeatherProbe||0))return '';
      this._nextWeatherProbe=Date.now()+30000;
      this._autoWeatherEntity=Object.keys(states).filter(id=>id.startsWith('weather.')).sort()[0]||'';
      return this._autoWeatherEntity;
    }
    _themeScene(theme){
      if(theme.scene && theme.scene!=='auto')return {scene:theme.scene,source:'handmatig',night:theme.scene==='night'};
      const now=new Date(),sun=this.hass?.states?.['sun.sun']?.state;
      const night=sun==='below_horizon'||(sun!=='above_horizon'&&(now.getHours()<7||now.getHours()>=20));
      let scene='',source='';
      if(theme.dynamic==='weather'){
        const entity=this._weatherEntity(theme),state=entity?this.hass?.states?.[entity]?.state:'';
        if(state && !['unavailable','unknown'].includes(state)){
          scene=weatherEffect(state);source=entity;
          if(theme.rain_sensor&&validRainIntensity(this.hass?.states?.[theme.rain_sensor]) && !['storm','snow'].includes(scene)){
            const v=Number(this.hass.states[theme.rain_sensor].state);
            if(Number.isFinite(v)&&v>0.10)scene='rain';
          }
          // Hold a valid scene across short sensor reconnects without timers.
          if(scene)this._lastWeatherScene={entity,scene,at:Date.now()};
        }else if(entity&&this._lastWeatherScene?.entity===entity &&
          Date.now()-this._lastWeatherScene.at<60000){
          scene=this._lastWeatherScene.scene;source=entity;
        }
        // Extended unavailability -> calm preset, never invent rain.
      } else if(theme.dynamic==='daynight')scene=night?'night':'sun';
      else if(theme.dynamic==='season')scene=seasonFor(now.getMonth()+1);
      return {scene,source,night};
    }
    _syncTheme(force=false){
      if(!this.weatherLayer)return;
      const theme=cleanTheme(this._themePrefs()),{scene,source,night}=this._themeScene(theme);
      const motionReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
      const mobile=this._isMobile();
      // PalaKiosk/aanraakschermen: halve de animatiedichtheid, nooit canvas, externe afbeeldingen of extra timers.
      const countBase={off:0,gentle:15,normal:24,high:34}[theme.effects];
      const performanceRatio=this.saved.performance_center?.enabled?({full:1,balanced:.75,fast:.5}[this.saved.performance_center.profile]||1):1;
      const count=(motionReduced||countBase===0||!['rain','storm','snow','winter','spring','autumn','wind'].includes(scene))?0:Math.max(3,Math.round(countBase*(mobile?.55:1)*performanceRatio));
      const dynamicColors=theme.dynamic!=='off' && !!scene;
      let {accent,sky,ground,fg}=resolvedThemePalette(theme,scene);
      const configured=colour(this.saved.accent||this._resolved().appearance.accent);
      if(theme.accent_source==='picker')accent=theme.accent_color;
      else if(theme.accent_source==='custom'||(theme.preset==='classic'&&!dynamicColors))accent=configured;
      const signature=JSON.stringify([theme,scene,source,night,count,accent,sky,ground,this.integration]);
      // The drawer can expand/collapse without changing the theme signature.
      // Keep visibility in sync even when the expensive theme update is skipped.
      const weatherHidden=theme.effects==='off'||!scene||
        (this.integration==='native'&&this._isMobile()&&!this.native?.hasAttribute('expanded'));
      if(this.weatherLayer.hidden!==weatherHidden)this.weatherLayer.hidden=weatherHidden;
      if(this._dialogPortal&&this._dialogPortal.style.getPropertyValue('--p-accent')!==accent)
        this._dialogPortal.style.setProperty('--p-accent',accent);
      if(!force&&signature===this.themeSignature)return;
      this.themeSignature=signature;
      this.setAttribute('data-theme',theme.preset);
      this.setAttribute('data-theme-active',String(theme.preset!=='classic'||dynamicColors));
      this.setAttribute('data-weather',scene);
      this.style.setProperty('--p-accent',accent);
      this.style.setProperty('--p-sky',sky);
      this.style.setProperty('--p-ground',ground);
      this.style.setProperty('--p-weather-opacity',String(({subtle:0.3,balanced:0.6,vivid:0.9})[theme.weather_opacity]));
      this.style.setProperty('--p-text',fg||'#f5faff');
      this.style.setProperty('--p-muted','#c4d5e5');
      // Dialogs live in a separate shadow root; mirror only palette tokens,
      // not a second theme engine or expensive watcher.
      if(this._dialogPortal){
        this._dialogPortal.dataset.themeActive=this.getAttribute('data-theme-active')||'false';
        this._dialogPortal.dataset.theme=theme.preset;
        for(const [name,value] of [['--p-accent',accent],['--p-sidebar-accent',accent],['--p-sky',sky],['--p-ground',ground],['--p-text',fg||'#f5faff'],['--p-muted','#c4d5e5']])
          this._dialogPortal.style.setProperty(name,value);
      }
      this.weatherLayer.dataset.effect=scene;
      const particleSignature=JSON.stringify([scene,count,this.integration]);
      if(particleSignature!==this._particleSignature){
        this._particleSignature=particleSignature;
        this.weatherLayer.replaceChildren();
      if(count){
        const frag=document.createDocumentFragment();
        for(let i=0;i<count;i++){
          const n=$('span','particle');
          const seed=(i*37+11)%101;
          n.style.setProperty('--p-x',seed+'%');
          n.style.setProperty('--p-opacity',String(.38+(i%5)*.13));
          n.style.setProperty('--p-delay',(-(i*1.37)%17)+'s');
          n.style.setProperty('--p-duration',((scene==='snow'||scene==='winter')?9+(i%8):scene==='wind'?3+(i%3):5+(i%5))+'s');
          n.style.setProperty('--p-w',(scene==='wind'?18+(i%4)*8:(scene==='rain'||scene==='storm'?1+(i%2):3+i%4))+'px');
          n.style.setProperty('--p-h',(scene==='rain'||scene==='storm'?9+i%5*5:5+i%3)+'px');
          if(scene==='wind')n.style.top=(8+(i*17)%86)+'%';
          frag.append(n);
        }
        this.weatherLayer.append(frag);
      }
      }
      if(this.mobileDock){this.mobileDock.style.setProperty('--p-accent',accent);this.mobileDockSignature='';}
      this._syncHaHeader(); // theme background also fills native HA header and fixed navigation
    }
    _themeSection(title,icon,subtitle){
      const section=$('section','theme-section');
      const head=$('div','theme-section-head'),glyph=$('span','theme-section-icon',icon),copy=$('div');
      copy.append($('h4',null,title),$('p',null,subtitle));head.append(glyph,copy);section.append(head);
      return section;
    }
    _themeEditor(page){
      const root=$('div','theme-editor-v2');page.append(root);
      root.append(this._help('Hoe werkt het live weerthema?',
        'De gekozen themakleur is de basis. Live weer voegt een lichte sfeer toe op basis van een weather.*-entiteit; een aparte regensensor moet mm/u doorgeven, geen temperatuur. Effectsterkte beperkt alleen de zichtbaarheid. Op apparaten met Verminder beweging worden animaties beperkt.'));
      const preview=$('div','theme-preview');preview.id='pala-theme-preview';
      const top=$('div','theme-preview-top');top.append($('span','preview-icon','☀'),$('div','preview-copy'));
      const status=$('span','theme-preview-status','Live voorbeeld · niet opgeslagen');
      const mock=$('div','theme-preview-menu');mock.append($('span','mock-ico','⚡'),$('span','mock-name','Mijn sidebar'),$('span','mock-badge','21,5 °C'));
      preview.append(top,status,mock);root.append(preview);
      const presetSection=this._themeSection('1. Uiterlijk','🎨','Kies een basis. De kleuren veranderen direct in het voorbeeld.');
      const palettes=$('div','theme-presets');palettes.id='pala-theme-presets';
      for(const [id,name] of [['classic','Home Assistant'],['glass','Glas'],['ocean','Oceaan'],['forest','Bos'],['sunset','Zonsondergang'],['midnight','Middernacht'],['amoled','AMOLED zwart'],['aurora','Noorderlicht'],['graphite','Grafiet'],['copper','Koper']]){
        const b=$('button','theme-preset');b.type='button';b.dataset.do='theme-preset';b.dataset.preset=id;
        b.setAttribute('aria-label','Gebruik thema '+name);
        b.style.setProperty('--preset-sky',THEMES[id][1]);b.style.setProperty('--preset-ground',THEMES[id][2]);
        b.append($('span','theme-preset-label',name));
        const swatch=$('span','swatch');for(const c of THEMES[id].slice(0,3)){const v=$('span');v.style.background=c;swatch.append(v);}b.append(swatch);palettes.append(b);
      }
      presetSection.append(palettes);root.append(presetSection);
      const auto=this._themeSection('2. Automatische sfeer','🌦️','Laat Home Assistant de sfeer bepalen, of houd het gekozen thema vast.');
      auto.append(this._formField('Kleurverandering','pala-theme-dynamic','off', [['off','Vast thema'],['weather','Automatisch op basis van weer'],['daynight','Automatisch dag / nacht'],['season','Automatisch per seizoen']]));
      const weatherBlock=$('div','theme-section');weatherBlock.id='pala-theme-weather-fields';
      const weatherOptions=[['','Automatisch eerste weather.* entiteit'],...Object.keys(this.hass?.states||{}).filter(id=>id.startsWith('weather.')).sort().map(id=>[id,(this.hass.states[id].attributes?.friendly_name||id)+' · '+id])];
      const selectedWeather=this._themePrefs().weather_entity;
      if(selectedWeather&&!weatherOptions.some(entry=>entry[0]===selectedWeather))weatherOptions.push([selectedWeather,selectedWeather+' (nu niet beschikbaar)']);
      weatherBlock.append(this._formField('Weer-entiteit','pala-theme-weather','',weatherOptions));
      weatherBlock.append(this._entityField('Regensensor (optioneel, alleen mm/u)','pala-theme-rain'));
      weatherBlock.append($('p','theme-field-note','Bij een weer-entiteit bepaalt die de sfeer. Een neerslagsensor mag alleen regenintensiteit in mm/u leveren, niet temperatuur in °C.'));
      auto.append(weatherBlock);
      const source=$('div','theme-live-source');source.id='pala-theme-live-source';
      source.append($('span','dot'),$('span','text','De actuele bron wordt hier gecontroleerd.'));auto.append(source);
      root.append(auto);
      const motion=this._themeSection('3. Effecten en beweging','✨','Instellingen voor een rustige tablet of een levendige desktop.');
      motion.append(this._formField('Sfeereffect','pala-theme-scene','auto', [['auto','Automatisch · volg gekozen bron'],['rain','🌧 Regen'],['snow','❄ Sneeuw'],['sun','☀ Zon'],['night','🌙 Maan en nacht'],['storm','⛈ Onweer'],['clouds','☁ Wolken'],['mist','🌫 Mist'],['wind','💨 Wind'],['spring','🌸 Lente'],['summer','🌞 Zomer'],['autumn','🍂 Herfst'],['winter','❄ Winter']]));
      motion.append($('p','theme-field-note','Een handmatig effect overschrijft de automatische sfeer. Kies Automatisch om weer, dag/nacht of seizoen te volgen.'));
      motion.append(this._formField('Bewegende deeltjes','pala-theme-effects','gentle', [['off','Uit · geen bewegende deeltjes'],['gentle','Rustig · aanbevolen tablet'],['normal','Normaal'],['high','Levendig (desktop)']]));
      motion.append(this._formField('Sterkte van het weereffect','pala-theme-opacity','balanced', [['subtle','Subtiel'],['balanced','Gebalanceerd'],['vivid','Duidelijk zichtbaar']]));
      motion.append($('p','theme-field-note','De instelling voor minder beweging van je apparaat krijgt altijd voorrang. Op mobiel worden minder deeltjes gebruikt.'));
      root.append(motion);
      const colors=this._themeSection('4. Accentkleur','🎯','Gebruik de themakleur of kies je eigen accentkleur voor knoppen en selecties.');
      colors.append(this._formField('Accentkleurbron','pala-theme-accent','theme',[['theme','Automatisch · thema / weer'],['custom','Mijn bestaande accentkleur (Algemeen)'],['picker','Zelf kleur kiezen']]));
      const colorpicker=$('label','theme-color-picker');colorpicker.id='pala-theme-custom-color-wrap';
      colorpicker.append($('span',null,'Mijn kleur'));
      const colorInput=$('input');colorInput.id='pala-theme-accent-color';colorInput.type='color';colorInput.value='#38bdf8';colorInput.setAttribute('aria-label','Eigen thema-accentkleur');
      const colorCode=$('code',null,'#38BDF8');colorCode.id='pala-theme-custom-color-code';
      colorpicker.append(colorInput,colorCode);colors.append(colorpicker);root.append(colors);
      const actions=$('div','theme-actions');actions.append(this._button('Thema opslaan','theme-save','primary'),this._button('Voorbeeld stoppen','theme-cancel'),this._button('Standaard herstellen','theme-reset'));root.append(actions);
    }
    _themeControls(value){
      const dynamic=this.dialog.querySelector('#pala-theme-dynamic')?.value||'off';
      const weatherBlock=this.dialog.querySelector('#pala-theme-weather-fields');if(weatherBlock)weatherBlock.hidden=dynamic!=='weather';
      const picker=this.dialog.querySelector('#pala-theme-custom-color-wrap');if(picker)picker.hidden=(this.dialog.querySelector('#pala-theme-accent')?.value!=='picker');
      const code=this.dialog.querySelector('#pala-theme-custom-color-code');if(code)code.textContent=(this.dialog.querySelector('#pala-theme-accent-color')?.value||value.accent_color).toUpperCase();
      const source=this.dialog.querySelector('#pala-theme-live-source');if(!source)return;
      const summary=source.querySelector('.text');let warning=false,message='';
      if(value.scene!=='auto')message='Handmatig effect: '+value.scene+' · automatische sensor wordt tijdelijk overschreven.';
      else if(value.dynamic==='weather'){
        const id=this._weatherEntity(value),state=this.hass?.states?.[id]?.state;
        message=id?(id+' · '+(state||'onbekend')):'Geen weather.* entiteit gevonden.';
        if(!id || !state || ['unknown','unavailable'].includes(state))warning=true;
        if(value.rain_sensor){
          const e=this.hass?.states?.[value.rain_sensor],unit=e?.attributes?.unit_of_measurement||'zonder eenheid';
          message+=' | Regenbron '+value.rain_sensor+': '+(e?.state||'niet beschikbaar')+' '+unit;
          if(!validRainIntensity(e)){message+=' · geen regenintensiteit: genegeerd';warning=true;}
        }
      }else if(value.dynamic==='daynight')message='Dag/nacht vanuit sun.sun · '+(this.hass?.states?.['sun.sun']?.state||'tijd van apparaat');
      else if(value.dynamic==='season')message='Seizoen automatisch bepaald via huidige maand.';
      else message='Vast thema · geen automatische weersensor nodig.';
      summary.textContent=message;source.dataset.warning=String(warning);
    }
    _fillThemeEditor(value){
      const t=cleanTheme(value),q=id=>this.dialog.querySelector('#pala-theme-'+id);
      for(const [field,id] of [['dynamic','dynamic'],['scene','scene'],['weather_entity','weather'],['rain_sensor','rain'],['effects','effects'],['accent_source','accent'],['weather_opacity','opacity'],['accent_color','accent-color']]){if(q(id))q(id).value=t[field];}
      this._chosenPreset=t.preset;
      this._updateThemePreview(t);
    }
    _themeForm(){
      const q=id=>this.dialog.querySelector('#pala-theme-'+id)?.value;
      return cleanTheme({preset:this._chosenPreset||'classic',dynamic:q('dynamic'),scene:q('scene'),weather_entity:q('weather'),rain_sensor:q('rain'),effects:q('effects'),accent_source:q('accent'),accent_color:q('accent-color'),weather_opacity:q('opacity')});
    }
    _updateThemePreview(value){
      const t=cleanTheme(value),info=this._themeScene(t),scene=info.scene,colors=resolvedThemePalette(t,scene);
      const preview=this.dialog.querySelector('#pala-theme-preview');if(!preview)return;
      preview.style.setProperty('--preview-sky',colors.sky);preview.style.setProperty('--preview-ground',colors.ground);
      const accent=t.accent_source==='picker'?t.accent_color:t.accent_source==='custom'?(this.saved.accent||this._resolved().appearance.accent):colors.accent;
      preview.style.setProperty('--preview-accent',accent);
      const icons={rain:'🌧️',storm:'⛈️',snow:'❄️',sun:'☀️',night:'🌙',clouds:'☁️',mist:'🌫️',wind:'💨',spring:'🌸',summer:'🌞',autumn:'🍂',winter:'❄️'};
      preview.querySelector('.preview-icon').textContent=icons[scene]||'🎨';
      preview.querySelector('.preview-copy').replaceChildren($('strong',null,({classic:'Home Assistant',glass:'Glas',ocean:'Oceaan',forest:'Bos',sunset:'Zonsondergang',midnight:'Middernacht',amoled:'AMOLED zwart',aurora:'Noorderlicht',graphite:'Grafiet',copper:'Koper'})[t.preset]),$('small',null,scene?'Sfeer: '+scene+' · '+(info.source||'automatisch'):'Vast thema · geen weer-effect'));
      for(const b of this.dialog.querySelectorAll('[data-do="theme-preset"]'))b.setAttribute('aria-pressed',String(b.dataset.preset===t.preset));
      this._themeControls(t);
      const saved=cleanTheme(this.saved.theme||this._resolved().theme);
      const status=preview.querySelector('.theme-preview-status');if(status)status.textContent=JSON.stringify(t)===JSON.stringify(saved)?'Huidige instellingen':'Live voorbeeld · nog niet opgeslagen';
    }
    _themePreviewLive(){
      if(!this.dialog.open||this.editorTab!=='themes')return;
      const t=this._themeForm();this.themeDraft=t;this._updateThemePreview(t);this._syncTheme();
    }
    _themeSave(){
      const t=this._themeForm();this.saved.theme=t;this.themeDraft=null;this._saveSettings();this._syncTheme();this._updateThemePreview(t);
      this._editorNotice('Thema opgeslagen. Het past zich automatisch aan wanneer de sensor of het dagdeel verandert.');
    }
    _themeCancel(){this.themeDraft=null;this._syncTheme(true);this._fillThemeEditor(this._themePrefs());}
    _drawer(){return this.native?.isConnected?this.native:deepFindSidebar();}
    _nativeDrawerParts(){
      const n=this._drawer();
      const root=n?.getRootNode?.();
      // HA 2026 puts <ha-sidebar> INSIDE <ha-drawer> in the main shadow
      // tree. ha-sidebar[expanded] describes the desktop icon rail, NOT
      // whether the *mobile modal* is open; narrow sidebars are expanded
      // even when their surrounding modal is CLOSED.
      return {main:root?.host?.localName==='home-assistant-main'?root.host:null,
              drawer:root?.querySelector?.('ha-drawer')||null};
    }
    _drawerOpen(){
      const n=this._drawer();if(!n)return false;
      if(this._drawerNarrow()){
        const {main,drawer}=this._nativeDrawerParts();
        // The owner updates _drawerOpen immediately on hass-toggle-menu;
        // ha-drawer.open is rendered one microtask later. Check the owner
        // first to avoid races around an Android Back or a quick dialog.
        if(main && typeof main._drawerOpen==='boolean')return main._drawerOpen;
        if(drawer && typeof drawer.open==='boolean')return drawer.open;
        if(drawer)return drawer.hasAttribute('open');
      }
      // Legacy/custom mock without HA's 2026 modal wrapper.
      return !!(n.expanded===true||n.hasAttribute('expanded'));
    }
    _drawerNarrow(){const n=this._drawer();return !!(n ? (n.narrow===true||n.hasAttribute('narrow')) : window.matchMedia('(max-width: 870px)').matches);}
    _menuHistoryState(){return !!(history.state && history.state.__palaSidebarMenu===true);}
    _dialogHistoryState(){return String(history.state?.__palaSidebarDialog||'');}
    _openOwnedDialog(node,kind){
      if(node.open)return;
      this._syncDialogPortal();
      if(this._isMobile() && this._mobile().enabled && !this._dialogMarker){
        try{
          const state={...(history.state && typeof history.state==='object'?history.state:{})};
          const menuEntry=state.__palaSidebarMenu===true;
          delete state.__palaSidebarMenu;
          delete state.__palaSidebarDialog;
          // Menu -> dialoog is ONE overlay transition, not two back entries.
          // Keep the same temporary history entry and turn it into the dialog
          // marker. On Android, one Back then closes the dialog and returns
          // directly to the dashboard. No invisible sidebar entry survives.
          if(menuEntry){
            if(this.integration==='native'&&this._drawerNarrow()&&this._drawerOpen())this._closeNative();
            if(this.open)this._setOpen(false,true);
            history.replaceState({...state,__palaSidebarDialog:kind},'',location.href);
            this._historyMarker=false;
            this._historyReleasing=false;
            this._historyCallbacks.length=0;
          }else{
            history.pushState({...state,__palaSidebarDialog:kind},'',location.href);
          }
          this._dialogMarker=kind;
        }catch{this._dialogMarker='';}
      }
      // On HA versions where a native hamburger didn't set a menu marker,
      // the dialog still must open AFTER the drawer closes.
      if(this.integration==='native'&&this._drawerNarrow()&&this._drawerOpen())this._closeNative();
      if(this.open)this._setOpen(false,true);
      // One forced style read on OPEN only guarantees the first frame is the
      // offscreen/transparent state, even in older Android WebViews.
      this._clearDialogCloseTimer(node);
      this._syncDialogPortal();this._syncHaDialogTheme(true);
      node.dataset.phase='enter';
      node.showModal();
      if(this._dialogMotionDuration()>0){
        void node.getBoundingClientRect();
        requestAnimationFrame(()=>{if(node.open&&node.dataset.phase==='enter')node.dataset.phase='open';});
      }else node.dataset.phase='open';
    }
    _dialogMotionDuration(){
      if(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return 0;
      return {off:0,fast:140,smooth:220,relaxed:320}[this.saved.dialog_motion]??220;
    }
    _clearDialogCloseTimer(node){
      const timer=this._dialogCloseTimers.get(node);
      if(timer!==undefined){clearTimeout(timer);this._dialogCloseTimers.delete(node);}
    }
    _finishDialogClose(node){
      this._clearDialogCloseTimer(node);
      if(node.open)node.close();
      // Keep the existing Android marker release semantics. A popstate-driven
      // close already consumed its entry, so this is deliberately idempotent.
      if(this._dialogMarker)this._releaseDialogHistory();
      else if(this._dialogCallbacks.length){
        const callbacks=this._dialogCallbacks.splice(0);
        callbacks.forEach(fn=>fn());
      }
    }
    _onOwnedDialogClose(kind){
      if(this._dialogMarker===kind)this._releaseDialogHistory();
    }
    _releaseDialogHistory(after){
      if(typeof after==='function')this._dialogCallbacks.push(after);
      if(this._dialogReleasing)return;
      if(!this._dialogMarker || this._dialogHistoryState()!==this._dialogMarker){
        this._dialogMarker='';
        const callbacks=this._dialogCallbacks.splice(0);
        callbacks.forEach(fn=>fn());
        return;
      }
      this._dialogReleasing=true;
      try{history.back();}catch{
        this._dialogReleasing=false;
        this._dialogMarker='';
        this._dialogCallbacks.length=0;
      }
    }
    _onDialogPopstate(){
      if(!this._dialogMarker || this._dialogHistoryState()===this._dialogMarker)return false;
      const kind=this._dialogMarker;
      this._dialogMarker='';this._dialogReleasing=false;
      const dlg={settings:this.dialog,quick:this.quickDialog,action:this.actionDialog}[kind];
      if(dlg?.open){
        // Back already changed history. Animate the closing dialog without
        // issuing a SECOND history.back() or touching the native HA drawer.
        this._animateDialogClose(dlg);
      }
      const callbacks=this._dialogCallbacks.splice(0);
      queueMicrotask(()=>{
        callbacks.forEach(fn=>fn());
        // A real new swipe may have opened the native menu while the old
        // dialog history entry was still being released. Restore ONLY its
        // own marker now that the earlier popstate has settled.
        if(!this._dialogMarker&&this._drawerNarrow()&&this._drawerOpen())this._syncMenuHistory();
      });
      // A modal popstate must NEVER also close the underlying sidebar.
      return true;
    }
    _animateDialogClose(node){
      if(!node?.open||node.dataset.phase==='exit')return;
      const duration=this._dialogMotionDuration();
      if(!duration){this._finishDialogClose(node);return;}
      node.dataset.phase='exit';
      this._dialogCloseTimers.set(node,setTimeout(()=>this._finishDialogClose(node),duration+24));
    }
    _closeOwnedDialog(node,after){
      if(typeof after==='function')this._dialogCallbacks.push(after);
      if(node.open){
        this._animateDialogClose(node);
      }else if(this._dialogMarker)this._releaseDialogHistory();
      else {const callbacks=this._dialogCallbacks.splice(0);callbacks.forEach(fn=>fn());}
    }
    _syncMenuHistory(){
      // Eén tijdelijke back-entry, uitsluitend voor het daadwerkelijk geopende
      // mobiele menu. Nooit herhaald pushen bij Home Assistant her-renders.
      if(!this._mobile().enabled||!this._mobile().back_closes_menu||!this._isMobile())return;
      // An owned dialog has exclusive control of its temporary history entry.
      // Never discard the menu marker simply because a dialog is on top.
      if(this._dialogMarker||this._dialogReleasing||this._historyReleasing||this._nativeClosePending)return;
      const isOpen=this.open||(this.integration==='native'&&this._drawerNarrow()&&this._drawerOpen());
      if(isOpen){
        if(!this._menuHistoryState() && !this._historyMarker){
          try{
            const state=history.state&&typeof history.state==='object'?history.state:{};
            history.pushState({...state,__palaSidebarMenu:true},'',location.href);
            this._historyMarker=true;
          }catch{this._historyMarker=false;}
        }else if(this._menuHistoryState())this._historyMarker=true;
      }else if(this._historyMarker || this._menuHistoryState()){
        // Home Assistant may close the modal itself (scrim tap, route change,
        // swipe, or re-mount). Remove precisely our own history entry.
        // Also reconcile a marker kept by the SPA after JS reinitialization.
        this._historyMarker=true;
        this._releaseMenuHistory();
      }
      
    }
    _releaseMenuHistory(after){
      if(typeof after==='function')this._historyCallbacks.push(after);
      if(this._historyReleasing)return;
      if(!this._menuHistoryState()){
        // A modal marker may be on top. Releasing the menu here would orphan
        // its underlying history entry (or execute a route callback too soon).
        if(this._dialogMarker||this._dialogHistoryState())return;
        this._historyMarker=false;
        const callbacks=this._historyCallbacks.splice(0);
        callbacks.forEach(fn=>fn());
        return;
      }
      this._historyReleasing=true;
      try{history.back();}
      catch{
        this._historyReleasing=false;
        // Bij een geweigerde back niet nog een tweede back proberen.
        this._historyCallbacks.length=0;
      }
    }
    _closeNative(){
      if(!this._drawerOpen()||this._nativeClosePending)return false;
      // Let HOME ASSISTANT close its own drawer. Changing expanded directly
      // used to collapse the native fixed Settings/Notifications/Profile area
      // while leaving the overlay visually open on Android.
      this._nativeClosePending=true;
      // Explicit close is idempotent. An undirected toggle would REOPEN the
      // modal if HA had already closed it between our check and dispatch.
      this._haMenu(false);
      // HA may process the event synchronously. In that case do not keep
      // a stale pending flag that can block the NEXT valid close action.
      if(!this._drawerOpen())this._nativeClosePending=false;
      else setTimeout(()=>{
        this._nativeClosePending=false;
        if(!this._drawerOpen())this._syncMenuHistory();
      },180);
      
      return true;
    }
    _onMenuPopstate(){
      // Gewone dashboard-back is van Home Assistant. Alleen als er een
      // PalaSidebar-marker loopt mogen we onze menu-status veranderen.
      // A real Android Back triggers popstate (not a JS keydown). If HA
      // replaced the drawer or the transient marker was missed, still close
      // an actually open mobile overlay rather than leave it stuck onscreen.
      if(!this._historyMarker && !this._historyReleasing &&
         !(this._isMobile() && (this.open||(this._drawerNarrow()&&this._drawerOpen()))))return;
      if(this._dialogMarker || this._dialogReleasing)return;
      if(this._menuHistoryState())return;
      this._historyMarker=false;
      this._historyReleasing=false;
      
      if(this.quickDialog.open)this.quickDialog.close();
      if(this.integration==='native'&&this._drawerNarrow()&&this._drawerOpen())this._closeNative();
      if(this.open)this._setOpen(false,true);
      const callbacks=this._historyCallbacks.splice(0);
      // Wacht totdat Home Assistant de route van dezelfde popstate verwerkt.
      queueMicrotask(()=>callbacks.forEach(fn=>fn()));
    }
    _quickEntries(){
      // Universeel: alleen zelf ingestelde links en daadwerkelijk beschikbare
      // Home Assistant-menu-items; nooit andermans hardcoded routes tonen.
      const found=new Map();const seenPaths=new Set();
      const add=i=>{
        if(!i?.path||!validPath(i.path)||i.admin_only&&!this.hass?.user?.is_admin)return;
        const key=routeKey(i.path)||i.path;
        if(this.saved.quick_hidden.includes(i.id)||seenPaths.has(key))return;
        found.set(i.id,i);seenPaths.add(key);
      };
      for(const item of this.saved.quick_links)add(item);
      if(this.saved.quick_auto!==false)for(const item of this._allItems())add(item);
      const order=this.saved.quick_order;
      return [...found.values()].sort((a,b)=>{
        const x=order.indexOf(a.id),y=order.indexOf(b.id);
        return (x<0?10000:x)-(y<0?10000:y);
      });
    }
    showQuickDialog(){
      // Native sidebar may close on mobile; the existing body portal owns the dialog.
      this._quickOrderCleanup(true);
      this._renderQuickDialog();
    }
    _renderQuickDialog(){
      const pane=$('div','dialog-content'),title=$('div','quick-title');
      const actions=$('div','quick-title-actions');
      const orderButton=this._button('Volgorde aanpassen','quick-order-toggle');
      orderButton.setAttribute('aria-pressed','false');
      actions.append(orderButton,this._button('Sluiten','quick-close'));
      title.append($('h2',null,'Van alles · Dashboards'),actions);
      const intro=$('p','quick-sort-hint','Snel naar je dashboards en eigen links. Houd een tegel ingedrukt en sleep om de volgorde te wijzigen, of kies Volgorde aanpassen.');
      const controls=$('div','quick-sort-controls');controls.hidden=true;
      controls.append($('span','quick-sort-selection','Tik een tegel aan of sleep hem naar de juiste plek.'));
      const previous=this._button('←','quick-order-prev'),next=this._button('→','quick-order-next');
      previous.title='Geselecteerde snelkoppeling één plaats terug';
      next.title='Geselecteerde snelkoppeling één plaats verder';
      controls.append(previous,next);
      const grid=$('div','quick-grid');const items=this._quickEntries();
      grid.setAttribute('aria-label','Snelkoppelingen, volgorde aanpasbaar');
      for(const item of items){
        const button=$('button','quick-tile');button.type='button';button.dataset.do='quick-route';
        button.dataset.path=item.path;button.dataset.id=item.id;
        button.title=item.label+' · lang indrukken om te verplaatsen';
        button.append(this._icon(item.icon,'▦'),$('span','name',item.label));grid.append(button);
      }
      if(!items.length){
        const note=$('div','quick-empty');note.append($('strong',null,'Nog geen snelkoppelingen'),$('p',null,'Ga naar PalaSidebar → Instellingen → Snelmenu om dashboards te kiezen of zelf een link toe te voegen.'));grid.append(note);
      }
      const status=$('span','quick-count',items.length+' snelkoppelingen');status.setAttribute('aria-live','polite');
      pane.append(title,intro,controls,grid,status);
      this.quickDialog.replaceChildren(pane);
      this._quickOrderMode=false;this._quickSelectedId=null;
      if(!this.quickDialog.open)this._openOwnedDialog(this.quickDialog,'quick');
    }
    _setupQuickOrdering(){
      this.quickDialog.addEventListener('pointerdown',e=>{
        if(e.pointerType==='touch'||e.button!==0||!e.isPrimary)return;
        this._quickOrderStart(e,'pointer');
      },{passive:true});
      this.quickDialog.addEventListener('pointermove',e=>{
        if(e.pointerType!=='touch')this._quickOrderMove(e.clientX,e.clientY,'pointer',e.pointerId);
      },{passive:true});
      this.quickDialog.addEventListener('pointerup',e=>{
        if(e.pointerType!=='touch')this._quickOrderEnd('pointer',e.pointerId,true);
      },{passive:true});
      this.quickDialog.addEventListener('pointercancel',e=>{
        if(e.pointerType!=='touch')this._quickOrderEnd('pointer',e.pointerId,false);
      },{passive:true});
      // Android Companion uses native touch even when PointerEvents is present;
      // once a long press is recognized, prevent the WebView from scrolling.
      this.quickDialog.addEventListener('touchstart',e=>{
        if(e.touches.length===1)this._quickOrderStart(e.touches[0],'touch',e.target);
      },{passive:true});
      this.quickDialog.addEventListener('touchmove',e=>{
        const t=e.touches[0];if(!t)return;
        if(this._quickOrderMove(t.clientX,t.clientY,'touch',t.identifier)&&e.cancelable)e.preventDefault();
      },{passive:false});
      this.quickDialog.addEventListener('touchend',e=>{
        const id=e.changedTouches[0]?.identifier;
        if(this._quickOrderEnd('touch',id,true)&&e.cancelable)e.preventDefault();
      },{passive:false});
      this.quickDialog.addEventListener('touchcancel',()=>this._quickOrderEnd('touch',null,false),{passive:true});
      this.quickDialog.addEventListener('contextmenu',e=>{
        const tile=e.target.closest?.('.quick-grid .quick-tile');
        if(!tile)return;
        e.preventDefault();e.stopPropagation();
        if(this._quickPress?.source==='touch'){
          if(!this._quickPress.armed)this._quickOrderArm();
          return;
        }
        this._quickOrderCleanup(false);
        this._quickOrderSetMode(true,tile.dataset.id);
      });
      this.quickDialog.addEventListener('keydown',e=>{
        const tile=e.target.closest?.('.quick-grid .quick-tile');
        if(!tile)return;
        if(e.altKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
          e.preventDefault();
          this._quickOrderSetMode(true,tile.dataset.id);
          this._quickOrderNudge(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1);
          tile.focus();
        }
      });
      // Block only click-to-navigate during sorting/after a drag, not buttons in
      // the modal toolbar, and do not modify PalaSidebar's normal menu clicks.
      this.quickDialog.addEventListener('click',e=>{
        const tile=e.target.closest?.('.quick-grid .quick-tile');
        if(!tile)return;
        if(this._quickOrderMode||performance.now()<this._quickSuppressClickUntil){
          e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
          if(this._quickOrderMode)this._quickOrderSelect(tile.dataset.id);
        }
      },true);
    }
    _quickOrderSetMode(enabled,selectedId=null){
      if(!this.quickDialog.open)return;
      this._quickOrderMode=!!enabled;
      const grid=this.quickDialog.querySelector('.quick-grid');
      grid?.classList.toggle('is-sorting',this._quickOrderMode);
      const controls=this.quickDialog.querySelector('.quick-sort-controls');
      if(controls)controls.hidden=!this._quickOrderMode;
      const toggle=this.quickDialog.querySelector('[data-do="quick-order-toggle"]');
      if(toggle){toggle.textContent=this._quickOrderMode?'Gereed':'Volgorde aanpassen';toggle.setAttribute('aria-pressed',String(this._quickOrderMode));}
      const hint=this.quickDialog.querySelector('.quick-sort-hint');
      if(hint)hint.textContent=this._quickOrderMode?'Sleep je tegel naar de gewenste plaats, of tik hem aan en gebruik de pijlen. De volgorde wordt opgeslagen per account.':'Snel naar je dashboards en eigen links. Houd een tegel ingedrukt en sleep om de volgorde te wijzigen, of kies Volgorde aanpassen.';
      this._quickOrderSelect(this._quickOrderMode?(selectedId||this._quickSelectedId):null);
    }
    _quickOrderSelect(id){
      const grid=this.quickDialog.querySelector('.quick-grid');
      if(!grid)return;
      const tiles=[...grid.querySelectorAll('.quick-tile')];
      const tile=tiles.find(x=>x.dataset.id===id);
      this._quickSelectedId=tile?.dataset.id||null;
      for(const item of tiles)item.classList.toggle('quick-selected',item===tile&&this._quickOrderMode);
      const label=this.quickDialog.querySelector('.quick-sort-selection');
      if(label)label.textContent=tile?'Geselecteerd: '+(tile.querySelector('.name')?.textContent||'snelkoppeling'):'Tik een tegel aan of sleep hem naar de juiste plek.';
      for(const [cmd,step] of [['quick-order-prev',-1],['quick-order-next',1]]){
        const btn=this.quickDialog.querySelector('[data-do="'+cmd+'"]');
        if(btn)btn.disabled=!tile||tiles.indexOf(tile)+step<0||tiles.indexOf(tile)+step>=tiles.length;
      }
    }
    _quickOrderStart(point,source,targetNode=null){
      const tile=(targetNode||point.target)?.closest?.('.quick-grid .quick-tile');
      if(!tile||!this.quickDialog.open||this.quickDialog.dataset.phase==='exit')return;
      this._quickOrderCleanup(false);
      this._quickPress={source,id:source==='touch'?point.identifier:point.pointerId,tile,x:point.clientX,y:point.clientY,armed:false,changed:false,
        order:[...this.quickDialog.querySelectorAll('.quick-grid .quick-tile')].map(x=>x.dataset.id)};
      if(this._quickOrderMode)this._quickOrderArm();
      else this._quickPressTimer=setTimeout(()=>this._quickOrderArm(),450);
    }
    _quickOrderArm(){
      const press=this._quickPress;
      if(!press||!press.tile.isConnected||!this.quickDialog.open)return;
      if(this._quickPressTimer!==null){clearTimeout(this._quickPressTimer);this._quickPressTimer=null;}
      press.armed=true;
      // Keep pointer events flowing if the cursor leaves the dialog while
      // dragging; normal clicks never acquire capture before a long press.
      if(press.source==='pointer')try{this.quickDialog.setPointerCapture(press.id);}catch{}
      this._quickOrderSetMode(true,press.tile.dataset.id);
      this._quickSuppressClickUntil=performance.now()+1000;
      press.tile.classList.add('quick-dragging');
      const rect=press.tile.getBoundingClientRect();
      press.offsetX=press.x-rect.left;press.offsetY=press.y-rect.top;
      const ghost=press.tile.cloneNode(true);
      ghost.classList.remove('quick-dragging','quick-selected');ghost.classList.add('quick-drag-ghost');
      ghost.removeAttribute('data-do');ghost.setAttribute('aria-hidden','true');ghost.style.width=rect.width+'px';ghost.style.height=rect.height+'px';
      this._dialogPortalRoot.append(ghost);this._quickGhost=ghost;
      this._quickOrderGhostAt(press.x,press.y);
    }
    _quickOrderGhostAt(x,y){
      const press=this._quickPress;
      if(!press||!this._quickGhost)return;
      this._quickGhost.style.left=(x-press.offsetX)+'px';this._quickGhost.style.top=(y-press.offsetY)+'px';
    }
    _quickOrderMove(x,y,source,id){
      const press=this._quickPress;
      if(!press||press.source!==source||(id!==null&&press.id!==id))return false;
      if(!press.armed){
        if(Math.hypot(x-press.x,y-press.y)>12)this._quickOrderCleanup(false);
        return false;
      }
      this._quickOrderGhostAt(x,y);
      const grid=this.quickDialog.querySelector('.quick-grid');if(!grid)return true;
      const gridRect=grid.getBoundingClientRect();
      // Move the scrolling container only while the user moves their finger;
      // no permanent animation loop or interval is introduced.
      if(y<gridRect.top+30)grid.scrollTop-=Math.min(18,gridRect.top+30-y);
      else if(y>gridRect.bottom-30)grid.scrollTop+=Math.min(18,y-gridRect.bottom+30);
      for(const node of grid.querySelectorAll('.quick-drop-target'))node.classList.remove('quick-drop-target');
      const tiles=[...grid.querySelectorAll('.quick-tile')];
      const target=tiles.find(tile=>{
        if(tile===press.tile)return false;
        const r=tile.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
      });
      if(target){
        target.classList.add('quick-drop-target');
        if(tiles.indexOf(press.tile)<tiles.indexOf(target))target.after(press.tile);
        else grid.insertBefore(press.tile,target);
        press.changed=true;
        this._quickOrderSelect(press.tile.dataset.id);
      }
      return true;
    }
    _quickOrderEnd(source,id,commit){
      const press=this._quickPress;
      if(!press||press.source!==source||(id!==null&&press.id!==id))return false;
      const armed=press.armed;
      if(armed){
        const grid=this.quickDialog.querySelector('.quick-grid');
        const before=press.order.join('\u0000');
        const after=[...(grid?.querySelectorAll('.quick-tile')||[])].map(x=>x.dataset.id).join('\u0000');
        if(!commit&&grid){
          const tiles=new Map([...grid.querySelectorAll('.quick-tile')].map(x=>[x.dataset.id,x]));
          for(const key of press.order){const node=tiles.get(key);if(node)grid.append(node);}
        }else if(commit&&before!==after)this._quickOrderSave();
        this._quickSuppressClickUntil=performance.now()+700;
      }
      this._quickOrderCleanup(false);
      if(armed)this._quickOrderSelect(press.tile.dataset.id);
      return armed;
    }
    _quickOrderCleanup(resetMode=false){
      if(this._quickPressTimer!==null){clearTimeout(this._quickPressTimer);this._quickPressTimer=null;}
      if(this._quickPress?.source==='pointer')try{
        if(this.quickDialog.hasPointerCapture(this._quickPress.id))this.quickDialog.releasePointerCapture(this._quickPress.id);
      }catch{}
      if(this._quickPress?.tile)this._quickPress.tile.classList.remove('quick-dragging');
      this._quickPress=null;
      this._quickGhost?.remove();this._quickGhost=null;
      this.quickDialog.querySelectorAll('.quick-drop-target').forEach(x=>x.classList.remove('quick-drop-target'));
      if(resetMode){this._quickOrderMode=false;this._quickSelectedId=null;this._quickSuppressClickUntil=0;}
    }
    _quickOrderSave(){
      const ids=[...this.quickDialog.querySelectorAll('.quick-grid .quick-tile')].map(x=>x.dataset.id);
      if(!ids.length)return;
      // Preserve hidden ids in stored preferences so unhiding doesn't lose
      // someone's earlier ordering. The existing editor uses the same array.
      const visible=new Set(ids);
      this.saved.quick_order=[...ids,...this.saved.quick_order.filter(id=>!visible.has(id))].slice(0,150);
      this._saveSettings();
      const status=this.quickDialog.querySelector('.quick-count');
      if(status)status.textContent=ids.length+' snelkoppelingen · volgorde opgeslagen';
    }
    _quickOrderNudge(step){
      if(!this._quickOrderMode)return;
      const grid=this.quickDialog.querySelector('.quick-grid');
      const tiles=[...grid?.querySelectorAll('.quick-tile')||[]];
      const from=tiles.findIndex(x=>x.dataset.id===this._quickSelectedId);
      const to=from+step;
      if(from<0||to<0||to>=tiles.length)return;
      const tile=tiles[from];
      if(step>0)tiles[to].after(tile);else grid.insertBefore(tile,tiles[to]);
      this._quickOrderSave();this._quickOrderSelect(tile.dataset.id);
    }
    _quickEditor(page){
      page.append($('h3',null,'Van alles · Snelmenu'),$('p',null,'Persoonlijke snelkoppelingen zonder code aanpassen. Home Assistant kan alleen dashboards tonen die op jouw installatie beschikbaar zijn.'));
      page.append(this._help('Voor iedereen geschikt',
        'Er zitten geen vooraf ingestelde privé-dashboards in de JavaScript. Schakel automatisch gevonden dashboards aan of uit, of voeg hieronder zelf naam, pad en icoon toe. Je selectie wordt per Home Assistant-account opgeslagen.'));
      const toggle=$('label','check'),enabled=$('input');enabled.type='checkbox';enabled.id='pala-quick-auto';enabled.checked=this.saved.quick_auto!==false;
      toggle.append(enabled,$('span',null,'Beschikbare Home Assistant-dashboards automatisch tonen'));
      page.append(toggle);
      const autoHint=$('p','field-note','Bij uitgeschakeld automatisch tonen verschijnt alleen wat je hieronder zelf toevoegt. Je bestaande dashboardindeling blijft ongewijzigd.');page.append(autoHint);
      page.append($('h4',null,'Mijn eigen snelkoppelingen'));
      page.append(this._formField('Bestaande snelkoppeling bewerken','pala-quick-select','',[
        ['','+ Nieuwe snelkoppeling'],...this.saved.quick_links.map(i=>[i.id,i.label])
      ]));
      const panels=Object.entries(this.hass?.panels||{})
        .filter(([,v])=>!v.require_admin||this.hass?.user?.is_admin)
        .map(([key,value])=>['/'+(value.url_path||key),value.title||prettify(key)]);
      page.append(this._formField('Dashboard op dit systeem kiezen','pala-quick-panel','',[
        ['','— Eigen pad invullen —'],...panels
      ]));
      page.append(this._formField('Naam','pala-quick-name',''),
        this._formField('Pad (bijv. /lovelace, /calendar of https://...)','pala-quick-path',''),
        this._formField('Icoon (mdi:...)','pala-quick-icon','mdi:view-dashboard-outline'));
      const actions=$('div','btnrow');actions.append(this._button('Snelkoppeling opslaan','quick-save','primary'),this._button('Nieuw','quick-new'),this._button('Verwijderen','quick-remove'));
      page.append(actions);
      page.append($('h4',null,'Volgorde en zichtbaarheid'));
      const rows=$('div','quick-rows');rows.id='pala-quick-rows';
      const items=this._quickEntries();
      for(const item of items){
        const row=$('div','quick-row');row.append(this._icon(item.icon,'▦'),$('span','name',item.label));
        for(const [op,txt] of [['quick-up','↑'],['quick-down','↓'],['quick-hide','×']]){
          const b=this._button(txt,op);b.dataset.id=item.id;b.title=op==='quick-hide'?'Verbergen':op==='quick-up'?'Naar boven':'Naar beneden';row.append(b);
        }
        rows.append(row);
      }
      if(!items.length)rows.append($('p','field-note','Nog geen items: voeg zelf iets toe of zet automatische dashboards aan.'));
      page.append(rows);page.append(this._button('Verborgen items opnieuw tonen','quick-reset'));
      page.append($('h4',null,'Optioneel: snelkoppelingen importeren'));
      page.append($('p','field-note','Plak een JSON-lijst met naam, pad en mdi-icoon. Handig om je oude snelkoppelingen eenmalig over te nemen. Bestaande eigen links worden niet overschreven.'));
      const importBox=$('textarea');importBox.id='pala-quick-import';importBox.rows=3;importBox.placeholder='[{"label":"Mijn dashboard","path":"/lovelace","icon":"mdi:home"}]';
      importBox.setAttribute('aria-label','Snelkoppelingen importeren als JSON');importBox.style.width='100%';
      page.append(importBox,this._button('JSON importeren','quick-import'));
    }
    _quickFillEditor(id=''){
      const q=n=>this.dialog.querySelector('#pala-quick-'+n);
      const item=this.saved.quick_links.find(i=>i.id===id);
      if(!q('select'))return;
      q('select').value=item?.id||'';q('panel').value='';
      q('name').value=item?.label||'';q('path').value=item?.path||'';
      q('icon').value=item?.icon||'mdi:view-dashboard-outline';
    }
    _quickPickPanel(){
      const q=n=>this.dialog.querySelector('#pala-quick-'+n),path=q('panel')?.value;
      if(!path)return;
      const panel=Object.entries(this.hass?.panels||{}).find(([key,v])=>'/'+(v.url_path||key)===path)?.[1];
      q('path').value=path;
      if(panel){q('name').value=panel.title||prettify(path.slice(1));q('icon').value=isSafeIcon(panel.icon)?panel.icon:'mdi:view-dashboard-outline';}
    }
    _quickSaveEditor(){
      const q=n=>text(this.dialog.querySelector('#pala-quick-'+n)?.value).trim();
      const oldId=q('select'),label=q('name'),path=q('path'),icon=q('icon');
      if(!label||!validPath(path)){this._editorNotice('Vul een naam en geldig pad of HTTPS-link in.');return;}
      if(icon&&!isSafeIcon(icon)){this._editorNotice('Gebruik een geldig icoon zoals mdi:home-outline.');return;}
      const existing=this.saved.quick_links.find(i=>routeKey(i.path)===routeKey(path)&&i.id!==oldId);
      if(existing){this._editorNotice('Deze eigen snelkoppeling bestaat al: '+existing.label);return;}
      const id=oldId||'quick-eigen-'+cleanId(label.toLowerCase())+'-'+Date.now().toString(36);
      const old=this.saved.quick_links.find(i=>i.id===oldId);
      const item=configItem({...old,id,label,path,icon:icon||'mdi:link-variant'});
      if(!item)return;
      if(!old && this.saved.quick_links.length>=50){this._editorNotice('Maximaal 50 eigen snelkoppelingen.');return;}
      this.saved.quick_links=old?this.saved.quick_links.map(i=>i.id===oldId?item:i):[...this.saved.quick_links,item];
      this.saved.quick_hidden=this.saved.quick_hidden.filter(i=>i!==id);
      this.saved.quick_auto=this.dialog.querySelector('#pala-quick-auto')?.checked!==false;
      this._saveSettings();this._rebuildSettingsAtSamePosition('quick');this._quickFillEditor(id);
      this._editorNotice('Snelkoppeling opgeslagen voor je HA-account.');
    }
    _quickRemoveEditor(){
      const id=this.dialog.querySelector('#pala-quick-select')?.value;
      if(!id||!this.saved.quick_links.some(i=>i.id===id))return;
      if(!confirm('Deze eigen snelkoppeling verwijderen? Het dashboard zelf blijft bestaan.'))return;
      this.saved.quick_links=this.saved.quick_links.filter(i=>i.id!==id);
      this.saved.quick_order=this.saved.quick_order.filter(i=>i!==id);
      this.saved.quick_hidden=this.saved.quick_hidden.filter(i=>i!==id);
      this._saveSettings();this._rebuildSettingsAtSamePosition('quick');this._editorNotice('Snelkoppeling verwijderd.');
    }
    _quickImportJson(){
      const raw=this.dialog.querySelector('#pala-quick-import')?.value||'';
      let data;try{data=JSON.parse(raw);}catch{this._editorNotice('JSON ongeldig. Gebruik een lijst met objecten.');return;}
      if(!Array.isArray(data)||data.length>100){this._editorNotice('Gebruik een lijst van maximaal 100 snelkoppelingen.');return;}
      const links=[...this.saved.quick_links],paths=new Set(links.map(x=>routeKey(x.path)));
      let count=0;
      for(const entry of data){
        if(!entry||typeof entry!=='object'||Array.isArray(entry)||!validPath(entry.path)||!text(entry.label).trim())continue;
        const key=routeKey(entry.path);
        if(paths.has(key)||links.length>=50)continue;
        const id=(typeof entry.id==='string'&&/^quick-[a-z0-9_-]{2,65}$/i.test(entry.id)&&!links.some(x=>x.id===entry.id))?entry.id:
          'quick-eigen-'+cleanId(text(entry.label).toLowerCase())+'-'+count+'-'+Date.now().toString(36);
        const item=configItem({id,label:entry.label,path:entry.path,icon:entry.icon||'mdi:link-variant',admin_only:entry.admin_only===true});
        if(!item)continue;
        links.push(item);paths.add(key);count++;
      }
      if(!count){this._editorNotice('Geen nieuwe geldige snelkoppelingen gevonden.');return;}
      this.saved.quick_links=links;
      this._saveSettings();this._rebuildSettingsAtSamePosition('quick');this._editorNotice(count+' snelkoppelingen geïmporteerd.');
    }
    _moveQuick(id,step){
      const order=this._quickEntries().map(i=>i.id),index=order.indexOf(id);
      const pos=index+step;if(index<0||pos<0||pos>=order.length)return;
      [order[index],order[pos]]=[order[pos],order[index]];
      this.saved.quick_order=order;this._saveSettings();this._rebuildSettingsAtSamePosition('quick');
    }
    _haMenu(open){
      const n=this.native?.isConnected?this.native:deepFindSidebar();
      if(!n)return false;
      // HA supports {open:true|false}. Only pass a detail when explicitly
      // requested, preserving the native desktop toggle semantics.
      n.dispatchEvent(new CustomEvent('hass-toggle-menu',{bubbles:true,composed:true,
        ...(typeof open==='boolean'?{detail:{open}}:{})}));
      return true;
    }
    _restoreHaHeader(){
      if(this._haHeaderStyle){this._haHeaderStyle.remove();this._haHeaderStyle=null;}
      if(this._haHeaderSidebar){
        if(this._haHeaderOriginal!==null)try{this._haHeaderSidebar.sidebarTitle=this._haHeaderOriginal;}catch{}
        this._haHeaderSidebar.style.removeProperty('--pala-sky');
        this._haHeaderSidebar.style.removeProperty('--pala-ground');
        this._haHeaderSidebar.style.removeProperty('--pala-badge-accent');
        this._haHeaderSidebar.style.removeProperty('--pala-native-text-size');
        this._haHeaderSidebar.style.removeProperty('--pala-native-badge-size');
      }
      this._haHeaderSidebar=null;this._haHeaderOriginal=null;
    }
    // HA owns its bottom three items (Settings, Notifications, Profile).
    // Bridge our user-selected menu typography onto that native shadow root.
    _syncNativeTypography(n){
      if(!n?.isConnected || this.integration!=='native')return;
      const typography=cleanDesign(this.saved.design).typography/100;
      n.style.setProperty('--pala-native-text-size',(12*typography).toFixed(1)+'px');
      n.style.setProperty('--pala-native-badge-size',(10*typography).toFixed(1)+'px');
    }
    _syncHaHeader(){
      const n=this.integration==='native' ? (this.native?.isConnected?this.native:deepFindSidebar()) : null;
      if(!n?.shadowRoot){this._restoreHaHeader();return;}
      if(this._haHeaderSidebar!==n){
        this._restoreHaHeader();this._haHeaderSidebar=n;
        this._haHeaderOriginal=typeof n.sidebarTitle==='string'?n.sidebarTitle:'Home Assistant';
        this._haHeaderStyle=document.createElement('style');
        this._haHeaderStyle.dataset.palaHeader='';n.shadowRoot.append(this._haHeaderStyle);
      }
      const h=this._header();
      this._syncNativeTypography(n);
      // HA's bottom fixed-navigation is rendered OUTSIDE the PalaSidebar
      // shadow DOM. Feed it the same live accent as badges in the custom menu.
      n.style.setProperty('--pala-badge-accent',
        this.style.getPropertyValue('--p-accent').trim() ||
        colour(this.saved.accent||this._resolved().appearance.accent));
      // Only sidebarTitle is used; never remove HA's menu component or overwrite global styles.
      const desired=h.ha_title||this._haHeaderOriginal;
      if(n.sidebarTitle!==desired)n.sidebarTitle=desired;
      const theme=cleanTheme(this._themePrefs());
      const {scene}=this._themeScene(theme);
      const palette=resolvedThemePalette(theme,scene);
      const active=theme.preset!=='classic'||(theme.dynamic!=='off'&&!!scene);
      if(active){
        n.style.setProperty('--pala-sky',palette.sky);
        n.style.setProperty('--pala-ground',palette.ground);
      } else {
        n.style.removeProperty('--pala-sky');n.style.removeProperty('--pala-ground');
      }
      const headerCss={
        normal:'',
        'title-hidden':'.menu .title{display:none!important}',
        compact:'.menu{height:44px!important;min-height:44px!important}.menu .title{display:none!important}',
        hidden:'.menu{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important}'
      }[h.ha]||'';
      const themeCss=active?`
        :host{background-color:var(--pala-ground)!important;
          background-image:${theme.dynamic==='weather'?
            'linear-gradient(180deg,color-mix(in srgb,var(--pala-sky) 38%,var(--pala-ground)) 0%,var(--pala-ground) 72%)':
            'linear-gradient(160deg,var(--pala-sky),var(--pala-ground))'}!important;
          background-repeat:no-repeat!important;background-size:100% 100%!important}
        .menu{background-color:transparent!important}
        .panels-list,.wrapper,ha-list-nav{background-color:transparent!important}
        :host ha-list-item-button{--sidebar-text-color:#eaf4ff;--sidebar-icon-color:#c3d8e7;
          --sidebar-selected-icon-color:#eaf4ff}
      `:'';
      // Settings/notification counters belong to HA and normally use HA's
      // generic accent color, not PalaSidebar's weather/theme palette.
      // Style ONLY the native counter spans; never replace their values or
      // touch the profile avatar, native navigation or HA's sidebar logic.
      const badgeCss=`
        .panels-list ha-list-item-button .badge,
        .panels-list ha-list-item-base .badge {
          background-color:var(--pala-badge-accent,var(--accent-color))!important;
          color:#0b1822!important;
          border-radius:8px!important;
          font-weight:800!important;
          border:1px solid #ffffff25!important;
        }
      `;
      // Native HA fixed footer lives outside the PalaSidebar shadow tree.
      // Only these three labels/counters inherit the PalaSidebar design slider.
      // HA's own avatar, click handlers, selection, icons and badge values stay intact.
      const nativeFooterTypographyCss=`
        ha-list-item-button:is(.configuration,.notifications,.user) .item-text,
        ha-list-item-button:is(#sidebar-config,#sidebar-notifications,#sidebar-profile) .item-text {
          font-family:var(--primary-font-family,Roboto,Arial,sans-serif)!important;
          font-size:var(--pala-native-text-size,12px)!important;
          font-weight:550!important;
          line-height:1.4!important;
        }
        ha-list-item-button:is(.configuration,.notifications) .badge,
        ha-list-item-button:is(#sidebar-config,#sidebar-notifications) .badge {
          font-size:var(--pala-native-badge-size,10px)!important;
        }
      `;
      // Hide only the visual rail in HA's native sidebar; retain native scrolling.
      const scrollbarCss=`
        :host,.wrapper,.panels-list,.menu,ha-list-nav{scrollbar-width:none!important;-ms-overflow-style:none!important}
        :host::-webkit-scrollbar,.wrapper::-webkit-scrollbar,.panels-list::-webkit-scrollbar,
        .menu::-webkit-scrollbar,ha-list-nav::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}
      `;
      const css=headerCss+themeCss+badgeCss+nativeFooterTypographyCss+scrollbarCss;
      if(this._haHeaderStyle.textContent!==css)this._haHeaderStyle.textContent=css;
    }
    _setOpen(value,fromHistory=false){
      const wasOpen=this.open;
      this.open=!!value;this.setAttribute('data-open',String(this.open));
      if(!this.open && this.tempFloating){this.tempFloating=false;this.ensurePlacement();}
      if(!fromHistory){
        if(wasOpen && !this.open)this._releaseMenuHistory();
        else this._syncMenuHistory();
      }
    }
    _openDrawer(){
      if(this.integration==='native'){
        if(this._drawerNarrow()){
          if(!this._drawerOpen())this._haMenu(true);
          // When a dialog just closed, its history.back() can still be in
          // flight while the next swipe starts. Reconcile only if the drawer
          // remains open after that popstate; never create a phantom entry.
          if(this._dialogReleasing||this._historyReleasing){
            for(const delay of [100,300])setTimeout(()=>{
              if(this._drawerNarrow()&&this._drawerOpen()&&!this._dialogMarker)this._syncMenuHistory();
            },delay);
          }
          // The HA main application owns the native sidebar state. Never set
          // `expanded` or edit its attributes here: that could hide the fixed
          // Settings / Notifications / Profile navigation on Android.
          // Reuse the native Home Assistant menu event rather than toggling it ourselves.
          this._syncMenuHistory();this._vibrate();return;
        }
        this.tempFloating=true;this.ensurePlacement();
      }
      this._setOpen(true);this._vibrate();
    }
    _back(){
      if(this._dialogReleasing)return true;
      if(this.quickDialog.open){this._closeOwnedDialog(this.quickDialog);return true;}
      if(this.actionDialog.open){this._closeOwnedDialog(this.actionDialog);return true;}
      if(this.dialog.open){this._closeOwnedDialog(this.dialog);return true;}
      if(this.open||(this._drawerNarrow()&&this._drawerOpen())){
        if(this._drawerNarrow()&&this._drawerOpen())this._closeNative();
        if(this.open)this._setOpen(false,true);
        this._releaseMenuHistory();
        return true;
      }
      // De Android-bridge handelt uitsluitend menu's/dialogen af.
      // Dashboard-back behoort aan Home Assistant of de Android-app.
      return false;
    }
    _navigate(path){
      if(!validPath(path))return;
      const go=()=>{
        const a=document.createElement('a');a.href=path;a.style.display='none';document.body.append(a);
        a.click();a.remove();
      };
      // Eerst de tijdelijke mobiele menustap verwijderen; daarna via HA-router.
      if(this._menuHistoryState())this._releaseMenuHistory(go);
      else go();
    }
    // Direct-manipulation swipe: the panel follows the finger horizontally.
    // The Home Assistant 2026 modal is still the sole owner of the REAL open
    // state; we only temporarily paint its visual dialog and then remove it.
    _swipePanel(){
      if(this.integration==='floating')return this.shell;
      if(this.integration!=='native'||!this._drawerNarrow())return null;
      const ha=this._nativeDrawerParts().drawer;
      if(!ha||ha.type!=='modal')return null;
      const wa=ha.shadowRoot?.querySelector('wa-drawer');
      return wa?.shadowRoot?.querySelector('[part="dialog"]')||null;
    }
    _swipeRestore(){
      if(this._swipeRestoreTimer){clearTimeout(this._swipeRestoreTimer);this._swipeRestoreTimer=null;}
      const el=this._swipePreviewElement;
      if(el&&this._swipeOriginal){
        for(const [property,previous] of Object.entries(this._swipeOriginal)){
          if(previous.value)el.style.setProperty(property,previous.value,previous.priority);
          else el.style.removeProperty(property);
        }
      }
      this._swipePreviewElement=null;this._swipeOriginal=null;
    }
    _swipeDraw(s){
      if(!s?.active)return;
      if(!s.target){
        s.target=this._swipePanel();
        if(!s.target){
          // Lit/WA can mount the modal one frame after hass-toggle-menu.
          // Keep the last finger position, do not trigger a second toggle.
          if(s.paintAttempts++<75)requestAnimationFrame(()=>{if(this._gesture===s)this._swipeDraw(s);});
          return;
        }
        this._swipeRestore();
        this._swipePreviewElement=s.target;this._swipeOriginal={};
        for(const property of ['transition','transform','will-change']){
          this._swipeOriginal[property]={value:s.target.style.getPropertyValue(property),priority:s.target.style.getPropertyPriority(property)};
        }
      }
      const width=s.width||280;
      const dx=(s.latestX-s.x)*s.sign;
      const offset=s.direction==='open'?-width+clamp(dx,0,width):-clamp(-dx,0,width);
      s.target.style.setProperty('transition','none','important');
      s.target.style.setProperty('will-change','transform','important');
      s.target.style.setProperty('transform',`translate3d(${offset}px,0,0)`,'important');
    }
    _swipeFinish(s,finish){
      if(!s.target){this._swipeRestore();return;}
      const width=s.width||280;
      const destination=finish?(s.direction==='close'?-width:0):(s.direction==='close'?0:-width);
      s.target.style.setProperty('transition','transform 180ms cubic-bezier(.2,.8,.2,1)','important');
      s.target.style.setProperty('transform',`translate3d(${destination}px,0,0)`,'important');
      // Inline visuals are transient. Never leave an inline transform on HA.
      this._swipeRestoreTimer=setTimeout(()=>this._swipeRestore(),210);
    }
    handleGestureStart(e){
      if(this._gesture){
        // Pointerdown normally comes before touchstart in Android WebView;
        // use one touch stream only, never track one gesture twice.
        if(e.touches?.length===1){this._gesture.input='touch';this._gesture.x=e.touches[0].clientX;this._gesture.y=e.touches[0].clientY;this._gesture.started=performance.now();}
        return;
      }
      if(!this._isMobile()||!this._mobile().enabled||
         this.dialog.open||this.actionDialog.open||this.quickDialog.open)return;
      const t=e.touches?.[0]||(e.pointerType==='touch'?e:null);
      if(!t||e.touches?.length>1)return;
      const x=t.clientX,y=t.clientY;
      if(y<24||e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
      const fromMenu=(e.composedPath?.()||[]).includes(this);
      const open=this.open||(this.integration==='native'&&this._drawerNarrow()&&this._drawerOpen())||
        (this.integration==='native'&&this._drawerNarrow()&&fromMenu);
      let direction='';
      if(open&&x<Math.min(innerWidth*.95,390)&&this._mobile().swipe_close)direction='close';
      else if(!open&&x<=72&&(this.saved.mobile_swipe??this._mobile().swipe_open))direction='open';
      if(!direction)return;
      const panel=this._swipePanel();
      const width=Math.max(200,Math.min(430,panel?.getBoundingClientRect().width||this._drawer()?.getBoundingClientRect?.().width||300));
      this._gesture={x,y,latestX:x,latestY:y,direction,sign:1,started:performance.now(),
        input:e.touches?'touch':'pointer',active:false,target:null,paintAttempts:0,width,fromMenu};
    }
    handleGestureMove(e){
      const s=this._gesture;if(!s)return;
      if(s.input==='touch'&&!e.touches)return;
      if(s.input==='pointer'&&e.touches)return;
      const t=e.touches?.[0]||(e.pointerType==='touch'?e:null);
      if(!t||e.touches?.length>1){this.handleGestureCancel();return;}
      const dx=t.clientX-s.x,dy=t.clientY-s.y;
      if(!s.active){
        if(Math.abs(dy)>26&&Math.abs(dy)>Math.abs(dx)){this.handleGestureCancel();return;}
        if(Math.abs(dx)<12||Math.abs(dx)<Math.abs(dy)*1.3)return;
        if((s.direction==='open'&&dx<=0)||(s.direction==='close'&&dx>=0)){this.handleGestureCancel();return;}
        s.active=true;
        this._favoriteHoldClear();
        this._swipeRestore();
        // Open once when a deliberate edge gesture is confirmed. Visual
        // drag begins as soon as Web Awesome mounts its dialog surface.
        if(s.direction==='open')this._openDrawer();
      }
      s.latestX=t.clientX;s.latestY=t.clientY;
      if(e.cancelable)e.preventDefault();
      this._swipeDraw(s);
    }
    handleGestureEnd(e){
      const s=this._gesture;if(!s)return;
      if(s.input==='touch'&&!e.changedTouches)return;
      if(s.input==='pointer'&&e.changedTouches)return;
      this._gesture=null;
      const t=e.changedTouches?.[0]||(e.pointerType==='touch'?e:null);
      if(!t){this._swipeFinish(s,false);return;}
      const dx=t.clientX-s.x,dy=t.clientY-s.y;
      if(!s.active){
        // Compatibility for WebViews that never issue touchmove; no visual drag
        // is possible there but a complete deliberate swipe still works.
        if(Math.abs(dx)>=65&&Math.abs(dx)>Math.abs(dy)*1.3){
          if(s.direction==='open'&&dx>0)this._openDrawer();
          if(s.direction==='close'&&dx<0){if(this.integration==='native')this._closeNative();else this._setOpen(false);this._releaseMenuHistory();}
        }
        return;
      }
      const distance=s.direction==='open'?dx:-dx;
      const elapsed=Math.max(1,performance.now()-s.started);
      const finish=distance>=s.width*0.44||(distance>46&&distance/elapsed>0.65);
      this._swipeFinish(s,finish);
      if(s.direction==='close'){
        if(finish){
          if(this.integration==='native')this._closeNative();else this._setOpen(false);
          this._releaseMenuHistory();
        }else this._syncMenuHistory();
      }else if(finish){this._syncMenuHistory();}
      else{
        if(this.integration==='native')this._closeNative();else this._setOpen(false);
        this._releaseMenuHistory();
      }
    }
    handleGestureCancel(){
      const s=this._gesture;this._gesture=null;
      if(!s)return;
      this._swipeFinish(s,false);
      if(s.active&&s.direction==='open'){
        if(this.integration==='native')this._closeNative();else this._setOpen(false);
        this._releaseMenuHistory();
      }
    }
    setConfig(config,error=''){this.config=config;this.error=error;this.redraw();}
    setHass(hass){
      if(!hass)return;
      const accountChanged=this.hass?.user?.id!==hass.user?.id;
      const statesChanged=this._lastHassStates!==hass.states;
      this.hass=hass;
      if(accountChanged){
        this._lastHassStates=null;this._perf.samples=[];
        this._agendaCache={key:'',at:0,events:[],status:'',pending:false,generation:this._agendaCache.generation+1};this._agendaRenderSignature='';
        this._recoveryPoints=[];this._recoveryStatus='laden';this._lastDialogHaTheme='';
        this._loadSettings();this.redraw();
      }
      if(statesChanged){
        this._lastHassStates=hass.states;
        this._perf.lastStateAt=Date.now();
        this._scheduleLiveRefresh();
      }
      if(this.dialog?.open||this.quickDialog?.open||this.actionDialog?.open)this._syncHaDialogTheme();
    }
    _scheduleLiveRefresh(){
      if(document.hidden||this._liveFrame||!this.isConnected)return;
      this._liveFrame=requestAnimationFrame(()=>{
        this._liveFrame=0;
        if(document.hidden||!this.isConnected)return;
        this._perf.liveUpdates++;
        this.refreshStatus();
        if(this.dialog?.open&&this.editorTab==='diagnostic')this._fillDiagnostic();
      });
    }
    _resolved(){return profileApplied(this.config,this.hass,this.saved)}
    _themePrefs(){return this.themeDraft||this.saved.theme||this._resolved().theme||FALLBACK.theme;}
    _effectiveMode(){const c=this._resolved();return this.tempFloating?'floating':(this.saved.mode||c.mode||'auto')}
    _bindNativeDrawer(){
      const next=this.integration==='native'?this._nativeDrawerParts().drawer:null;
      if(next===this._observedDrawer)return;
      if(this._observedDrawer)this._observedDrawer.removeEventListener('hass-drawer-closed',this._onDrawerClosed);
      this._observedDrawer=next;
      // Native scrim/outside close changes ha-drawer.open, not
      // ha-sidebar.expanded. Catch HA's own close event immediately instead
      // of waiting up to three seconds for an unrelated status refresh.
      if(next)next.addEventListener('hass-drawer-closed',this._onDrawerClosed);
    }
    _applyIntegration(type,sidebar=null){
      if(this.native && (type!=='native'||this.native!==sidebar))this._restoreNativeFooter();
      this.integration=type;this.native=sidebar;
      this.setAttribute('data-integration',type);this.setAttribute('data-open',String(this.open));
      if(sidebar){
        this.setAttribute('slot','main-navigation');
      }else this.removeAttribute('slot');
      this._syncMobile();this._syncHaHeader();this._bindNativeDrawer();
    }
    _compactSync(){
      // Op mobiel wordt de HA-drawer vaak als overlay getoond terwijl de
      // desktop-property 'expanded' false blijft. Dat is GEEN ingeklapte
      // desktop-rail: toon daarom alle labels, koppen en zoekfunctie.
      // Alleen een echte, brede desktop-rail mag naar icon-only omschakelen.
      const overlayMode=this._isMobile() || !!(this.native &&
        (this.native.narrow===true || this.native.hasAttribute('narrow')));
      const compact=!!(this.integration==='native' && this.native &&
        !overlayMode && this.native.expanded!==true &&
        !this.native.hasAttribute('expanded'));
      this.setAttribute('data-compact',String(compact));
      const railMotion=this.saved.rail_motion||'smooth';
      if(this.getAttribute('data-rail-motion')!==railMotion)this.setAttribute('data-rail-motion',railMotion);
    }
    _mountNative(sidebar){
      if(!sidebar || !sidebar.shadowRoot?.querySelector('slot[name="main-navigation"]'))return false;
      if(this.native===sidebar && this.parentNode===sidebar){this._compactSync();this._syncHaHeader();this._bindNativeDrawer();this._syncMenuHistory();return true;}
      if(this.nativeObserver){this.nativeObserver.disconnect();this.nativeObserver=null;}
      this._setOpen(false);this._applyIntegration('native',sidebar);
      sidebar.appendChild(this);
      this._bindNativeDrawer();
      this.nativeObserver=new MutationObserver(()=>{this._compactSync();this._syncTheme();this._syncMenuHistory();});
      this.nativeObserver.observe(sidebar,{attributes:true,attributeFilter:['expanded','narrow']});
      this.redraw();this._syncMenuHistory();return true;
    }
    ensurePlacement(){
      const mode=this._effectiveMode();
      const sidebar=mode==='floating'?null:(this.native?.isConnected?this.native:deepFindSidebar());
      if(sidebar && this._mountNative(sidebar))return;
      if(this.nativeObserver){this.nativeObserver.disconnect();this.nativeObserver=null;}
      if(this.integration!=='floating'||this.parentNode!==document.body){
        this.open=false;this._applyIntegration('floating');
        document.body.appendChild(this);this.redraw();
      }
    }
    _icon(icon,fallback){return makeIcon(icon,fallback)}
    _click(e){
      const target=e.target.closest?.('[data-do]');if(!target)return;
      const cmd=target.dataset.do;
      if(cmd==='ha-menu'){this._haMenu();this._syncMenuHistory();return;}
      if(cmd==='quick-open'){this.showQuickDialog();return;}
      if(cmd==='profile'){
        e.preventDefault();
        if(this._drawerOpen()&&this._drawerNarrow())this._closeNative();
        if(this.open)this._setOpen(false);
        this._navigate('/profile');return;
      }
      if(cmd==='v2-context-open'||cmd==='v2-context-run'){
        const item=this._allItems().find(x=>x.id===target.dataset.id);
        if(!item)return;
        const action=this._actionForItem(item);
        if(cmd==='v2-context-run'&&(!action||!['toggle','service'].includes(action.type)))return;
        this._closeOwnedDialog(this.actionDialog,()=>{
          if(action)this._runAction(action);
          else if(item.path)this._navigate(item.path);
          this._recent(item.id);
        });return;
      }
      if(cmd==='v2-context-live-toggle'){
        const entity=target.dataset.entity;
        if(isEntity(entity))this._closeOwnedDialog(this.actionDialog,()=>this._runAction({type:'toggle',entity}));
        return;
      }
      if(cmd==='v2-context-section-toggle'){
        const section=target.dataset.section;
        // Invoke the existing section action synchronously. A callback after
        // history.back() can be lost in Android WebViews during drawer closes.
        const btn=section==='live'?this.liveCenter.querySelector('.group-toggle'):
          [...this.list.querySelectorAll('.group-toggle')].find(b=>b.dataset.id===section);
        if(btn?.isConnected)btn.click();
        this._closeOwnedDialog(this.actionDialog);return;
      }
      if(cmd==='v2-context-more'){
        const entity=target.dataset.entity;
        if(isEntity(entity))this._closeOwnedDialog(this.actionDialog,()=>this._runAction({type:'more-info',entity}));
        return;
      }
      if(cmd==='v2-live-collapse'){
        this._setLiveCenterCollapsed(!this.saved.live_center?.collapsed);return;
      }
      if(cmd==='v2-live-more'){
        const entity=target.dataset.entity;if(!isEntity(entity))return;
        const tile=this.saved.live_center?.tiles?.find(x=>x.entity===entity);
        this._runAction(tile?.action==='toggle'?{type:'toggle',entity}:{type:'more-info',entity});return;
      }
      if(cmd==='v2-live-save'){this._saveLiveCenter();return;}
      if(cmd==='v2-menu-save'){
        this.saved.context_menu=cleanContextMenu({enabled:this.dialog.querySelector('#pala-v2-menu-enabled')?.checked,configured:true});
        this._saveSettings();this._editorNotice('Long-press snelmenu opgeslagen.');return;
      }
      if(cmd==='v2-perf-save'){
        this.saved.performance_center=cleanPerformanceCenter({enabled:this.dialog.querySelector('#pala-v2-perf-enabled')?.checked,profile:this.dialog.querySelector('#pala-v2-perf-profile')?.value});
        if(!this.saved.performance_center.enabled)this._perf.samples=[];
        this._saveSettings();this._syncTheme(true);this._fillPerformance();this._editorNotice('Performance-instelling opgeslagen.');return;
      }
      if(cmd==='v2-perf-refresh'){this._fillPerformance();return;}
      if(cmd==='v2-perf-reset'){this._perf.samples=[];this._perf.listDraws=0;this._perf.liveUpdates=0;this._fillPerformance();return;}
      if(cmd==='v2-perf-copy'){
        const report=this._performanceReport();
        if(navigator.clipboard?.writeText)navigator.clipboard.writeText(report).then(()=>this._editorNotice('Performance-rapport gekopieerd.')).catch(()=>this._editorNotice('Kopiëren geblokkeerd door de browser.'));
        else this._editorNotice('Kopiëren niet beschikbaar in deze browser.');return;
      }
      if(cmd==='v2-theme-snapshot'){this._saveThemeSnapshot();return;}
      if(cmd==='v2-theme-load'){
        const id=this.dialog.querySelector('#pala-v2-theme-select')?.value;
        const saved=this.saved.theme_snapshots.find(x=>x.id===id);
        if(saved)this._loadThemeSnapshot(saved.theme);else this._editorNotice('Selecteer een eigen preset.');return;
      }
      if(cmd==='v2-theme-delete'){
        const id=this.dialog.querySelector('#pala-v2-theme-select')?.value;
        if(!id)return;
        this.saved.theme_snapshots=this.saved.theme_snapshots.filter(x=>x.id!==id);
        this._saveSettings();this._refreshSnapshotsUI();this._editorNotice('Preset verwijderd.');return;
      }
      if(cmd==='v2-theme-export'){
        const textarea=this.dialog.querySelector('#pala-v2-theme-json');
        if(textarea)textarea.value=JSON.stringify(this._themeForm(),null,2);
        this._editorNotice('Thema JSON gereed. Je kunt de tekst kopiëren.');return;
      }
      if(cmd==='v2-theme-import'){
        const raw=this.dialog.querySelector('#pala-v2-theme-json')?.value||'';
        if(!raw||raw.length>5000){this._editorNotice('Vul geldige thema JSON in (max. 5 KB).');return;}
        try{
          const obj=JSON.parse(raw);
          if(!obj||typeof obj!=='object'||Array.isArray(obj)||!['classic','glass','ocean','forest','sunset','midnight','amoled','aurora','graphite','copper'].includes(obj.preset))throw Error('preset');
          this._loadThemeSnapshot(obj);
        }catch{this._editorNotice('Ongeldige thema JSON.');}return;
      }
      if(cmd==='favorite-toggle'){
        const id=target.dataset.id;
        if(this._allItems().some(item=>item.id===id))this._toggleFavorite(id);
        this._closeOwnedDialog(this.actionDialog);return;
      }
      if(cmd==='quick-order-toggle'){
        this._quickOrderCleanup(false);
        this._quickOrderSetMode(!this._quickOrderMode);
        return;
      }
      if(cmd==='quick-order-prev'||cmd==='quick-order-next'){
        this._quickOrderNudge(cmd==='quick-order-prev'?-1:1);return;
      }
      if(cmd==='quick-close'){this._closeOwnedDialog(this.quickDialog);return;}
      if(cmd==='quick-route'){
        if(this._quickOrderMode||performance.now()<this._quickSuppressClickUntil)return;
        const path=target.dataset.path;
        this._closeOwnedDialog(this.quickDialog,validPath(path)?()=>this._navigate(path):undefined);
        return;
      }
      if(cmd==='quick-up'||cmd==='quick-down'){this._moveQuick(target.dataset.id,cmd==='quick-up'?-1:1);return;}
      if(cmd==='quick-hide'){this.saved.quick_hidden.push(target.dataset.id);this._saveSettings();this._rebuildSettingsAtSamePosition('quick');return;}
      if(cmd==='quick-reset'){this.saved.quick_hidden=[];this.saved.quick_order=[];this._saveSettings();this._rebuildSettingsAtSamePosition('quick');return;}
      if(cmd==='quick-save'){this._quickSaveEditor();return;}
      if(cmd==='quick-new'){this._quickFillEditor('');return;}
      if(cmd==='quick-remove'){this._quickRemoveEditor();return;}
      if(cmd==='quick-import'){this._quickImportJson();return;}
      if(cmd==='header-route'){
        const item=this._allItems().find(i=>i.id===target.dataset.id);
        if(item){const action=this._actionForItem(item);if(action)this._runAction(action);else if(item.path)this._navigate(item.path);if(this.open)this._setOpen(false);}
        return;
      }
      if(cmd==='open'){this.open?this._setOpen(false):this._openDrawer();return;}
      if(cmd==='close'){this._setOpen(false);return;}
      if(cmd==='settings'){this.showSettings();return;}
      if(cmd==='ha-restart'){this._requestHARestart();return;}
      if(cmd==='agenda-collapse'){
        this.saved.agenda=cleanAgenda({...this.saved.agenda,collapsed:!this.saved.agenda?.collapsed});
        // Laat bestaande kaarten gemount: geen replaceChildren bij uit-/inklappen.
        this._agendaPaint();this._saveSettings();return;
      }
      if(cmd==='agenda-open'||cmd==='agenda-entry'){
        this._navigate('/calendar');if(this.open)this._setOpen(false);return;
      }
      if(cmd==='agenda-refresh'){this._agendaMaybeFetch(true);return;}
      if(cmd==='agenda-pick-waste'){
        const names=new Set(AGENDA_WASTE_CALENDARS);
        for(const node of this.dialog.querySelectorAll('[data-agenda-calendar]'))node.checked=names.has(node.dataset.agendaCalendar);
        return;
      }
      if(cmd==='agenda-pick-all'){
        for(const node of this.dialog.querySelectorAll('[data-agenda-calendar]'))node.checked=true;
        return;
      }
      if(cmd==='agenda-pick-none'){
        for(const node of this.dialog.querySelectorAll('[data-agenda-calendar]'))node.checked=false;
        return;
      }
      if(cmd==='agenda-save'){this._agendaSaveEditor();return;}
      if(cmd==='save-header'){this._saveHeader();return;}
      if(cmd==='layout-section-pick'){const sel=this.dialog.querySelector('#pala-layout-section');if(sel){sel.value=target.dataset.id;this._layoutFillSection();}return;}
      if(cmd==='layout-icon-same-sensor'){
        const source=this.dialog?.querySelector('#pala-layout-title-entity')?.value||'';
        const picker=this.dialog?.querySelector('#pala-layout-icon-entity');
        if(picker){picker.value=source;this._fillDynamicItemAttributes('icon','auto');this._previewDynamicItem();}
        return;
      }
      if(cmd==='layout-item-pick'){const sel=this.dialog.querySelector('#pala-layout-item');if(sel){sel.value=target.dataset.id;this._layoutFillItem();}return;}
      if(cmd==='layout-section-save'){this._layoutSaveSection();return;}
      if(cmd==='layout-section-up'||cmd==='layout-section-down'){this._layoutMoveSection(cmd==='layout-section-up'?-1:1,target.dataset.id);return;}
      if(cmd==='layout-section-add'){this._layoutAddSection();return;}
      if(cmd==='layout-section-remove'){this._layoutRemoveSection();return;}
      if(cmd==='layout-item-save'){this._layoutSaveItem();return;}
      if(cmd==='layout-item-up'||cmd==='layout-item-down'){this._layoutMoveItem(cmd==='layout-item-up'?-1:1,target.dataset.id);return;}
      if(cmd==='layout-reset'){this._layoutReset();return;}
      if(cmd==='layout-global-save'){this._layoutSaveGlobal();return;}
      if(cmd==='footer-route'){
        const item=this._allItems().find(i=>i.id===target.dataset.id);
        if(item){const action=this._actionForItem(item);action?this._runAction(action):this._navigate(item.path);}
        return;
      }
      if(cmd==='settings-close'||cmd==='settings-close-top'){this._closeOwnedDialog(this.dialog);return;}
      if(cmd==='action-close'){this._closeOwnedDialog(this.actionDialog);return;}
      if(cmd==='editor-tabs-prev'||cmd==='editor-tabs-next'){const nav=this.dialog.querySelector('.editor-tabs');if(nav)nav.scrollBy({left:(cmd==='editor-tabs-prev'?-1:1)*Math.max(150,nav.clientWidth*.7),behavior:'smooth'});return;}
      if(cmd==='editor-tab'){if(this.editorTab==='design')this._applyDesign();if(this.editorTab==='ui_style'){this._pfxDraft=null;this._pfxApply();}if(this.themeDraft){this.themeDraft=null;this._syncTheme(true);this._fillThemeEditor(this._themePrefs());}this.dialog.querySelector('#pala-editor-notice')?.remove();this._showEditorTab(target.dataset.tab);const scroller=this.dialog.querySelector('.dialog-content');if(scroller)scroller.scrollTop=0;return;}
      if(cmd==='theme-preset'){this._chosenPreset=target.dataset.preset;this._themePreviewLive();return;}
      if(cmd==='theme-save'){this._themeSave();return;}
      if(cmd==='pfx-preset'){this._pfxPreset(target.dataset.profile);return;}
      if(cmd==='pfx-save'){this._pfxSave();return;}
      if(cmd==='pfx-reset'){this._pfxReset();return;}
      if(cmd==='pfx-cancel'){this._pfxDraft=null;this._pfxApply();this._editorNotice('Voorbeeld gestopt; opgeslagen instelling blijft actief.');return;}
      if(cmd==='design-save'){this._designSave();return;}
      if(cmd==='design-reset'){this._designReset();return;}
      if(cmd==='diagnostic-refresh'){this._fillDiagnostic();return;}
      if(cmd==='diagnostic-copy'){navigator.clipboard?.writeText(this._diagnosticText()).then(()=>this._editorNotice('Rapport gekopieerd.')).catch(()=>this._editorNotice('Kopiëren niet toegestaan door browser.'));return;}
      if(cmd==='recovery-refresh'){this._loadRecoveryPoints(true);return;}
      if(cmd==='recovery-restore'){this._restoreRecoveryPoint(Number(target.dataset.index));return;}
      if(cmd==='theme-reset'){this._chosenPreset='classic';this._fillThemeEditor(FALLBACK.theme);this.themeDraft=cleanTheme(FALLBACK.theme);this._syncTheme(true);this.saved.theme=cleanTheme(FALLBACK.theme);this.themeDraft=null;this._saveSettings();this._editorNotice('Standaardthema hersteld.');return;}
      if(cmd==='theme-cancel'){this._themeCancel();return;}
      if(cmd==='editor-panel'){this._pickPanel();return;}
      if(cmd==='editor-menu-save'){this._editorMenuSave();return;}
      if(cmd==='editor-menu-remove'){this._editorMenuRemove();return;}
      if(cmd==='editor-menu-clear'){this._fillMenuEditor('');return;}
      if(cmd==='badge-template-new-line'){this._badgeTemplateInsert(true);return;}
      if(cmd==='badge-template-same-line'){this._badgeTemplateInsert(false);return;}
      if(cmd==='badge-template-empty-line'){this._badgeTemplateBlankLine();return;}
      if(cmd==='editor-badge-save'){this._editorBadgeSave();return;}
      if(cmd==='editor-badge-remove'){this._editorBadgeRemove();return;}
      if(cmd==='badge-add-stop'){
        this._badgeAddStop();this._badgeSyncColorStops();this._previewBadge();return;
      }
      if(cmd==='badge-add-current-stop'){
        const n=numericSensorValue(this._badgeCurrentColorValue());
        if(Number.isFinite(n)){
          this._badgeAddStop(String(n),'#ff9500');this._badgeSyncColorStops();this._previewBadge();
        }else this._editorNotice('De sensor moet een geldige numerieke waarde hebben voor een kleurpunt.');
        return;
      }
      if(cmd==='badge-copy-stops'){
        const current=text(this.dialog.querySelector('#pala-badge-color_rules')?.value);
        const converted=stopsFromRules(current);
        if(!converted){this._editorNotice('Geen numerieke kleurgrenzen gevonden. Voeg zelf kleurpunten toe.');return;}
        this._badgeFillStops(converted);this._badgeSyncColorStops();this._previewBadge();return;
      }
      if(cmd==='badge-remove-stop'){
        target.closest('[data-badge-stop]')?.remove();this._badgeSyncColorStops();this._previewBadge();return;
      }
      if(cmd==='badge-add-rule'){
        this._badgeAddRule();this._badgeSyncColorRules();this._previewBadge();return;
      }
      if(cmd==='badge-add-current-rule'){
        const raw=this._badgeCurrentColorValue();const state=text(raw).replace(/[;\n]/g,'').replace(/(?<![<>])=/g,'').slice(0,50);
        if(state&&!['unknown','unavailable'].includes(state.toLowerCase())){
          this._badgeAddRule(state,sensorColor(state)||(state==='on'?'#22c55e':state==='off'?'#ef4444':'#38bdf8'));
          this._badgeSyncColorRules();this._previewBadge();
        }else this._editorNotice('Deze sensor heeft nu geen bruikbare waarde.');
        return;
      }
      if(cmd==='badge-remove-rule'){
        target.closest('[data-badge-rule]')?.remove();this._badgeSyncColorRules();this._previewBadge();return;
      }
      if(cmd==='badge-color-swatch'){
        const input=this.dialog.querySelector('#'+target.dataset.target);
        if(input && hex6(target.dataset.color)){
          input.value=hex6(target.dataset.color);this._badgeColorPickerEvent(input);this._previewBadge();
        }return;
      }
      if(cmd==='editor-action-save'){this._editorActionSave();return;}
      if(cmd==='editor-action-remove'){this._editorActionRemove();return;}
      if(cmd==='editor-sensor-add'){this._editorSensorAdd();return;}
      if(cmd==='editor-sensor-new'){this._fillSensorEditor('');return;}
      if(cmd==='editor-sensor-edit'){this._fillSensorEditor(target.dataset.entity);return;}
      if(cmd==='editor-sensor-use-status-title'||cmd==='editor-sensor-use-status-icon'||cmd==='editor-sensor-use-title-icon'){
        const kind=cmd.endsWith('title')?'title':'icon';
        const value=cmd==='editor-sensor-use-title-icon'?this.dialog.querySelector('#pala-sensor-title-entity')?.value:this.dialog.querySelector('#pala-sensor-entity')?.value;
        const field=this.dialog.querySelector('#pala-sensor-'+kind+'-entity');if(field){field.value=value||'';this._fillSensorAttributes(kind,kind==='icon'?'auto':'');this._previewSensor();}
        return;
      }
      if(cmd==='editor-sensor-remove'){this._editorSensorRemove(target.dataset.entity);return;}
      if(cmd==='choose-entity'){
        const field=this.dialog.querySelector('#'+target.dataset.field);
        if(field){field.value=target.dataset.entity;this._updateSuggestions(field);
          field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));}
        return;
      }
      if(cmd==='clear-field'){
        const field=this.dialog.querySelector('#'+target.dataset.field);
        if(field){field.value='';field.dispatchEvent(new Event('input',{bubbles:true}));
          field.dispatchEvent(new Event('change',{bubbles:true}));field.focus();}
        return;
      }
      if(cmd==='group'){
        this._toggleGroup(target.dataset.id);
        // A pointer/touch click should not leave a large persistent focus ring.
        // Keyboard clicks (detail === 0) retain the accessible focus indicator.
        if(e.detail>0)target.blur();
        return;
      }
      if(cmd==='favorite'){this._toggleFavorite(target.dataset.id);return;}
      if(cmd==='route'){
        const id=target.dataset.id,item=this._allItems().find(x=>x.id===id);
        if(!item)return;
        const action=this._actionForItem(item);
        if(action){
          e.preventDefault();
          if(this._isMobile() && this._drawerOpen())this._closeNative();
          if(this.integration==='floating'&&this.open)this._setOpen(false);
          if(this._menuHistoryState())this._releaseMenuHistory(()=>this._runAction(action));
          else this._runAction(action);
        }else if(!item.path)e.preventDefault();
        else if(!pathIsExternal(item.path) && this._isMobile()){
          // Laat HA de eigen routing afhandelen, nadat de mobiele menustap weg is.
          e.preventDefault();
          if(this._drawerOpen())this._closeNative();
          if(this.integration==='floating'&&this.open)this._setOpen(false);
          this._navigate(item.path);
        }else if(this.integration==='floating'&&this.open)this._setOpen(false);
        this._recent(id);
        return;
      }
      if(cmd==='entity'){
        this._closeOwnedDialog(this.actionDialog,()=>this._runAction({type:'more-info',entity:target.dataset.entity}));return;
      }
      if(cmd==='save-prefs'){this._saveDialog();return;}
      if(cmd==='reset-prefs'){if(!this._prefsStore?.ready){this._editorNotice('Wacht op het laden van je serverinstellingen voordat je herstelt.');return;}if(!confirm('Alle PalaSidebar-instellingen voor dit Home Assistant-account herstellen, ook op andere apparaten?'))return;this.saved=EMPTY_PREFS();this._pfxDraft=null;this._pfxApply();this._saveSettings();this._closeOwnedDialog(this.dialog);this.redraw();return;}
      if(cmd==='add-link'){this._addLink();return;}
      if(cmd==='remove-link'){this.saved.links=this.saved.links.filter(i=>i.id!==target.dataset.id);this._saveSettings();this._rebuildSettingsAtSamePosition(this.editorTab);this.redraw();return;}
      if(cmd==='sync-server'){
        const store=this._prefsStore;
        if(!store)return;
        if(!store.ready){if(store.retryTimer)clearTimeout(store.retryTimer);store.retryTimer=null;this._loadServerSettings(store);}
        else{store.dirty=true;this._scheduleServerSave(true);}
        return;
      }
      if(cmd==='export'){this._exportSettings();return;}
      if(cmd==='import'){this._importSettings();return;}
      if(cmd==='reload-config'){fetchConfig().then(({config,error})=>{this.setConfig(config,error);this.ensurePlacement();this._closeOwnedDialog(this.dialog);});return;}
    }
    _input(e){
      if(e.target===this.searchInput){this.search=e.target.value;this._drawList();}
      else if(e.target?.dataset?.entityPicker)this._updateSuggestions(e.target);
      if(e.target?.id==='pala-badge-entity'){
        this._refreshBadgeAttributeOptions();this._refreshBadgeColorAttributeOptions();
      }
      if(e.target?.id==='pala-badge-insert-entity')this._refreshBadgeInsertAttributes();
      if(['pala-sensor-title-entity','pala-sensor-icon-entity'].includes(e.target?.id))
        this._fillSensorAttributes(e.target.id.includes('title')?'title':'icon');
      if(e.target?.id?.startsWith('pala-sensor-'))this._previewSensor();
      if(['pala-layout-title-entity','pala-layout-icon-entity'].includes(e.target?.id)){
        this._fillDynamicItemAttributes(e.target.id.includes('title')?'title':'icon');this._previewDynamicItem();
      }
      if(['pala-layout-title-attribute','pala-layout-icon-attribute','pala-layout-item-label','pala-layout-item-icon'].includes(e.target?.id))this._previewDynamicItem();
      if(e.target?.matches?.('[data-badge-color-native],[data-badge-color-hex]'))this._badgeColorPickerEvent(e.target);
      if(e.target?.closest?.('[data-badge-rule]'))this._badgeSyncColorRules();
      if(e.target?.closest?.('[data-badge-stop]'))this._badgeSyncColorStops();
      if(e.target?.id?.startsWith('pala-badge-')||e.target?.closest?.('[data-badge-rule]')||e.target?.closest?.('[data-badge-stop]'))this._previewBadge();
      if(e.target?.id?.startsWith('pala-theme-'))this._themePreviewLive();
      if(e.target?.dataset?.pfxKey)this._pfxPreview();
      if(e.target?.id?.startsWith('pala-design-'))this._designPreview();
    }
    _change(e) {
      const id=e.target?.id;
      if(id==='pala-layout-section')this._layoutFillSection();
      if(id==='pala-layout-item')this._layoutFillItem();
      if(id==='pala-menu-select')this._fillMenuEditor(e.target.value);
      if(id==='pala-quick-select')this._quickFillEditor(e.target.value);
      if(id==='pala-quick-panel')this._quickPickPanel();
      if(id==='pala-quick-auto'){this.saved.quick_auto=e.target.checked;this._saveSettings();this._rebuildSettingsAtSamePosition('quick');}
      if(id==='pala-menu-panel')this._pickPanel();
      if(id==='pala-badge-select')this._fillBadgeEditor(e.target.value);
      if(id==='pala-badge-entity'){
        this._refreshBadgeAttributeOptions();this._refreshBadgeColorAttributeOptions();
      }
      if(id==='pala-badge-insert-entity')this._refreshBadgeInsertAttributes();
      if(id==='pala-sensor-select')this._fillSensorEditor(e.target.value);
      if(['pala-sensor-title-entity','pala-sensor-icon-entity'].includes(id))
        this._fillSensorAttributes(id.includes('title')?'title':'icon');
      if(id?.startsWith('pala-sensor-'))this._previewSensor();
      if(['pala-layout-title-entity','pala-layout-icon-entity'].includes(id)){
        this._fillDynamicItemAttributes(id.includes('title')?'title':'icon');this._previewDynamicItem();
      }
      if(['pala-layout-title-attribute','pala-layout-icon-attribute'].includes(id))this._previewDynamicItem();
      if(id==='pala-badge-color_entity')this._refreshBadgeColorAttributeOptions();
      if(id==='pala-badge-attribute')this._toggleCustomBadgeAttribute();
      if(id==='pala-badge-color_attribute_select')this._toggleBadgeColorAttribute();
      if(e.target?.matches?.('[data-badge-color-native],[data-badge-color-hex]')){
        this._badgeColorPickerEvent(e.target);
        const hex=e.target.closest('.badge-color-control')?.querySelector('[data-badge-color-hex]');
        if(hex && !hex6(hex.value))hex.value=hex.closest('.badge-color-control').querySelector('[data-badge-color-native]').value;
      }
      if(e.target?.closest?.('[data-badge-rule]'))this._badgeSyncColorRules();
      if(e.target?.closest?.('[data-badge-stop]'))this._badgeSyncColorStops();
      if(id==='pala-badge-color_transition' && e.target.value==='gradient' &&
        !text(this.dialog.querySelector('#pala-badge-color_stops')?.value)){
        // Eén keer automatisch de bestaande numerieke drempels als kleurpunten gebruiken.
        const converted=stopsFromRules(this.dialog.querySelector('#pala-badge-color_rules')?.value);
        if(converted){this._badgeFillStops(converted);this._badgeSyncColorStops();}
      }
      if(id==='pala-badge-fallback_enabled')this._updateBadgeColorEditor();
      if(id?.startsWith('pala-badge-')||e.target?.closest?.('[data-badge-rule]')||e.target?.closest?.('[data-badge-stop]'))this._previewBadge();
      if(id==='pala-action-select')this._fillActionEditor(e.target.value);
      if(id==='pala-action-type')this._toggleActionFields();
      if(id?.startsWith('pala-theme-'))this._themePreviewLive();
      if(e.target?.dataset?.pfxKey)this._pfxPreview();
      if(id?.startsWith('pala-design-'))this._designPreview();
    }
    _toggleGroup(id){
      const n=new Set(this.saved.closed),collapsed=!n.has(id);
      if(collapsed)n.add(id);else n.delete(id);
      this.saved.closed=[...n];
      // Do not rebuild the menu: retaining its DOM keeps the open/close
      // animation continuous, and avoids recreating badges and sensor images.
      const toggle=[...this.list.querySelectorAll('.group-toggle')].find(el=>el.dataset.id===id);
      const body=toggle?.parentElement?.nextElementSibling;
      if(toggle&&body?.classList.contains('group-content')){
        toggle.setAttribute('aria-expanded',String(!collapsed));
        body.dataset.collapsed=String(collapsed);
        body.setAttribute('aria-hidden',String(collapsed));
        body.inert=collapsed;
      }
      this._saveSettings();
    }
    _toggleFavorite(id){const s=new Set(this.saved.favorites);s.has(id)?s.delete(id):s.add(id);this.saved.favorites=[...s];this._saveSettings();this._drawList();}
    _recent(id){this.saved.recent=[id,...this.saved.recent.filter(v=>v!==id)].slice(0,8);this._saveSettings();}
    _isAvailable(item){
      if(item.admin_only&&!this.hass?.user?.is_admin)return false;
      if(item.hide_mobile && this._isMobile())return false;
      if(this.saved.hidden.includes(item.id))return false;
      if(item.requires_panel && this.hass?.panels && !own(this.hass.panels,item.requires_panel))return false;
      if(item.visible_when){const r=item.visible_when; const ent=this.hass?.states?.[r.entity];if(r.entity&&!ent)return false;if(r.state!==undefined&&ent.state!==String(r.state))return false;}
      return true;
    }
    // One section pipeline for config groups, user groups and HA discovery.
    // Display overrides never mutate source configuration or dashboard routes.
    _sectionDefinitions(){
      const cfg=this._resolved(),defs=[{id:'favorieten',title:'★ FAVORIETEN',virtual:true},{id:'recent',title:'RECENT',virtual:true}];
      for(const g of cfg.groups)if(!defs.some(x=>x.id===g.id))defs.push({id:g.id,title:g.title,admin_only:!!g.admin_only});
      const personal=new Map();
      for(const link of this.saved.links){const title=link.group||'MIJN DASHBOARDS',id='persoonlijk-'+cleanId(title.toLowerCase());if(!personal.has(id))personal.set(id,{id,title});}
      defs.push(...personal.values());
      for(const g of this.saved.custom_groups)if(!defs.some(x=>x.id===g.id))defs.push({...g,custom:true});
      defs.push({id:'automatisch',title:cfg.discovery.title||'Andere dashboards'});
      return defs.filter(g=>!g.admin_only||this.hass?.user?.is_admin).map(g=>({...g,
        title:this.saved.section_overrides[g.id]?.title||g.title,
        visible:this.saved.section_overrides[g.id]?.visible!==false}));
    }
    _navData(includeHiddenSections=false,includeHiddenItems=false){
      const cfg=this._resolved(),seen=new Set(),definitions=this._sectionDefinitions(),map=new Map(definitions.map(g=>[g.id,{...g,items:[]}]));
      const push=(groupId,raw,groupAdmin=false)=>{
        const item=configItem(raw);if(!item)return;
        // A menu item coming from an admin-only group remains admin-only when moved.
        if(groupAdmin)item.admin_only=true;
        if(!includeHiddenItems&&!this._isAvailable(item))return;
        if(includeHiddenItems && ((item.admin_only&&!this.hass?.user?.is_admin)||item.hide_mobile&&this._isMobile()))return;
        const key=routeKey(item.path)||'id:'+item.id;
        if(seen.has(key))return;
        seen.add(key);
        const dest=this.saved.item_groups[item.id]||groupId;
        const group=map.get(dest)||map.get(groupId);
        if(!group)return;
        if(this.saved.item_labels[item.id])item.label=this.saved.item_labels[item.id];
        if(this.saved.item_icons[item.id])item.icon=this.saved.item_icons[item.id];
        group.items.push(item);
      };
      for(const group of cfg.groups){for(const item of group.items)push(group.id,item,group.admin_only);}
      for(const link of this.saved.links){const id='persoonlijk-'+cleanId((link.group||'MIJN DASHBOARDS').toLowerCase());push(id,link);}
      if(cfg.discovery.enabled && this.hass?.panels){
        const ex=new Set(arr(cfg.discovery.exclude));const entries=[];
        for(const [key,info] of Object.entries(this.hass.panels)){
          const slug=info.url_path||key;
          if(ex.has(slug)||ex.has(key)||(!cfg.discovery.include_system_panels&&['profile','config','developer-tools','notifications','logbook','history','energy','map','media-browser'].includes(slug)))continue;
          entries.push({id:'auto-'+cleanId(slug),label:text(info.title||prettify(slug)),path:'/'+slug,
            icon:isSafeIcon(info.icon)?info.icon:'mdi:view-dashboard-outline',admin_only:!!info.require_admin});
        }
        entries.sort((a,b)=>a.label.localeCompare(b.label,'nl'));
        for(const item of entries)push('automatisch',item);
      }
      const itemOrder=this.saved.item_order;
      const result=[...map.values()];
      for(const group of result)group.items.sort((a,b)=>{
        const i=itemOrder.indexOf(a.id),j=itemOrder.indexOf(b.id);
        return i<0&&j<0?0:i<0?1:j<0?-1:i-j;
      });
      const sectionOrder=this.saved.section_order;
      result.sort((a,b)=>{
        const i=sectionOrder.indexOf(a.id),j=sectionOrder.indexOf(b.id);
        return i<0&&j<0?0:i<0?1:j<0?-1:i-j;
      });
      return result.filter(g=>(includeHiddenSections||g.visible)&&g.items.length);
    }
    _allItems(){return this._navData().flatMap(g=>g.items);}
    _menuSignatureValue(){
      const cfg=this._resolved();
      const panels=Object.entries(this.hass?.panels||{}).map(([id,p])=>id+':'+(p.url_path||'')+':'+(p.title||'')).sort();
      const cond=[...cfg.groups.flatMap(g=>g.items),...this.saved.links].filter(i=>i.visible_when?.entity)
        .map(i=>i.id+':'+i.visible_when.entity+'='+String(this.hass?.states?.[i.visible_when.entity]?.state||''));
      return JSON.stringify([this.hass?.user?.is_admin,panels,cond]);
    }
    _updateMenuIfChanged(){
      const signature=this._menuSignatureValue();
      if(this.lastMenuSignature!==signature){this.lastMenuSignature=signature;this._drawList();}
    }
    _updatesCount(){
      if(!this._resolved().appearance.show_update_count)return 0;
      const states=this.hass?.states;if(!states)return 0;
      const entities=this.hass?.entities;
      if(this._updatesCache?.states===states&&this._updatesCache?.entities===entities&&Date.now()-this._updatesCache.at<15000)return this._updatesCache.count;
      let count=0;
      for(const [k,v] of Object.entries(states))if(k.startsWith('update.')&&v.state==='on'&&!entities?.[k]?.hidden)count++;
      this._updatesCache={states,entities,count,at:Date.now()};
      return count;
    }
    redraw(){
      const cfg=this._resolved(),app=cfg.appearance;
      this._syncTheme();this._applyDesign();
      const hdr=this._header();this.setAttribute('data-header-mode',hdr.pala);this.setAttribute('data-ha-header',hdr.ha);
      this.setAttribute('data-hide-logo',String(!hdr.logo));this.setAttribute('data-header-recovery',String(hdr.ha==='hidden'&&hdr.pala==='hidden'));
      this._syncHaHeader();
      this.setAttribute('data-density',this.saved.density||(['normal','compact'].includes(app.density)?app.density:'compact'));
      this.head.replaceChildren();this.head.dataset.align=hdr.align;
      this.style.setProperty('--p-header-title-size',hdr.title_size+'px');
      this.style.setProperty('--p-header-subtitle-size',hdr.subtitle_size+'px');
      for(const [name,value] of [['title',hdr.title_color],['subtitle',hdr.subtitle_color],['extra',hdr.extra_color]]){
        const key='--p-header-'+name+'-color';if(value)this.style.setProperty(key,value);else this.style.removeProperty(key);
      }
      this.headerExtra.hidden=!hdr.extra;this._headerTicking=/\{[a-z0-9_]+\.[a-z0-9_]+(?:#[a-z0-9_-]+)?(?::(?:compact|days-hours|hours-minutes|clock))?\}/i.test([hdr.title,hdr.subtitle,hdr.extra].join(' '));
      for(const [name,value] of [['background',hdr.background_color],['logo-background',hdr.logo_bg],['logo-color',hdr.logo_color],['clock-color',hdr.clock_color]]){
        const key='--p-header-'+name;if(value)this.style.setProperty(key,value);else this.style.removeProperty(key);
      }
      const accountLogo=hdr.logo_mode!=='custom';
      const logo=$('button','logo');logo.type='button';
      if(accountLogo){
        logo.dataset.do='profile';logo.title='Mijn Home Assistant-profiel';
        logo.setAttribute('aria-label','Open Home Assistant-profiel');
        if(this.hass?.user){
          const badge=document.createElement('ha-user-badge');badge.user=this.hass.user;
          // Before HA upgrades its own custom element, show account initials.
          const name=String(this.hass.user.name||'').trim();const words=name.split(/\s+/).filter(Boolean);
          badge.textContent=(words.length>1?(words[0][0]+words[words.length-1][0]):name.slice(0,2)).toUpperCase()||'?';
          logo.append(badge);
        }
        else logo.textContent='◉';
      }else{
        logo.dataset.do='profile';logo.title='Mijn Home Assistant-profiel';
        logo.setAttribute('aria-label','Open Home Assistant-profiel');
        if(hdr.logo_icon)logo.append(this._icon(hdr.logo_icon,'◉'));
        else logo.textContent=hdr.logo_text||'P';
      }
      const brand=$('div','brand');brand.append($('strong',null,hdr.title||cfg.title),$('small',null,hdr.subtitle||cfg.subtitle));
      const settings=$('button','iconbtn top-settings');settings.type='button';settings.title='PalaSidebar instellingen';settings.dataset.do='settings';settings.append(this._icon('mdi:cog-outline','⚙'));
      if(hdr.ha==='hidden'&&this.integration==='native'){
        const toggle=$('button','iconbtn');toggle.type='button';toggle.title='Home Assistant-menu openen of sluiten';
        toggle.dataset.do='ha-menu';toggle.append(this._icon('mdi:menu','☰'));this.head.append(toggle);
      }
      this.head.append(logo,brand);
      if(hdr.pala==='app'){
        const toolbar=$('div','header-shortcuts');toolbar.setAttribute('aria-label','Snelle navigatie');
        const shortcuts=(this._mobile().dock_items||[]).map(id=>this._allItems().find(i=>i.id===id)).filter(i=>i?.path&&!i.admin_only).slice(0,3);
        for(const item of shortcuts){
          const b=$('button','iconbtn');b.type='button';b.title=item.label;
          b.dataset.do='header-route';b.dataset.id=item.id;b.append(this._icon(item.icon,'•'));toolbar.append(b);
        }
        this.head.append(toolbar);
      }
      const quick=$('button','iconbtn');quick.type='button';quick.title='Van alles · Dashboardkeuze';quick.setAttribute('aria-label','Van alles');quick.dataset.do='quick-open';quick.append(this._icon('mdi:view-dashboard','▦'));if(hdr.show_quick)this.head.append(quick);if(hdr.show_settings||this.saved.footer_config?.show_settings===false)this.head.append(settings);this._refreshHeaderText();
      this.launch.dataset.do='open';this.scrim.dataset.do='close';
      this.searchBox.hidden=app.show_search===false||this.saved.search_config.visible===false;
      this.searchInput.placeholder=this.saved.search_config.placeholder;
      this.clock.hidden=app.show_clock===false||!hdr.clock;
      this.banner.hidden=!this.error;this.banner.textContent=this.error;
      this._drawList();this._buildLiveCenter();this._agendaPaint();this._agendaMaybeFetch();this._drawHealth();this._drawFooter();this.refreshStatus();
    }
    _badgeTemplateLines(template,autoLines=true){
      const raw=text(template);
      if(!autoLines||raw.includes('\n'))return raw;
      // Old one-line F1 templates commonly contain "race_name | countdown".
      // Turn the delimiter into a true line break without modifying the saved template.
      const token=/\{[a-z0-9_]+\.[a-z0-9_]+(?:#[a-z0-9_-]{1,80})?(?::(?:auto|compact|days-hours|hours-minutes|clock|number))?\}/gi;
      const matches=[...raw.matchAll(token)];
      if(matches.length<2)return raw;
      let result=raw;
      for(let i=matches.length-1;i>=1;i--){
        const at=matches[i].index;
        const prefix=result.slice(0,at).replace(/[ \t]*(?:[|·•][ \t]*)?$/, '');
        result=prefix+'\n'+result.slice(at);
      }
      return result;
    }
    _formatTemplate(template){
      // Syntax: {sensor.f1#race_name} {sensor.f1:clock} or {sensor.f1#attribute:compact}.
      return text(template).replace(/\{([a-z0-9_]+\.[a-z0-9_]+)(?:#([a-z0-9_-]{1,80}))?(?::(auto|compact|days-hours|hours-minutes|clock|number))?\}/gi,
        (_token,entity,attribute='',format='auto')=>this._badgeValue({entity,attribute,format,live:format!=='auto',show:'available',decimals:1,max_chars:0})||'—');
    }
    _refreshHeaderText(){
      const hdr=this._header(),cfg=this._resolved();
      const brand=this.head.querySelector('.brand');
      const title=brand?.querySelector('strong'),sub=brand?.querySelector('small');
      const update=(el,v)=>{if(el&&el.textContent!==v)el.textContent=v;};
      update(title,this._formatTemplate(hdr.title||cfg.title));
      update(sub,this._formatTemplate(hdr.subtitle||cfg.subtitle));
      update(this.headerExtra,this._formatTemplate(hdr.extra));
    }
    _dynamicSource(entity,attribute=''){
      if(!entity)return null;
      const state=this.hass?.states?.[entity];if(!state)return null;
      const raw=attribute?state.attributes?.[attribute]:state.state;
      if(raw===undefined||raw===null||typeof raw==='object')return null;
      const value=String(raw).trim();
      if(!value || ['unknown','unavailable','none','null'].includes(value.toLowerCase()))return null;
      return value;
    }
    _itemDynamicTitle(item,prefs=this.saved.item_dynamic?.[item.id]){
      const raw=prefs?.title_entity?this._dynamicSource(prefs.title_entity,prefs.title_attribute):null;
      return raw?raw.slice(0,120):item.label;
    }
    _itemDynamicIcon(item,prefs=this.saved.item_dynamic?.[item.id]){
      const entity=prefs?.icon_entity;
      if(entity){
        const state=this.hass?.states?.[entity];
        if(state){
          const attr=prefs.icon_attribute||'auto';
          const values=attr==='auto'?[state.attributes?.icon,state.attributes?.entity_picture,state.state]:
            [attr==='state'?state.state:state.attributes?.[attr]];
          for(const raw of values){
            if(isSafeIcon(raw))return {kind:'mdi',value:raw};
            const picture=safeEntityPicture(raw);
            if(picture)return {kind:'picture',value:picture};
            const emoji=safeSensorEmoji(raw);
            if(emoji)return {kind:'emoji',value:emoji};
          }
        }
      }
      return {kind:'mdi',value:item.icon};
    }
    _drawDynamicIcon(holder,chosen,force=false){
      if(!holder)return;
      const key=chosen.kind+':'+chosen.value;
      if(!force&&holder.dataset.entityIcon===key)return;
      if(!holder.dataset.fallbackIcon){
        const original=holder.querySelector('ha-icon')?.getAttribute('icon');
        holder.dataset.fallbackIcon=isSafeIcon(original)?original:'mdi:image-outline';
      }
      holder.dataset.entityIcon=key;
      if(chosen.kind==='picture'){
        // A valid /local/ image can open in a tab while an old 404 response
        // remains cached for the <img> in the sidebar. Versioning only local
        // pictures forces one fresh request per release, not per HA update.
        const imageUrl=value=>value.startsWith('/local/')
          ? value+(value.includes('?')?'&':'?')+'v='+VERSION : value;
        const pic=$('img','pala-sensor-picture');
        pic.alt='';pic.decoding='async';pic.loading='eager';
        let triedPng=false;
        pic.addEventListener('error',()=>{
          if(!pic.isConnected||holder.dataset.entityIcon!==key)return;
          // PNG is an optional fallback if an older Android WebView rejects SVG.
          if(!triedPng && /\.svg(?:[?#]|$)/i.test(chosen.value)){
            triedPng=true;
            pic.src=imageUrl(chosen.value.replace(/\.svg(?=[?#]|$)/i,'.png'));
            return;
          }
          // Never leave a browser broken-image symbol in the navigation.
          const fallback=this._icon(holder.dataset.fallbackIcon,'◈');
          holder.replaceChildren(...fallback.childNodes);
        });
        holder.replaceChildren(pic);
        pic.src=imageUrl(chosen.value);
      }else if(chosen.kind==='emoji'){
        holder.replaceChildren($('span','pala-sensor-emoji',chosen.value));
      }else{
        const icon=this._icon(chosen.value,'◈');holder.replaceChildren(...icon.childNodes);
      }
    }
    _refreshDynamicItems(){
      for(const {link,item} of this._activeDynamicItems||[]){
        if(!link.isConnected)continue;
        const label=link.querySelector('.nav-label');
        const title=this._itemDynamicTitle(item);
        if(label&&label.textContent!==title)label.textContent=title;
        if(link.title!==title)link.title=title;
        if(link.getAttribute('aria-label')!==title)link.setAttribute('aria-label',title);
        this._drawDynamicIcon(link.querySelector('.ico'),this._itemDynamicIcon(item));
      }
    }
    // Shared section factory: no visually separate arrow or header implementation.
    // Normal navigation sections and Live Control Center call this exact method.
    _makeSectionHeader(title,command,collapsed,id=''){
      const header=$('div','group-title');
      const toggle=$('button','group-toggle');
      toggle.type='button';toggle.dataset.do=command;
      if(id)toggle.dataset.id=id;
      toggle.setAttribute('aria-expanded',String(!collapsed));
      toggle.append($('span',null,title),makeChevron('group-chevron'));
      header.append(toggle);
      return {header,toggle};
    }
    _drawList(){
      const cfg=this._resolved(),query=this.search.toLocaleLowerCase('nl').trim(),base=this._navData(),byId=new Map(base.flatMap(g=>g.items.map(i=>[i.id,i])));
      const definitions=this._sectionDefinitions(),visibility=id=>definitions.find(g=>g.id===id)?.visible!==false;
      const rows=[],promoted=new Set();
      const favdef=definitions.find(g=>g.id==='favorieten'),recentdef=definitions.find(g=>g.id==='recent');
      if(!query && cfg.appearance.show_favorites!==false && visibility('favorieten')){
        const items=this.saved.favorites.map(id=>byId.get(id)).filter(Boolean);
        if(items.length){rows.push({id:'favorieten',title:favdef?.title||'★ FAVORIETEN',items});items.forEach(i=>promoted.add(i.id));}
      }
      if(!query && cfg.appearance.show_recent!==false && visibility('recent')){
        const items=this.saved.recent.slice(0,5).map(id=>byId.get(id)).filter(Boolean).filter(i=>!promoted.has(i.id));
        if(items.length){rows.push({id:'recent',title:recentdef?.title||'RECENT',items});items.forEach(i=>promoted.add(i.id));}
      }
      const suppressDuplicates=!(this.saved.repeat_recent===true);
      for(const group of base){
        const items=suppressDuplicates&&!query?group.items.filter(i=>!promoted.has(i.id)):group.items;
        if(items.length)rows.push({...group,items});
      }
      const sectionOrder=this.saved.section_order;
      rows.sort((a,b)=>{
        const i=sectionOrder.indexOf(a.id),j=sectionOrder.indexOf(b.id);
        return i<0&&j<0?0:i<0?1:j<0?-1:i-j;
      });
      // Preserve a pending hold across benign list redraws; the timer checks
      // that an item with the same ID is still present before opening.
      this.list.replaceChildren();
      if(this.saved.show_quick_link && (!query||'van alles dashboards'.includes(query))){
        const all=$('button','nav-link quick-open');all.type='button';all.dataset.do='quick-open';
        all.setAttribute('aria-label','Van alles · dashboards');all.title='Van alles · dashboards';
        all.append(this._icon('mdi:view-dashboard','▦'),$('span','nav-label','Van alles · dashboards'));
        this.list.append(all);
      }
      let count=0;
      for(const group of rows){
        const filtered=group.items.filter(i=>!query||(i.label+' '+this._itemDynamicTitle(i)+' '+i.path).toLocaleLowerCase('nl').includes(query));if(!filtered.length)continue;
        const collapsed=this.saved.closed.includes(group.id)&&!query;
        const {header}=this._makeSectionHeader(group.title,'group',collapsed,group.id);
        this.list.append(header);
        // Keep section rows mounted even when collapsed. The grid track
        // smoothly collapses to zero without disconnecting/recreating badges.
        const body=$('div','group-content');body.dataset.collapsed=String(collapsed);
        body.setAttribute('aria-hidden',String(collapsed));body.inert=collapsed;
        const inner=$('div','group-content-inner');
        for(const item of filtered){inner.append(this._renderLink(item));count++;}
        body.append(inner);this.list.append(body);
      }
      if(count===0&&query)this.list.append($('div','empty','Geen menuonderdelen gevonden.'));
      else if(count===0 && !rows.length)this.list.append($('div','empty','Geen menuonderdelen beschikbaar.'));
      this._perf.listDraws++;this._perf.lastListRows=count;
      this.lastMenuSignature=this._menuSignatureValue();
      // Alleen verwijzingen vernieuwen bij structurele wijzigingen; sensorupdates werken in-place.
      this._activeDynamicItems=[...this.list.querySelectorAll('.nav-row .nav-link')].map(link=>({
        link,item:byId.get(link.dataset.id)
      })).filter(entry=>!!entry.item && !!this.saved.item_dynamic?.[entry.item.id]);
      this._refreshDynamicItems();
      // Rebuild references only when the navigation structure actually changes.
      this._activeBadges=[...this.list.querySelectorAll('[data-item-badge]')].map(node=>{
        const item=byId.get(node.dataset.itemBadge);
        return {node,spec:item?this._badgeForItem(item):null};
      });
      // Countdown badges need the one-second clock; other badges are driven
      // by HA state changes. Rebuild this index ONLY when menu rows change.
      this._activeTickBadges=this._activeBadges.filter(({spec})=>
        (spec?.entity&&!spec.attribute&&/countdown/i.test(spec.entity)) ||
        (spec?.template&&/countdown|:(?:clock|compact|days-hours|hours-minutes)/i.test(spec.template)));
      this._markRoute();this._refreshBadges();
    }
    _actionForItem(item){return own(this.saved.action_overrides,item.id)?this.saved.action_overrides[item.id]:item.action;}
    _badgeForItem(item){return own(this.saved.badge_overrides,item.id)?this.saved.badge_overrides[item.id]:item.badge;}
    _renderLink(item){
      const row=$('div','nav-row');row.dataset.path=item.path;row.dataset.id=item.id;
      const action=this._actionForItem(item);
      const link=$((item.path && (!action||action.type==='navigate'))?'a':'button','nav-link');
      link.dataset.do='route';link.dataset.id=item.id;link.title=item.label;link.setAttribute('aria-label',item.label);
      if(link.localName==='a'){
        link.href=action?.type==='navigate'?action.path:item.path;
        if(pathIsExternal(link.href)){link.target='_blank';link.rel='noopener noreferrer';}
      }else link.type='button';
      const glyph=/^(home|auto-)/.test(item.id)?'⌂':'◈';
      link.append(this._icon(item.icon,glyph),$('span','nav-label',item.label));
      const badge=$('span','badge');badge.dataset.itemBadge=item.id;if(this._badgeForItem(item)==='updates')badge.dataset.badge='updates';badge.hidden=true;link.append(badge);
      // No permanent favorite star: the whole right side is reserved for badges.
      // Touch long-press, desktop context menu and Shift+F10 open favorite actions.
      row.append(link);return row;
    }
    _markRoute(){
      const pathname=location.pathname.replace(/\/$/,'')||'/';
      const rows=[...this.list.querySelectorAll('.nav-row')];
      const candidate=rows.filter(n=>{const p=n.dataset.path;if(!p||pathIsExternal(p))return false;const url=new URL(p,location.origin==='null'?'http://localhost':location.origin);return pathname===url.pathname.replace(/\/$/,'')||pathname.startsWith(url.pathname.replace(/\/$/,'')+'/');})
        .sort((a,b)=>b.dataset.path.length-a.dataset.path.length)[0];
      for(const row of rows){const active=row===candidate;row.classList.toggle('active',active);const a=row.querySelector('.nav-link');if(a){if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}}
    }
    _badgeValue(spec){
      if(spec==='updates'){
        const v=this._updatesCount();return v?String(v>99?'99+':v):'';
      }
      if(!spec)return '';
      // Kies uitsluitend de badgebron voor de actuele warmtepompstand.
      // Geen timers, geen heropbouw en geen extra Home Assistant-templatesensoren.
      if(spec.switch_entity && spec.switch_cases?.length){
        const stand=this._dynamicSource(spec.switch_entity);
        const row=stand && spec.switch_cases.find(rule=>rule.state.toLocaleUpperCase('nl')===stand.toLocaleUpperCase('nl'));
        if(row){
          if(row.entity)return this._badgeValue({...spec,entity:row.entity,attribute:'',template:'',
            switch_entity:'',switch_cases:[],prefix:(spec.prefix||'')+(row.prefix?row.prefix+' ':'')});
          return String(row.text||'').slice(0,90);
        }
      }
      if(spec.template){const rendered=this._formatTemplate(this._badgeTemplateLines(spec.template,spec.auto_lines!==false));
        return rendered.slice(0,clamp(Number(spec.max_chars)||500,1,500));}
      if(!spec.entity)return '';
      const state=this.hass?.states?.[spec.entity];if(!state)return '';
      const source=spec.attribute?state.attributes?.[spec.attribute]:state.state;
      const raw=!spec.attribute && (spec.live===true || /countdown/i.test(spec.entity))
        ?this._liveCountdown(spec.entity,source,state):source;
      if(raw===undefined||raw===null||['unavailable','unknown'].includes(String(raw)))return '';
      const n=Number(raw),on=String(raw).toLowerCase()==='on';
      if(spec.show==='on'&&!on)return '';
      if(spec.show==='nonzero'&&(!Number.isFinite(n)||n<=0))return '';
      let value;
      if(typeof raw==='object'){
        try{value=JSON.stringify(raw)}catch{value='—';}
      }else value=String(raw);
      if(value==='on')value='Aan';else if(value==='off')value='Uit';
      if(typeof raw==='number'&&!Number.isInteger(raw))value=raw.toLocaleString('nl-NL',{maximumFractionDigits:1});
      const countdown=/^\s*(?:(\d+)\s*d\s*)?(?:(\d+)\s*h\s*)?(?:(\d+)\s*m\s*)?(?:(\d+)\s*s)\s*$/i.exec(value);
      if(countdown && ['compact','days-hours','hours-minutes','clock'].includes(spec.format)){
        const d=Number(countdown[1]||0),h=Number(countdown[2]||0),m=Number(countdown[3]||0),sec=Number(countdown[4]||0);
        const pad=n=>String(n).padStart(2,'0');
        if(spec.format==='days-hours')value=`${d}d ${h}h`;
        else if(spec.format==='hours-minutes')value=`${d*24+h}h ${m}m`;
        else if(spec.format==='clock')value=(d?`${d}d `:'')+`${pad(h)}:${pad(m)}:${pad(sec)}`;
        else value=d?`${d}d ${h}h`:h?`${h}h ${m}m`:`${m}m ${sec}s`;
      }else if(spec.format==='number' && Number.isFinite(Number(raw)) && String(raw).trim()!==''){
        value=Number(raw).toLocaleString('nl-NL',{minimumFractionDigits:0,maximumFractionDigits:clamp(Number(spec.decimals??1),0,3)});
      }
      let result=String(spec.prefix||'')+value+String(spec.suffix||'');
      const max=clamp(Number(spec.max_chars)||0,0,60);
      if(max>0 && result.length>max)result=result.slice(0,Math.max(1,max-1))+'…';
      return result.slice(0,90);
    }
    _liveCountdown(id,raw,state){
      if(typeof raw!=='string')return raw;
      // Only interpret plain countdown tokens; leave HA's other templates intact.
      const match=/^\s*(?:(\d+)\s*d\s*)?(?:(\d+)\s*h\s*)?(?:(\d+)\s*m\s*)?(?:(\d+)\s*s)\s*$/i.exec(raw);
      if(!match)return raw;
      if(!this._countdownCache)this._countdownCache=new Map();
      let entry=this._countdownCache.get(id);
      if(!entry||entry.raw!==raw){
        const observed=Date.parse(state.last_changed||state.last_updated||'');
        const since=Number.isFinite(observed)&&Math.abs(Date.now()-observed)<120000?observed:Date.now();
        entry={raw,seenAt:since};this._countdownCache.set(id,entry);
      }
      const starting=(Number(match[1]||0)*86400)+(Number(match[2]||0)*3600)+(Number(match[3]||0)*60)+Number(match[4]||0);
      const elapsed=Math.max(0,Math.min(600,Math.floor((Date.now()-entry.seenAt)/1000)));
      let left=Math.max(0,starting-elapsed);
      const d=Math.floor(left/86400);left%=86400;
      const h=Math.floor(left/3600);left%=3600;
      const m=Math.floor(left/60),secs=left%60;
      return `${d}d ${h}h ${m}m ${secs}s`;
    }
    _refreshBadges(tickOnly=false){
      // No full badge scan every second. Normal badges refresh on state updates;
      // countdowns alone use the precomputed one-second index.
      for(const {node,spec} of (tickOnly?this._activeTickBadges:this._activeBadges)||[]){
        const v=this._badgeValue(spec);
        const hidden=!v;if(node.hidden!==hidden)node.hidden=hidden;
        if(v!==node.textContent)node.textContent=v;
        const multiline=String(v.includes('\n'));
        if(node.dataset.multiline!==multiline)node.dataset.multiline=multiline;
        if(node.title!==v)node.title=v;
        const color=spec&&typeof spec==='object'?spec.color:'accent';
        if(node.dataset.color!==color)node.dataset.color=color;
        const style=spec&&typeof spec==='object'?spec.style||'solid':'solid';
        const size=spec&&typeof spec==='object'?spec.size||'normal':'normal';
        const layout=spec&&typeof spec==='object'?spec.layout||'right':'right';
        if(node.dataset.style!==style)node.dataset.style=style;
        if(node.dataset.size!==size)node.dataset.size=size;
        if(node.parentElement?.dataset.badgeLayout!==layout)node.parentElement.dataset.badgeLayout=layout;
        if(color==='sensor'||color==='custom'){
          const current=badgeColor(spec,this.hass?.states);
          if(current){
            if(node.style.getPropertyValue('--p-badge-color')!==current)node.style.setProperty('--p-badge-color',current);
            const labelColour=readableBadgeText(current);
            if(node.style.getPropertyValue('--p-badge-text')!==labelColour)node.style.setProperty('--p-badge-text',labelColour);
          }else{
            if(node.style.getPropertyValue('--p-badge-color'))node.style.removeProperty('--p-badge-color');
            if(node.style.getPropertyValue('--p-badge-text'))node.style.removeProperty('--p-badge-text');
          }
        }else{
          if(node.style.getPropertyValue('--p-badge-color'))node.style.removeProperty('--p-badge-color');
          if(node.style.getPropertyValue('--p-badge-text'))node.style.removeProperty('--p-badge-text');
        }
        const link=node.parentElement;
        const label=link?.querySelector('.nav-label'), icon=link?.querySelector('.ico');
        const named={success:'#4ade80',warning:'#fbbf24',danger:'#f87171'};
        const tint=(color==='sensor'||color==='custom')?(node.style.getPropertyValue('--p-badge-color')||'var(--p-accent)'):named[color]||'var(--p-accent)';
        const syncTint=(element,enabled,property)=>{
          if(!element)return;
          const active=!!enabled && !hidden;
          if(element.dataset.dynamicColor!==String(active))element.dataset.dynamicColor=String(active);
          if(active){
            if(element.style.getPropertyValue(property)!==tint)element.style.setProperty(property,tint);
          }else if(element.style.getPropertyValue(property))element.style.removeProperty(property);
        };
        syncTint(label,spec?.label_color_from_badge,'--p-label-color');
        syncTint(icon,spec?.icon_color_from_badge,'--p-icon-color');
        if(node.getAttribute('aria-label')!==v)node.setAttribute('aria-label',v);
      }
    }
    _healthDisplay(ent){
      // Delegate to the same tested dynamic resolvers as ordinary menu items.
      // The status value still belongs to ent.entity_id; other sources only
      // influence the visible title/icon, never which HA entity is opened.
      const base={label:ent.label,icon:ent.icon};
      return {
        label:this._itemDynamicTitle(base,{title_entity:ent.title_entity,title_attribute:ent.title_attribute}),
        icon:this._itemDynamicIcon(base,{icon_entity:ent.icon_entity,icon_attribute:ent.icon_attribute})
      };
    }
    _refreshHealthDisplay(){
      for(const btn of this.health.querySelectorAll('button.entity[data-entity]')){
        const ent=(this.saved.quick_entities??this._resolved().quick_entities).find(e=>e.entity_id===btn.dataset.entity);
        if(!ent)continue;
        const display=this._healthDisplay(ent);
        const name=btn.querySelector('.health-label');
        if(name && name.textContent!==display.label)name.textContent=display.label;
        if(btn.title!==display.label)btn.title=display.label;
        this._drawDynamicIcon(btn.querySelector('.health-icon'),display.icon);
      }
    }
    _drawHealth(){
      const entities=this.saved.quick_entities??this._resolved().quick_entities;
      this.health.replaceChildren();this.health.hidden=!entities.length;
      if(!entities.length)return;
      this.health.append($('div','health-title','LIVE STATUS'));
      for(const ent of entities){
        const btn=$('button','entity');btn.type='button';btn.dataset.do='entity';btn.dataset.entity=ent.entity_id;
        const picture=this._icon(ent.icon,'●');picture.classList.add('health-icon');
        const label=$('span','health-label',ent.label);
        btn.append(picture,label);
        const val=$('span','value');val.dataset.state=ent.entity_id;val.textContent='—';btn.append(val);
        this.health.append(btn);
      }
      this._refreshHealthDisplay();
    }
    _requestHARestart(){
      // Never trust only the visible button or a client-side preference for privileges.
      // HA enforces administrator permissions when homeassistant.restart is called.
      if(this._restartBusy || this.saved?.footer_config?.show_restart===false)return;
      if(this.hass?.user?.is_admin!==true){alert('Alleen Home Assistant-beheerders mogen Home Assistant herstarten.');return;}
      if(typeof this.hass?.callService!=='function'){
        alert('Home Assistant is momenteel niet verbonden.');return;
      }
      if(!confirm('Home Assistant echt herstarten?\n\nActieve automatiseringen en scripts worden onderbroken. Je Home Assistant is tijdelijk niet beschikbaar.'))return;
      this._restartBusy=true;
      const button=this.footer?.querySelector('[data-do="ha-restart"]');
      if(button){button.disabled=true;button.title='Herstart aangevraagd';}
      Promise.resolve().then(()=>this.hass.callService('homeassistant','restart'))
        .then(()=>{
          // The server will disconnect; avoid a second accidental restart.
          if(button?.isConnected){button.title='Herstart aangevraagd';button.setAttribute('aria-label','Home Assistant wordt herstart');}
        })
        .catch(err=>{
          this._restartBusy=false;
          if(button?.isConnected){button.disabled=false;button.title='Home Assistant herstarten';}
          alert('Herstart niet uitgevoerd: '+(err?.message||String(err)));
        });
    }
    _drawFooter(){
      const fc=this.saved.footer_config;this.footer.replaceChildren();
      // Administrator only, opt-out per HA account. Keep out of HA's native footer.
      if(fc.show_restart!==false && this.hass?.user?.is_admin===true){
        const restart=$('button','pala-restart');restart.type='button';
        restart.dataset.do='ha-restart';restart.title='Home Assistant herstarten';
        restart.setAttribute('aria-label','Home Assistant herstarten');
        restart.append(this._icon('mdi:restart','↻'),$('span','pala-restart-label','Home Assistant herstarten'));
        restart.disabled=!!this._restartBusy;
        this.footer.append(restart);
      }
      if(fc.show_settings){const prefs=$('button','iconbtn');prefs.type='button';prefs.title='PalaSidebar-instellingen';prefs.dataset.do='settings';prefs.append(this._icon('mdi:tune-variant','⚙'));this.footer.append(prefs);}
      if(fc.link){const item=this._allItems().find(i=>i.id===fc.link);if(item){const link=$('button','iconbtn');link.type='button';link.title=item.label;link.dataset.do='footer-route';link.dataset.id=item.id;link.append(this._icon(item.icon,'▦'));this.footer.append(link);}}
      if(fc.show_version)this.footer.append($('span','footlabel','PalaSidebar '+VERSION));
      if(fc.show_status){const right=$('span','right');right.append(this._icon('mdi:shield-check-outline','✓'));this.footer.append(right);}
      this.footer.hidden=!this.footer.children.length;
      this._syncNativeFooter();
    }
    _restoreNativeFooter(){
      if(!this._haFooterStyles)return;
      for(const [node,[value,priority]] of this._haFooterStyles){
        if(!node.isConnected)continue;
        value?node.style.setProperty('display',value,priority):node.style.removeProperty('display');
      }
      this._haFooterStyles.clear();
    }
    _syncNativeFooter(){
      // This method is also called after a settings edit or native DOM change:
      // it must honor those calls immediately. Throttle ONLY the periodic
      // health check in ensure(), never the actual footer-update operation.
      this._footerLastScan=Date.now();
      this._footerLastNative=this.native;
      // Limit modification to known native footer anchors; restore our own styles
      // when settings change. Never hide the native sidebar itself.
      const native=this.integration==='native'?this._drawer():null;if(!native?.shadowRoot)return;
      if(!this._haFooterStyles)this._haFooterStyles=new Map();
      const fc=this.saved.footer_config;
      if(fc.ha_settings&&fc.ha_notifications&&fc.ha_profile&&!this._haFooterStyles.size)return;
      const visibility={'/config':fc.ha_settings,'/notifications':fc.ha_notifications,'/profile':fc.ha_profile};
      const found=[];const visit=(root,depth=0)=>{
        if(!root?.querySelectorAll||depth>3)return;
        for(const element of root.querySelectorAll('a[href]'))found.push(element);
        for(const element of root.querySelectorAll('*'))if(element.shadowRoot)visit(element.shadowRoot,depth+1);
      };
      visit(native.shadowRoot);
      for(const anchor of found){
        const href=anchor.getAttribute('href');let path='';
        try{path=href?.startsWith('/')&&!href.startsWith('//')?href.split(/[?#]/)[0]:(new URL(href,location.href)).pathname;path=path.replace(/\/+$/,'')||'/';}catch{continue;}
        if(!Object.prototype.hasOwnProperty.call(visibility,path))continue;
        const node=anchor.closest('ha-list-item-button,ha-list-item-base')||anchor;
        if(!this._haFooterStyles.has(node))this._haFooterStyles.set(node,[node.style.getPropertyValue('display'),node.style.getPropertyPriority('display')]);
        if(visibility[path]===false)node.style.setProperty('display','none','important');
        else{const [value,priority]=this._haFooterStyles.get(node);value?node.style.setProperty('display',value,priority):node.style.removeProperty('display');this._haFooterStyles.delete(node);}
      }
      for(const [node,original] of this._haFooterStyles){
        if(node.isConnected)continue;
        this._haFooterStyles.delete(node);
      }
    }
    refreshStatus(){
      const started=performance.now();
      // Preserve the update-count cache (max 15s). HA normally supplies a new
      // states object on changes; the TTL covers in-place mutations. Clearing
      // it on every 3s status tick unnecessarily scanned ALL entities.
      const now=new Date(),app=this._resolved().appearance;
      if(!this._clockFormatter)this._clockFormatter=new Intl.DateTimeFormat('nl-NL',{weekday:'long',hour:'2-digit',minute:'2-digit'});
      const clock=app.show_clock===false?'':this._clockFormatter.format(now);
      if(this.clock.textContent!==clock)this.clock.textContent=clock;
      for(const node of this.health.querySelectorAll('[data-state]')){
        const state=this.hass?.states?.[node.dataset.state];const next=relativeLabel(state);if(node.textContent!==next)node.textContent=next;
      }
      this._refreshHealthDisplay();
      this._refreshLiveCenter();
      this._agendaMaybeFetch();
      this._agendaPaint();
      this._updateMenuIfChanged();this._refreshDynamicItems();this._refreshBadges();this._refreshHeaderText();
      // Active route only changes with navigation (or a structural redraw,
      // which already calls _markRoute). Skip repeated DOM scans every 3s.
      if(this._lastCheckedRoute!==location.pathname){
        this._lastCheckedRoute=location.pathname;
        this._markRoute();
      }
      this._syncTheme();this._syncMobile();
      if(this.dialog?.open && this.editorTab==='badges')this._previewBadge();
      const haVersion=text(this.hass?.config?.version);
      if(haVersion){
        const versionKey=KEY+':last-ha-version';
        const previous=safeGet(versionKey);
        if(previous && previous!==haVersion && !this.versionNotified){
          this.versionNotified=true;
          this.banner.textContent='Home Assistant bijgewerkt van '+previous+' naar '+haVersion+'. Sidebar-koppeling opnieuw gecontroleerd.';
          this.banner.hidden=false;
        }
        if(previous!==haVersion)safeSet(versionKey,haVersion);
        this.lastVersion=haVersion;
      }
      this._lastFullRefreshAt=Date.now();
      this._perf.fullRefreshes++;
      this._perf.lastRefreshMs=Number((performance.now()-started).toFixed(1));
      if(this.saved.performance_center?.enabled){const a=this._perf.samples;a.push(this._perf.lastRefreshMs);if(a.length>120)a.shift();}
      if(this.dialog?.open&&this.editorTab==='performance')this._fillPerformance();
    }
    _runAction(action){
      if(!action)return;
      if(action.type==='navigate'){this._navigate(action.path);return;}
      if(action.type==='more-info'){
        this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:action.entity},bubbles:true,composed:true}));return;
      }
      if(action.type==='dialog'){this._openActionDialog(action);return;}
      if(action.type==='toggle'||action.type==='service'){
        if(!this.hass?.callService){alert('Home Assistant is niet verbonden.');return;}
        if(action.type==='service' && !confirm('Service uitvoeren: '+action.domain+'.'+action.service+' voor '+action.entity+'?'))return;
        const domain=action.type==='toggle'?'homeassistant':action.domain;
        const service=action.type==='toggle'?'toggle':action.service;
        Promise.resolve().then(()=>this.hass.callService(domain,service,{entity_id:action.entity}))
          .catch(err=>alert('Actie niet uitgevoerd: '+(err?.message||err)));
      }
    }
    _openActionDialog(action){
      const pane=$('div','dialog-content');pane.append($('h2',null,action.title||'Informatie'));
      if(action.message)pane.append($('p','popup-message',action.message));
      if(action.entity){
        const state=this.hass?.states?.[action.entity];
        pane.append($('p',null,(state?.attributes?.friendly_name||action.entity)+' · '+relativeLabel(state)));
        const more=this._button('Meer informatie','entity');more.dataset.entity=action.entity;pane.append(more);
      }
      pane.append(this._button('Sluiten','action-close'));
      this.actionDialog.replaceChildren(pane);
      if(!this.actionDialog.open)this._openOwnedDialog(this.actionDialog,'action');
    }

    // Built with the SAME section, menu row and badge components as the
    // existing sidebar. No independent card, background, chevron or animation.
    _buildLiveCenter(){
      const cfg=cleanLiveCenter(this.saved.live_center);
      this.liveCenter.hidden=!cfg.enabled;
      this.liveCenter.replaceChildren();this._liveTiles=[];this._liveGrid=null;
      if(!cfg.enabled)return;
      const {header,toggle}=this._makeSectionHeader('LIVE CONTROL CENTER','v2-live-collapse',cfg.collapsed);
      const body=$('div','group-content'),inner=$('div','group-content-inner');
      for(const tile of cfg.tiles){
        const row=$('div','nav-row');
        const button=$('button','nav-link');button.type='button';
        button.dataset.do='v2-live-more';button.dataset.entity=tile.entity;
        button.title=tile.label||tile.entity;
        const label=$('span','nav-label',tile.label||tile.entity),value=$('span','badge','—');
        button.append(this._icon(tile.icon,'◈'),label,value);
        row.append(button);inner.append(row);
        this._liveTiles.push({button,val:value,entity:tile.entity});
      }
      if(!cfg.tiles.length)inner.append($('div','empty','Voeg sensoren toe via Instellingen → Control Center.'));
      body.append(inner);this.liveCenter.append(header,body);
      this._liveGrid=inner;this._setLiveCenterCollapsed(cfg.collapsed,false);
      this._refreshLiveCenter();
    }
    _setLiveCenterCollapsed(collapsed,persist=true){
      const v=!!collapsed;
      if(!this.liveCenter)return;
      this.liveCenter.dataset.collapsed=String(v);
      const header=this.liveCenter.querySelector('.group-toggle');
      const body=this.liveCenter.querySelector('.group-content');
      if(header){header.setAttribute('aria-expanded',String(!v));header.setAttribute('aria-label',v?'Live Control Center uitklappen':'Live Control Center inklappen');}
      if(body){body.dataset.collapsed=String(v);body.setAttribute('aria-hidden',String(v));body.inert=v;}
      if(persist){
        this.saved.live_center=cleanLiveCenter({...this.saved.live_center,collapsed:v});
        this._saveSettings();
        if(!v)this._refreshLiveCenter();
      }
    }
    _refreshLiveCenter(){
      if(this.liveCenter?.hidden||this.saved.live_center?.collapsed||!this._liveTiles?.length)return;
      for(const tile of this._liveTiles){
        const state=this.hass?.states?.[tile.entity],value=relativeLabel(state),offline=!state||['unknown','unavailable'].includes(state.state);
        if(tile.val.textContent!==value)tile.val.textContent=value;
        tile.button.dataset.offline=String(offline);
        const color=offline?'#64748b':sensorColor(state.state)||(state.state==='on'?'#22c55e':state.state==='off'?'#64748b':'');
        // Optional state colour uses exactly the SAME badge styling and
        // contrast calculation as normal navigation badges.
        if(color){
          tile.val.dataset.color='custom';
          tile.val.style.setProperty('--p-badge-color',color);
          tile.val.style.setProperty('--p-badge-text',readableBadgeText(color));
        }else{
          delete tile.val.dataset.color;
          tile.val.style.removeProperty('--p-badge-color');tile.val.style.removeProperty('--p-badge-text');
        }
        const title=(state?.attributes?.friendly_name||tile.entity)+' · '+(offline?'Niet beschikbaar':value);
        if(tile.button.title!==title)tile.button.title=title;
      }
    }
    _liveCenterEditor(page){
      const cfg=cleanLiveCenter(this.saved.live_center);
      page.append($('h3',null,'Live Control Center'),$('p',null,'Compacte live tegels onder de zoekbalk. Je kiest zelf de sensoren; er worden geen nieuwe HA-aanvragen gedaan.'));
      const toggle=$('label','check'),box=$('input');box.type='checkbox';box.id='pala-v2-live-enabled';box.checked=cfg.enabled;
      toggle.append(box,$('span',null,'Live Control Center inschakelen'));page.append(toggle);
      page.append($('p','pala-v2-caption','Maximaal 6 tegels. Lege regels worden overgeslagen. Tik voor meer informatie of een bestaande aan/uit-schakelaar. Acties respecteren Home Assistant-rechten.'));
      for(let i=0;i<6;i++){
        const t=cfg.tiles[i]||{label:'',entity:'',icon:'mdi:information-outline',action:'more-info'};
        const group=$('div','pala-v2-editor-row');group.append($('strong',null,'Tegel '+(i+1)));
        group.append(this._formField('Naam','pala-v2-live-label-'+i,t.label));
        group.append(this._entityField('Entiteit','pala-v2-live-entity-'+i,t.entity));
        group.append(this._formField('Icoon (mdi:...)','pala-v2-live-icon-'+i,t.icon));
        group.append(this._formField('Tikactie','pala-v2-live-action-'+i,t.action||'more-info', [['more-info','Meer informatie'],['toggle','Schakelaar omzetten']]));page.append(group);
      }
      const controls=$('div','btnrow');controls.append(this._button('Control Center opslaan','v2-live-save','primary'));
      page.append(controls);
    }
    _saveLiveCenter(){
      const q=id=>this.dialog.querySelector('#pala-v2-live-'+id);
      const tiles=[];
      for(let i=0;i<6;i++){
        const raw=q('entity-'+i)?.value?.trim()||'';
        if(!raw)continue;
        if(!isEntity(raw)){this._editorNotice('Ongeldige entiteit bij tegel '+(i+1)+'.');return;}
        tiles.push({label:q('label-'+i)?.value||'',entity:raw,icon:q('icon-'+i)?.value||'',action:q('action-'+i)?.value||'more-info'});
      }
      this.saved.live_center=cleanLiveCenter({enabled:q('enabled')?.checked,collapsed:this.saved.live_center?.collapsed,tiles});
      this._saveSettings();this._buildLiveCenter();this._editorNotice('Live Control Center opgeslagen.');
    }
    _contextMenuEditor(page){
      page.append($('h3',null,'Long-press snelmenu 2.0'),$('p',null,'Houd een menu-item, sectie of live-tegel ingedrukt (550 ms), of klik met rechts. Gewoon tikken en swipen blijven werken.'));
      const row=$('label','check'),cb=$('input');cb.type='checkbox';cb.id='pala-v2-menu-enabled';cb.checked=this.saved.context_menu?.enabled===true;
      row.append(cb,$('span',null,'Uitgebreid snelmenu inschakelen'));page.append(row,this._button('Snelmenu-instelling opslaan','v2-menu-save','primary'));
      page.append($('p','pala-v2-caption','Uitgeschakeld blijft het bestaande favorietenmenu actief. De bestaande lang-indruktijd en swipe-afbreking blijven behouden.'));
    }
    _performanceSnapshot(){
      const p=this._perf,s=[...p.samples].sort((a,b)=>a-b);
      const mean=s.length?Math.round(s.reduce((a,b)=>a+b,0)*10/s.length)/10:null;
      const p95=s.length?s[Math.min(s.length-1,Math.ceil(s.length*.95)-1)]:null;
      return {samples:s.length,mean,p95,last:p.lastRefreshMs,live:p.liveUpdates,full:p.fullRefreshes,draws:p.listDraws,rows:p.lastListRows,
        badges:this._activeBadges?.length||0,tiles:this._liveTiles?.length||0,lag:p.lastStateAt?Math.round((Date.now()-p.lastStateAt)/1000):null};
    }
    _performanceEditor(page){
      page.append($('h3',null,'Performance Center'),$('p',null,'Echte frontendmetingen van deze browser, geen geschatte tablet-RAM of Home Assistant-serverbelasting.'));
      const toggle=$('label','check'),input=$('input');input.type='checkbox';input.id='pala-v2-perf-enabled';input.checked=this.saved.performance_center?.enabled===true;
      toggle.append(input,$('span',null,'Update-tijden verzamelen (maximaal 120)'));page.append(toggle);
      page.append(this._formField('Profiel voor weeranimaties','pala-v2-perf-profile',this.saved.performance_center?.profile||'full', [['full','Volledig · ongewijzigd'],['balanced','Gebalanceerd · 75% deeltjes'],['fast','Snel · 50% deeltjes']]));
      const summary=$('div','pala-v2-status');summary.id='pala-v2-perf-stats';page.append(summary);
      const actions=$('div','btnrow');actions.append(this._button('Instelling opslaan','v2-perf-save','primary'),this._button('Verversen','v2-perf-refresh'),this._button('Rapport kopiëren','v2-perf-copy'),this._button('Metingen wissen','v2-perf-reset'));page.append(actions);
      page.append($('p','pala-v2-caption','Metingen blijven lokaal in het geheugen en worden niet naar een externe dienst gestuurd. Deze tab heeft geen eigen timer.'));
      this._fillPerformance(summary);
    }
    _fillPerformance(node=this.dialog.querySelector('#pala-v2-perf-stats')){
      if(!node||!this.dialog.open&&this.editorTab!=='performance')return;
      const d=this._performanceSnapshot();node.replaceChildren();
      for(const [name,val] of [['Laatste update',d.last+' ms'],['Gemiddeld',d.mean===null?'—':d.mean+' ms'],['P95',d.p95===null?'—':d.p95+' ms'],['Metingen',d.samples],['Live updates',d.live],['Lijstopbouw',d.draws],['Badges',d.badges],['Live tegels',d.tiles]]){
        const block=$('div','pala-v2-stat');block.append($('strong',null,String(val)),$('small',null,name));node.append(block);
      }
    }
    _performanceReport(){const p=this._performanceSnapshot();return 'PalaSidebar '+VERSION+' · browser-performance\n'+
      'Laatste: '+p.last+' ms | Gemiddeld: '+(p.mean??'—')+' ms | P95: '+(p.p95??'—')+' ms\n'+
      'Metingen: '+p.samples+' | Updates: '+p.live+' | Lijst-renders: '+p.draws+' | Badges: '+p.badges+' | Live tegels: '+p.tiles;}
    _themeStudioPro(page){
      page.append($('h3',null,'Theme Studio Pro · eigen stijlen'),$('p',null,'Sla een huidig thema op als eigen preset. De bestaande thema-engine, animaties en kleurinstellingen blijven leidend.'));
      page.append(this._formField('Naam voor nieuwe preset','pala-v2-theme-name','Mijn thema'));
      const save=$('div','btnrow');save.append(this._button('Preset bewaren','v2-theme-snapshot','primary'));page.append(save);
      const snaps=cleanThemeSnapshots(this.saved.theme_snapshots);
      page.append(this._formField('Mijn presets','pala-v2-theme-select',snaps[0]?.id||'',[['','— Kies een preset —'],...snaps.map(x=>[x.id,x.name])]));
      const row=$('div','btnrow');row.append(this._button('Voorbeeld laden','v2-theme-load'),this._button('Preset verwijderen','v2-theme-delete'));
      page.append(row);
      page.append($('p','pala-v2-caption','Voorbeeld laden wijzigt niets definitief: klik daarna op Thema opslaan om het toe te passen. Voorbeeld stoppen herstelt het vorige thema.'));
      const textarea=$('textarea','pala-v2-import');textarea.id='pala-v2-theme-json';textarea.placeholder='Thema JSON voor export of import...';textarea.setAttribute('aria-label','Thema JSON');page.append(textarea);
      const io=$('div','btnrow');io.append(this._button('Huidig thema exporteren','v2-theme-export'),this._button('JSON als voorbeeld laden','v2-theme-import'));page.append(io);
    }
    _refreshSnapshotsUI(){this._rebuildSettingsAtSamePosition('themes');}
    _saveThemeSnapshot(){
      const name=this.dialog.querySelector('#pala-v2-theme-name')?.value?.trim().slice(0,32);
      if(!name){this._editorNotice('Geef de preset eerst een naam.');return;}
      const snapshots=cleanThemeSnapshots(this.saved.theme_snapshots);
      const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,36)||'eigen';
      const next={id,name,theme:this._themeForm()};const index=snapshots.findIndex(x=>x.id===id);
      if(index>=0)snapshots[index]=next;else if(snapshots.length<8)snapshots.push(next);
      else{this._editorNotice('Maximaal acht eigen presets. Verwijder er eerst één.');return;}
      this.saved.theme_snapshots=snapshots;this._saveSettings();this._refreshSnapshotsUI();this._editorNotice('Eigen preset opgeslagen.');
    }
    _loadThemeSnapshot(value){
      const t=cleanTheme(value);this.themeDraft=t;this._fillThemeEditor(t);this._syncTheme(true);
      this._editorNotice('Preset geladen als voorbeeld. Klik op Thema opslaan om dit te bewaren.');
    }
    _openFavoriteMenu(id){
      const item=this._allItems().find(i=>i.id===id);
      if(!item || this.actionDialog.open||this.dialog.open||this.quickDialog.open)return;
      const isFavorite=this.saved.favorites.includes(id);
      const pane=$('div','dialog-content favorite-menu');
      pane.append($('h2',null,item.label),$('p',null,isFavorite?'Dit onderdeel staat in Favorieten.':'Beheer dit menuonderdeel zonder ruimte voor een ster in de sidebar.'));
      const actions=$('div','btnrow');
      if(this.saved.context_menu?.enabled){
        pane.querySelector('p').textContent='Snelmenu voor dit menuonderdeel.';
        const open=this._button('Openen','v2-context-open','primary');open.dataset.id=id;actions.append(open);
        const action=this._actionForItem(item),entity=(action?.entity||this._badgeForItem(item)?.entity||'');
        if(isEntity(entity)){
          const info=this._button('Meer informatie','v2-context-more');info.dataset.entity=entity;actions.append(info);
        }
        if(action&&(action.type==='toggle'||action.type==='service')){
          const run=this._button('Actie uitvoeren','v2-context-run');run.dataset.id=id;actions.append(run);
        }
      }
      const fav=this._button(isFavorite?'★ Verwijderen uit favorieten':'★ Toevoegen aan favorieten','favorite-toggle',this.saved.context_menu?.enabled?'':'primary');
      fav.dataset.id=id;actions.append(fav,this._button('Sluiten','action-close'));
      pane.append(actions);
      this.actionDialog.replaceChildren(pane);
      this._openOwnedDialog(this.actionDialog,'action');
    }
    // Resolve one intended target using the actual composed path, not an
    // event target retargeted through a nested HA icon/shadow root.
    _quickMenuTarget(event){
      const path=event.composedPath?.()||[event.target];
      for(const node of path){
        if(!node?.matches||!node.isConnected)continue;
        if(node.matches('.nav-row .nav-link')){
          if(this.list.contains(node)&&node.dataset.id)
            return {kind:'item',id:node.dataset.id,node};
          if(this.liveCenter.contains(node)&&isEntity(node.dataset.entity))
            return {kind:'live',entity:node.dataset.entity,node};
        }
        if(node.matches('.group-toggle')){
          if(this.list.contains(node)&&node.dataset.id)
            return {kind:'section',id:node.dataset.id,node};
          if(this.liveCenter.contains(node))
            return {kind:'live-section',node};
        }
        if(node.matches('.quick-open')&&this.list.contains(node))
          return {kind:'quick',node};
      }
      return null;
    }
    _openQuickMenuTarget(target){
      if(!target?.node?.isConnected||this.dialog.open||this.actionDialog.open||this.quickDialog.open)return false;
      if(target.kind==='item'){
        this._openFavoriteMenu(target.id);return this.actionDialog.open;
      }
      if(target.kind==='quick'){
        this.showQuickDialog();return this.quickDialog.open;
      }
      const pane=$('div','dialog-content favorite-menu');
      const actions=$('div','btnrow');
      if(target.kind==='live'){
        const tile=this.saved.live_center?.tiles?.find(t=>t.entity===target.entity);
        if(!tile)return false;
        pane.append($('h2',null,tile.label||target.entity),$('p',null,'Live Control Center · '+target.entity));
        const more=this._button('Meer informatie','v2-context-more','primary');more.dataset.entity=target.entity;actions.append(more);
        if(tile.action==='toggle'){
          const toggle=this._button('Aan/uit','v2-context-live-toggle');toggle.dataset.entity=target.entity;actions.append(toggle);
        }
      }else if(target.kind==='section'||target.kind==='live-section'){
        const title=target.node.textContent.trim()||'Sectie';
        pane.append($('h2',null,title),$('p',null,'Sectie bedienen'));
        const toggle=this._button(target.node.getAttribute('aria-expanded')==='true'?'Inklappen':'Uitklappen','v2-context-section-toggle','primary');
        toggle.dataset.section=target.kind==='live-section'?'live':target.id;
        actions.append(toggle);
      }else return false;
      actions.append(this._button('Sluiten','action-close'));
      pane.append(actions);this.actionDialog.replaceChildren(pane);
      this._openOwnedDialog(this.actionDialog,'action');return this.actionDialog.open;
    }
    _favoriteHoldClear(){
      if(this._favoriteHoldTimer!==undefined){clearTimeout(this._favoriteHoldTimer);this._favoriteHoldTimer=undefined;}
      this._favoriteHold=null;
    }
    _favoriteHoldArm(x,y,target,pointerId=null,source='pointer'){
      this._favoriteHoldClear();
      // Backward-compatible helper: old internal callers/tests supplied an ID.
      if(typeof target==='string'){
        const node=[...this.list.querySelectorAll('.nav-row .nav-link')].find(n=>n.dataset.id===target);
        target=node?{kind:'item',id:target,node}:null;
      }
      if(!target?.node?.isConnected)return;
      this._favoriteHold={x,y,target,pointerId,source};
      this._favoriteHoldTimer=setTimeout(()=>{
        const hold=this._favoriteHold;
        this._favoriteHoldClear();
        if(!hold||this._gesture?.active||!hold.target.node.isConnected)return;
        if(this._openQuickMenuTarget(hold.target))
          this._favoriteSuppressClickUntil=performance.now()+1100;
      },550);
    }
    _favoriteHoldPointerStart(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      if(e.isPrimary===false||e.button>0)return;
      const target=this._quickMenuTarget(e);
      if(!target||this.dialog.open||this.actionDialog.open||this.quickDialog.open)return;
      // On Android the following touchstart upgrades this timer to touch;
      // without touch events, pointer handling still works as a fallback.
      this._favoriteHoldArm(e.clientX,e.clientY,target,e.pointerId,'pointer');
    }
    _favoriteHoldPointerMove(e){
      const hold=this._favoriteHold;
      if(!hold||hold.source==='touch'||hold.pointerId!==e.pointerId)return;
      if(Math.abs(e.clientX-hold.x)>16||Math.abs(e.clientY-hold.y)>16||this._gesture?.active)this._favoriteHoldClear();
    }
    _favoriteHoldPointerEnd(e){
      // pointercancel is normal during Android's touch stream. Never cancel an
      // ongoing touch hold because of a POINTER cancel from the same finger.
      if(this._favoriteHold?.source==='touch')return;
      if(this._favoriteHold?.pointerId===e.pointerId)this._favoriteHoldClear();
    }
    _favoriteHoldStart(e){
      if(!e.touches||e.touches.length!==1)return;
      const target=this._quickMenuTarget(e);
      if(!target||this.dialog.open||this.actionDialog.open||this.quickDialog.open)return;
      const touch=e.touches[0];this._favoriteHoldArm(touch.clientX,touch.clientY,target,touch.identifier,'touch');
    }
    _favoriteHoldMove(e){
      const hold=this._favoriteHold,t=e.touches?.[0];
      if(!hold||hold.source!=='touch')return;
      if(!t||e.touches.length!==1||Math.abs(t.clientX-hold.x)>16||Math.abs(t.clientY-hold.y)>16||this._gesture?.active)this._favoriteHoldClear();
    }
    _help(label,body){
      // Native details: accessible disclosure, no additional listeners/timers,
      // and textContent only (never interpolate untrusted sensor data as HTML).
      const d=$('details','pala-help');
      const summary=$('summary',null,'ⓘ '+label);
      const p=$('p',null,body);
      d.append(summary,p);return d;
    }
    _formField(label,id,value='',options=null){
      const wrap=$('label','field');wrap.append($('span',null,label));let ctrl;
      if(options){ctrl=$('select');for(const [key,name] of options){const opt=$('option',null,name);opt.value=key;ctrl.append(opt);}ctrl.value=value;}
      else{ctrl=$('input');ctrl.value=value;}
      ctrl.id=id;
      if(!options){
        const line=$('div','field-control');line.append(ctrl);
        const clear=this._button('×','clear-field','field-clear');clear.dataset.field=id;
        clear.title='Veld wissen';clear.setAttribute('aria-label',label+' wissen');line.append(clear);wrap.append(line);
      }else wrap.append(ctrl);
      return wrap;
    }
    _entityField(label,id,value=''){
      const f=this._formField(label,id,value);const input=f.querySelector('input');input.placeholder='Typ naam of entity_id, bijvoorbeeld sensor.buienalarm_neerslag';input.dataset.entityPicker='1';
      const suggestions=$('div','entity-suggestions');suggestions.dataset.for=id;f.append(suggestions);
      return f;
    }
    _updateSuggestions(input){
      const host=this.dialog.querySelector('[data-for="'+input.id+'"]');if(!host)return;
      const query=text(input.value).toLowerCase();host.replaceChildren();
      if(isEntity(query)&&this.hass?.states?.[query])return;
      const entries=Object.entries(this.hass?.states||{});
      let count=0;
      for(const [id,state] of entries){
        const name=text(state.attributes?.friendly_name);
        if(!id.toLowerCase().includes(query)&&!name.toLowerCase().includes(query))continue;
        const b=this._button((name?name+' · ':'')+id,'choose-entity');b.dataset.field=input.id;b.dataset.entity=id;
        host.append(b);if(++count>=12)break;
      }
    }
    _showEditorTab(tab){
      this.editorTab=tab;
      if(tab==='performance')this._fillPerformance();
      for(const node of this.dialog.querySelectorAll('[data-editor-page]'))node.hidden=node.dataset.editorPage!==tab;
      for(const node of this.dialog.querySelectorAll('[data-do="editor-tab"]')){
        const active=node.dataset.tab===tab;
        node.classList.toggle('primary',active);
        node.setAttribute('aria-selected',String(active));
        node.tabIndex=active?0:-1;
      }
      const active=this.dialog.querySelector('[data-do="editor-tab"].primary');
      const bar=active?.parentElement;
      if(bar && active){
        const left=active.offsetLeft,right=left+active.offsetWidth;
        if(left<bar.scrollLeft)bar.scrollLeft=left;
        else if(right>bar.scrollLeft+bar.clientWidth)bar.scrollLeft=right-bar.clientWidth;
      }
    }
    _rebuildSettingsAtSamePosition(tab=this.editorTab||'layout',select={}){
      // The old editor rebuilt the dialog and jumped to the top after EVERY save.
      // Rebuild only for structural changes; restore scroll and the selected item.
      const pane=this.dialog.querySelector('.dialog-content');
      const scroll=pane?.scrollTop||0;
      const oldTabs=this.dialog.querySelector('.editor-tabs');const tabScroll=oldTabs?.scrollLeft||0;
      const section=select.sectionId??this.dialog.querySelector('#pala-layout-section')?.value;
      const item=select.itemId??this.dialog.querySelector('#pala-layout-item')?.value;
      this.showSettings(tab);
      const sectionEl=this.dialog.querySelector('#pala-layout-section');
      if(sectionEl && section && Array.from(sectionEl.options).some(o=>o.value===section)){sectionEl.value=section;this._layoutFillSection();}
      const itemEl=this.dialog.querySelector('#pala-layout-item');
      if(itemEl && item && Array.from(itemEl.options).some(o=>o.value===item)){itemEl.value=item;this._layoutFillItem();}
      const newPane=this.dialog.querySelector('.dialog-content');if(newPane)newPane.scrollTop=scroll;
      const tabs=this.dialog.querySelector('.editor-tabs');if(tabs)tabs.scrollLeft=tabScroll;
    }

    _selectItems(){return this._navData(true,true).flatMap(g=>g.items).map(i=>[i.id,i.label+' ('+i.id+')']);}
    _menuEditor(pane){
      pane.append($('h3',null,'Dashboard of menuknop toevoegen'),$('p',null,'Kies een gevonden dashboard of vul zelf een pad in. De aanraakactie kun je bij Acties aanpassen.'));
      pane.append(this._formField('Bestaande eigen link bewerken','pala-menu-select','',[['','+ Nieuwe toevoegen'],...this.saved.links.map(i=>[i.id,i.label])]));
      const panels=Object.entries(this.hass?.panels||{}).filter(([k,v])=>!v.require_admin||this.hass?.user?.is_admin)
        .map(([key,value])=>['/'+(value.url_path||key),value.title||prettify(key)]);
      pane.append(this._formField('Bestaand HA-dashboard kiezen','pala-menu-panel','',[['','— Zelf invoeren —'],...panels]));
      pane.append(this._formField('Naam','pala-menu-name',''),this._formField('Pad (/lovelace of /dashboard-naam/pagina)','pala-menu-path',''),
        this._formField('Icoon (mdi:...)','pala-menu-icon','mdi:view-dashboard-outline'),
        this._formField('Groepnaam','pala-menu-group','MIJN DASHBOARDS'));
      const row=$('div','btnrow');row.append(this._button('Opslaan','editor-menu-save','primary'),this._button('Nieuw','editor-menu-clear'),this._button('Verwijderen','editor-menu-remove'));pane.append(row);
      pane.append($('p',null,'Wijzigingen gelden voor deze Home Assistant-gebruiker op dit apparaat. Verwijderen wist geen echt HA-dashboard.'));
    }
    _fillMenuEditor(id){
      const item=this.saved.links.find(i=>i.id===id);const q=id=>this.dialog.querySelector('#'+id);
      q('pala-menu-select').value=item?.id||'';
      q('pala-menu-name').value=item?.label||'';q('pala-menu-path').value=item?.path||'';
      q('pala-menu-icon').value=item?.icon||'mdi:view-dashboard-outline';q('pala-menu-group').value=item?.group||'MIJN DASHBOARDS';
      q('pala-menu-panel').value='';
    }
    _pickPanel(){
      const path=this.dialog.querySelector('#pala-menu-panel')?.value;if(!path)return;
      const panel=Object.entries(this.hass?.panels||{}).find(([key,p])=>'/'+(p.url_path||key)===path)?.[1];
      this.dialog.querySelector('#pala-menu-path').value=path;
      if(panel){this.dialog.querySelector('#pala-menu-name').value=panel.title||prettify(path.slice(1));
        this.dialog.querySelector('#pala-menu-icon').value=panel.icon||'mdi:view-dashboard-outline';}
    }
    _editorMenuSave(){
      const q=id=>text(this.dialog.querySelector('#'+id)?.value);
      const oldId=q('pala-menu-select'),name=q('pala-menu-name'),path=q('pala-menu-path'),icon=q('pala-menu-icon'),group=q('pala-menu-group');
      if(!name||!validPath(path)){alert('Vul een naam en een geldig pad of HTTPS-link in.');return;}
      const duplicate=this._allItems().find(i=>i.path===path && i.id!==oldId);
      if(duplicate && !duplicate.id.startsWith('auto-')){alert('Dit pad staat al in je menu: '+duplicate.label+'. Gebruik Badges of Acties om dit item aan te passen.');return;}
      const id=oldId||'custom-'+cleanId(name)+'-'+Date.now().toString(36);
      const old=this.saved.links.find(i=>i.id===oldId),item=configItem({...old,id,label:name,path,icon,group});
      if(!item)return;
      this.saved.links=oldId?this.saved.links.map(i=>i.id===oldId?item:i):[...this.saved.links,item].slice(0,50);
      this._saveSettings();this.redraw();this._rebuildSettingsAtSamePosition('menu');this._fillMenuEditor(id);
    }
    _editorMenuRemove(){
      const id=this.dialog.querySelector('#pala-menu-select')?.value;if(!id)return;
      if(!confirm('Deze eigen snelkoppeling verwijderen?'))return;
      this.saved.links=this.saved.links.filter(x=>x.id!==id);delete this.saved.badge_overrides[id];delete this.saved.action_overrides[id];
      this._saveSettings();this.redraw();this._rebuildSettingsAtSamePosition('menu');
    }
    _badgeColorPicker(id,value='#38bdf8'){
      const wrap=$('div','badge-color-control');
      const picker=$('input');picker.type='color';picker.id=id;picker.dataset.badgeColorNative='1';picker.value=hex6(value)||'#38bdf8';picker.title='Kleur kiezen';picker.setAttribute('aria-label','Kleur kiezen');
      const hex=$('input');hex.type='text';hex.id=id+'-hex';hex.dataset.badgeColorHex='1';hex.value=picker.value;hex.maxLength=7;hex.placeholder='#38bdf8';hex.setAttribute('aria-label','HEX kleurcode');hex.autocomplete='off';
      wrap.append(picker,hex);return wrap;
    }
    _badgeColorPickerEvent(input){
      const pair=input.closest('.badge-color-control');if(!pair)return;
      const native=pair.querySelector('[data-badge-color-native]'),hex=pair.querySelector('[data-badge-color-hex]');
      if(input===native)hex.value=native.value;
      else if(hex6(hex.value))native.value=hex6(hex.value);
    }
    _badgeAddStop(value='',color='#38bdf8'){
      const list=this.dialog.querySelector('#pala-badge-gradient-stop-list');
      if(!list||list.children.length>=15)return;
      const id='pala-badge-stop-color-'+(++this._badgeStopSeq||1);
      const row=$('div','badge-gradient-stop');row.dataset.badgeStop='1';
      const input=$('input');input.type='text';input.inputMode='decimal';input.dataset.badgeStopValue='1';
      input.placeholder='Temperatuur, bijv. 18';input.maxLength=25;input.value=value;
      input.setAttribute('aria-label','Sensorwaarde van kleurpunt');
      const cp=this._badgeColorPicker(id,color);
      const remove=this._button('×','badge-remove-stop','field-clear');remove.title='Kleurpunt verwijderen';remove.setAttribute('aria-label','Kleurpunt verwijderen');
      row.append(input,cp,remove);list.append(row);
    }
    _badgeFillStops(stops){
      const list=this.dialog.querySelector('#pala-badge-gradient-stop-list');if(!list)return;
      list.replaceChildren();this._badgeStopSeq=0;
      for(const [value,color] of parseColorStops(stops))this._badgeAddStop(String(value),color);
    }
    _badgeSyncColorStops(){
      const field=this.dialog.querySelector('#pala-badge-color_stops');if(!field)return;
      const stops=new Map();
      for(const row of this.dialog.querySelectorAll('[data-badge-stop]')){
        const n=numericSensorValue(row.querySelector('[data-badge-stop-value]')?.value);
        const color=hex6(row.querySelector('[data-badge-color-native]')?.value);
        if(Number.isFinite(n)&&Math.abs(n)<=1e9&&color)stops.set(n,color);
      }
      field.value=[...stops].sort((a,b)=>a[0]-b[0]).slice(0,15).map(([n,c])=>n+'='+c).join(';').slice(0,900);
    }
    _badgeAddRule(state='',color='#38bdf8'){
      const list=this.dialog.querySelector('#pala-badge-color-rule-list');
      if(!list||list.children.length>=15)return;
      const id='pala-badge-rule-color-'+(++this._badgeRuleSeq||1);
      const row=$('div','badge-color-rule');row.dataset.badgeRule='1';
      const control=$('div','badge-rule-condition');
      const kind=$('select');kind.dataset.badgeRuleKind='1';kind.setAttribute('aria-label','Voorwaarde voor kleurregel');
      for(const [key,label] of [['eq','Is gelijk aan'],['ge','Vanaf ≥'],['gt','Hoger dan >'],['lt','Lager dan <'],['le','Tot en met ≤'],['between','Tussen']]){
        const opt=$('option',null,label);opt.value=key;kind.append(opt);
      }
      const condition=text(state);
      const op=/^(>=|<=|>|<)\s*(.+)$/.exec(condition);
      const between=/^(-?\d+(?:[.,]\d+)?)\s*\.\.\s*(-?\d+(?:[.,]\d+)?)$/.exec(condition);
      if(between)kind.value='between';
      else if(op)kind.value=({'>=':'ge','>':'gt','<':'lt','<=':'le'})[op[1]];
      const input=$('input');input.type='text';input.placeholder='Bijv. 20, 25 of on';input.maxLength=55;input.value=between?condition:op?op[2]:condition;
      input.dataset.badgeRuleState='1';input.setAttribute('aria-label','Sensorwaarde of grenswaarde');
      const setHint=()=>{input.placeholder=kind.value==='between'?'15..25 (van 15 tot 25)':'25 of on';};
      kind.addEventListener('change',setHint);setHint();
      control.append(kind,input);
      const cp=this._badgeColorPicker(id,color);const remove=this._button('×','badge-remove-rule','field-clear');remove.title='Kleurregel verwijderen';remove.setAttribute('aria-label','Kleurregel verwijderen');
      row.append(control,cp,remove);list.append(row);
    }
    _badgeSyncColorRules(){
      const field=this.dialog.querySelector('#pala-badge-color_rules');if(!field)return;
      field.value=[...this.dialog.querySelectorAll('[data-badge-rule]')].map(row=>{
        const raw=text(row.querySelector('[data-badge-rule-state]')?.value).replace(/[;\n]/g,'').slice(0,50);
        const kind=row.querySelector('[data-badge-rule-kind]')?.value||'eq';
        const op={ge:'>=',gt:'>',lt:'<',le:'<='}[kind]||'';
        // Old typed operators remain valid; do not double the operator.
        const condition=op ? op+raw.replace(/^(?:>=|<=|>|<)\s*/,'') : raw;
        const color=hex6(row.querySelector('[data-badge-color-native]')?.value);
        return condition&&color?condition+'='+color:'';
      }).filter(Boolean).slice(0,15).join(';').slice(0,900);
    }
    _badgeUpdateColorStatus(){
      const result=this.dialog.querySelector('#pala-badge-color-result');
      if(!result)return;
      const raw=this._badgeCurrentColorValue();
      if(this.dialog.querySelector('#pala-badge-color_transition')?.value==='direct'){
        const swatch=this.dialog.querySelector('#pala-badge-direct-result');
        const shade=sensorColor(raw);
        const current=this.dialog.querySelector('#pala-badge-color-current');
        if(current)current.textContent='Huidige sensorwaarde: '+this._badgeDisplayValue(raw,85);
        if(swatch){
          swatch.replaceChildren();
          const chip=$('span','chip');chip.style.background=shade||'var(--p-accent)';swatch.append(chip);
          swatch.append(document.createTextNode(shade
            ? 'Sensorkleur herkend: '+shade+'. Deze kleur wordt rechtstreeks op badge, en desgewenst tekst en icoon toegepast.'
            : 'Deze sensor geeft geen geldige RGB-, HEX- of benoemde kleur terug. De badge gebruikt de themakleur.'));
        }
        return;
      }
      if(this.dialog.querySelector('#pala-badge-color_transition')?.value==='gradient'){
        const stops=parseColorStops(this.dialog.querySelector('#pala-badge-color_stops')?.value);
        const n=numericSensorValue(raw);
        const shade=interpolateColor(stops,raw);
        const current=this.dialog.querySelector('#pala-badge-color-current');
        if(current)current.textContent='Huidige sensorwaarde: '+this._badgeDisplayValue(raw,85);
        const bar=this.dialog.querySelector('#pala-badge-gradient-bar');
        if(bar){
          bar.dataset.indicator=String(stops.length>1 && Number.isFinite(n));
          if(stops.length>1 && Number.isFinite(n))bar.style.setProperty('--p-gradient-pos',
            (clamp((n-stops[0][0])/(stops[stops.length-1][0]-stops[0][0]),0,1)*100).toFixed(2)+'%');
          else bar.style.removeProperty('--p-gradient-pos');
          if(stops.length>1){
            const low=stops[0][0],high=stops[stops.length-1][0];
            bar.style.background='linear-gradient(to right, '+stops.map(([v,c])=>c+' '+((v-low)/(high-low)*100).toFixed(2)+'%').join(', ')+')';
          }else bar.style.background=stops[0]?.[1]||'var(--p-accent)';
        }
        const target=this.dialog.querySelector('#pala-badge-gradient-result');
        if(target){target.replaceChildren();const chip=$('span','chip');chip.style.background=shade||'var(--p-accent)';target.append(chip);
          const explanation=!Number.isFinite(n)?'De gekozen sensorwaarde is niet numeriek. Kies een temperatuursensor of ander getal.'
            :!stops.length?'Voeg minstens twee kleurpunten toe (bijvoorbeeld 18 en 23).'
            :stops.length===1?'Eén kleurpunt ingesteld. Voeg een tweede toe voor een vloeiende overgang.'
            :n<=stops[0][0]?'Onder de eerste grens: kleur van '+stops[0][0]+' wordt gebruikt.'
            :n>=stops[stops.length-1][0]?'Boven de laatste grens: kleur van '+stops[stops.length-1][0]+' wordt gebruikt.'
            :'Bij '+this._badgeDisplayValue(raw,35)+' berekent PalaSidebar automatisch een tussenkleur: '+shade+'.';
          target.append(document.createTextNode(explanation));}
        return;
      }
      const needle=text(raw);
      const rules=text(this.dialog.querySelector('#pala-badge-color_rules')?.value);
      const matched=colorRules(rules,raw);
      const direct=sensorColor(raw);
      const fallback=this.dialog.querySelector('#pala-badge-fallback_enabled')?.checked
        ?hex6(this.dialog.querySelector('#pala-badge-color_fallback')?.value):'';
      const shade=matched||direct||fallback;
      const current=this.dialog.querySelector('#pala-badge-color-current');
      if(current)current.textContent='Huidige sensorwaarde: '+this._badgeDisplayValue(raw,85);
      const rows=[...this.dialog.querySelectorAll('[data-badge-rule]')];
      let active=-1;
      for(const [i,row] of rows.entries()){
        const rule=text(row.querySelector('[data-badge-rule-state]')?.value);
        const kind=row.querySelector('[data-badge-rule-kind]')?.value||'eq';
        const op={ge:'>=',gt:'>',lt:'<',le:'<='}[kind]||'';
        const cond=op?op+rule.replace(/^(?:>=|<=|>|<)\s*/,''):rule;
        const candidate=colorRules(cond+'='+hex6(row.querySelector('[data-badge-color-native]')?.value),raw);
        if(active<0&&candidate)active=i;
        row.dataset.active=String(active===i && !!matched);
      }
      result.replaceChildren();
      const chip=$('span','chip');chip.style.background=shade||'var(--p-accent)';result.append(chip);
      const explanation=matched?'Regel '+(active+1)+' actief → badge gebruikt deze kleur.'
        :direct?'De sensor levert zelf een geldige kleur op.'
        :fallback?'Geen regel komt overeen: de ingestelde standaardkleur wordt gebruikt.'
        :'Geen kleurregel past bij '+(needle||'de sensorwaarde')+'. De badge gebruikt nu de themakleur.';
      result.append(document.createTextNode(explanation));
      if(!matched&&!direct&&rows.length>0){
        result.append($('div','field-note','Tip: 15 en 25 betekenen exact 15 en exact 25. Kies bijvoorbeeld “Lager dan 15”, “Tussen 15..25” en “Vanaf 25”.'));
      }
    }
    _badgeCurrentColorValue(){
      const entity=text(this.dialog.querySelector('#pala-badge-color_entity')?.value)||text(this.dialog.querySelector('#pala-badge-entity')?.value);
      const attr=this._selectedBadgeColorAttribute();
      const current=this.hass?.states?.[entity];return attr?current?.attributes?.[attr]:current?.state;
    }
    _refreshBadgeColorAttributeOptions(requested){
      const picker=this.dialog.querySelector('#pala-badge-color_attribute_select');if(!picker)return;
      const entity=text(this.dialog.querySelector('#pala-badge-color_entity')?.value)||text(this.dialog.querySelector('#pala-badge-entity')?.value);
      const state=this.hass?.states?.[entity];
      const previous=requested!==undefined?text(requested):this._selectedBadgeColorAttribute();
      picker.replaceChildren();
      const add=(v,label)=>{const opt=$('option',null,label);opt.value=v;picker.append(opt);};
      add('','Sensorwaarde (aanbevolen)'+(state?' · '+this._badgeDisplayValue(state.state,24):''));
      for(const [name,value] of Object.entries(state?.attributes||{}).sort(([a],[b])=>a.localeCompare(b,'nl'))){
        add(name,name+' · '+this._badgeDisplayValue(value,26));
      }
      if(previous && !Object.hasOwn(state?.attributes||{},previous))add(previous,'Eerder gekozen: '+previous);
      add('__manual__','Ander attribuut handmatig…');picker.value=previous||'';
      this._toggleBadgeColorAttribute();
    }
    _selectedBadgeColorAttribute(){
      const selected=this.dialog.querySelector('#pala-badge-color_attribute_select')?.value||'';
      return selected==='__manual__'?text(this.dialog.querySelector('#pala-badge-color_attribute')?.value):selected;
    }
    _toggleBadgeColorAttribute(){
      const visible=this.dialog.querySelector('#pala-badge-color_attribute_select')?.value==='__manual__';
      const manual=this.dialog.querySelector('#pala-badge-color_attribute')?.closest('.field');if(manual)manual.hidden=!visible;
    }
    _updateBadgeColorEditor(){
      const mode=this.dialog.querySelector('#pala-badge-color')?.value;
      const fixed=this.dialog.querySelector('#pala-badge-custom-color-panel');if(fixed)fixed.hidden=mode!=='custom';
      const sensor=this.dialog.querySelector('#pala-badge-sensor-color-panel');if(sensor)sensor.hidden=mode!=='sensor';
      const live=this.dialog.querySelector('#pala-badge-color-current');
      if(live && mode==='sensor')this._badgeUpdateColorStatus();
      const fb=this.dialog.querySelector('#pala-badge-fallback-panel');
      if(fb)fb.hidden=!this.dialog.querySelector('#pala-badge-fallback_enabled')?.checked;
      const gradient=this.dialog.querySelector('#pala-badge-gradient-config');
      const steps=this.dialog.querySelector('#pala-badge-steps-config');
      const transition=this.dialog.querySelector('#pala-badge-color_transition')?.value;
      if(gradient)gradient.hidden=transition!=='gradient';
      if(steps)steps.hidden=transition!=='steps';
      const direct=this.dialog.querySelector('#pala-badge-direct-config');
      if(direct)direct.hidden=transition!=='direct';
    }
    _refreshBadgeInsertAttributes(){
      const picker=this.dialog.querySelector('#pala-badge-insert-attribute');if(!picker)return;
      const id=text(this.dialog.querySelector('#pala-badge-insert-entity')?.value);
      const attrs=this.hass?.states?.[id]?.attributes||{};
      const previous=picker.value;picker.replaceChildren();
      const add=(value,label)=>{const opt=$('option',null,label);opt.value=value;picker.append(opt);};
      add('','Sensorwaarde (state)');
      for(const key of Object.keys(attrs).sort().slice(0,65)){
        const value=attrs[key];
        if(value===undefined||value===null||typeof value==='object')continue;
        add(key,key+' · '+String(value).slice(0,48));
      }
      picker.value=[...picker.options].some(o=>o.value===previous)?previous:'';
    }
    _badgeTemplateInsert(newLine){
      const editor=this.dialog.querySelector('#pala-badge-template');if(!editor)return;
      const id=text(this.dialog.querySelector('#pala-badge-insert-entity')?.value);
      if(!isEntity(id)||!this.hass?.states?.[id]){
        this._editorNotice('Zoek eerst een bestaande sensor en kies die uit de resultaten.');return;
      }
      const attribute=this.dialog.querySelector('#pala-badge-insert-attribute')?.value||'';
      const fmt=this.dialog.querySelector('#pala-badge-insert-format')?.value||'auto';
      const token='{'+id+(attribute?'#'+attribute:'')+(fmt==='auto'?'':':'+fmt)+'}';
      const current=editor.value;
      const sep=!current?'':newLine?'\n':' · ';
      if((current+sep+token).length>500){this._editorNotice('De badge heeft maximaal 500 tekens.');return;}
      editor.value=current+sep+token;
      if(newLine && current && this.dialog.querySelector('#pala-badge-layout')?.value==='right'){
        this.dialog.querySelector('#pala-badge-layout').value='below';
        this._editorNotice('De badge staat nu onder de menunaam, zodat beide regels goed passen.');
      }
      editor.dispatchEvent(new Event('input',{bubbles:true}));editor.focus();editor.setSelectionRange(editor.value.length,editor.value.length);
    }
    _badgeTemplateBlankLine(){
      const editor=this.dialog.querySelector('#pala-badge-template');if(!editor)return;
      if(editor.value.length>=499)return;
      editor.value+='\n';editor.dispatchEvent(new Event('input',{bubbles:true}));editor.focus();
    }
    _badgeLinePreview(template){
      const container=this.dialog.querySelector('#pala-badge-line-preview');if(!container)return;
      container.replaceChildren($('strong',null,'Zo komt de badge op meerdere regels:'));
      const rendered=this._formatTemplate(template);
      for(const [index,line] of rendered.split('\n').slice(0,8).entries()){
        const row=$('div','line');row.append($('span','number',String(index+1)+'.'),$('span',null,line||'Lege regel'));
        container.append(row);
      }
    }
    _badgeSwitchInput(){
      const value=key=>text(this.dialog?.querySelector('#pala-badge-'+key)?.value);
      return {switch_entity:value('switch-entity'),switch_cases:[0,1,2].map(index=>({
        state:value('switch-state-'+index),entity:value('switch-sensor-'+index),
        prefix:value('switch-prefix-'+index),text:value('switch-text-'+index)
      }))};
    }
    _badgeEditor(pane){
      pane.append($('h3',null,'Sensorbadge op een menuonderdeel'),
        $('p',null,'Kies eerst een menuknop en een sensor. Alle beschikbare attributen worden daarna automatisch getoond, met hun actuele waarde.'));
      pane.append(this._help('Meerregelige badges en automatisch meekleuren',
        'Gebruik de sensorzoeker en de knoppen bij Samengestelde badge; je hoeft geen {sensor...}-code te onthouden. Enter voegt een tweede regel toe. Voor een RGB/HEX-kleursensor kies je Direct uit sensorkleur; voor temperatuur kies je Vloeiend tussen kleurpunten. Icoon en menutekst kunnen onafhankelijk meekleuren.'));
      pane.append(this._formField('Bij welke menuknop?','pala-badge-select','',[['','— Selecteer een menuonderdeel —'],...this._selectItems()]));
      pane.append(this._entityField('Sensor of entiteit (zoeken op naam mag)','pala-badge-entity'));
      const attr=this._formField('Welke waarde wil je tonen?','pala-badge-attribute','',[['','Gewone sensorwaarde (state)']]);
      const note=$('small','field-note','Je hoeft geen attribuutnaam uit je hoofd te weten. Kies uit de lijst of gebruik de standaard sensorwaarde.');attr.append(note);pane.append(attr);
      const custom=this._formField('Ander attribuut (alleen voor gevorderden)','pala-badge-custom-attribute');custom.hidden=true;pane.append(custom);
      const sample=$('div','badge-live-preview');sample.id='pala-badge-preview';sample.setAttribute('aria-live','polite');pane.append(sample);
      const templateField=$('label','field badge-template-editor');
      templateField.append($('span',null,'Samengestelde badge · elke Enter is een nieuwe regel'));
      const templateInput=$('textarea');templateInput.id='pala-badge-template';templateInput.rows=4;
      templateInput.maxLength=500;templateInput.placeholder='Regel 1: racenaam\nRegel 2: aftelling';
      templateField.append(templateInput);pane.append(templateField);
      const lineToggle=$('label','check'),lineToggleCheck=$('input');lineToggleCheck.type='checkbox';lineToggleCheck.id='pala-badge-auto_lines';lineToggleCheck.checked=true;
      lineToggle.append(lineToggleCheck,$('span',null,'Bestaande sjablonen: zet de tweede sensor automatisch op een nieuwe regel'));pane.append(lineToggle);
      const builder=$('div','badge-template-builder');
      builder.append($('strong',null,'Sensor toevoegen zonder codes te typen'),
        $('p','field-note','Zoek een sensor, kies de gewenste waarde en druk op ‘Nieuwe badgeregel’. Je hoeft geen { } of entity-ID te kennen.'));
      const builderFields=$('div','builder-grid');
      builderFields.append(this._entityField('Zoek sensor op naam','pala-badge-insert-entity'),
        this._formField('Wat wil je tonen?','pala-badge-insert-attribute','',[['','Gewone sensorwaarde']]));
      builderFields.append(this._formField('Weergave','pala-badge-insert-format','auto',[
        ['auto','Originele waarde'],['clock','Aftelling · 3d 02:49:59'],['compact','Compact · 3d 2h'],
        ['days-hours','Dagen en uren'],['hours-minutes','Uren en minuten'],['number','Getal']]));
      builder.append(builderFields);
      const controls=$('div','btnrow');
      controls.append(this._button('＋ Nieuwe badgeregel','badge-template-new-line','primary'),
        this._button('＋ Naast bestaande tekst','badge-template-same-line'),
        this._button('↵ Lege tekstregel','badge-template-empty-line'));
      builder.append(controls);
      const lines=$('div','badge-line-preview');lines.id='pala-badge-line-preview';builder.append(lines);
      pane.append(builder);
      pane.append($('p','field-note','Tip: gebruik de positie Onder de menunaam voor een brede F1-racenaam. Meerdere regels werken ook rechts naast de menunaam. Het live voorbeeld toont iedere regel apart.'));
      const switchPanel=$('details','badge-switch-panel');switchPanel.id='pala-badge-switch-panel';
      const switchSummary=$('summary',null,'Automatisch wisselende badge · CV / tapwater / uit');switchPanel.append(switchSummary);
      switchPanel.append($('p','field-note','Laat één badge omschakelen aan de hand van een stand-sensor. Per stand kun je een eigen temperatuursensor, tekst vóór de waarde of een vaste tekst (bij Uit) instellen. Lege standen worden genegeerd.'));
      switchPanel.append(this._entityField('Stand-sensor van het apparaat','pala-badge-switch-entity'));
      for(let i=0;i<3;i++){
        const defaults=[['HOT WATER','Tapwater'],['HEAT','CV'],['OFF','Uit']][i];
        const casePanel=$('div','badge-switch-case');
        casePanel.append($('strong',null,defaults[1]),
          this._formField('Stand exact zoals in Home Assistant','pala-badge-switch-state-'+i,defaults[0]),
          this._entityField('Sensorwaarde voor deze stand (optioneel)','pala-badge-switch-sensor-'+i),
          this._formField('Tekst vóór de waarde (optioneel)','pala-badge-switch-prefix-'+i),
          this._formField('Vaste badge als er geen sensor is gekozen','pala-badge-switch-text-'+i,i===2?'Uit':''));
        switchPanel.append(casePanel);
      }
      switchPanel.append($('p','field-note','Bijvoorbeeld HOT WATER → je tapwatertemperatuur, HEAT → je cv-aanvoertemperatuur, OFF → Uit. De gewone badge blijft de terugvalwaarde als geen stand overeenkomt. Bij een onbeschikbare gekozen sensor wordt de badge tijdelijk verborgen. Gebruik Achtervoegsel voor °C.'));
      pane.append(switchPanel);
      pane.append(this._formField('Badge tonen','pala-badge-show','always', [['always','Altijd zolang sensor beschikbaar is'],['nonzero','Alleen als getal groter dan 0'],['on','Alleen bij Aan/on'],['available','Wanneer waarde beschikbaar is']]));
      pane.append(this._formField('Voorvoegsel (optioneel)','pala-badge-prefix'),this._formField('Achtervoegsel (bijv. °C)','pala-badge-suffix'));
      pane.append(this._formField('Weergave van waarde','pala-badge-format','auto',[
        ['auto','Normaal (originele sensorwaarde)'],['compact','Compacte aftelling · 3d 22h'],['days-hours','Dagen en uren · 3d 22h'],
        ['hours-minutes','Uren en minuten · 94h 23m'],['clock','Klok · 3d 22:23:29'],['number','Getal afgerond (met decimalen)']]));
      pane.append(this._formField('Positie badge','pala-badge-layout','right', [['right','Rechts naast de menunaam'],['below','Onder de menunaam · aanbevolen bij F1'],['above','Boven de menunaam'],['left','Tussen icoon en menunaam']]));
      pane.append(this._formField('Vorm','pala-badge-style','solid', [['solid','Gevulde badge'],['soft','Zachte badge'],['outline','Omlijnd'],['plain','Alleen tekst'],['dot','Alleen statusstip']]));
      pane.append(this._formField('Grootte','pala-badge-size','normal', [['small','Klein'],['normal','Normaal'],['large','Groot']]));
      pane.append(this._formField('Maximaal aantal tekens (0 = automatisch)','pala-badge-max_chars','0'));
      pane.append(this._formField('Aantal decimalen bij getal','pala-badge-decimals','1', [['0','0'],['1','1'],['2','2'],['3','3']]));
      pane.append($('h3',null,'Kleur van de badge'),$('p','field-note','Je hoeft geen sensor te zoeken die een kleur heeft. Kies één vaste kleur, of koppel zelf kleuren aan de gewone sensorwaarden.'));
      pane.append(this._formField('Hoe bepaal je de kleur?','pala-badge-color','accent',[
        ['accent','Automatisch · themakleur'],['custom','Zelf een kleur kiezen 🎨'],
        ['sensor','Automatisch bij sensorstatus / meetwaarde'],['success','Altijd groen'],['warning','Altijd oranje'],['danger','Altijd rood']]));
      const fixed=$('div','badge-color-config');fixed.id='pala-badge-custom-color-panel';fixed.hidden=true;
      fixed.append($('div','badge-color-heading','Mijn badgekleur'),this._badgeColorPicker('pala-badge-custom_color'));
      const presets=$('div','badge-color-swatches');
      for(const c of ['#38bdf8','#22c55e','#f59e0b','#ef4444','#a855f7','#ec4899','#ffffff','#64748b']){
        const sw=$('button','badge-color-swatch');sw.type='button';sw.dataset.do='badge-color-swatch';sw.dataset.color=c;sw.dataset.target='pala-badge-custom_color';sw.style.background=c;sw.title='Kies '+c;sw.setAttribute('aria-label','Kies kleur '+c);presets.append(sw);
      }
      fixed.append(presets);pane.append(fixed);
      const auto=$('div','badge-color-config');auto.id='pala-badge-sensor-color-panel';auto.hidden=true;
      auto.append($('div','badge-color-heading','Kleuren laten reageren op je sensor'),
        $('p','badge-color-description','Gebruik dezelfde sensor als je badge, of kies hieronder een andere. De gewone sensorwaarde is meestal voldoende: je hoeft geen kleurattribuut te hebben.'));
      auto.append(this._entityField('Kleursensor (leeg = badgesensor)','pala-badge-color_entity'));
      auto.append(this._formField('Welke waarde bepaalt de kleur?','pala-badge-color_attribute_select','',[['','Sensorwaarde (state)']]));
      const manual=this._formField('Andere attribuutnaam (gevorderd)','pala-badge-color_attribute');manual.hidden=true;auto.append(manual);
      const current=$('div','badge-color-status');current.id='pala-badge-color-current';auto.append(current);
      auto.append(this._formField('Hoe moeten de kleuren reageren?','pala-badge-color_transition','steps',[
        ['direct','Direct uit sensorkleur · RGB / HEX (geen regels nodig)'],
        ['steps','Stapsgewijs · regels en bereiken'],
        ['gradient','Vloeiend · automatisch tussen kleurpunten 🎨']]));
      const directSection=$('div','badge-color-config');directSection.id='pala-badge-direct-config';directSection.hidden=true;
      directSection.append($('p','badge-color-description','Bijvoorbeeld sensor.op_welke_kleur_staat_afvalbeheer met waarde rgb(31,250,2). Geen kleurregels of attributen nodig: de kleur verandert vanzelf mee met de sensor.'));
      const directResult=$('div','badge-color-result');directResult.id='pala-badge-direct-result';directResult.setAttribute('aria-live','polite');directSection.append(directResult);
      auto.append(directSection);
      const stepsSection=$('div','badge-color-config');stepsSection.id='pala-badge-steps-config';
      stepsSection.append($('div','badge-color-heading','Kleurregels (stapsgewijs)'),
        $('p','badge-color-description','Kies per regel gelijk aan, vanaf, lager dan of tussen. De eerste passende regel wordt gebruikt.'));
      const rules=$('div');rules.id='pala-badge-color-rule-list';stepsSection.append(rules);
      const fbLabel=$('label','check');const fbCheck=$('input');fbCheck.type='checkbox';fbCheck.id='pala-badge-fallback_enabled';
      fbLabel.append(fbCheck,$('span',null,'Gebruik een standaardkleur als geen regel overeenkomt'));stepsSection.append(fbLabel);
      const fbPanel=$('div','badge-color-fallback');fbPanel.id='pala-badge-fallback-panel';fbPanel.hidden=true;
      fbPanel.append($('div','badge-color-heading','Standaardkleur voor overige waarden'),this._badgeColorPicker('pala-badge-color_fallback','#22c55e'));
      stepsSection.append(fbPanel);
      const result=$('div','badge-color-result');result.id='pala-badge-color-result';result.setAttribute('aria-live','polite');stepsSection.append(result);
      const buttons=$('div','btnrow');buttons.append(this._button('＋ Kleurregel toevoegen','badge-add-rule'),this._button('Regel voor huidige waarde','badge-add-current-rule'));stepsSection.append(buttons);
      auto.append(stepsSection);
      const gradientSection=$('div','badge-color-config');gradientSection.id='pala-badge-gradient-config';gradientSection.hidden=true;
      gradientSection.append($('div','badge-color-heading','Vloeiende kleuren · stel je kleurpunten in'),
        $('p','badge-color-description','Bijvoorbeeld 18 = blauw, 20 = oranje, 23 = rood. Bij 20,9 maakt PalaSidebar vanzelf de kleur tussen oranje en rood. Onder de laagste en boven de hoogste grens blijft de eindkleur staan.'));
      const stopList=$('div');stopList.id='pala-badge-gradient-stop-list';gradientSection.append(stopList);
      const gradientButtons=$('div','btnrow');gradientButtons.append(this._button('＋ Kleurpunt toevoegen','badge-add-stop'),this._button('Punt bij huidige temperatuur','badge-add-current-stop'),this._button('Bestaande regels overnemen','badge-copy-stops'));gradientSection.append(gradientButtons);
      const gradientBar=$('div','badge-gradient-bar');gradientBar.id='pala-badge-gradient-bar';gradientBar.setAttribute('aria-label','Voorbeeld van het kleurverloop');gradientSection.append(gradientBar);
      const gradientResult=$('div','badge-gradient-status');gradientResult.id='pala-badge-gradient-result';gradientResult.setAttribute('aria-live','polite');gradientSection.append(gradientResult);
      auto.append(gradientSection);
      const colorStops=this._formField('Kleurpunten (interne opslag)','pala-badge-color_stops');colorStops.hidden=true;auto.append(colorStops);
      const legacy=this._formField('Statuskleuren (interne opslag)','pala-badge-color_rules');legacy.hidden=true;auto.append(legacy);
      pane.append(auto);
      const label=$('label','check'),labelCheck=$('input');labelCheck.type='checkbox';labelCheck.id='pala-badge-label_color_from_badge';label.append(labelCheck,$('span',null,'Menutekst mee laten kleuren met de badge'));pane.append(label);
      const iconTint=$('label','check'),iconCheck=$('input');iconCheck.type='checkbox';iconCheck.id='pala-badge-icon_color_from_badge';iconTint.append(iconCheck,$('span',null,'Menu-icoon mee laten kleuren met de badge'));pane.append(iconTint);
      pane.append($('p','field-note','Deze schakelaars werken los van elkaar, per menu-item. Zonder vinkje blijven de bestaande tekst- en icoonkleuren behouden.'));
      const row=$('div','btnrow');row.append(this._button('Badge opslaan','editor-badge-save','primary'),this._button('Badge verwijderen','editor-badge-remove'));pane.append(row);
      pane.append($('p',null,'Het voorbeeld reageert tijdens het wijzigen. Opslaan synchroniseert je badge met je Home Assistant-account zodra de verbinding beschikbaar is.'));
      this._refreshBadgeAttributeOptions('');
    }
    _refreshBadgeAttributeOptions(requested){
      const picker=this.dialog.querySelector('#pala-badge-attribute');
      if(!picker)return;
      const sensor=text(this.dialog.querySelector('#pala-badge-entity')?.value);
      const state=this.hass?.states?.[sensor];
      const previous=requested!==undefined?text(requested):this._selectedBadgeAttribute();
      picker.replaceChildren();
      const add=(value,label)=>{const opt=$('option',null,label);opt.value=value;picker.append(opt);};
      add('','Gewone sensorwaarde (state)'+(state?' · '+this._badgeDisplayValue(state.state):''));
      if(state){
        for(const [name,value] of Object.entries(state.attributes||{}).sort(([a],[b])=>a.localeCompare(b,'nl'))){
          add(name,name+' · '+this._badgeDisplayValue(value,48));
        }
      }
      if(previous && previous!=='__manual__' && !Object.hasOwn(state?.attributes||{},previous)){
        add(previous,'Eerder gekozen: '+previous+' (niet beschikbaar)');
      }
      add('__manual__','Ander attribuut handmatig invoeren…');
      picker.value=previous||'';
      this._toggleCustomBadgeAttribute();
      this._previewBadge();
    }
    _selectedBadgeAttribute(){
      const choice=this.dialog.querySelector('#pala-badge-attribute')?.value||'';
      return choice==='__manual__'?text(this.dialog.querySelector('#pala-badge-custom-attribute')?.value):choice;
    }
    _toggleCustomBadgeAttribute(){
      const field=this.dialog.querySelector('#pala-badge-custom-attribute')?.closest('.field');
      if(field)field.hidden=this.dialog.querySelector('#pala-badge-attribute')?.value!=='__manual__';
    }
    _badgeDisplayValue(value,limit=70){
      if(value===undefined||value===null)return 'geen waarde';
      let s;
      if(typeof value==='object'){try{s=JSON.stringify(value)}catch{s='[gegevens]';}}
      else s=String(value);
      return s.length>limit?s.slice(0,limit-1)+'…':s;
    }
    _previewBadge(){
      const node=this.dialog.querySelector('#pala-badge-preview');if(!node)return;
      const id=text(this.dialog.querySelector('#pala-badge-entity')?.value),state=this.hass?.states?.[id];
      const attr=this._selectedBadgeAttribute(),raw=attr?state?.attributes?.[attr]:state?.state;
      node.replaceChildren();
      const previewColor=this.dialog.querySelector('#pala-badge-color')?.value||'accent';node.dataset.color=previewColor;
      if(previewColor==='sensor'||previewColor==='custom'){
        const spec={color:previewColor,entity:id,custom_color:this.dialog.querySelector('#pala-badge-custom_color')?.value,
          color_entity:text(this.dialog.querySelector('#pala-badge-color_entity')?.value),
          color_attribute:this._selectedBadgeColorAttribute(),color_rules:this.dialog.querySelector('#pala-badge-color_rules')?.value,
          color_transition:this.dialog.querySelector('#pala-badge-color_transition')?.value,color_stops:this.dialog.querySelector('#pala-badge-color_stops')?.value,
          color_fallback:this.dialog.querySelector('#pala-badge-fallback_enabled')?.checked?this.dialog.querySelector('#pala-badge-color_fallback')?.value:''};
        const previewShade=badgeColor(spec,this.hass?.states);
        node.style.setProperty('--p-badge-color',previewShade||'var(--p-accent)');
        node.style.setProperty('--p-badge-text',readableBadgeText(previewShade));
      }else{
        const named={success:'#4ade80',warning:'#fbbf24',danger:'#f87171'};
        node.style.setProperty('--p-badge-color',named[previewColor]||'var(--p-accent)');
        node.style.setProperty('--p-badge-text',readableBadgeText(named[previewColor]));
      }
      this._updateBadgeColorEditor();
      const title=$('strong',null,'Voorbeeld van je badge');node.append(title);
      const item=this._allItems().find(i=>i.id===this.dialog.querySelector('#pala-badge-select')?.value);
      if(item){
        const example=$('div','preview-menu');
        const ico=this._icon(item.icon,'◈');ico.classList.add('preview-icon');
        const name=$('span','preview-label',item.label);
        ico.dataset.dynamicColor=String(this.dialog.querySelector('#pala-badge-icon_color_from_badge')?.checked===true);
        name.dataset.dynamicColor=String(this.dialog.querySelector('#pala-badge-label_color_from_badge')?.checked===true);
        example.append(ico,name);node.append(example);
      }
      const template=text(this.dialog.querySelector('#pala-badge-template')?.value);
      const displayTemplate=this._badgeTemplateLines(template,this.dialog.querySelector('#pala-badge-auto_lines')?.checked!==false);
      this._badgeLinePreview(displayTemplate);
      const switched=badgeSpec({entity:id,template,auto_lines:this.dialog.querySelector('#pala-badge-auto_lines')?.checked!==false,
        attribute:attr,show:this.dialog.querySelector('#pala-badge-show')?.value,
        prefix:this.dialog.querySelector('#pala-badge-prefix')?.value,suffix:this.dialog.querySelector('#pala-badge-suffix')?.value,
        format:this.dialog.querySelector('#pala-badge-format')?.value,decimals:this.dialog.querySelector('#pala-badge-decimals')?.value,
        ...this._badgeSwitchInput()});
      if(switched && switched.switch_entity){
        const current=this._dynamicSource(switched.switch_entity);
        const value=this._badgeValue(switched);
        const example=$('span','value',value||'—');example.dataset.style=this.dialog.querySelector('#pala-badge-style')?.value||'solid';
        example.dataset.size=this.dialog.querySelector('#pala-badge-size')?.value||'normal';
        node.append($('span','hint','Actuele stand: '+(current||'niet beschikbaar')+' · live badge'),example);
        return;
      }
      if(template){const example=$('span','value',this._formatTemplate(displayTemplate));example.dataset.style=this.dialog.querySelector('#pala-badge-style')?.value||'solid';
        example.style.whiteSpace='pre-line';example.dataset.size=this.dialog.querySelector('#pala-badge-size')?.value||'normal';node.append($('span','hint','Samengestelde waarde uit meerdere entiteiten en attributen'),example);return;}
      if(!id){node.append($('span','hint','Kies een sensor of vul een samengesteld sjabloon in.'));return;}
      if(!state){node.append($('span','hint','Entiteit niet gevonden in Home Assistant. Kies er één uit de zoeksuggesties.'));return;}
      const name=text(state.attributes?.friendly_name)||id;
      node.append($('span','hint',name+' · '+(attr?'Attribuut: '+attr:'Sensorwaarde')));
      if(raw===undefined||raw===null){node.append($('span','hint','Deze waarde is niet beschikbaar op de gekozen sensor.'));return;}
      const prefix=this.dialog.querySelector('#pala-badge-prefix')?.value||'';
      const suffix=this.dialog.querySelector('#pala-badge-suffix')?.value||'';
      const show=this.dialog.querySelector('#pala-badge-show')?.value||'always';
      const color=this.dialog.querySelector('#pala-badge-color')?.value||'accent';
      node.dataset.color=color;
      const style=this.dialog.querySelector('#pala-badge-style')?.value||'solid';
      const size=this.dialog.querySelector('#pala-badge-size')?.value||'normal';
      const rendered=this._badgeValue({entity:id,attribute:attr,show,prefix,suffix,color,
        format:this.dialog.querySelector('#pala-badge-format')?.value||'auto',
        max_chars:this.dialog.querySelector('#pala-badge-max_chars')?.value||'0',
        decimals:this.dialog.querySelector('#pala-badge-decimals')?.value||'1'});
      if(!rendered){
        node.append($('span','hint','De badge is momenteel verborgen door de gekozen voorwaarde of ontbrekende sensorwaarde.'));
       }else {const example=$('span','value',rendered);example.dataset.style=style;example.dataset.size=size;
        example.title=rendered;node.append(example);}
      const layout=this.dialog.querySelector('#pala-badge-layout')?.value||'right';
      node.append($('span','hint',layout==='below'?'Badge verschijnt onder de menunaam.':'Badge staat rechts van de menunaam. Lange waarden worden visueel afgekort.'));
      if(!attr && state.attributes?.unit_of_measurement && !suffix){
        node.append($('span','hint','Tip: deze sensor gebruikt '+state.attributes.unit_of_measurement+' als eenheid. Vul die eventueel in bij Achtervoegsel.'));
      }
    }
    _fillBadgeEditor(id){
      const item=this._allItems().find(x=>x.id===id),badge=item?this._badgeForItem(item):null;
      const b=badge&&typeof badge==='object'?badge:null;
      const q=k=>this.dialog.querySelector('#pala-badge-'+k);
      q('select').value=item?.id||'';q('entity').value=b?.entity||'';
      q('template').value=b?.template||'';
      q('auto_lines').checked=b?.auto_lines!==false;
      q('switch-entity').value=b?.switch_entity||'';
      const defaults=['HOT WATER','HEAT','OFF'];
      for(let i=0;i<3;i++){
        const rule=b?.switch_cases?.[i];
        q('switch-state-'+i).value=rule?.state||(!b?.switch_entity?defaults[i]:'');
        q('switch-sensor-'+i).value=rule?.entity||'';
        q('switch-prefix-'+i).value=rule?.prefix||'';
        q('switch-text-'+i).value=rule?.text||(!b?.switch_entity&&i===2?'Uit':'');
      }
      this.dialog.querySelector('#pala-badge-switch-panel').open=!!b?.switch_entity;
      this._refreshBadgeInsertAttributes();
      q('color_entity').value=b?.color_entity||'';
      q('color_transition').value=['gradient','direct'].includes(b?.color_transition)?b.color_transition:'steps';q('color_stops').value=b?.color_stops||'';
      this._badgeFillStops(b?.color_stops||'');
      q('color_attribute').value=b?.color_attribute||'';q('color_rules').value=b?.color_rules||'';
      const fallback=hex6(b?.color_fallback);
      q('fallback_enabled').checked=!!fallback;
      q('color_fallback').value=fallback||'#22c55e';q('color_fallback-hex').value=q('color_fallback').value;
      q('custom_color').value=hex6(b?.custom_color)||'#38bdf8';q('custom_color-hex').value=q('custom_color').value;
      this._refreshBadgeColorAttributeOptions(b?.color_attribute||'');
      const list=this.dialog.querySelector('#pala-badge-color-rule-list');list?.replaceChildren();
      this._badgeRuleSeq=0;
      for(const raw of text(b?.color_rules).split(/[;\n]/).slice(0,15)){
        const split=raw.lastIndexOf('=');if(split<=0)continue;
        const color=sensorColor(raw.slice(split+1));if(color)this._badgeAddRule(raw.slice(0,split),color);
      }
      q('label_color_from_badge').checked=b?.label_color_from_badge===true;
      q('icon_color_from_badge').checked=b?.icon_color_from_badge===true;
      q('custom-attribute').value='';
      q('show').value=b?.show||'always';q('prefix').value=b?.prefix||'';q('suffix').value=b?.suffix||'';q('color').value=b?.color||'accent';
      for(const [field,fallback] of [['format','auto'],['layout','right'],['style','solid'],['size','normal'],['max_chars',0],['decimals',1]])q(field).value=b?.[field]??fallback;
      this._refreshBadgeAttributeOptions(b?.attribute||'');
    }
    _editorBadgeSave(){
      const q=k=>text(this.dialog.querySelector('#pala-badge-'+k)?.value),id=q('select');
      if(!id){this._editorNotice('Selecteer eerst een menuknop.');return;}
      const switchInput=this._badgeSwitchInput();
      const hasSwitch=isEntity(switchInput.switch_entity) && switchInput.switch_cases.some(row=>row.state&&(isEntity(row.entity)||row.text));
      if(!isEntity(q('entity'))&&!q('template')&&!hasSwitch){
        this._editorNotice('Kies een badgesensor, vul een sjabloon in of stel een stand-sensor met een geldige regel in.');return;
      }
      const attribute=this._selectedBadgeAttribute();
      this.saved.badge_overrides[id]=badgeSpec({entity:q('entity'),template:q('template'),...switchInput,auto_lines:this.dialog.querySelector('#pala-badge-auto_lines')?.checked!==false,attribute,show:q('show'),prefix:q('prefix'),suffix:q('suffix'),color:q('color'),custom_color:q('custom_color'),color_entity:q('color_entity'),color_attribute:this._selectedBadgeColorAttribute(),color_rules:q('color_rules'),color_transition:q('color_transition'),color_stops:q('color_stops'),color_fallback:this.dialog.querySelector('#pala-badge-fallback_enabled')?.checked?q('color_fallback'):'',label_color_from_badge:this.dialog.querySelector('#pala-badge-label_color_from_badge')?.checked,icon_color_from_badge:this.dialog.querySelector('#pala-badge-icon_color_from_badge')?.checked,format:q('format'),layout:q('layout'),style:q('style'),size:q('size'),max_chars:q('max_chars'),decimals:q('decimals')});
      this._saveSettings();this._drawList();this._editorNotice('Badge opgeslagen. Je kunt alle velden blijven wijzigen of wissen.');
    }
    _editorBadgeRemove(){
      const id=text(this.dialog.querySelector('#pala-badge-select')?.value);if(!id)return;
      this.saved.badge_overrides[id]=null;this._saveSettings();this._drawList();this._fillBadgeEditor(id);this._editorNotice('Badge uitgeschakeld.');
    }
    _actionEditor(pane){
      pane.append($('h3',null,'Klikactie kiezen'),$('p',null,'Kies wat er gebeurt als je op een menuknop tikt. Een service wordt uitsluitend na jouw tik en extra bevestiging uitgevoerd.'));
      pane.append(this._formField('Menuknop','pala-action-select','',[['','— Selecteer een menuonderdeel —'],...this._selectItems()]));
      pane.append(this._formField('Bij aanklikken','pala-action-type','none',[['none','Normale navigatie'],['more-info','Home Assistant entiteitdialoog'],['dialog','Eigen infodialoog'],['toggle','Entiteit aan/uit schakelen'],['service','Home Assistant service uitvoeren (met bevestiging)'],['navigate','Andere pagina openen']]));
      pane.append(this._entityField('Entiteit (waar relevant)','pala-action-entity'));
      pane.append(this._formField('Dialoogtitel','pala-action-title'),this._formField('Tekst in dialoog','pala-action-message'));
      pane.append(this._formField('Pad bij navigeren','pala-action-path'));
      pane.append(this._formField('Service domein (bijv. light)','pala-action-domain'),this._formField('Service naam (bijv. turn_on)','pala-action-service'));
      const row=$('div','btnrow');row.append(this._button('Actie opslaan','editor-action-save','primary'),this._button('Actie herstellen','editor-action-remove'));pane.append(row);
      pane.append($('p','warning','Let op: HA-toegangsrechten blijven gelden. Kies geen ontgrendeling of alarm-uitschakeling zonder bewuste beveiliging.'));
    }
    _toggleActionFields(){
      const type=this.dialog.querySelector('#pala-action-type')?.value;
      for(const id of ['entity','title','message','path','domain','service']){
        const visible=id==='entity'?['more-info','toggle','service','dialog'].includes(type):
          ['title','message'].includes(id)?type==='dialog':id==='path'?type==='navigate':type==='service';
        const node=this.dialog.querySelector('#pala-action-'+id);if(node)node.closest('.field').hidden=!visible;
      }
    }
    _fillActionEditor(id){
      const item=this._allItems().find(x=>x.id===id),action=item?this._actionForItem(item):null;
      const q=k=>this.dialog.querySelector('#pala-action-'+k);
      q('select').value=item?.id||'';q('type').value=action?.type||'none';q('entity').value=action?.entity||'';
      q('title').value=action?.title||'';q('message').value=action?.message||'';q('path').value=action?.path||item?.path||'';
      q('domain').value=action?.domain||'';q('service').value=action?.service||'';
      this._toggleActionFields();
    }
    _editorActionSave(){
      const q=k=>text(this.dialog.querySelector('#pala-action-'+k)?.value),id=q('select');
      if(!id){alert('Selecteer eerst een menuknop.');return;}
      const type=q('type');
      const spec=type==='none'?null:actionSpec({type,entity:q('entity'),title:q('title'),message:q('message'),path:q('path'),domain:q('domain'),service:q('service')});
      if(type!=='none'&&!spec){alert('De actie heeft nog ongeldige of ontbrekende gegevens.');return;}
      this.saved.action_overrides[id]=spec;this._saveSettings();this._drawList();this._editorNotice('Klikactie opgeslagen.');
    }
    _editorActionRemove(){
      const id=text(this.dialog.querySelector('#pala-action-select')?.value);if(!id)return;
      delete this.saved.action_overrides[id];this._saveSettings();this._drawList();this._fillActionEditor(id);this._editorNotice('Standaardactie hersteld.');
    }
    _sensorEditor(pane){
      pane.append($('h3',null,'Live sensoren onderin de sidebar'),
        $('p',null,'Kies een sensor via de zoekfunctie en stel de naam en het icoon naar wens in. Klik in de sidebar op de sensor voor de gewone Home Assistant-informatie.'));
      pane.append(this._help('Eigen naam, afbeelding en sensorwaarden',
        'De statussensor bepaalt welke Home Assistant-entiteit opent bij een tik. Gebruik een andere sensor voor de dynamische titel of een icoon uit attribuut icon, emoji of entity_picture. Bij wegvallen wordt de vaste naam of het vaste MDI-icoon gebruikt.'));
      const all=this.saved.quick_entities??this._resolved().quick_entities;
      pane.append(this._formField('Bestaande sensor bewerken','pala-sensor-select','',[
        ['','＋ Nieuwe sensor'],...all.map(e=>[e.entity_id,e.label+' · '+e.entity_id])
      ]));
      pane.append(this._entityField('Statussensor (zoek op naam of entity-ID)','pala-sensor-entity'));
      pane.append($('h3',null,'Vaste naam en icoon (ook als fallback)'));
      pane.append(this._formField('Weergavenaam','pala-sensor-name'));
      pane.append(this._formField('Vast icoon (mdi:...)','pala-sensor-icon','mdi:information-outline'));
      const dynamic=$('div','layout-dynamic-panel');
      dynamic.append($('h4',null,'Dynamische naam en sensoricoon'),
        $('p','field-note','Laat de naam en het icoon automatisch veranderen op basis van een Home Assistant-sensor. De vaste waarden hierboven blijven als terugval behouden.'));
      dynamic.append(this._entityField('Naam automatisch uit sensor','pala-sensor-title-entity'));
      dynamic.append(this._formField('Welke sensorwaarde wordt de naam?','pala-sensor-title-attribute','', [['','Sensorwaarde (state)']]));
      dynamic.append(this._entityField('Icoon / foto / emoji uit sensor','pala-sensor-icon-entity'));
      dynamic.append(this._formField('Welke waarde wordt het icoon?','pala-sensor-icon-attribute','auto',[
        ['auto','Automatisch (icon / foto / emoji / state)'],['icon','Attribuut icon'],
        ['entity_picture','Attribuut entity_picture'],['state','Sensorwaarde']
      ]));
      const row=$('div','btnrow');
      row.append(this._button('Gebruik statussensor voor naam','editor-sensor-use-status-title'),
        this._button('Gebruik statussensor voor icoon','editor-sensor-use-status-icon'),
        this._button('Gebruik naamsensor voor icoon','editor-sensor-use-title-icon'));
      dynamic.append(row);
      dynamic.append($('p','field-note','Je hoeft geen entity-ID te onthouden. Typ een deel van de naam en kies een voorstel. Daarna kun je een beschikbaar attribuut selecteren.'));
      const preview=$('div','layout-dynamic-preview');preview.id='pala-sensor-dynamic-preview';preview.setAttribute('aria-live','polite');dynamic.append(preview);
      pane.append(dynamic);
      const buttons=$('div','btnrow');buttons.append(this._button('Sensor opslaan','editor-sensor-add','primary'),
        this._button('Nieuw','editor-sensor-new'));
      pane.append(buttons);
      const list=$('div','sensor-editor-list');list.id='pala-sensor-list';
      for(const entity of all){
        const rec=$('div','editor-record');
        rec.append($('span',null,entity.label+' · '+entity.entity_id));
        const edit=this._button('Bewerken','editor-sensor-edit');edit.dataset.entity=entity.entity_id;
        const remove=this._button('Verwijderen','editor-sensor-remove');remove.dataset.entity=entity.entity_id;
        rec.append(edit,remove);list.append(rec);
      }
      pane.append(list);
    }
    _fillSensorAttributes(kind,requested){
      const entity=this.dialog.querySelector('#pala-sensor-'+kind+'-entity')?.value||'';
      const picker=this.dialog.querySelector('#pala-sensor-'+kind+'-attribute');if(!picker)return;
      const current=requested===undefined?picker.value:requested;
      const state=this.hass?.states?.[entity];
      const options=kind==='title'?[['','Sensorwaarde (state)']]:[
        ['auto','Automatisch (icon / foto / emoji / state)'],
        ['icon','Attribuut icon'],['entity_picture','Attribuut entity_picture'],['state','Sensorwaarde']];
      const keys=new Set(options.map(([v])=>v));
      for(const key of Object.keys(state?.attributes||{}).sort()){
        if(!/^[a-zA-Z0-9_-]{1,80}$/.test(key)||keys.has(key))continue;
        const value=state.attributes[key];
        if(kind==='icon'&&!isSafeIcon(value)&&!safeEntityPicture(value)&&!safeSensorEmoji(value))continue;
        keys.add(key);options.push([key,key+' · '+String(value).slice(0,45)]);
      }
      if(current&&!keys.has(current)&&/^[a-zA-Z0-9_-]{1,80}$/.test(current))options.push([current,current+' (niet beschikbaar)']);
      picker.replaceChildren(...options.map(([v,label])=>{const opt=$('option',null,label);opt.value=v;return opt;}));
      picker.value=current|| (kind==='icon'?'auto':'');
    }
    _fillSensorEditor(entity){
      const find=id=>this.dialog.querySelector('#pala-sensor-'+id);
      const entries=this.saved.quick_entities??this._resolved().quick_entities;
      const found=entries.find(e=>e.entity_id===entity);
      if(find('select'))find('select').value=found?.entity_id||'';
      find('entity').value=found?.entity_id||'';
      find('name').value=found?.label||'';
      find('icon').value=found?.icon||'mdi:information-outline';
      find('title-entity').value=found?.title_entity||'';
      find('icon-entity').value=found?.icon_entity||'';
      this._fillSensorAttributes('title',found?.title_attribute||'');
      this._fillSensorAttributes('icon',found?.icon_attribute||'auto');
      this._previewSensor();
    }
    _previewSensor(){
      const pane=this.dialog?.querySelector('#pala-sensor-dynamic-preview');if(!pane)return;
      const q=id=>text(this.dialog.querySelector('#pala-sensor-'+id)?.value);
      const baseEntity=q('entity');
      const sample=quickEntity({entity_id:isEntity(baseEntity)?baseEntity:'sensor.preview',
        label:q('name')||this.hass?.states?.[baseEntity]?.attributes?.friendly_name||baseEntity||'Voorbeeld sensor',
        icon:q('icon'),title_entity:q('title-entity'),title_attribute:q('title-attribute'),
        icon_entity:q('icon-entity'),icon_attribute:q('icon-attribute')});
      if(!sample)return;
      const display=this._healthDisplay(sample);
      const ico=this._icon(sample.icon,'◈');this._drawDynamicIcon(ico,display.icon,true);
      const value=this.hass?.states?.[sample.entity_id];
      pane.replaceChildren(ico,$('strong',null,display.label),$('span','value',relativeLabel(value)));
    }
    _editorSensorAdd(){
      const q=id=>text(this.dialog.querySelector('#pala-sensor-'+id)?.value);
      const entity=q('entity');
      if(!isEntity(entity)){alert('Kies eerst een geldige sensor of entiteit uit Home Assistant.');return;}
      const name=q('name')||this.hass?.states?.[entity]?.attributes?.friendly_name||entity;
      const icon=q('icon')||'mdi:information-outline';
      if(!isSafeIcon(icon)){alert('Gebruik voor het vaste icoon een geldig mdi:...-icoon.');return;}
      const titleEntity=q('title-entity'),iconEntity=q('icon-entity');
      if((titleEntity&&!isEntity(titleEntity))||(iconEntity&&!isEntity(iconEntity))){alert('Kies een geldige entiteit voor de dynamische naam of het icoon.');return;}
      const stored=quickEntity({entity_id:entity,label:name,icon,title_entity:titleEntity,title_attribute:q('title-attribute'),
        icon_entity:iconEntity,icon_attribute:q('icon-attribute')});
      const previous=q('select');
      const all=this.saved.quick_entities??[...this._resolved().quick_entities];
      const cleaned=all.filter(i=>i.entity_id!==entity&&i.entity_id!==previous);
      const selectedIndex=all.findIndex(e=>e.entity_id===(previous||entity));
      cleaned.splice(Math.min(selectedIndex<0?cleaned.length:selectedIndex,cleaned.length),0,stored);
      this.saved.quick_entities=cleaned.slice(0,20);
      this._saveSettings();this.redraw();this._rebuildSettingsAtSamePosition('sensors');
      this._fillSensorEditor(entity);this._editorNotice('Live sensor opgeslagen.');
    }
    _editorSensorRemove(entity){
      this.saved.quick_entities=(this.saved.quick_entities??this._resolved().quick_entities).filter(i=>i.entity_id!==entity);
      this._saveSettings();this.redraw();this._rebuildSettingsAtSamePosition('sensors');
      this._editorNotice('Sensor verwijderd.');
    }
    _editorNotice(message){
      let node=this.dialog.querySelector('#pala-editor-notice');if(!node){node=$('p','editor-notice');node.id='pala-editor-notice';this.dialog.querySelector('.dialog-content')?.append(node);}
      node.textContent=message;node.setAttribute('role','status');node.setAttribute('aria-live','polite');
      if(this._editorNoticeTimer)clearTimeout(this._editorNoticeTimer);
      this._editorNoticeTimer=setTimeout(()=>{node.remove();this._editorNoticeTimer=null;},2700);
    }
    _agendaAvailable(){
      return Object.entries(this.hass?.states||{}).filter(([id])=>/^calendar\.[a-z0-9_]+$/.test(id))
        .map(([id,st])=>({id,name:text(st?.attributes?.friendly_name||id.replace(/^calendar\./,'').replace(/_/g,' '))})).sort((a,b)=>a.name.localeCompare(b.name,'nl'));
    }
    _agendaSelected(){
      const a=cleanAgenda(this.saved.agenda);
      // A newly enabled agenda starts with the known four waste calendars.
      return a.calendars.length?a.calendars:AGENDA_WASTE_CALENDARS.filter(id=>!!this.hass?.states?.[id]);
    }
    _agendaSaveEditor(){
      if(!this._prefsStore?.ready){this._editorNotice('Wacht tot je persoonlijke Home Assistant-instellingen geladen zijn voordat je de agenda opslaat.');return;}
      const q=id=>this.dialog.querySelector('#'+id);
      const enabled=!!q('pala-agenda-enabled')?.checked;
      const calendars=[...this.dialog.querySelectorAll('[data-agenda-calendar]:checked')].map(node=>node.dataset.agendaCalendar);
      if(enabled&&!calendars.length){this._editorNotice('Kies minimaal één agenda voordat je de widget inschakelt.');return;}
      const previous=cleanAgenda(this.saved.agenda);
      const next=cleanAgenda({enabled,calendars,days:q('pala-agenda-days')?.value,limit:q('pala-agenda-limit')?.value,title:q('pala-agenda-title')?.value,collapsed:previous.collapsed,
        theme:q('pala-agenda-theme')?.value,size:q('pala-agenda-size')?.value,showCalendar:q('pala-agenda-show-calendar')?.checked});
      this.saved.agenda=next;
      // Size and theme changes are paint-only: never refetch or clear good data.
      const queryChanged=previous.enabled!==next.enabled||previous.days!==next.days||JSON.stringify(previous.calendars)!==JSON.stringify(next.calendars);
      if(queryChanged){this._agendaCache.generation++;this._agendaCache.pending=false;this._agendaCache.key='';this._agendaCache.at=0;this._agendaCache.events=[];this._agendaCache.status='';}
      this._agendaRenderSignature='';
      this._saveSettings();this._agendaPaint();if(queryChanged)this._agendaMaybeFetch();
      this._editorNotice(enabled?'Agenda-widget ingeschakeld en opgeslagen.':'Agenda-widget uitgeschakeld en opgeslagen.');
    }
    _agendaEditor(page){
      const a=cleanAgenda(this.saved.agenda),available=this._agendaAvailable(),selected=a.calendars.length?a.calendars:AGENDA_WASTE_CALENDARS.filter(id=>available.some(v=>v.id===id));
      page.append($('h3',null,'Agenda in de sidebar'),$('p','field-note','Bekijk de eerstvolgende afspraken rechtstreeks vanuit je Home Assistant-agenda’s. Standaard staat de widget uit; alleen je eigen accountinstellingen veranderen.'));
      page.append(this._help('Waar komen de afspraken vandaan?',
        'PalaSidebar vraagt agenda-afspraken aan Home Assistant via calendar.get_events. Er worden geen nieuwe afspraken gemaakt of bestaande afspraken gewijzigd. De widget ververst ongeveer iedere vijf minuten, en alleen zolang hij aanstaat.'));
      const toggle=$('label','check'),check=$('input');check.type='checkbox';check.id='pala-agenda-enabled';check.checked=a.enabled;toggle.append(check,$('span',null,'Agenda-widget in sidebar tonen'));page.append(toggle);
      page.append(this._formField('Naam boven de agenda','pala-agenda-title',a.title));
      page.append(this._formField('Hoeveel afspraken tonen?','pala-agenda-limit',String(a.limit),[1,2,3,4,5].map(n=>[String(n),n+' afspraak'+(n===1?'':'en')])));
      page.append(this._formField('Hoe ver vooruit kijken?','pala-agenda-days',String(a.days),[[7,'7 dagen'],[14,'14 dagen'],[30,'30 dagen'],[60,'60 dagen']]));
      page.append($('h3',null,'Uiterlijk en formaat'),$('p','field-note','De agenda volgt het PalaSidebar-thema. Afvalafspraken gebruiken exact de kleuren van je bestaande afvalbeheersensor: GFT groen, PMD cyaan, Papier grijs en Restafval oranje. In- en uitklappen werkt nu vloeiend.'));
      page.append(this._formField('Thema van de agenda','pala-agenda-theme',a.theme,[['sidebar','Volg PalaSidebar (aanbevolen)'],['soft','Rustige themakleuren'],['glass','Transparant glas']]));
      page.append(this._formField('Grootte van de agenda','pala-agenda-size',a.size,[['mini','Mini · één regel per afspraak'],['compact','Compact · kortere kaarten'],['normal','Normaal · huidige formaat'],['comfortable','Ruim · extra leesbaar']]));
      const subtitleToggle=$('label','check'),subtitleCheck=$('input');subtitleCheck.type='checkbox';subtitleCheck.id='pala-agenda-show-calendar';subtitleCheck.checked=a.showCalendar;
      subtitleToggle.append(subtitleCheck,$('span',null,'Agendanaam onder de afspraak tonen'));page.append(subtitleToggle);
      page.append(this._help('Wat verandert bij Mini en Compact?',
        'Mini toont elke afspraak op één regel en verbergt de agendanaam. Compact heeft kleinere datumvakjes en maximaal twee titelregels. Alle details blijven bereikbaar via het openen van de afspraak. De weergave verandert zonder extra kalenderaanvragen.'));
      page.append($('h3',null,'Welke agenda’s?'),$('p','field-note','Kies een of meer agenda’s. Met “Afvalkalenders” selecteer je meteen jouw vier Lingewaard-afvalagenda’s.'));
      const quick=$('div','btnrow');quick.append(this._button('♻ Afvalkalenders','agenda-pick-waste'),this._button('Alles','agenda-pick-all'),this._button('Geen','agenda-pick-none'));page.append(quick);
      const grid=$('div','pala-agenda-editor-grid');
      if(!available.length)grid.append($('p','field-note','Er zijn op dit moment geen calendar.*-entiteiten beschikbaar. Controleer de Home Assistant-kalenderintegratie.'));
      for(const item of available){
        const l=$('label','pala-agenda-choice'),input=$('input');input.type='checkbox';input.dataset.agendaCalendar=item.id;input.checked=selected.includes(item.id);
        const name=$('span',null,item.name);name.title=item.id;l.append(input,name);grid.append(l);
      }
      page.append(grid);
      const info=$('div','pala-agenda-preview');info.append($('strong',null,'Voorbeeld van de sidebar'),$('p',null,'📅 30 okt · GFT / PMD / of je eigen afspraken, met een datum en een duidelijke aanduiding “Vandaag”, “Morgen” of “Over X dagen”.'));page.append(info);
      page.append(this._button('Agenda-instellingen opslaan','agenda-save','primary'));
    }
    _agendaDate(start){
      if(typeof start!=='string')return null;
      // Never silently normalize e.g. 2026-02-31 into March. The date part
      // must be a real calendar day, even if the timestamp has an offset.
      const m=/^(\d{4})-(\d{2})-(\d{2})(?=$|[Tt ])/.exec(start);if(!m)return null;
      const year=+m[1],month=+m[2],day=+m[3];
      if(month<1||month>12||day<1||day>31||
         new Date(Date.UTC(year,month-1,day)).toISOString().slice(0,10)!==m[0].slice(0,10))return null;
      const dateOnly=start.length===10;
      const d=dateOnly?new Date(year,month-1,day,12):new Date(start.replace(' ','T'));
      return Number.isFinite(d.getTime())?d:null;
    }
    _agendaRelative(date){
      const now=new Date();const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());
      const diff=Math.round((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);
      return diff===0?'Vandaag':diff===1?'Morgen':diff>1?'Over '+diff+' d':'Eerder';
    }
    async _agendaMaybeFetch(force=false){
      const a=cleanAgenda(this.saved.agenda);if(!a.enabled||document.hidden||!this.isConnected||!this.hass||
         (this.dataset.compact==='true'&&this.integration==='native'))return;
      const selected=this._agendaSelected().filter(id=>this.hass.states?.[id]);if(!selected.length)return;
      const key=[this.hass.user?.id||'',selected.join(','),a.days].join('|');const cache=this._agendaCache;
      if(cache.pending)return;
      if(!force&&cache.key===key&&Date.now()-cache.at<300000)return;
      if(typeof this.hass.callWS!=='function'){
        cache.status='Geen Home Assistant-kalenderverbinding';cache.at=Date.now();cache.key=key;this._agendaPaint();return;
      }
      cache.pending=true;cache.status='laden';cache.key=key;const generation=++cache.generation;this._agendaPaint();
      try{
        const now=new Date();const end=new Date(now);end.setDate(end.getDate()+a.days);
        const payload={type:'call_service',domain:'calendar',service:'get_events',return_response:true,
          target:{entity_id:selected},service_data:{start_date_time:now.toISOString(),end_date_time:end.toISOString()}};
        const raw=await this.hass.callWS(payload);
        if(generation!==cache.generation)return;
        const response=raw?.response||raw;
        if(!response||typeof response!=='object'||Array.isArray(response))throw Error('Geen geldige kalenderrespons');
        const events=[],keys=new Set();
        for(const id of selected){
          const list=response[id]?.events;
          if(!Array.isArray(list))continue;
          for(const ev of list){
            const date=this._agendaDate(ev?.start);if(!date)continue;
            const summary=text(ev?.summary||'Afspraak').slice(0,140);
            const dateKey=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
            // All-day duplicates (same title + day) are collapsed. For timed
            // calendars preserve separate appointments on the same day when
            // their start times differ, even if they have the same title.
            const timed=typeof ev.start==='string'&&ev.start.length>10;
            const unique=id+'|'+dateKey+'|'+summary.toLocaleLowerCase('nl')+
              (timed?'|'+date.getTime():'');
            if(keys.has(unique))continue;keys.add(unique);
            events.push({id,summary,start:date,time:ev.start||'',calendar:this.hass.states?.[id]?.attributes?.friendly_name||id});
          }
        }
        events.sort((x,y)=>x.start-y.start||x.summary.localeCompare(y.summary,'nl'));
        cache.events=events.slice(0,60);cache.status='goed';cache.at=Date.now();
      }catch(e){
        if(generation!==cache.generation)return;
        // Keep the last successful snapshot when HA is briefly unavailable.
        cache.status='fout';cache.at=Date.now();cache.error=text(e?.message||e).slice(0,120);
      }finally{
        if(generation===cache.generation){cache.pending=false;this._agendaRenderSignature='';this._agendaPaint();}
      }
    }
    _agendaPaint(){
      if(!this.agenda)return;
      const a=cleanAgenda(this.saved.agenda);
      this.agenda.hidden=!a.enabled;if(!a.enabled)return;
      this.agenda.dataset.collapsed=String(a.collapsed);
      this.agenda.dataset.theme=a.theme;this.agenda.dataset.size=a.size;
      this.agenda.dataset.showCalendar=String(a.showCalendar);
      // Bij alleen de ingeklapte status wijzigen blijft de inhoud staan,
      // zodat CSS de echte hoogte/opacity soepel kan animeren.
      const existingTitle=this.agenda.querySelector('.pala-agenda-title');
      if(existingTitle){existingTitle.setAttribute('aria-expanded',String(!a.collapsed));existingTitle.title=a.collapsed?'Agenda uitklappen':'Agenda inklappen';}
      const existingEntries=this.agenda.querySelector('.pala-agenda-entries');
      if(existingEntries){existingEntries.setAttribute('aria-hidden',String(a.collapsed));existingEntries.inert=a.collapsed;}
      const cache=this._agendaCache,items=cache.events.slice(0,a.limit);
      const stamp=new Date().toDateString();
      const signature=JSON.stringify([a.enabled,a.calendars,a.days,a.limit,a.title,a.theme,a.size,a.showCalendar,
        cache.key,cache.at,cache.status,items.map(x=>[x.id,x.summary,x.start.toISOString()]),stamp]);
      if(signature===this._agendaRenderSignature)return;
      this._agendaRenderSignature=signature;
      const head=$('div','pala-agenda-head');const title=$('button','pala-agenda-title');title.type='button';title.dataset.do='agenda-collapse';title.title=a.collapsed?'Agenda uitklappen':'Agenda inklappen';title.setAttribute('aria-expanded',String(!a.collapsed));
      title.append(this._icon('mdi:calendar-month-outline','📅'),$('span',null,a.title),makeChevron('pala-agenda-chevron'));head.append(title);
      const open=this._button('','agenda-open','pala-agenda-button');open.title='Home Assistant-agenda openen';open.setAttribute('aria-label','Volledige agenda openen');open.append(this._icon('mdi:open-in-new','↗'));head.append(open);
      const reload=this._button('','agenda-refresh','pala-agenda-button');reload.title='Agenda verversen';reload.setAttribute('aria-label','Agenda verversen');reload.append(this._icon('mdi:refresh','↻'));head.append(reload);
      const entries=$('div','pala-agenda-entries');
      entries.setAttribute('aria-hidden',String(a.collapsed));entries.inert=a.collapsed;
      const inner=$('div','pala-agenda-entries-inner');
      if(!items.length){
        const message=cache.pending?'Afspraken ophalen…':cache.status==='fout'?'Kalender tijdelijk niet bereikbaar':cache.status==='goed'?'Geen afspraken in deze periode.':'Kies een agenda in Instellingen → Agenda.';
        inner.append($('p','pala-agenda-empty',message));
      }
      for(const item of items){
        const b=$('button','pala-agenda-entry');b.type='button';b.dataset.do='agenda-entry';b.title=item.calendar+' · '+item.summary;
        // Exact palet uit de bestaande Home Assistant-afvalbeheersensor.
        const c=agendaWasteColor(item.id,item.summary);
        if(c)b.style.setProperty('--p-agenda-color',c);
        const dt=$('span','pala-agenda-date');dt.append($('strong',null,String(item.start.getDate())),$('small',null,item.start.toLocaleDateString('nl-NL',{month:'short'})));
        const content=$('span','pala-agenda-copy');content.append($('strong',null,item.summary),$('small',null,item.calendar));
        const longRelative=this._agendaRelative(item.start);
        const miniRelative=a.size==='mini' ? (longRelative.startsWith('Over ')?longRelative.replace(/^Over (\d+) d$/,'$1d'):longRelative) : longRelative;
        const relative=$('span','pala-agenda-relative',miniRelative);relative.title=longRelative;
        b.append(dt,content,relative);inner.append(b);
      }
      entries.append(inner);
      this.agenda.replaceChildren(head,entries);
    }
    showSettings(tab=this.editorTab||'general'){
      // Herbouw alleen bij openen of na expliciete opslaan/verwijderen-actie.
      this.dialog.classList.add('settings-dialog');
      this.dialog.replaceChildren();
      const pane=$('div','dialog-content');
      const intro=$('div','settings-intro');intro.append($('h2',null,'PalaSidebar · Instellingen'),
        $('p',null,'Personaliseer je sidebar. Wijzigingen worden bewaard bij Home Assistant onder je gebruikersaccount.'));
      const topClose=this._button('✕','settings-close-top','settings-close-top');topClose.setAttribute('aria-label','Instellingen sluiten');topClose.title='Sluiten';intro.append(topClose);
      pane.append(intro);
      const sync=$('div','pala-sync-status','◌ Instellingen laden / synchroniseren');
      sync.id='pala-storage-pill';sync.setAttribute('role','status');sync.setAttribute('aria-live','polite');
      pane.append(sync);
      const tabs=$('div','editor-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Instellingencategorieën');
      for(const [id,label] of [['general','Algemeen'],['header','Header'],['layout','Indeling'],['quick','Snelmenu'],['menu','Dashboards'],['badges','Badges'],['actions','Acties'],['sensors','Sensoren'],['agenda','Agenda'],['live_center','Control Center'],['themes','Thema’s'],['design','Design'],['ui_style','PalaSidebar UI'],['diagnostic','Diagnose'],['performance','Performance'],['backup','Backup']]){
        const b=this._button(label,'editor-tab');b.dataset.tab=id;b.id='pala-tab-'+id;b.setAttribute('role','tab');b.setAttribute('aria-controls','pala-page-'+id);tabs.append(b);
      }
      const tabsWrap=$('div','editor-tabs-wrap');
      const prev=this._button('‹','editor-tabs-prev','tabs-scroll-btn');prev.setAttribute('aria-label','Vorige instellingentabs');prev.title='Vorige tabs';
      const next=this._button('›','editor-tabs-next','tabs-scroll-btn');next.setAttribute('aria-label','Volgende instellingentabs');next.title='Volgende tabs';
      tabsWrap.append(prev,tabs,next);pane.append(tabsWrap);
      const page=(id)=>{const box=$('section','editor-page');box.id='pala-page-'+id;box.dataset.editorPage=id;box.setAttribute('role','tabpanel');box.setAttribute('aria-labelledby','pala-tab-'+id);pane.append(box);return box;};
      const general=page('general');
      general.append(this._help('Wat verandert PalaSidebar?',
        'De sidebar beheert alleen de navigatie en de eigen dialogen. De Home Assistant-dashboards, rechten en apparatuur blijven ongewijzigd. Instellingen worden per account opgeslagen zodra de synchronisatie is bevestigd.'));
      general.append(this._formField('Weergave','pala-mode',this.saved.mode||'auto', [['auto','Automatisch'],['integrated','Ingebouwd'],['floating','Zwevend menu']]));
      general.append(this._formField('Dichtheid','pala-density',this.saved.density||'compact',[['compact','Compact'],['normal','Ruim']]));
      general.append(this._formField('Apparaatprofiel','pala-device',this.saved.device||'auto',[['auto','Automatisch'],['desktop','Computer'],['tablet','Tablet / PalaKiosk'],['phone','Telefoon']]));
      general.append(this._formField('Kleuraccent (hex)','pala-color',this.saved.accent||colour(this.config.appearance.accent)));
      for(const [id,label,checked] of [
        ['pala-mobile-dock','Mobiele navigatiebalk onderaan',this._dockEnabled()],
        ['pala-mobile-swipe','Vanaf de linkerrand vegen om het menu te openen',this.saved.mobile_swipe??this._mobile().swipe_open]]){
        const line=$('label','check');const box=$('input');box.type='checkbox';box.id=id;box.checked=checked;line.append(box,$('span',null,label));general.append(line);
      }
      general.append($('h3',null,'Animaties en dialogen'));
      general.append(this._formField('Animatiesnelheid dialogen','pala-dialog-motion',this.saved.dialog_motion||'smooth',
        [['off','Uit · maximaal licht'],['fast','Snel · 140 ms'],['smooth','Soepel · 220 ms (aanbevolen)'],['relaxed','Rustig · 320 ms']]));
      general.append(this._formField('Open-/sluiteffect','pala-dialog-style',this.saved.dialog_style||'lift',
        [['lift','Zacht omhoog / omlaag'],['zoom','Subtiel in-/uitzoomen'],['fade','Alleen vervagen']]));
      general.append(this._formField('Donkerte achter dialoog','pala-dialog-backdrop',this.saved.dialog_backdrop||'normal',
        [['soft','Licht'],['normal','Normaal'],['strong','Donker']]));
      general.append(this._formField('Desktop-sidebar in-/uitschuiven','pala-rail-motion',this.saved.rail_motion||'smooth',
        [['fast','Snel'],['smooth','Soepel (aanbevolen)'],['relaxed','Rustig'],['off','Zonder inhoudsanimatie']]));
      general.append($('p',null,'De originele Home Assistant-drawer blijft zelf verantwoordelijk voor de breedte en mobiele terugknop. De instellingen regelen alleen de PalaSidebar-inhoud en eigen dialogen. Systeeminstelling ‘verminder beweging’ heeft altijd voorrang.'));
      general.append($('p',null,'Android-terug: PalaSidebar-menu en eigen dialogen gebruiken elk één tijdelijke geschiedenisstap. Home Assistant- en Browser Mod-dialogen worden door Home Assistant zelf beheerd. Op Android bepaalt de Companion App/WebView uiteindelijk of de fysieke terugknop aan de pagina wordt doorgegeven.'));
      const headPage=page('header');const hh=this._header();
      headPage.append($('h3',null,'Home Assistant header'),
        $('p',null,'De aanpassing geldt alleen voor de linker Home Assistant-sidebar. De titelbalk boven een dashboard blijft intact.'));
      headPage.append(this._formField('Originele Home Assistant-header','pala-ha-header',hh.ha,
        [['normal','Standaard'],['title-hidden','Alleen titel verbergen'],['compact','Compact'],['hidden','Hele header verbergen (aanbevolen)']]));
      headPage.append(this._formField('Eigen titel in HA-header (optioneel)','pala-ha-title',hh.ha_title));
      headPage.append(this._help('Dynamische titel en icoon',
        'Gebruik een sensorwaarde of attribuut voor de titel, bijvoorbeeld race_name. Bij een ontbrekende sensor blijft de vaste titel beschikbaar. Extra tekstregels ondersteunen {sensor.entity_id} of {sensor.entity_id#attribuut}.'));
      headPage.append($('h3',null,'PalaSidebar-header'));
      headPage.append(this._formField('Weergave','pala-head-mode',hh.pala,
        [['normal','Normaal'],['compact','Compact (aanbevolen)'],['minimal','Alleen logo en instellingen'],['app','App-stijl met snelle icoonknoppen'],['hidden','Verbergen (instellingen onderaan blijven beschikbaar)']]));
      headPage.append(this._formField('Eigen titel (leeg = standaard)','pala-head-title',hh.title));
      headPage.append(this._formField('Eigen subtitel (leeg = standaard)','pala-head-subtitle',hh.subtitle));
      headPage.append(this._formField('Extra sensorregel onder header','pala-head-extra',hh.extra));
      headPage.append($('p','field-note','In titel, subtitel en extra regel kun je tokens gebruiken: {sensor.woonkamer_temperatuur} of {sensor.f1#race_name}. De tekst wordt zonder HTML of scripts getoond.'));
      headPage.append(this._formField('Uitlijning','pala-head-align',hh.align,[['left','Links'],['center','Midden'],['right','Rechts']]));
      headPage.append(this._formField('Tekstkleur titel (#RRGGBB, leeg = thema)','pala-head-title-color',hh.title_color));
      headPage.append(this._formField('Tekstkleur subtitel (#RRGGBB)','pala-head-subtitle-color',hh.subtitle_color));
      headPage.append(this._formField('Tekstkleur sensorregel (#RRGGBB)','pala-head-extra-color',hh.extra_color));
      headPage.append(this._formField('Titelgrootte in pixels (9–24)','pala-head-title-size',String(hh.title_size)));
      headPage.append(this._formField('Subtitelgrootte in pixels (8–20)','pala-head-subtitle-size',String(hh.subtitle_size)));
      headPage.append(this._formField('Avatar links in de header','pala-head-logo-mode',hh.logo_mode,[['account','Home Assistant-account (profielfoto / initialen)'],['custom','Eigen logo / icoon (bestaande instelling)']]));
      headPage.append($('p','field-note','Tik op de account-avatar om je Home Assistant-profiel te openen. Bij Eigen logo blijven je bestaande logoletters en -kleuren bruikbaar.'));
      headPage.append(this._formField('Eigen logoletters (maximaal 3)','pala-head-logo-text',hh.logo_text));
      headPage.append(this._formField('Logo-icoon (mdi:..., leeg = letters)','pala-head-logo-icon',hh.logo_icon));
      headPage.append(this._formField('Achtergrond header (#RRGGBB)','pala-head-background-color',hh.background_color));
      headPage.append(this._formField('Logokleur achtergrond (#RRGGBB)','pala-head-logo-bg',hh.logo_bg));
      headPage.append(this._formField('Kleur logo (#RRGGBB)','pala-head-logo-color',hh.logo_color));
      headPage.append(this._formField('Kleur klok (#RRGGBB)','pala-head-clock-color',hh.clock_color));
      for(const [id,label,checked] of [['pala-head-logo','Avatar / logo tonen',hh.logo],['pala-head-clock','Datum/tijd tonen',hh.clock],['pala-head-quick','Van alles-knop tonen',hh.show_quick],['pala-head-settings','Instellingenknop tonen',hh.show_settings]]){
        const line=$('label','check'),box=$('input');box.type='checkbox';box.id=id;box.checked=checked;
        line.append(box,$('span',null,label));headPage.append(line);
      }
      headPage.append($('p','warning','Bij een grote Home Assistant-update kan de headerstructuur veranderen. De originele HA-navigatie blijft beschikbaar.'));
      headPage.append(this._button('Header opslaan','save-header','primary'));
      const gr=$('div','btnrow');gr.append(this._button('Instellingen opslaan','save-prefs','primary'));general.append(gr);
      this._layoutEditor(page('layout'));this._quickEditor(page('quick'));this._contextMenuEditor(pane.querySelector('#pala-page-quick'));this._menuEditor(page('menu'));this._badgeEditor(page('badges'));this._actionEditor(page('actions'));this._sensorEditor(page('sensors'));this._agendaEditor(page('agenda'));this._liveCenterEditor(page('live_center'));this._themeEditor(page('themes'));this._themeStudioPro(pane.querySelector('#pala-page-themes'));this._designEditor(page('design'));this._pfxEditor(page('ui_style'));this._diagnosticEditor(page('diagnostic'));this._performanceEditor(page('performance'));
      const backup=page('backup');backup.append($('h3',null,'Opslag en backup'),
        $('p',null,'Je persoonlijke dashboards, badges, acties, sensoren en header worden automatisch opgeslagen bij Home Assistant onder je gebruikersaccount. Cache wissen verwijdert deze serverinstellingen niet. De browser bewaart ook een lokale kopie voor als Home Assistant tijdelijk onbereikbaar is.'));
      backup.append(this._help('Veilig herstellen zonder menu-items te verliezen',
        'Exporteer voor grote updates eerst je instellingen als JSON. Herstelpunten bewaren eerdere versies per Home Assistant-account. Een lokale kopie is geen bevestigde serverbackup: wis de browsercache niet zolang de opslag nog synchroniseert of offline staat.'));
      const storageLabel=$('p','field-note','');storageLabel.id='pala-server-storage-status';backup.append(storageLabel);
      backup.append(this._button('Nu synchroniseren','sync-server'));
      backup.append($('h3',null,'Automatische herstelpunten'),$('p',null,'Bij wijzigingen bewaart PalaSidebar eerdere instellingen apart op de Home Assistant-server. Herstellen vraagt altijd bevestiging.'));
      const restoreList=$('div','diagnostic-list');restoreList.id='pala-recovery-list';backup.append(restoreList);
      backup.append(this._button('Herstelpunten verversen','recovery-refresh'));
      this._renderRecoveryPoints();
      this._showStorageStatus();
      const exports=$('div','btnrow');exports.append(this._button('Export downloaden','export','primary'),this._button('Importeren','import'),this._button('Config opnieuw laden','reload-config'),this._button('Alles herstellen','reset-prefs'));backup.append(exports);
      const textarea=$('textarea');textarea.id='pala-importtext';textarea.placeholder='Plak hier je eerder geëxporteerde JSON…';textarea.setAttribute('aria-label','Importeer persoonlijke instellingen');backup.append(textarea);
      backup.append($('p','warning','De serveropslag is per Home Assistant-gebruikersaccount. Andere apparaten met hetzelfde account laden dezelfde persoonlijke indeling bij een herstart/herladen van de frontend. Wis je de cache voordat de eerste synchronisatie succesvol is, dan kunnen nog niet gesynchroniseerde wijzigingen verloren gaan. Maak ook regelmatig een JSON-export.')); 
      backup.append($('p',null,'De oorspronkelijke Home Assistant-rechten blijven altijd van toepassing. Dit is geen beheerinterface voor HA-dashboards zelf.'));
      backup.append($('p',null,'HA '+(this.hass?.config?.version||'?')+' · PalaSidebar '+VERSION+' · '+(this.integration==='native'?'Ingebouwd':'Zwevend')));
      const footer=$('div','btnrow');footer.append(this._button('Sluiten','settings-close'));pane.append(footer);
      this.dialog.append(pane);this._showStorageStatus();this._refreshBadgeAttributeOptions('');this._fillThemeEditor(this._themePrefs());this._layoutFillSection();this._layoutFillItem();this._fillSensorEditor('');this._showEditorTab(tab);
      if(!this.dialog.open)this._openOwnedDialog(this.dialog,'settings');
    }
    _layoutEditor(page){
      page.append($('h3',null,'Indeling aanpassen'),$('p',null,'Wijzig je secties en menu-items hieronder. Gebruik de pijlen bij de juiste naam: de nieuwe volgorde is meteen zichtbaar en wordt direct opgeslagen.'));
      const sectionPanel=$('div','layout-editor-panel');sectionPanel.append($('h3',null,'Secties en volgorde'));
      const defs=this._sectionDefinitions().filter(g=>!g.admin_only||this.hass?.user?.is_admin);
      const sorted=[...defs];const order=this.saved.section_order;
      sorted.sort((a,b)=>{let i=order.indexOf(a.id),j=order.indexOf(b.id);return i<0&&j<0?0:i<0?1:j<0?-1:i-j;});
      sectionPanel.append(this._formField('Sectie bewerken','pala-layout-section',sorted[0]?.id||'',sorted.map(g=>[g.id,g.title])));
      const orderHeader=$('div','layout-order-header');orderHeader.append($('strong',null,'Huidige volgorde'),$('small',null,'Tik op een naam om die te bewerken'));
      sectionPanel.append(orderHeader);
      const orderList=$('div','layout-order-list');orderList.id='pala-layout-sections-order';orderList.setAttribute('aria-label','Volgorde van secties');sectionPanel.append(orderList);
      sectionPanel.append(this._formField('Eigen naam van deze sectie','pala-layout-title',''));
      const show=$('label','check'),showBox=$('input');showBox.type='checkbox';showBox.id='pala-layout-visible';show.append(showBox,$('span',null,'Sectie zichtbaar'));sectionPanel.append(show);
      const buttons=$('div','btnrow');buttons.append(this._button('Sectie opslaan','layout-section-save','primary'),this._button('Eigen sectie verwijderen','layout-section-remove'));sectionPanel.append(buttons);
      sectionPanel.append(this._formField('Nieuwe sectie maken','pala-layout-new',''));
      sectionPanel.append(this._button('Nieuwe sectie toevoegen','layout-section-add'));
      const workspace=$('div','layout-workspace');workspace.append(sectionPanel);page.append(workspace);
      const itemPanel=$('div','layout-editor-panel');itemPanel.append($('h3',null,'Menu-items verplaatsen en aanpassen'),$('p',null,'Kies een menu-item. De pijlen staan direct naast de namen van de items in dezelfde sectie.'));
      const all=this._navData(true,true).flatMap(g=>g.items);
      itemPanel.append(this._formField('Menuonderdeel bewerken','pala-layout-item',all[0]?.id||'',all.map(i=>[i.id,i.label])));
      const itemOrderHeader=$('div','layout-order-header');itemOrderHeader.append($('strong',null,'Volgorde binnen de huidige sectie'));
      const itemCount=$('small');itemCount.id='pala-layout-item-count';itemOrderHeader.append(itemCount);itemPanel.append(itemOrderHeader);
      const itemOrderList=$('div','layout-order-list layout-items-order');itemOrderList.id='pala-layout-items-order';itemOrderList.setAttribute('aria-label','Volgorde van menu-items');itemPanel.append(itemOrderList);
      itemPanel.append(this._formField('Plaatsen in sectie','pala-layout-item-group',sorted[0]?.id||'',sorted.filter(g=>!g.virtual).map(g=>[g.id,g.title])));
      itemPanel.append(this._formField('Nieuwe naam (leeg = standaard)','pala-layout-item-label',''));
      itemPanel.append(this._formField('Nieuw icoon, mdi:... (leeg = standaard)','pala-layout-item-icon',''));
      const dynamic=$('div','layout-dynamic-panel');
      dynamic.append($('h4',null,'Dynamische naam en sensoricoon'),$('p','field-note','Kies een entiteit op naam; daarna kun je het attribuut selecteren. Als de sensor niet beschikbaar is, blijven de vaste naam en het vaste icoon gewoon zichtbaar.'));
      dynamic.append(this._entityField('Titel automatisch uit sensor','pala-layout-title-entity'));
      dynamic.append(this._formField('Titel: welke waarde?','pala-layout-title-attribute','', [['','Sensorwaarde (state)']]));
      const sameSensor=$('div','btnrow');sameSensor.append(this._button('Zelfde sensor voor icoon','layout-icon-same-sensor'));
      dynamic.append(sameSensor);
      dynamic.append(this._entityField('Icoon of logo uit sensor','pala-layout-icon-entity'));
      dynamic.append(this._formField('Icoon: welke waarde?','pala-layout-icon-attribute','auto', [['auto','Automatisch: icon / foto / emoji / state'],['icon','Attribuut icon'],['entity_picture','Attribuut entity_picture'],['state','Sensorwaarde (state)']]));
      const preview=$('div','layout-dynamic-preview');preview.id='pala-layout-dynamic-preview';preview.setAttribute('aria-live','polite');dynamic.append(preview);
      const hint=$('p','field-note','Tip voor F1: kies bij de titel bijvoorbeeld sensor.next_f1_session_countdown → race_name. Kies voor het icoon een sensor met attribuut icon (mdi:...) of entity_picture.');dynamic.append(hint);
      itemPanel.append(dynamic);
      const hidden=$('label','check'),hiddenBox=$('input');hiddenBox.type='checkbox';hiddenBox.id='pala-layout-item-hidden';hidden.append(hiddenBox,$('span',null,'Menuonderdeel verbergen'));itemPanel.append(hidden);
      const buttons2=$('div','btnrow');buttons2.append(this._button('Menu-item opslaan','layout-item-save','primary'));itemPanel.append(buttons2);
      workspace.append(itemPanel);
      page.append($('h3',null,'Zoekfunctie en dubbelingen'));
      const quick=$('label','check'),quickCheck=$('input');quickCheck.type='checkbox';quickCheck.id='pala-layout-quick-visible';quickCheck.checked=this.saved.show_quick_link;quick.append(quickCheck,$('span',null,'Van alles-snelmenu bovenaan tonen'));page.append(quick);
      const searchBox=$('label','check'),searchCheck=$('input');searchCheck.type='checkbox';searchCheck.id='pala-layout-search-visible';searchCheck.checked=this.saved.search_config.visible;searchBox.append(searchCheck,$('span',null,'Zoekbalk tonen'));page.append(searchBox);
      page.append(this._formField('Tekst in zoekbalk','pala-layout-search-placeholder',this.saved.search_config.placeholder));
      const duplicates=$('label','check'),repeat=$('input');repeat.type='checkbox';repeat.id='pala-layout-repeat';repeat.checked=this.saved.repeat_recent;duplicates.append(repeat,$('span',null,'Recente en favoriete items óók in de gewone secties tonen'));page.append(duplicates);
      page.append($('h3',null,'Onderste knoppen'));
      const footer=this.saved.footer_config;
      for(const [id,label,value] of [
        ['show_settings','PalaSidebar-instellingen tonen',footer.show_settings],['show_version','PalaSidebar-versie tonen',footer.show_version],['show_status','Status-icoon tonen',footer.show_status],
        ['show_restart','Home Assistant herstartknop tonen (alleen beheerders)',footer.show_restart],
        ['ha_settings','Originele Home Assistant Instellingen tonen',footer.ha_settings],['ha_notifications','Originele Meldingen tonen',footer.ha_notifications],['ha_profile','Originele Profielknop tonen',footer.ha_profile]]){
        const line=$('label','check'),box=$('input');box.type='checkbox';box.id='pala-layout-footer-'+id;box.checked=value;line.append(box,$('span',null,label));page.append(line);
      }
      page.append(this._formField('Extra eigen knop onderaan','pala-layout-footer-link',footer.link||'',[['','Geen extra knop'],...this._selectItems()]));
      page.append($('p','warning','Home Assistant-knoppen zijn eigendom van Home Assistant. Verbergen gebeurt alleen wanneer PalaSidebar de oorspronkelijke knop veilig herkent. Je kunt de pagina’s altijd nog via hun gewone URL openen. De PalaSidebar-instellingen blijven via de eigen header bereikbaar.'));
      const save=$('div','btnrow');save.append(this._button('Algemene indeling opslaan','layout-global-save','primary'),this._button('Indeling herstellen','layout-reset'));page.append(save);
    }
    _layoutFillSection(){
      const id=this.dialog.querySelector('#pala-layout-section')?.value,g=this._sectionDefinitions().find(x=>x.id===id);if(!g)return;
      this.dialog.querySelector('#pala-layout-title').value=this.saved.section_overrides[id]?.title||g.title;
      this.dialog.querySelector('#pala-layout-visible').checked=g.visible;
      this._layoutOrderRender();
    }
    _fillDynamicItemAttributes(kind,requested){
      const entity=this.dialog.querySelector('#pala-layout-'+kind+'-entity')?.value||'';
      const picker=this.dialog.querySelector('#pala-layout-'+kind+'-attribute');if(!picker)return;
      const current=requested===undefined?picker.value:requested;
      const state=this.hass?.states?.[entity];
      const initial=kind==='title'?[['','Sensorwaarde (state)']]:[
        ['auto','Automatisch: icon / foto / emoji / state'],
        ['icon','Attribuut icon (mdi:...)'],['entity_picture','Attribuut entity_picture (afbeelding)'],
        ['state','Sensorwaarde (state, bijvoorbeeld mdi:flag-checkered)']];
      const values=new Set(initial.map(x=>x[0]));
      for(const name of Object.keys(state?.attributes||{}).sort()){
        if(!/^[a-zA-Z0-9_-]{1,80}$/.test(name)||values.has(name))continue;
        if(kind==='icon'){
          const v=state.attributes[name];
          if(!isSafeIcon(v)&&!safeEntityPicture(v)&&!safeSensorEmoji(v))continue;
        }
        values.add(name);
        initial.push([name,name+' · '+this._badgeDisplayValue(state.attributes[name],45)]);
      }
      if(current && !values.has(current) && /^[a-zA-Z0-9_-]{1,80}$/.test(current))initial.push([current,current+' (momenteel niet beschikbaar)']);
      picker.replaceChildren(...initial.map(([value,label])=>{const opt=$('option',null,label);opt.value=value;return opt;}));
      picker.value=current|| (kind==='icon'?'auto':'');
    }
    _previewDynamicItem(){
      const preview=this.dialog?.querySelector('#pala-layout-dynamic-preview');if(!preview)return;
      const id=this.dialog.querySelector('#pala-layout-item')?.value||'';
      const item=this._navData(true,true).flatMap(g=>g.items).find(i=>i.id===id);if(!item)return;
      const fallbackName=text(this.dialog.querySelector('#pala-layout-item-label')?.value)||item.label;
      const fallbackIcon=text(this.dialog.querySelector('#pala-layout-item-icon')?.value)||item.icon;
      const dynamic={title_entity:text(this.dialog.querySelector('#pala-layout-title-entity')?.value),
        title_attribute:this.dialog.querySelector('#pala-layout-title-attribute')?.value||'',
        icon_entity:text(this.dialog.querySelector('#pala-layout-icon-entity')?.value),
        icon_attribute:this.dialog.querySelector('#pala-layout-icon-attribute')?.value||'auto'};
      const sample={...item,label:fallbackName,icon:isSafeIcon(fallbackIcon)?fallbackIcon:item.icon};
      // Preview gebruikt dezelfde resolvers als de sidebar, zonder opgeslagen voorkeuren te wijzigen.
      const name=this._itemDynamicTitle(sample,dynamic),chosen=this._itemDynamicIcon(sample,dynamic);
      const icon=this._icon(sample.icon,'◈');this._drawDynamicIcon(icon,chosen,true);
      preview.replaceChildren(icon,$('strong',null,name));
      preview.title='Live voorbeeld · bij ontbrekende sensor wordt het vaste menu-item getoond';
    }
    _layoutFillItem(){
      const id=this.dialog.querySelector('#pala-layout-item')?.value;
      const groups=this._navData(true,true);
      const item=groups.flatMap(g=>g.items).find(i=>i.id===id);if(!item)return;
      const group=groups.find(g=>g.items.some(i=>i.id===id));
      this.dialog.querySelector('#pala-layout-item-group').value=this.saved.item_groups[id]||group?.id||'start';
      this.dialog.querySelector('#pala-layout-item-label').value=this.saved.item_labels[id]||'';
      this.dialog.querySelector('#pala-layout-item-icon').value=this.saved.item_icons[id]||'';
      const dynamic=this.saved.item_dynamic?.[id]||{};
      this.dialog.querySelector('#pala-layout-title-entity').value=dynamic.title_entity||'';
      this.dialog.querySelector('#pala-layout-icon-entity').value=dynamic.icon_entity||'';
      this._fillDynamicItemAttributes('title',dynamic.title_attribute||'');
      this._fillDynamicItemAttributes('icon',dynamic.icon_attribute||'auto');
      this._previewDynamicItem();
      this.dialog.querySelector('#pala-layout-item-hidden').checked=this.saved.hidden.includes(id);
      this._layoutOrderRender();
    }
    _layoutOrderRender(){
      const sections=this.dialog.querySelector('#pala-layout-sections-order');
      const items=this.dialog.querySelector('#pala-layout-items-order');
      if(!sections||!items)return;
      const chosenSection=this.dialog.querySelector('#pala-layout-section')?.value;
      const chosenItem=this.dialog.querySelector('#pala-layout-item')?.value;
      const defs=this._sectionDefinitions();const order=this.saved.section_order;
      defs.sort((a,b)=>{const i=order.indexOf(a.id),j=order.indexOf(b.id);return i<0&&j<0?0:i<0?1:j<0?-1:i-j;});
      const row=(id,label,pos,total,kind,selected,meta)=>{
        const el=$('div','layout-order-row');el.dataset.selected=String(selected);
        const pick=this._button('',kind==='section'?'layout-section-pick':'layout-item-pick','layout-order-pick');pick.dataset.id=id;
        pick.title='Bewerk '+label;pick.setAttribute('aria-label','Bewerk '+label);
        pick.append($('span','layout-row-number',String(pos+1)));
        const detail=$('span','layout-row-title',label);if(meta)detail.append($('small','layout-row-meta',meta));pick.append(detail);el.append(pick);
        const controls=$('div','layout-order-controls');
        for(const [direction,step] of [['up',-1],['down',1]]){
          const b=this._button(step===-1?'↑':'↓',kind==='section'?'layout-section-'+direction:'layout-item-'+direction);
          b.dataset.id=id;b.disabled=step===-1?pos===0:pos===total-1;
          b.title=(step===-1?'Omhoog: ':'Omlaag: ')+label;
          b.setAttribute('aria-label',b.title);
          controls.append(b);
        }
        el.append(controls);return el;
      };
      const secTop=sections.scrollTop;sections.replaceChildren(...defs.map((g,i)=>row(g.id,g.title,i,defs.length,'section',g.id===chosenSection,g.visible?'':'Verborgen')));sections.scrollTop=secTop;
      const groups=this._navData(true,true);
      const group=groups.find(g=>g.items.some(i=>i.id===chosenItem));
      const entries=group?.items||[];
      const itemTop=items.scrollTop;
      items.replaceChildren(...entries.map((i,index)=>row(i.id,i.label,index,entries.length,'item',i.id===chosenItem,this.saved.hidden.includes(i.id)?'Verborgen':'')));
      items.scrollTop=itemTop;
      const itemCount=this.dialog.querySelector('#pala-layout-item-count');
      if(itemCount)itemCount.textContent=group?(group.title+' · '+entries.length+' items'):'Geen items';
    }
    _layoutSaveSection(){
      const id=this.dialog.querySelector('#pala-layout-section').value;
      const value=text(this.dialog.querySelector('#pala-layout-title').value).slice(0,64);
      if(!value){alert('Vul een sectienaam in.');return;}
      this.saved.section_overrides[id]={title:value,visible:this.dialog.querySelector('#pala-layout-visible').checked};
      const option=this.dialog.querySelector('#pala-layout-section')?.selectedOptions?.[0];if(option)option.textContent=value;
      this._saveSettings();this.redraw();this._layoutFillSection();this._editorNotice('Sectie opgeslagen. Je blijft op dezelfde plek.');
    }
    _layoutFocusControl(kind,step,id){
      const target=this.dialog.querySelector('[data-do="layout-'+kind+'-'+(step===-1?'up':'down')+'"][data-id="'+id+'"]');
      try{target?.focus({preventScroll:true});}catch{}
    }
    _layoutMoveSection(step,id=this.dialog.querySelector('#pala-layout-section')?.value){
      const picker=this.dialog.querySelector('#pala-layout-section');if(!picker)return;
      picker.value=id;
      const all=this._sectionDefinitions().map(g=>g.id);let order=[...this.saved.section_order];
      order=[...order.filter(k=>all.includes(k)),...all.filter(k=>!order.includes(k))];
      const pos=order.indexOf(id),next=pos+step;if(next<0||next>=order.length)return;
      [order[pos],order[next]]=[order[next],order[pos]];this.saved.section_order=order;
      this._saveSettings();this.redraw();this._layoutFillSection();this._layoutFocusControl('section',step,id);this._editorNotice('Sectie verplaatst: '+(pos+1)+' → '+(next+1));
    }
    _layoutAddSection(){
      const title=text(this.dialog.querySelector('#pala-layout-new')?.value).slice(0,64);
      if(!title){alert('Vul de naam van je nieuwe sectie in.');return;}
      const id='eigen-'+cleanId(title.toLowerCase());if(this._sectionDefinitions().some(g=>g.id===id)){alert('Deze sectie bestaat al.');return;}
      this.saved.custom_groups.push({id,title});this._saveSettings();this.redraw();this._rebuildSettingsAtSamePosition('layout',{sectionId:id});this._editorNotice('Sectie '+title+' toegevoegd.');
    }
    _layoutRemoveSection(){
      const id=this.dialog.querySelector('#pala-layout-section').value;
      if(!this.saved.custom_groups.some(g=>g.id===id)){this._editorNotice('Alleen zelf aangemaakte secties kunnen worden verwijderd. Andere secties kun je verbergen.');return;}
      if(!confirm('Eigen sectie verwijderen? De menu-items gaan terug naar hun oorspronkelijke sectie.'))return;
      this.saved.custom_groups=this.saved.custom_groups.filter(g=>g.id!==id);
      this.saved.section_order=this.saved.section_order.filter(g=>g!==id);delete this.saved.section_overrides[id];
      for(const [item,group] of Object.entries(this.saved.item_groups))if(group===id)delete this.saved.item_groups[item];
      this._saveSettings();this.redraw();this._rebuildSettingsAtSamePosition('layout');this._editorNotice('Eigen sectie verwijderd.');
    }
    _layoutSaveItem(){
      const id=this.dialog.querySelector('#pala-layout-item').value;
      const dest=this.dialog.querySelector('#pala-layout-item-group').value;
      if(!this._sectionDefinitions().some(g=>g.id===dest&&!g.virtual)){alert('Kies een geldige sectie.');return;}
      const label=text(this.dialog.querySelector('#pala-layout-item-label').value).slice(0,90),icon=text(this.dialog.querySelector('#pala-layout-item-icon').value);
      const titleEntity=text(this.dialog.querySelector('#pala-layout-title-entity').value);
      const iconEntity=text(this.dialog.querySelector('#pala-layout-icon-entity').value);
      if(icon&&!isSafeIcon(icon)){alert('Gebruik een icoon zoals mdi:home-outline.');return;}
      if((titleEntity&&!isEntity(titleEntity))||(iconEntity&&!isEntity(iconEntity))){
        alert('Kies een geldige entiteit uit de sensorzoeker.');return;
      }
      // Eerst validatie, daarna alle wijzigingen tegelijk doorvoeren.
      this.saved.item_groups[id]=dest;
      if(label)this.saved.item_labels[id]=label;else delete this.saved.item_labels[id];
      if(icon)this.saved.item_icons[id]=icon;else delete this.saved.item_icons[id];
      if(titleEntity||iconEntity){this.saved.item_dynamic[id]={
        title_entity:titleEntity,title_attribute:this.dialog.querySelector('#pala-layout-title-attribute').value,
        icon_entity:iconEntity,icon_attribute:this.dialog.querySelector('#pala-layout-icon-attribute').value
      };}else delete this.saved.item_dynamic[id];
      const hidden=this.dialog.querySelector('#pala-layout-item-hidden').checked;
      this.saved.hidden=this.saved.hidden.filter(i=>i!==id);if(hidden)this.saved.hidden.push(id);
      const option=this.dialog.querySelector('#pala-layout-item')?.selectedOptions?.[0];if(option)option.textContent=label||option.textContent;
      this._saveSettings();this.redraw();this._layoutFillItem();this._editorNotice('Menu-item opgeslagen. Je blijft op dezelfde plek.');
    }
    _layoutMoveItem(step,id=this.dialog.querySelector('#pala-layout-item')?.value){
      const picker=this.dialog.querySelector('#pala-layout-item');if(!picker)return;
      picker.value=id;
      const group=this._navData(true,true).find(g=>g.items.some(i=>i.id===id));if(!group)return;
      const all=this._navData(true,true).flatMap(g=>g.items).map(i=>i.id);
      const global=this.saved.item_order;let order=[...global.filter(i=>all.includes(i)),...all.filter(i=>!global.includes(i))];
      const members=order.filter(i=>group.items.some(item=>item.id===i));const pos=members.indexOf(id),next=pos+step;
      if(pos<0||next<0||next>=members.length)return;
      const a=order.indexOf(id),b=order.indexOf(members[next]);[order[a],order[b]]=[order[b],order[a]];
      this.saved.item_order=order;this._saveSettings();this.redraw();this._layoutFillItem();this._layoutFocusControl('item',step,id);this._editorNotice('Menu-item verplaatst: '+(pos+1)+' → '+(next+1));
    }
    _layoutSaveGlobal(){
      const q=id=>this.dialog.querySelector('#pala-layout-'+id);
      const fc=this.saved.footer_config;
      const updated={...fc};
      for(const k of ['show_settings','show_version','show_status','show_restart','ha_settings','ha_notifications','ha_profile'])updated[k]=q('footer-'+k).checked;
      // Validate the draft BEFORE mutating saved state. A rejected edit must
      // never leak into a later unrelated save operation.
      if(this._header().pala==='hidden'&&this._header().ha==='hidden'&&!updated.show_settings){alert('Laat PalaSidebar-instellingen zichtbaar wanneer beide headers verborgen zijn.');return;}
      Object.assign(fc,updated);
      fc.link=q('footer-link').value;
      this.saved.search_config={visible:q('search-visible').checked,placeholder:text(q('search-placeholder').value).slice(0,80)||'Zoeken in menu…'};
      this.saved.repeat_recent=q('repeat').checked;this.saved.show_quick_link=q('quick-visible').checked;
      this._saveSettings();this.redraw();this._syncNativeFooter();this._editorNotice('Indeling en onderste knoppen opgeslagen.');
    }
    _layoutReset(){
      if(!confirm('Alleen je eigen sectie-indeling, itemnamen, zichtbaarheid en onderste knoppen herstellen?'))return;
      const clean=EMPTY_PREFS();for(const key of ['section_overrides','section_order','custom_groups','item_groups','item_labels','item_icons','item_dynamic','item_order','search_config','footer_config','repeat_recent','show_quick_link','hidden'])this.saved[key]=clean[key];
      this._saveSettings();this.redraw();this._rebuildSettingsAtSamePosition('layout');this._editorNotice('Indeling hersteld.');
    }
    _button(label,cmd,cls=''){const b=$('button','btn '+cls,label);b.type='button';b.dataset.do=cmd;return b;}
    _saveHeader(){
      const q=id=>this.dialog.querySelector('#'+id);
      this.saved.header=cleanHeader({ha:q('pala-ha-header').value,ha_title:q('pala-ha-title').value,
        pala:q('pala-head-mode').value,title:q('pala-head-title').value,
        subtitle:q('pala-head-subtitle').value,logo:q('pala-head-logo').checked,logo_mode:q('pala-head-logo-mode').value,clock:q('pala-head-clock').checked,
        extra:q('pala-head-extra').value,align:q('pala-head-align').value,
        title_color:q('pala-head-title-color').value,subtitle_color:q('pala-head-subtitle-color').value,
        extra_color:q('pala-head-extra-color').value,title_size:q('pala-head-title-size').value,
        subtitle_size:q('pala-head-subtitle-size').value,logo_text:q('pala-head-logo-text').value,
        show_quick:q('pala-head-quick').checked,show_settings:q('pala-head-settings').checked,
        logo_icon:q('pala-head-logo-icon').value,background_color:q('pala-head-background-color').value,
        logo_bg:q('pala-head-logo-bg').value,logo_color:q('pala-head-logo-color').value,
        clock_color:q('pala-head-clock-color').value});
      this._saveSettings();this.redraw();this._editorNotice('Header opgeslagen.');
    }
    _saveDialog(){
      const q=id=>this.dialog.querySelector('#'+id);
      this.saved.mode=q('pala-mode').value;this.saved.density=q('pala-density').value;this.saved.device=q('pala-device').value;this.saved.mobile_dock=q('pala-mobile-dock').checked;this.saved.mobile_swipe=q('pala-mobile-swipe').checked;
      this.saved.dialog_motion=q('pala-dialog-motion').value;
      this.saved.dialog_style=q('pala-dialog-style').value;
      this.saved.dialog_backdrop=q('pala-dialog-backdrop').value;
      this.saved.rail_motion=q('pala-rail-motion').value;
      const input=q('pala-color').value.trim();if(!/^#[0-9a-f]{6}$/i.test(input)){alert('Voer een geldige kleur in zoals #38bdf8');return;}
      this.saved.accent=input;this._saveSettings();this._closeOwnedDialog(this.dialog);this.redraw();this.ensurePlacement();
    }
    _addLink(){
      const name=text(this.dialog.querySelector('#pala-newname')?.value),path=text(this.dialog.querySelector('#pala-newpath')?.value),icon=text(this.dialog.querySelector('#pala-newicon')?.value);
      if(!name||!validPath(path)){alert('Vul een naam en een geldig pad (beginnend met /) of HTTPS-link in.');return;}
      const i=configItem({id:'custom-'+cleanId(path),label:name,path,icon});
      if(!i)return;
      this.saved.links=[...this.saved.links.filter(k=>k.id!==i.id),i].slice(0,50);this._saveSettings();this._rebuildSettingsAtSamePosition(this.editorTab);this.redraw();
    }
    _exportSettings(){
      const s=JSON.stringify({format:'PalaSidebar-v1',settings:this.saved},null,2);
      const blob=new Blob([s],{type:'application/json'}),url=URL.createObjectURL(blob),a=$('a');
      a.href=url;a.download='palasidebar-persoonlijk.json';this.shadowRoot.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    _importSettings(){
      const raw=this.dialog.querySelector('#pala-importtext')?.value||'';let json;
      try {json=JSON.parse(raw)}catch{alert('Dit is geen geldige JSON.');return;}
      if(json?.format!=='PalaSidebar-v1'||!json.settings||typeof json.settings!=='object'){alert('Ongeldig PalaSidebar-instellingenbestand.');return;}
      this.saved=parsePrefs(json.settings);this._pfxDraft=null;this._pfxApply();this._saveSettings();this._closeOwnedDialog(this.dialog);this.redraw();this.ensurePlacement();
    }
  }
  class PalaMobileDock extends HTMLElement {
    constructor(){
      super();this.attachShadow({mode:'open'});
      const css=document.createElement('style');css.textContent=`
:host{all:initial;position:fixed!important;z-index:2147482000;left:50%;transform:translateX(-50%);bottom:max(8px,env(safe-area-inset-bottom));display:block;pointer-events:auto;color:var(--primary-text-color,#edf3fb);font:500 11px/1.2 var(--primary-font-family,Arial,sans-serif)}
:host([data-keyboard]){display:none!important}*{box-sizing:border-box;-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none}.dock{display:flex;align-items:center;justify-content:center;gap:3px;min-height:54px;padding:5px;border:1px solid var(--divider-color,#526071);border-radius:19px;background:var(--sidebar-background-color,var(--card-background-color,#1f2937));box-shadow:0 6px 24px #0008;max-width:calc(100vw - 16px);padding-bottom:max(5px,env(safe-area-inset-bottom));}
.item{display:flex;align-items:center;flex-direction:column;justify-content:center;gap:3px;min-height:47px;min-width:48px;padding:4px 7px;border:0;border-radius:13px;background:transparent;color:inherit;text-decoration:none!important;cursor:pointer;white-space:nowrap;max-width:94px;overflow:hidden}
.item .text{font-size:10px;max-width:82px;overflow:hidden;text-overflow:ellipsis}.item[selected]{background:color-mix(in srgb,var(--p-accent) 20%,transparent);color:var(--p-accent)}
.ico{height:24px;display:flex;justify-content:center;align-items:center}.ico ha-icon{width:22px;height:22px;--mdc-icon-size:22px}
.item:focus-visible{outline:2px solid var(--p-accent)}
@media(max-width:355px){.item{min-width:44px;padding:4px}.item .text{font-size:9px;max-width:60px}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}`;
      this.shadowRoot.append(css);this.nav=document.createElement('nav');this.nav.className='dock';this.nav.setAttribute('aria-label','Mobiele snelnavigatie');this.shadowRoot.append(this.nav);
      this.nav.addEventListener('click',e=>{
        const el=e.target.closest?.('[data-action]');if(!el||!this.ownerSidebar)return;
        if(el.dataset.action==='menu')this.ownerSidebar._openDrawer();
        else if(el.dataset.action==='back'){if(!this.ownerSidebar._back()&&history.length>1)history.back();}
        else if(el.dataset.action==='route'){
          this.ownerSidebar._recent(el.dataset.id);this.ownerSidebar._vibrate();
        }
      });
    }
    update(items,settings,accent,controller){
      this.ownerSidebar=controller;this.style.setProperty('--p-accent',accent);
      this.nav.replaceChildren();
      const add=(type,icon,label,item)=>{
        const el=document.createElement(type==='route'?'a':'button');el.className='item';el.dataset.action=type;
        if(type==='route'){el.href=item.path;el.dataset.path=item.path;el.dataset.id=item.id;}else el.type='button';
        el.setAttribute('aria-label',label);el.title=label;
        const wrap=document.createElement('span');wrap.className='ico';wrap.append(makeIcon(icon,type==='back'?'‹':type==='menu'?'☰':'⌂'));el.append(wrap);
        if(settings.dock_labels){const lbl=document.createElement('span');lbl.className='text';lbl.textContent=label;el.append(lbl);}
        this.nav.append(el);
      };
      if(settings.back_button)add('back','mdi:arrow-left','Terug');
      for(const item of items)add('route',item.icon,item.label,item);
      add('menu','mdi:menu','Menu');this.markRoute();
    }
    markRoute(){
      const path=location.pathname.replace(/\/$/,'')||'/';
      const rows=[...this.nav.querySelectorAll('[data-action="route"]')];
      const active=rows.filter(a=>{try{const p=new URL(a.dataset.path,location.href).pathname.replace(/\/$/,'');return p===path||path.startsWith(p+'/');}catch{return false;}})
        .sort((a,b)=>b.dataset.path.length-a.dataset.path.length)[0];
      for(const a of rows){if(a===active){a.setAttribute('selected','');a.setAttribute('aria-current','page');}else{a.removeAttribute('selected');a.removeAttribute('aria-current');}}
    }
  }
  // HA 2026: extra_module_url may run before the app imports its scoped-custom-elements
  // polyfill. Register only AFTER the HA shell has created its shadow root, otherwise
  // definitions can disappear when the registry is swapped underneath this script.
  // Do not construct any custom elements before that point.
  let sidebar=null,ready=false;
  const diagnosticSnapshot=()=>{
    const s=sidebar;
    const data={version:VERSION,phase:bootInfo.phase,config:bootInfo.config,
      integration:s?.integration||bootInfo.integration,
      homeAssistant:s?.hass?.config?.version||'nog niet verbonden',
      accountStorage:s?._prefsStore?.status||bootInfo.storage,
      lastUiRefreshMs:s?._perf?.lastRefreshMs??null,
      liveRefreshCount:s?._perf?.liveUpdates??0,
      menuItems:s?.shadowRoot?.querySelectorAll('.nav-row')?.length||0,
      legacyStyleResourceDetected:legacyModuleActive()||legacySources().length>0,
      legacyStyleModuleActive:legacyModuleActive(),
      legacyStyleRequestObserved:legacySources().length>0,
      legacyStyleResources:legacySources(),
      sidebarStyleLoaded:!!document.getElementById(PFX_STYLE_ID),
      externalHacsResourceFailuresAreSeparate:true};
    return Object.freeze(data);
  };
  // This returns metadata only; never private entities, sensor values or full prefs.
  window.PalaSidebarDiagnostics=()=>diagnosticSnapshot();
  window.PalaSidebarReport=()=>{
    const d=diagnosticSnapshot();
    console.groupCollapsed('%c ▦ PALASIDEBAR %c diagnose v'+VERSION,
      'background:#152439;color:#e8f2ff;padding:3px 7px;border-radius:5px;font-weight:750',
      'color:#38bdf8;font-weight:700');
    console.table(d);console.groupEnd();
    return d;
  };
  const register = () => {
    if (!customElements.get('pala-mobile-dock')) customElements.define('pala-mobile-dock',PalaMobileDock);
    if (!customElements.get('pala-sidebar')) customElements.define('pala-sidebar',PalaSidebar);
    sidebar=$('pala-sidebar');
  };
  const ensure=()=>{
    if(!document.body)return;
    sidebar.ensurePlacement();
    const native=sidebar.native?.isConnected ? sidebar.native : deepFindSidebar();
    const hass=native?.hass||document.querySelector('home-assistant')?.hass||document.querySelector('home-assistant')?._hass;
    if(hass)sidebar.setHass(hass);
    // HA state updates refresh immediately via one RAF. Periodic checks serve
    // route/structure and the rare HA version that mutates states in place.
    if(document.visibilityState==='visible'&&
       (Date.now()-(sidebar._lastFullRefreshAt||0)>3200||sidebar._lastCheckedRoute!==location.pathname))
      sidebar.refreshStatus();
    if(sidebar.integration==='native' && (sidebar._footerLastNative!==sidebar.native || Date.now()-(sidebar._footerLastScan||0)>20000))sidebar._syncNativeFooter();
  };
  const begin=async()=>{
    if(ready)return;ready=true;
    bootInfo.phase='initialiseren';
    try{
      register();
      // No floating launcher flash during async JSON load: mount only when config is ready.
      const {config,error}=await fetchConfig();
      bootInfo.config=error?'standaardconfig (bestand niet geladen)':'geladen';
      sidebar.setConfig(config,error);
      document.body.append(sidebar);
      ensure();
      bootInfo.integration=sidebar.integration;
      bootInfo.phase='gereed';
      logStartup(sidebar);
      if(error)logWarning('config','Configbestand niet geladen; veilige standaardconfiguratie actief. '+error);
      checkLegacySource();
      // Delayed resource scan: extra_module_url can load after the sidebar.
      setTimeout(checkLegacySource,1700);
    }catch(error){
      bootInfo.phase='fout';bootInfo.issue=String(error?.message||error);
      console.error(DIAG_PREFIX+' Opstarten mislukt. Controleer het volledige foutbericht:',error);
      // Let the resource be tried again after a corrected reload.
      ready=false;
      return;
    }
    // Reconnect quickly after HA replaces its shell; a slow 8s interval left a floating button visible.
    [80,300,850].forEach(ms=>setTimeout(ensure,ms));
    // 3s for structural HA checks, 1s only for cheap local badge/time text.
    // The second ticker never scans HA shadow roots or rebuilds navigation.
    setInterval(()=>{if(!document.hidden)ensure();},3000);
    setInterval(()=>{
      if(document.hidden||!sidebar?.isConnected)return;
      const now=Date.now();
      if(sidebar._resolved().appearance.show_clock!==false && sidebar.getAttribute('data-compact')!=='true'){
        if(!sidebar._clockFormatter)sidebar._clockFormatter=new Intl.DateTimeFormat('nl-NL',{weekday:'long',hour:'2-digit',minute:'2-digit'});
        const value=sidebar._clockFormatter.format(now);
        if(sidebar.clock.textContent!==value)sidebar.clock.textContent=value;
      }
      if(sidebar.getAttribute('data-compact')!=='true'){sidebar._refreshBadges(true);if(sidebar._headerTicking)sidebar._refreshHeaderText();}
    },1000);
    window.addEventListener('hass-toggle-menu',()=>{
      // HA owns the toggle; inspect its settled state rather than manually
      // setting `expanded`, which can break Home Assistant native navigation.
      queueMicrotask(()=>sidebar._syncMenuHistory());
      setTimeout(()=>sidebar._syncMenuHistory(),120);
    });
    // Native HA hamburger lives outside the PalaSidebar element on mobile.
    // Keep history in sync after its real click. This never creates a second marker.
    window.addEventListener('click',ev=>{
      if(!sidebar._isMobile()||!sidebar._mobile().back_closes_menu)return;
      const path=ev.composedPath?.()||[];
      const menuClick=path.some(el=>{
        const tag=(el?.localName||'').toLowerCase();
        if(tag==='ha-menu-button')return true;
        if(tag!=='ha-icon-button')return false;
        const label=String(el.getAttribute?.('aria-label')||el.getAttribute?.('title')||'').toLowerCase();
        return /menu|sidebar|zijbalk/.test(label);
      });
      if(menuClick)setTimeout(()=>sidebar._syncMenuHistory(),120);
    },true);
    // Vaste Home Assistant-links onderaan zijn geen onderdeel van onze
    // eigen navigatielijst. Consumeer eerst een eventueel open menu-marker,
    // anders komt die later als een spookstap terug in de Android-backstack.
    window.addEventListener('click',ev=>{
      if(!sidebar._isMobile()||!sidebar._menuHistoryState()||!sidebar._drawerOpen())return;
      const path=ev.composedPath?.()||[];
      if(!path.includes(sidebar._drawer())||path.includes(sidebar))return;
      const link=path.find(node=>node?.localName==='ha-list-item-button' &&
        (typeof node.href==='string'||node.getAttribute?.('href')));
      const href=link?.href||link?.getAttribute?.('href');
      if(!href||!validPath(href)||pathIsExternal(href))return;
      ev.preventDefault();ev.stopImmediatePropagation();
      sidebar._closeNative();
      sidebar._navigate(href);
    },true);
    window.addEventListener('location-changed',()=>{if(sidebar.open)sidebar._setOpen(false,true);if(sidebar._drawerNarrow()&&sidebar._drawerOpen())sidebar._closeNative();if(!sidebar._menuHistoryState()&&!sidebar._historyReleasing){sidebar._historyMarker=false;sidebar._historyCallbacks.length=0;}ensure();});
    window.addEventListener('touchstart',e=>sidebar.handleGestureStart(e),{passive:true,capture:true});
    window.addEventListener('touchmove',e=>sidebar.handleGestureMove(e),{passive:false,capture:true});
    window.addEventListener('touchend',e=>sidebar.handleGestureEnd(e),{passive:true,capture:true});
    // Some kiosk WebViews emit only pointer events. Ignore mouse pointers.
    window.addEventListener('pointerdown',e=>{if(!sidebar._gesture)sidebar.handleGestureStart(e);},{passive:true,capture:true});
    window.addEventListener('pointermove',e=>{if(sidebar._gesture)sidebar.handleGestureMove(e);},{passive:false,capture:true});
    window.addEventListener('pointerup',e=>{if(sidebar._gesture)sidebar.handleGestureEnd(e);},{passive:true,capture:true});
    window.addEventListener('touchcancel',()=>{if(sidebar._gesture?.input==='touch')sidebar.handleGestureCancel();},{passive:true});
    // Android WebViews emit pointercancel while a valid touch stream continues
    // (e.g. after panning begins). Never cancel the touch swipe for that.
    window.addEventListener('pointercancel',()=>{if(sidebar._gesture?.input==='pointer')sidebar.handleGestureCancel();},{passive:true});
    // PalaKiosk can call this bridge from native WebView back handling.
    window.PalaSidebarBack=()=>{
      if(sidebar._historyReleasing||sidebar._dialogReleasing||sidebar._dialogCloseTimers.size)return true; // Prevent a second Android Back from exiting the app mid-close.
      if(sidebar._historyMarker&&sidebar._menuHistoryState()&&!sidebar.open&&!sidebar._drawerOpen()){sidebar._releaseMenuHistory();return true;}
      if(sidebar.quickDialog.open||sidebar.actionDialog.open||sidebar.dialog.open||sidebar.open){sidebar._back();return true;}
      const n=sidebar.native?.isConnected?sidebar.native:deepFindSidebar();
      if(sidebar.integration==='native'&&sidebar._drawerNarrow()&&sidebar._drawerOpen()){sidebar._back();return true;}
      return false;
    };
    window.addEventListener('pala-back',()=>window.PalaSidebarBack());
    window.addEventListener('resize',()=>sidebar._syncMobile(),{passive:true});
    window.visualViewport?.addEventListener('resize',()=>sidebar._keyboardVisibility(),{passive:true});
    window.addEventListener('popstate',()=>{
      if(!sidebar._onDialogPopstate())sidebar._onMenuPopstate();
      sidebar.refreshStatus();
    });
    window.addEventListener('pageshow',()=>ensure());
    document.addEventListener('visibilitychange',()=>{
      sidebar.setAttribute('data-document-hidden',String(document.hidden));
      // Reconnect native HA drawer immediately after returning from background.
      if(!document.hidden){sidebar._lastFullRefreshAt=0;ensure();}
    });
    window.addEventListener('keydown',e=>{
      if((e.key==='Escape'||e.key==='BrowserBack') && (sidebar.open||sidebar._drawerOpen()||sidebar.dialog.open||sidebar.actionDialog.open||sidebar.quickDialog.open)){
        e.preventDefault();window.PalaSidebarBack();
      }
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){
        if(sidebar.searchBox.hidden)return;
        if(e.target?.closest?.('input,textarea,[contenteditable="true"]'))return;
        e.preventDefault();if(sidebar.integration==='floating'){sidebar._openDrawer();}
        const native=sidebar.native;if(native&&!native.hasAttribute('expanded')){
          // Laat native HA gewoon werken: sneltoets opent in dit geval het veilige overlaymenu.
          sidebar._openDrawer();
        }
        sidebar.searchInput.focus();
      }
    });
  };
  const bootStarted=Date.now();
  const waitForShell=()=>{
    // Do not register while the frontend is still installing its element registry.
    // If the HA shell has changed after an update, launch in safe floating mode
    // after an extended grace period, provided the HA host exists.
    const ha=document.querySelector('home-assistant');
    if(document.body && ha && (ha.shadowRoot || Date.now()-bootStarted>30000)){
      clearInterval(shellTimer);begin();
    }
    // Don't poll indefinitely on login/error pages that don't render HA at all.
    else if(Date.now()-bootStarted>120000){clearInterval(shellTimer);}
  };
  const shellTimer=setInterval(waitForShell,250);
  waitForShell();
})();
