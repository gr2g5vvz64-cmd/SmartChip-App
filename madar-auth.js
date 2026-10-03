/*
 * مدار — ورودِ امن (۱۴۰۵/۰۷/۰۸)
 * یک فایلِ مشترک برایِ همه‌ی صفحه‌ها (index، CRM، ERP، موبایل، دفتر ارزی، یادآوری‌ها، وزن‌نامه، قیمت، کارمندان).
 *
 *  • ایمیل ← کدِ ۶ رقمی در بله/تلگرام ← توکنِ همین دستگاه (۳۰ روز؛ با هر بار استفاده تمدید می‌شه)
 *  • توکن خودکار به همه‌ی درخواست‌هایِ سرورِ مدار اضافه می‌شه (Authorization: Token …)
 *  • اگه سرور «وارد نشدید» برگردونه (401)، فرمِ ورود خودکار باز می‌شه
 *  • «تغییر کاربر» در هر صفحه = خروجِ همین دستگاه (توکن هم باطل می‌شه)
 *  • حالتِ سرور (MADAR_AUTH_MODE): off = فرم نمایش داده نمی‌شه ؛ log = فرم میاد ولی فعلاً می‌شه «بعداً» زد ؛ on = اجباری
 * این فایل باید قبل از اسکریپت‌هایِ خودِ صفحه و بعد از اسکریپتِ «سرورِ پشتیبان» بارگذاری بشه.
 */
