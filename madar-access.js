/*
 * 🔑 madar-access.js — سطحِ دسترسیِ مدار در همه‌ی صفحه‌ها (۱۴۰۵/۰۷/۱۹)
 *
 * این فایل خودش از داخلِ madar-auth.js بارگذاری می‌شه (لازم نیست در صفحه‌ها چیزی اضافه کنید).
 * کار می‌کنه با «پنلِ دسترسی» (access.html) و سرورِ /api/access/me/ :
 *   MadarAccess.can('page.crm')            ← آیا این کاربر این مجوز رو داره؟ (اگه سرور هنوز پنل نداره: true)
 *   MadarAccess.can('dash.team', false)    ← مقدارِ جایگزین وقتی اطلاعاتِ دسترسی در دسترس نیست
 *   MadarAccess.ready(function(ok){...})   ← وقتی اطلاعات رسید (ok=false یعنی سرور پنل ندارد / وارد نشده)
 *   <button data-perm="fx.edit">…</button> ← خودکار برایِ کسی که مجوز نداره پنهان می‌شه (data-perm="a|b" یعنی هرکدام)
 *   قفلِ ورود به صفحه: طبقِ نامِ فایل (FILE_PERMS) — فقط یک پیامِ «این بخش باز نیست»؛ قفلِ واقعی همیشه در سرور است.
 */
