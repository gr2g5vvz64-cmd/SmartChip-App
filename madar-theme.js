/* ═══════════════════════════════════════════════════════════════════════════
   madar-theme.js — تمِ مشترکِ روز/شبِ مدار (۱۴۰۵/۰۷/۱۹)
   • کلیدِ ذخیره: localStorage.smartchip_theme = 'light' | 'dark' (همان که index/crm/reminders دارند)
   • صفحه‌هایی که پالتِ روشنِ خودشان را دارند (index, crm, reminders) دست‌نخورده می‌مانند؛
     این فایل فقط برایِ بقیه (دو خانواده‌یِ نامِ متغیرها) پالتِ روشنِ آبیِ مدار را تزریق می‌کند
     و یک دکمه‌یِ ☀️/🌙 کوچک بالا-چپ می‌گذارد.
   • استفاده: <script src="./madar-theme.js"></script> داخلِ <head> (برایِ جلوگیری از پرش، زود).
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var KEY = 'smartchip_theme', root = document.documentElement;
  function stored(){ try{ return localStorage.getItem(KEY); }catch(e){ return null; } }
  function save(v){ try{ localStorage.setItem(KEY, v); }catch(e){} }
  function isLight(){ return root.getAttribute('data-theme') === 'light'; }
  function apply(light){
    if(light) root.setAttribute('data-theme','light'); else root.removeAttribute('data-theme');
    var m = document.querySelector('meta[name="theme-color"]');
    if(m){ if(!m.dataset.dark) m.dataset.dark = m.getAttribute('content'); m.setAttribute('content', light ? '#a9c8ec' : m.dataset.dark); }
    var b = document.getElementById('madarThemeBtn'); if(b){ b.textContent = light ? '🌙' : '☀️'; b.title = light ? 'حالتِ شب' : 'حالتِ روز'; }
  }
  // ۱) اعمالِ تمِ ذخیره‌شده (پیش‌فرض: تیره)
  if(stored() === 'light') root.setAttribute('data-theme','light');

  // ۲) آیا صفحه پالتِ روشنِ خودش را دارد؟ (قاعده‌ای با data-theme="light" در استایل‌هایِ صفحه)
  function selfThemed(){
    try{
      for(var i=0;i<document.styleSheets.length;i++){
        var rules; try{ rules = document.styleSheets[i].cssRules; }catch(e){ continue; }
        if(!rules) continue;
        for(var j=0;j<rules.length;j++){ var t = rules[j].selectorText; if(t && t.indexOf('data-theme') > -1 && /--(bg|accent|acc)\s*:/.test(rules[j].cssText || '')) return true; }
      }
    }catch(e){}
    return false;
  }

  var PALETTE =
    /* خانواده‌یِ A: access / me / roadmap / weekly */
    'html[data-theme="light"]{--bg:#a9c8ec;--card:#c3dbf3;--card2:#b3cdea;--line:#7ea3cc;--ink:#0f1f36;--soft:#3f5875;--acc:#0e7d6b;--ok:#15803d;--no:#dc2626;--warn:#b8690f;--blue:#1d4ed8;'+
    /* خانواده‌یِ B: org / m / راهنماها */
    '--surface:#c3dbf3;--border:#7ea3cc;--accent:#0e7d6b;--accent2:#0a5c50;--accent-hi:#14a38c;--hi:#14a38c;--text:#0f1f36;--muted:#3f5875;--faint:#56708f;--green:#15803d;--red:#dc2626;--teal:#0e7d6b;color-scheme:light}'+
    'html[data-theme="light"] body{background:var(--bg);color:var(--ink,var(--text))}';

  function boot(){
    if(selfThemed()) return;                          // پالتِ خودش را دارد — دخالت نکن
    var st = document.createElement('style'); st.id = 'madar-shared-theme'; st.textContent = PALETTE; document.head.appendChild(st);
    var b = document.createElement('button'); b.id = 'madarThemeBtn'; b.type = 'button'; b.setAttribute('aria-label','تم');
    b.style.cssText = 'position:fixed;top:10px;left:10px;z-index:9998;width:34px;height:34px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:rgba(128,128,128,.18);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-size:16px;line-height:1;cursor:pointer;padding:0';
    b.addEventListener('click', function(){ var l = !isLight(); save(l ? 'light' : 'dark'); apply(l); });
    document.body.appendChild(b);
    apply(isLight());
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.MadarTheme = { isLight: isLight, set: function(l){ save(l ? 'light' : 'dark'); apply(!!l); } };
})();