(function () {
  if (window.MadarAuth) return;
  var API = 'https://api.smartchipelec.com', OLD = 'https://smartchip-backend.onrender.com';
  var TK = 'madar_token', NK = 'madar_staff_name', EMAIL_KEYS = ['smartchip_user_email', 'smartchip_erp_email'];
  var ls = window.localStorage;
  function get(k) { try { return ls.getItem(k) || ''; } catch (e) { return ''; } }
  function set(k, v) { try { ls.setItem(k, v); } catch (e) {} }
  function isApi(u) { return typeof u === 'string' && (u.indexOf(API) === 0 || u.indexOf(OLD) === 0); }

  // ── ۱) توکن رویِ همه‌ی درخواست‌هایِ مدار ──
  var f0 = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input instanceof URL ? input.href : '');
    if (!isApi(url)) return f0(input, init);
    var t = get(TK);
    if (t) {
      init = Object.assign({}, init || {});
      var h = new Headers(init.headers || {});
      if (!h.has('Authorization')) h.set('Authorization', 'Token ' + t);
      init.headers = h;
    }
    return f0(input, init).then(function (r) {
      if (r.status === 401 && url.indexOf('/api/staff/auth/') < 0) {
        r.clone().json().then(function (j) { if (j && /^auth_/.test(j.code || '')) MadarAuth.require(true); }).catch(function () {});
      }
      return r;
    });
  };

  // ── ۲) «تغییر کاربر» در صفحه‌ها = خروجِ همین دستگاه ──
  var rm0 = Storage.prototype.removeItem;
  Storage.prototype.removeItem = function (k) {
    if (this === ls && EMAIL_KEYS.indexOf(k) >= 0 && get(TK)) { MadarAuth.logout(true); }
    return rm0.apply(this, arguments);
  };

  // ── ۳) فرمِ ورود ──
  var css = '#madarAuth{position:fixed;inset:0;z-index:2147483000;background:rgba(10,12,18,.82);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;padding:16px}' +
    '#madarAuth .ma-box{width:min(380px,100%);background:#1a1e2a;border:1px solid #323952;border-radius:16px;padding:24px 22px;color:#f4f5f8;box-shadow:0 20px 60px rgba(0,0,0,.45)}' +
    '#madarAuth .ma-logo{font-size:30px;font-weight:900;text-align:center;background:linear-gradient(160deg,#ffcf5a,#f0a500 45%,#e8630a);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;line-height:1.3}' +
    '#madarAuth .ma-sub{text-align:center;font-size:12px;color:#9aa2bd;margin:2px 0 18px}' +
    '#madarAuth label{display:block;font-size:12px;color:#9aa2bd;margin:0 0 6px}' +
    '#madarAuth input{width:100%;box-sizing:border-box;height:44px;border:1px solid #323952;border-radius:10px;background:#232838;color:#f4f5f8;font:inherit;font-size:15px;padding:0 12px;outline:none}' +
    '#madarAuth input:focus{border-color:#f0a500}' +
    '#madarAuth input.ma-code{font-size:24px;letter-spacing:.5em;text-align:center;direction:ltr;font-weight:800}' +
    '#madarAuth .ma-btn{width:100%;height:44px;margin-top:12px;border:0;border-radius:10px;background:#f0a500;color:#141821;font:inherit;font-weight:800;font-size:14px;cursor:pointer}' +
    '#madarAuth .ma-btn:disabled{opacity:.55;cursor:default}' +
    '#madarAuth .ma-link{background:none;border:0;color:#9aa2bd;font:inherit;font-size:12px;cursor:pointer;text-decoration:underline;padding:0}' +
    '#madarAuth .ma-row{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:8px}' +
    '#madarAuth .ma-msg{font-size:12px;margin-top:10px;line-height:1.8;min-height:20px}' +
    '#madarAuth .ma-err{color:#f87171}#madarAuth .ma-ok{color:#4ade80}' +
    '#madarAuth .ma-note{font-size:11px;color:#6b7390;margin-top:14px;line-height:1.8;text-align:center}';
  var el = null, state = {email: '', mode: 'log', strict: false, timer: null, open: false};

  function mount() {
    if (el) return el;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    el = document.createElement('div'); el.id = 'madarAuth'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'ورود به مدار');
    document.body.appendChild(el);
    return el;
  }
  function msg(text, kind) { var m = el.querySelector('.ma-msg'); if (m) { m.className = 'ma-msg ' + (kind === 'ok' ? 'ma-ok' : kind === 'err' ? 'ma-err' : ''); m.textContent = text || ''; } }
  function post(path, body) {
    return f0(API + path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)})
      .catch(function () { return f0(OLD + path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)}); })
      .then(function (r) { return r.json().catch(function () { return {ok: false, error: 'پاسخِ نامعتبر از سرور'}; }); });
  }
  function laterBtn() { return state.strict ? '' : '<button type="button" class="ma-link" data-a="later">فعلاً بعداً</button>'; }

  function stepEmail() {
    mount();
    el.innerHTML = '<div class="ma-box"><div class="ma-logo">مدار</div><div class="ma-sub">ورودِ امن — یک بار برایِ ۳۰ روز در این دستگاه</div>' +
      '<label for="maEmail">ایمیلِ کاری</label><input id="maEmail" type="email" inputmode="email" autocomplete="username" dir="ltr" placeholder="name@gmail.com">' +
      '<button type="button" class="ma-btn" data-a="send">ارسالِ کدِ ورود</button><div class="ma-msg"></div>' +
      '<div class="ma-row"><span></span>' + laterBtn() + '</div>' +
      '<div class="ma-note">کدِ ۶ رقمی به بله یا تلگرامِ شما فرستاده می‌شه.</div></div>';
    var inp = el.querySelector('#maEmail');
    inp.value = state.email || get('smartchip_user_email') || get('smartchip_erp_email');
    setTimeout(function () { inp.focus(); }, 30);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
    el.querySelector('[data-a=send]').onclick = send;
    var lb = el.querySelector('[data-a=later]'); if (lb) lb.onclick = later;
  }
  function send() {
    var inp = el.querySelector('#maEmail'), btn = el.querySelector('[data-a=send]');
    var email = (inp ? inp.value : state.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg('ایمیل رو درست بنویسید', 'err'); return; }
    state.email = email; if (btn) { btn.disabled = true; btn.textContent = 'در حالِ ارسال…'; }
    post('/api/staff/auth/request-code/', {email: email}).then(function (d) {
      if (d.ok) { stepCode(d.message); }
      else { if (btn) { btn.disabled = false; btn.textContent = 'ارسالِ کدِ ورود'; } msg(d.error || 'ارسال نشد', 'err');
 }
    }).catch(function () { if (btn) { btn.disabled = false; btn.textContent = 'ارسالِ کدِ ورود'; } msg('سرور در دسترس نیست — اینترنت رو چک کنید و دوباره امتحان کنید', 'err'); });
  }
  function stepCode(info) {
    el.innerHTML = '<div class="ma-box"><div class="ma-logo">مدار</div><div class="ma-sub" dir="ltr">' + state.email + '</div>' +
      '<label for="maCode">کدِ ۶ رقمی</label><input id="maCode" class="ma-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••">' +
      '<button type="button" class="ma-btn" data-a="verify">ورود</button><div class="ma-msg ma-ok"></div>' +
      '<div class="ma-row"><button type="button" class="ma-link" data-a="back">تغییرِ ایمیل</button><button type="button" class="ma-link" data-a="resend" disabled>ارسالِ دوباره (۶۰)</button></div></div>';
    msg(info || 'کد فرستاده شد', 'ok');
    var inp = el.querySelector('#maCode');
    setTimeout(function () { inp.focus(); }, 30);
    inp.addEventListener('input', function () {
      var v = inp.value.replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/\D/g, '').slice(0, 6);
      inp.value = v; if (v.length === 6) verify();
    });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') verify(); });
    el.querySelector('[data-a=verify]').onclick = verify;
    el.querySelector('[data-a=back]').onclick = stepEmail;
    var rs = el.querySelector('[data-a=resend]'), left = 60;
    clearInterval(state.timer);
    state.timer = setInterval(function () {
      left--; if (left <= 0) { clearInterval(state.timer); rs.disabled = false; rs.textContent = 'ارسالِ دوباره'; }
      else rs.textContent = 'ارسالِ دوباره (' + String(left).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }) + ')';
    }, 1000);
    rs.onclick = function () { if (!rs.disabled) { rs.disabled = true; send(); } };
  }
  function device() {
    var u = navigator.userAgent, b = /Edg\//.test(u) ? 'Edge' : /OPR\//.test(u) ? 'Opera' : /Firefox\//.test(u) ? 'Firefox' : /Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : 'مرورگر';
    var o = /Windows/.test(u) ? 'Windows' : /Android/.test(u) ? 'Android' : /iPhone|iPad/.test(u) ? 'iPhone/iPad' : /Mac OS/.test(u) ? 'Mac' : /Linux/.test(u) ? 'Linux' : '';
    return b + (o ? ' / ' + o : '');
  }
  function verify() {
    var inp = el.querySelector('#maCode'), btn = el.querySelector('[data-a=verify]');
    var code = (inp.value || '').replace(/\D/g, '');
    if (code.length !== 6) { msg('کدِ ۶ رقمی رو کامل وارد کنید', 'err'); return; }
    btn.disabled = true; btn.textContent = 'در حالِ بررسی…';
    post('/api/staff/auth/verify/', {email: state.email, code: code, device: device()}).then(function (d) {
      if (d.ok && d.token) {
        set(TK, d.token); set(NK, (d.staff && d.staff.name) || '');
        EMAIL_KEYS.forEach(function (k) { set(k, (d.staff && d.staff.email) || state.email); });
        msg('✅ وارد شدید', 'ok'); clearInterval(state.timer);
        setTimeout(function () { location.reload(); }, 350);
      } else { btn.disabled = false; btn.textContent = 'ورود'; msg(d.error || 'کد درست نیست', 'err'); inp.select(); }
    }).catch(function () { btn.disabled = false; btn.textContent = 'ورود'; msg('سرور در دسترس نیست — دوباره امتحان کنید', 'err'); });
  }
  function later() {
    try { sessionStorage.setItem('madar_auth_later', '1'); } catch (e) {}
    close();
  }
  function close() { if (el) { el.remove(); el = null; } state.open = false; clearInterval(state.timer); }

  function fetchMode() {
    return f0(API + '/api/staff/auth/mode/', {cache: 'no-store'})
      .catch(function () { return f0(OLD + '/api/staff/auth/mode/', {cache: 'no-store'}); })
      .then(function (r) { return r.ok ? r.json() : {mode: 'off'}; })
      .then(function (d) { return (d && d.mode) || 'off'; })
      .catch(function () { return 'unknown'; });
  }

  var MadarAuth = window.MadarAuth = {
    token: function () { return get(TK); },
    name: function () { return get(NK); },
    require: function (force) {
      if (state.open) return;
      fetchMode().then(function (mode) {
        state.mode = mode;
        if (mode === 'off' || mode === 'unknown') return;                 // سرور هنوز ورودِ امن نداره / در دسترس نیست
        state.strict = (mode === 'on');
        if (!state.strict && !force) { try { if (sessionStorage.getItem('madar_auth_later')) return; } catch (e) {} }
        if (force && get(TK)) { try { rm0.call(ls, TK); } catch (e) {} }
        state.open = true;
        var go = function () { stepEmail(); };
        if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
      });
    },
    logout: function (silent) {
      var t = get(TK);
      if (t) { f0(API + '/api/staff/auth/logout/', {method: 'POST', headers: {'Authorization': 'Token ' + t}}).catch(function () {}); }
      try { rm0.call(ls, TK); rm0.call(ls, NK); } catch (e) {}
      if (!silent) location.reload();
    },
    sessions: function () { return fetch(API + '/api/staff/auth/sessions/').then(function (r) { return r.json(); }); }
  };

  // ── ۵) لینکِ مستقیم به یک تب/صفحه (از کارتابل): crm.html#tab=prospMgmt ، erp.html#page=promises ──
  function deepLink() {
    var m = /^#(tab|page)=([\w-]+)/.exec(location.hash || ''); if (!m) return;
    var tries = 0, iv = setInterval(function () {
      tries++;
      var fn = m[1] === 'tab' ? window.showCrmTab : window.showPage;
      var ready = typeof fn === 'function' && !document.getElementById('madarAuth');
      if (ready) { clearInterval(iv); setTimeout(function () { try { fn(m[2]); } catch (e) {} }, 600); }
      if (tries > 60) clearInterval(iv);
    }, 400);
  }

  // ── ۶) 📥 کارتابلِ من — در همه‌ی صفحه‌ها ──
  var inboxCss = '#madarInbox{position:fixed;left:16px;bottom:16px;z-index:2147482000;font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl}' +
    '#madarInbox .mi-btn{display:flex;align-items:center;gap:6px;height:38px;padding:0 12px;border-radius:19px;border:1px solid #323952;background:#1a1e2a;color:#f4f5f8;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.3)}' +
    '#madarInbox .mi-btn:hover{border-color:#f0a500}' +
    '#madarInbox .mi-n{min-width:20px;height:20px;border-radius:10px;background:#ef4444;color:#fff;font-size:11px;display:inline-flex;align-items:center;justify-content:center;padding:0 5px}' +
    '#madarInbox .mi-n.zero{background:#323952;color:#9aa2bd}' +
    '#madarInbox .mi-panel{position:absolute;left:0;bottom:46px;width:min(360px,calc(100vw - 32px));max-height:min(480px,70vh);overflow:auto;background:#1a1e2a;border:1px solid #323952;border-radius:14px;box-shadow:0 16px 50px rgba(0,0,0,.45);color:#f4f5f8}' +
    '#madarInbox .mi-h{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #323952;font-weight:800;font-size:13px;position:sticky;top:0;background:#1a1e2a}' +
    '#madarInbox .mi-h a{color:#f0a500;font-size:11px;font-weight:600;text-decoration:none}' +
    '#madarInbox .mi-it{display:flex;gap:10px;align-items:flex-start;padding:9px 14px;border-bottom:1px solid #262c3d;text-decoration:none;color:inherit}' +
    '#madarInbox .mi-it:hover{background:#232838}' +
    '#madarInbox .mi-ic{font-size:16px;line-height:1.4}' +
    '#madarInbox .mi-t{font-size:12.5px;font-weight:700;line-height:1.6}' +
    '#madarInbox .mi-s{font-size:11px;color:#9aa2bd;line-height:1.6}' +
    '#madarInbox .mi-empty{padding:22px 14px;text-align:center;color:#9aa2bd;font-size:12px}' +
    '#madarInbox .mi-cats{display:flex;flex-wrap:wrap;gap:5px;padding:9px 12px;border-bottom:1px solid #323952}' +
    '#madarInbox .mi-cat{font-size:11px;color:#f4f5f8;text-decoration:none;border:1px solid #323952;border-radius:14px;padding:2px 9px;background:#232838}' +
    '#madarInbox .mi-cat:hover{border-color:#f0a500}' +
    '#madarInbox .mi-cat b{color:#ff8080;margin-right:3px}';
  var inbox = {el: null, items: [], open: false};
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function inboxRender() {
    if (!inbox.el) return;
    var n = inbox.count != null ? inbox.count : inbox.items.length;
    var cats = (inbox.cats || []).filter(function (c) { return c.count && !c.soon; });
    var fa = function (x) { return String(x).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }); };
    inbox.el.innerHTML = '<button type="button" class="mi-btn" aria-expanded="' + inbox.open + '" title="کارتابلِ من — هر چیزی که منتظرِ شماست">📥 کارتابل <span class="mi-n' + (n ? '' : ' zero') + '">' + fa(n) + '</span></button>' +
      (inbox.open ? '<div class="mi-panel" role="dialog" aria-label="کارتابلِ من"><div class="mi-h"><span>📥 کارتابلِ من</span><a href="org.html#inbox">صفحه‌ی کامل ›</a></div>' +
        (cats.length ? '<div class="mi-cats">' + cats.map(function (c) { return '<a class="mi-cat" href="org.html#inbox:' + c.key + '">' + c.icon + ' ' + esc(c.label) + ' <b>' + fa(c.count) + '</b></a>'; }).join('') + '</div>' : '') +
        (n ? inbox.items.slice(0, 30).map(function (it) {
          return '<a class="mi-it" href="' + esc(it.link || '#') + '"><span class="mi-ic">' + esc(it.icon) + '</span><span><div class="mi-t">' + esc(it.title) + '</div><div class="mi-s">' + esc(it.sub) + '</div></span></a>';
        }).join('') : '<div class="mi-empty">✨ چیزی منتظرِ شما نیست</div>') + '</div>' : '');
    inbox.el.querySelector('.mi-btn').onclick = function (e) { e.stopPropagation(); inbox.open = !inbox.open; inboxRender(); if (inbox.open) inboxLoad(); };
    var pn = inbox.el.querySelector('.mi-panel'); if (pn) pn.addEventListener('click', function (e) { e.stopPropagation(); });
  }
  function inboxLoad() {
    if (!get(TK)) return;
    fetch(API + '/api/org/inbox/', {cache: 'no-store'}).then(function (r) {
      if (r.status === 404 || r.status === 401) { if (inbox.el) { inbox.el.remove(); inbox.el = null; } return null; }
      return r.ok ? r.json() : null;
    }).then(function (d) {
      if (!d || !d.ok) return;
      if (!inbox.el) {
        var st = document.createElement('style'); st.textContent = inboxCss; document.head.appendChild(st);
        inbox.el = document.createElement('div'); inbox.el.id = 'madarInbox'; document.body.appendChild(inbox.el);
        var rb = document.getElementById('roadmapBtn'); if (rb) inbox.el.style.bottom = '76px';   // دکمه‌ی نقشه‌ی راهِ صفحه‌ی اصلی
        document.addEventListener('click', function () { if (inbox.open && inbox.el) { inbox.open = false; inboxRender(); } });
      }
      inbox.items = d.items || []; inbox.cats = d.categories || []; inbox.count = d.count; inboxRender();
      if (typeof window.onMadarInbox === 'function') { try { window.onMadarInbox(inbox.items); } catch (e) {} }
    }).catch(function () {});
  }
  MadarAuth.inbox = function () { return inbox.items; };
  MadarAuth.refreshInbox = inboxLoad;

  // ── ۴) شروع: اگه توکن نیست → فرم ؛ اگه هست → اعتبارش در پس‌زمینه بررسی بشه ──
  function boot() {
    var t = get(TK);
    if (!t) { MadarAuth.require(false); return; }
    f0(API + '/api/staff/auth/me/', {headers: {'Authorization': 'Token ' + t}, cache: 'no-store'})
      .catch(function () { return f0(OLD + '/api/staff/auth/me/', {headers: {'Authorization': 'Token ' + t}, cache: 'no-store'}); })
      .then(function (r) {
        if (r.status === 401) { try { rm0.call(ls, TK); } catch (e) {} MadarAuth.require(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then(function (d) { if (d && d.staff && d.staff.name) set(NK, d.staff.name); })
      .catch(function () {});
  }
  function start() {
    boot(); deepLink();
    if (window.MADAR_NO_INBOX_BUTTON) return;          // صفحه‌ای که کارتابل رو خودش نشون می‌ده (سازمان)
    setTimeout(inboxLoad, 2500);
    setInterval(function () { if (document.visibilityState === 'visible') inboxLoad(); }, 120000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