(function () {
  if (window.MadarAccess && window.MadarAccess._real) return;
  var API = 'https://api.smartchipelec.com', OLD = 'https://smartchip-backend.onrender.com';
  var CK = 'madar_access_v1', CACHE_MS = 5 * 60 * 1000;
  var EMAIL_KEYS = ['smartchip_user_email', 'smartchip_erp_email'];
  var FILE_PERMS = {
    'fx-ledger.html': 'page.fxledger', 'crm.html': 'page.crm', 'erp.html': 'page.erp', 'pricelist.html': 'page.pricelist',
    'weights.html': 'page.weights', 'staff-admin.html': 'page.staffadmin', 'guide-admin.html': 'page.adminguide',
    'reminders.html': 'page.reminders', 'access.html': 'access.manage', 'me.html': 'page.me'
  };
  var st = {loaded: false, ok: false, perms: null, role: '', name: '', email: '', waiters: []};
  var old = window.MadarAccess;
  var ls; try { ls = window.localStorage; } catch (e) {}
  function lget(k) { try { return ls.getItem(k) || ''; } catch (e) { return ''; } }
  function lset(k, v) { try { ls.setItem(k, v); } catch (e) {} }
  function email() { for (var i = 0; i < EMAIL_KEYS.length; i++) { var v = lget(EMAIL_KEYS[i]); if (v) return v; } return ''; }

  // قبل از رسیدنِ اطلاعات، عناصرِ data-perm دیده نشن (پرش نکنن)
  try {
    var s0 = document.createElement('style');
    s0.textContent = 'html:not(.ma-ready) [data-perm]{visibility:hidden!important}';
    (document.head || document.documentElement).appendChild(s0);
  } catch (e) {}

  function can(perm, fallback) {
    if (st.ok && st.perms && Object.prototype.hasOwnProperty.call(st.perms, perm)) return !!st.perms[perm];
    return fallback === undefined ? true : !!fallback;
  }
  function canAny(spec) {
    var parts = String(spec || '').split('|'), any = false;
    for (var i = 0; i < parts.length; i++) { if (can(parts[i].trim())) { any = true; break; } }
    return any;
  }
  function apply(root) {
    if (!st.loaded) return;
    var list;
    try { list = (root || document).querySelectorAll('[data-perm]'); } catch (e) { return; }
    for (var i = 0; i < list.length; i++) {
      var el = list[i], ok = !st.ok || canAny(el.getAttribute('data-perm'));
      if (ok) { if (el.getAttribute('data-perm-off')) { el.style.removeProperty('display'); el.removeAttribute('data-perm-off'); } }
      else { el.style.setProperty('display', 'none', 'important'); el.setAttribute('data-perm-off', '1'); }
    }
  }
  function guard() {
    if (!st.ok) return;
    var f = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var perm = (document.documentElement.getAttribute('data-page-perm')) || FILE_PERMS[f];
    if (!perm || can(perm)) return;
    function show() {
      if (document.getElementById('madarNoAccess')) return;
      var d = document.createElement('div'); d.id = 'madarNoAccess';
      d.setAttribute('style', 'position:fixed;inset:0;z-index:2147483200;background:#0f1218;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl');
      d.innerHTML = '<div style="max-width:380px;text-align:center;color:#f4f5f8"><div style="font-size:46px">🔒</div>' +
        '<div style="font-size:17px;font-weight:800;margin:10px 0 6px">این بخش برایِ نقشِ شما باز نیست</div>' +
        '<div style="font-size:12.5px;color:#9aa2bd;line-height:1.9">اگه برایِ کارتون لازمه، از مدیریت بخواهید دسترسی بدهد.</div>' +
        '<a href="index.html" style="display:inline-block;margin-top:16px;background:#f0a500;color:#141821;font-weight:800;text-decoration:none;padding:10px 20px;border-radius:10px;font-size:13px">بازگشت به صفحه‌یِ اصلی</a></div>';
      document.body.appendChild(d);
    }
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  }
  function finish(ok) {
    st.loaded = true; st.ok = ok;
    try { document.documentElement.classList.add('ma-ready'); } catch (e) {}
    apply(document); guard();
    var w = st.waiters.splice(0); w.forEach(function (cb) { try { cb(ok); } catch (e) { console.error(e); } });
  }
  function fetchMe() {
    var em = email(), q = em ? '?email=' + encodeURIComponent(em) : '';
    function go(base) { return fetch(base + '/api/access/me/' + q, {cache: 'no-store'}); }
    return go(API).catch(function () { return go(OLD); }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return d && d.ok && d.perms ? d : null; }).catch(function () { return null; });
  }
  function adopt(d) {
    st.perms = d.perms; st.role = d.role || ''; st.name = d.name || ''; st.email = d.email || '';
    lset(CK, JSON.stringify({t: Date.now(), em: email(), d: d}));
  }
  function load() {
    var cached = null;
    try { cached = JSON.parse(lget(CK) || 'null'); } catch (e) {}
    if (cached && cached.d && cached.em === email()) {                 // کشِ هم‌ایمیل: فوراً (حتی قدیمی)؛ در پس‌زمینه تازه می‌شه
      st.perms = cached.d.perms; st.role = cached.d.role || ''; st.name = cached.d.name || ''; finish(true);
      fetchMe().then(function (d) { if (d) { adopt(d); apply(document); } });   // همیشه در پس‌زمینه تازه می‌شه
      return;
    }
    fetchMe().then(function (d) { if (d) { adopt(d); finish(true); } else finish(false); });
  }
  var api = window.MadarAccess = {
    _real: true,
    can: can,
    any: canAny,
    role: function () { return st.role; },
    name: function () { return st.name; },
    perms: function () { return st.perms; },
    loaded: function () { return st.loaded; },
    ready: function (cb) { if (st.loaded) { try { cb(st.ok); } catch (e) { console.error(e); } } else st.waiters.push(cb); },
    apply: apply,
    refresh: function () { return fetchMe().then(function (d) { if (d) { adopt(d); st.ok = true; apply(document); } return !!d; }); },
    forget: function () { try { ls.removeItem(CK); } catch (e) {} }
  };
  if (old && old.q) old.q.forEach(function (cb) { api.ready(cb); });

  // عناصری که بعداً ساخته می‌شن (منوهایِ پویا) هم بررسی بشن
  function watch() {
    if (!window.MutationObserver || !document.body) return;
    var tm = null;
    new MutationObserver(function () { if (tm) return; tm = setTimeout(function () { tm = null; apply(document); }, 60); })
      .observe(document.body, {childList: true, subtree: true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
  load();
})();
