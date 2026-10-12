/* 🔍 madar-search.js — جستجوی سراسریِ مدار (۱۴۰۵/۰۷/۲۰)
   • باز کردن: Ctrl+K یا «/» یا هر دکمه‌ای با [data-msearch]  یا  MadarSearch.open()
   • می‌گردد در: بخش‌ها (همان madar-tiles.js، فقط آنچه دسترسی دارید) · مشتریان (منبعِ واحدِ «m/customers») · افراد (STAFF)
   • وابسته: madar-tiles.js (اختیاری)، MadarAccess (اختیاری) */
(function(){
  'use strict';
  var API='https://api.smartchipelec.com', box=null, tmr=null, staffCache=null;
  function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function norm(t){ return String(t||'').replace(/[ً-ٰٟ]/g,'').replace(/[‌\s]+/g,' ').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[۰-۹]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);}).toLowerCase().trim(); }
  function can(p){ try{ return !window.MadarAccess||!p||MadarAccess.can(p); }catch(e){ return true; } }
  function get(path){ return fetch(API+path,{cache:'no-store'}).then(function(r){ return r.ok?r.json():null; }).catch(function(){ return null; }); }
  var CSS='#msBox{position:fixed;inset:0;z-index:2147483200;background:rgba(8,10,16,.7);display:flex;justify-content:center;align-items:flex-start;padding:8vh 14px 14px;font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl}'+
    '#msBox .ms{width:min(560px,100%);background:#1a1e2a;color:#f4f5f8;border:1px solid #323952;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.5);overflow:hidden}'+
    '#msBox input{width:100%;background:#232838;color:#f4f5f8;border:0;border-bottom:1px solid #323952;padding:14px 16px;font:inherit;font-size:15px;outline:0}'+
    '#msBox .rs{max-height:60vh;overflow:auto;padding:4px 6px 8px}'+
    '#msBox .h{font-size:11px;font-weight:800;color:#9aa2bd;margin:10px 8px 2px}'+
    '#msBox a{display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:10px;color:inherit;text-decoration:none}'+
    '#msBox a:hover,#msBox a.on{background:#232838}'+
    '#msBox .i{font-size:18px;width:24px;text-align:center}#msBox .t{font-size:13px;font-weight:700}#msBox .s{font-size:11.5px;color:#9aa2bd}'+
    '#msBox .e{color:#9aa2bd;text-align:center;padding:22px;font-size:12.5px}';
  function ensure(){
    if(box) return; var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
    box=document.createElement('div'); box.id='msBox'; box.hidden=true;
    box.innerHTML='<div class="ms"><input id="msQ" type="search" placeholder="🔍 جستجو در مدار: بخش، مشتری، همکار…" autocomplete="off"><div class="rs" id="msR"></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click',function(e){ if(e.target===box) close(); });
    box.querySelector('#msQ').addEventListener('input',function(e){ clearTimeout(tmr); var q=e.target.value; tmr=setTimeout(function(){ run(q); },250); });
    box.querySelector('#msQ').addEventListener('keydown',function(e){ if(e.key==='Enter'){ var a=box.querySelector('#msR a'); if(a) location.href=a.getAttribute('href'); } });
  }
  function open(){ ensure(); box.hidden=false; var i=box.querySelector('#msQ'); i.value=''; run(''); setTimeout(function(){ i.focus(); },30); }
  function close(){ if(box) box.hidden=true; }
  function sec(title,items){
    if(!items.length) return '';
    return '<div class="h">'+title+'</div>'+items.map(function(x){ return '<a href="'+esc(x.href)+'"><span class="i">'+esc(x.icon)+'</span><span><div class="t">'+esc(x.t)+'</div>'+(x.s?'<div class="s">'+esc(x.s)+'</div>':'')+'</span></a>'; }).join('');
  }
  function tiles(q){
    var n=norm(q); return (window.MADAR_TILES||[]).filter(function(t){ return can(t.perm)&&(!n||norm(t.title+' '+(t.desc||'')).indexOf(n)>-1); }).slice(0,8)
      .map(function(t){ return {icon:t.icon,t:t.title,s:t.desc,href:t.href}; });
  }
  function run(q){
    var R=box.querySelector('#msR'), n=norm(q), seq=(run.seq=(run.seq||0)+1);
    var html=sec('بخش‌ها',tiles(q));
    R.innerHTML=html||'<div class="e">'+(n?'در بخش‌ها چیزی پیدا نشد…':'')+'</div>';
    if(n.length<2) return;
    Promise.all([
      get('/api/org/m/customers/?q='+encodeURIComponent(q.trim())),
      staffCache?Promise.resolve(staffCache):get('/api/staff/staff/').then(function(d){ staffCache=Array.isArray(d)?d:[]; return staffCache; })
    ]).then(function(r){
      if(seq!==run.seq) return;
      var cu=((r[0]&&r[0].rows)||[]).slice(0,6).map(function(c){ return {icon:'👤',t:c.name,s:[c.phone,c.assignee].filter(Boolean).join(' · '),href:'crm.html?customer='+encodeURIComponent(c.name)}; });
      var pe=(r[1]||[]).filter(function(s){ return s.active!==false&&norm(s.name+' '+(s.email||'')).indexOf(n)>-1; }).slice(0,5)
        .map(function(s){ return {icon:'🧑‍💼',t:s.name,s:s.role||'',href:can('access.manage')?'people.html#'+encodeURIComponent(s.email||''):'org.html'}; });
      R.innerHTML=html+sec('مشتریان',cu)+sec('همکاران',pe)||'<div class="e">چیزی پیدا نشد</div>';
      if(!R.innerHTML) R.innerHTML='<div class="e">چیزی پیدا نشد</div>';
    });
  }
  document.addEventListener('keydown',function(e){
    var tag=(e.target&&e.target.tagName)||'', typing=/INPUT|TEXTAREA|SELECT/.test(tag)||(e.target&&e.target.isContentEditable);
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); open(); }
    else if(e.key==='/'&&!typing){ e.preventDefault(); open(); }
    else if(e.key==='Escape') close();
  });
  document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('[data-msearch]'); if(b){ e.preventDefault(); open(); } });
  window.MadarSearch={open:open,close:close};
})();
