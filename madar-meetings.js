/*
 * 🗓 madar-meetings.js — «جلسه‌ها و اعلان‌ها» (۱۴۰۵/۰۷/۲۰) — کدِ مشترکِ صفحه‌هایِ «اعلان و جلسه» (مدیریت) و «داشبوردِ من» (همه)
 *   MadarMeet.card(m, {admin})        ← کارتِ یک جلسه/اعلان (HTML)
 *   MadarMeet.bind(root, opts)        ← دکمه‌هایِ کارت‌ها: پاسخِ حضور، خواندم، صورتجلسه، جزئیات، (مدیریت) ویرایش/لغو/یادآوری
 *   MadarMeet.openMinutes(id, cb)     ← پنجره‌یِ صورتجلسه (دبیر یا مدیریت)
 *   MadarMeet.openDetail(id)          ← جزئیاتِ جلسه
 *   MadarMeet.util                    ← تاریخِ شمسی: todayJ، addDays، normDate، normTime، faDate، weekday، fa
 * API: /api/announce/ (announce_app) — هیچ داده‌ای را خودش نگه نمی‌دارد.
 */
(function () {
  'use strict';
  if (window.MadarMeet) return;
  var API = 'https://api.smartchipelec.com';
  var MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  var WD = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];     // Date.getDay(): یکشنبه=۰
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  function fa(n) { return String(n == null ? '' : n).replace(/\d/g, function (d) { return FA[d]; }); }
  function en(s) { return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; }).trim(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  /* ───── تاریخِ شمسی (همان الگوریتمِ سرور) ───── */
  function g2j(gy, gm, gd) {
    var gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], fl = Math.floor;
    var gy2 = gm > 2 ? gy + 1 : gy;
    var days = 355666 + 365 * gy + fl((gy2 + 3) / 4) - fl((gy2 + 99) / 100) + fl((gy2 + 399) / 400) + gd + gdm[gm - 1];
    var jy = -1595 + 33 * fl(days / 12053); days %= 12053;
    jy += 4 * fl(days / 1461); days %= 1461;
    if (days > 365) { jy += fl((days - 1) / 365); days = (days - 1) % 365; }
    var jm, jd;
    if (days < 186) { jm = 1 + fl(days / 31); jd = 1 + days % 31; } else { jm = 7 + fl((days - 186) / 30); jd = 1 + (days - 186) % 30; }
    return [jy, jm, jd];
  }
  function j2g(jy, jm, jd) {
    var fl = Math.floor;
    jy += 1595;
    var days = -355668 + 365 * jy + fl(jy / 33) * 8 + fl(((jy % 33) + 3) / 4) + jd;
    days += jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186;
    var gy = 400 * fl(days / 146097); days %= 146097;
    if (days > 36524) { days -= 1; gy += 100 * fl(days / 36524); days %= 36524; if (days >= 365) days += 1; }
    gy += 4 * fl(days / 1461); days %= 1461;
    if (days > 365) { gy += fl((days - 1) / 365); days = (days - 1) % 365; }
    var gd = days + 1, leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
    var ms = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], gm = 1;
    while (gm <= 12 && gd > ms[gm]) { gd -= ms[gm]; gm++; }
    return [gy, gm, gd];
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayJ() { var d = new Date(), j = g2j(d.getFullYear(), d.getMonth() + 1, d.getDate()); return j[0] + '-' + pad(j[1]) + '-' + pad(j[2]); }
  function parseJ(s) { var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(en(s).replace(/\//g, '-')); if (!m) return null; var y = +m[1], mo = +m[2], d = +m[3]; if (mo < 1 || mo > 12 || d < 1 || d > (mo <= 6 ? 31 : 30)) return null; return [y, mo, d]; }
  function normDate(s) { var p = parseJ(s); return p ? p[0] + '-' + pad(p[1]) + '-' + pad(p[2]) : ''; }
  function toDate(jd) { var p = parseJ(jd); if (!p) return null; var g = j2g(p[0], p[1], p[2]); return new Date(g[0], g[1] - 1, g[2], 12); }
  function addDays(jd, n) { var d = toDate(jd) || new Date(); d.setDate(d.getDate() + n); var j = g2j(d.getFullYear(), d.getMonth() + 1, d.getDate()); return j[0] + '-' + pad(j[1]) + '-' + pad(j[2]); }
  function weekday(jd) { var d = toDate(jd); return d ? WD[d.getDay()] : ''; }
  function faDate(jd) { var p = parseJ(jd); return p ? fa(p[2] + ' ' + MONTHS[p[1] - 1] + ' ' + p[0]) : fa(jd || ''); }
  function normTime(s) { var m = /^(\d{1,2})[:٫](\d{2})$/.exec(en(s)); if (!m || +m[1] > 23 || +m[2] > 59) return ''; return pad(+m[1]) + ':' + m[2]; }

  /* ───── شبکه ───── */
  function myEmail() { try { return localStorage.getItem('smartchip_user_email') || localStorage.getItem('smartchip_erp_email') || ''; } catch (e) { return ''; } }
  function api(path, body, method) {
    var em = myEmail();
    var url = API + path + (path.indexOf('?') >= 0 ? '&' : '?') + 'email=' + encodeURIComponent(em);
    var opt = body === undefined ? { cache: 'no-store' } : { method: method || 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ actor_email: em }, body)) };
    return fetch(url, opt).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j || j.ok === false) throw new Error((j && j.error) || ('خطا ' + r.status)); return j; }); });
  }
  var _staff = null;
  function staff() {
    if (_staff) return Promise.resolve(_staff);
    return fetch(API + '/api/staff/staff/', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (a) {
      _staff = (Array.isArray(a) ? a : (a.results || [])).filter(function (x) { return x.active !== false && x.name; }).map(function (x) { return x.name; }).sort(); return _staff;
    }).catch(function () { return []; });
  }

  /* ───── استایل (یک‌بار) ───── */
  function css() {
    if (document.getElementById('mm-css')) return;
    var s = document.createElement('style'); s.id = 'mm-css';
    s.textContent = [
      '.mm-card{background:var(--card2,#232838);border:1px solid var(--line,#323952);border-right:4px solid #29b6f6;border-radius:14px;padding:11px 13px;margin-bottom:9px}',
      '.mm-card.imp{border-right-color:#f87171}.mm-card.canceled{opacity:.55;border-right-color:#6b7280}.mm-card.held{border-right-color:#34d399}.mm-card.ann{border-right-color:#f0a500}',
      '.mm-h{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.mm-h b{font-size:14px}',
      '.mm-st{font-size:10.5px;border:1px solid var(--line,#323952);border-radius:9px;padding:0 8px;color:var(--soft,#9aa2bd)}',
      '.mm-st.red{color:#f87171;border-color:rgba(248,113,113,.5)}.mm-st.grn{color:#34d399;border-color:rgba(52,211,153,.5)}.mm-st.org{color:#fb923c;border-color:rgba(251,146,60,.5)}',
      '.mm-s{font-size:12px;color:var(--soft,#9aa2bd);margin-top:3px;line-height:1.8}',
      '.mm-ag{font-size:12px;white-space:pre-line;background:rgba(255,255,255,.04);border-radius:10px;padding:6px 10px;margin-top:6px}',
      '.mm-act{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
      '.mm-b{background:var(--card,#1a1e2a);border:1px solid var(--line,#323952);color:var(--ink,#f4f5f8);border-radius:10px;padding:5px 12px;font:inherit;font-size:12px;cursor:pointer}',
      '.mm-b:hover{border-color:#f0a500}.mm-b.on{background:#f0a500;border-color:#f0a500;color:#1b1400;font-weight:800}.mm-b.pri{background:#f0a500;border-color:#f0a500;color:#1b1400;font-weight:800}.mm-b.bad{color:#f87171}',
      '.mm-b:disabled{opacity:.5;cursor:default}',
      '.mm-cnt{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;font-size:11px}.mm-cnt span{background:rgba(255,255,255,.05);border-radius:9px;padding:0 8px}',
      '.mm-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:4vh 12px;overflow:auto}',
      '.mm-md{background:var(--card,#1a1e2a);color:var(--ink,#f4f5f8);border:1px solid var(--line,#323952);border-radius:16px;padding:16px;width:100%;max-width:640px;font-family:inherit;font-size:13.5px;line-height:1.8}',
      '.mm-md h3{margin:0 0 8px;font-size:16px}.mm-md label{display:block;font-size:11.5px;color:var(--soft,#9aa2bd);margin:8px 0 3px}',
      '.mm-md input,.mm-md textarea,.mm-md select{width:100%;font:inherit;background:var(--bg,#0f1218);color:var(--ink,#f4f5f8);border:1px solid var(--line,#323952);border-radius:10px;padding:7px 10px;font-size:13px}',
      '.mm-md textarea{min-height:110px;resize:vertical;line-height:1.9}',
      '.mm-row{display:grid;grid-template-columns:2fr 1.2fr 1fr auto;gap:6px;margin-bottom:6px;align-items:center}',
      '.mm-ck{display:flex;gap:6px;flex-wrap:wrap}.mm-ck label{display:inline-flex;gap:5px;align-items:center;margin:0;background:rgba(255,255,255,.05);border-radius:9px;padding:2px 9px;color:var(--ink,#f4f5f8);font-size:12px;cursor:pointer}.mm-ck input{width:auto}',
      '.mm-msg{margin-top:8px;font-size:12.5px}.mm-msg.bad{color:#f87171}.mm-msg.ok{color:#34d399}',
      '@media(max-width:600px){.mm-row{grid-template-columns:1fr 1fr}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ───── کارت ───── */
  function stBadge(m) {
    if (m.kind === 'announce') return '<span class="mm-st org">📢 اعلان</span>';
    if (m.status === 'canceled') return '<span class="mm-st red">لغو شد</span>';
    if (m.status === 'held') return '<span class="mm-st grn">برگزار شد</span>';
    if (m.needs_minutes) return '<span class="mm-st org">صورتجلسه ننوشته</span>';
    var t = m.minutes_to_start;
    if (t != null && t > 0 && t <= 1440) return '<span class="mm-st org">' + (t < 60 ? fa(t) + ' دقیقه دیگر' : fa(Math.round(t / 60)) + ' ساعت دیگر') + '</span>';
    return '<span class="mm-st">برنامه‌ریزی‌شده</span>';
  }
  function card(m, opts) {
    opts = opts || {}; css();
    var cls = 'mm-card' + (m.kind === 'announce' ? ' ann' : '') + (m.important ? ' imp' : '') + (m.status === 'canceled' ? ' canceled' : '') + (m.status === 'held' ? ' held' : '');
    var h = '<div class="' + cls + '" data-mid="' + m.id + '"><div class="mm-h"><b>' + (m.kind === 'announce' ? '📢 ' : '🗓 ') + esc(m.title || (m.text || '').slice(0, 50)) + (m.important ? ' ❗' : '') + '</b>' + stBadge(m) + '</div>';
    if (m.kind === 'meeting') {
      h += '<div class="mm-s">📅 ' + esc(m.weekday) + ' ' + faDate(m.date) + ' · 🕘 ' + fa(m.time) + (m.end ? '–' + fa(m.end) : '') + (m.place ? ' · 📍 ' + esc(m.place) : '') + (m.link ? ' · <a href="' + esc(m.link) + '" target="_blank" rel="noopener" style="color:#f0a500">🔗 لینک</a>' : '') + '</div>';
      if (m.agenda) h += '<div class="mm-ag">' + esc(m.agenda) + '</div>';
      h += '<div class="mm-s">' + (m.secretary ? '✍️ دبیر: ' + esc(m.secretary) + ' · ' : '') + '👥 ' + esc(m.audience_label || '') + ' (' + fa(m.total) + ' نفر) · از طرفِ ' + esc(m.sender) + '</div>';
    } else {
      h += '<div class="mm-ag">' + esc(m.text) + '</div><div class="mm-s">از طرفِ ' + esc(m.sender) + ' · ' + faDate(todayJ()) + '</div>';
    }
    var c = m.counts || {};
    if (opts.admin || m.is_secretary) {
      if (m.kind === 'meeting') h += '<div class="mm-cnt"><span>✅ ' + fa(c.yes || 0) + '</span><span>❌ ' + fa(c.no || 0) + '</span><span>❔ ' + fa(c.maybe || 0) + '</span><span>⏳ بی‌پاسخ ' + fa(c.none || 0) + '</span></div>';
      else if (m.needs_ack) h += '<div class="mm-cnt"><span>👁 ' + fa(c.ack || 0) + ' از ' + fa(m.total) + ' نفر خوانده‌اند</span></div>';
    }
    h += '<div class="mm-act">';
    if (m.my && m.my.role !== 'host' && m.status !== 'canceled') {
      if (m.kind === 'meeting' && m.status === 'scheduled') ['yes', 'no', 'maybe'].forEach(function (k) { h += '<button class="mm-b' + (m.my.rsvp === k ? ' on' : '') + '" data-a="rsvp:' + k + '">' + ({ yes: '✅ می‌آیم', no: '❌ نمی‌توانم', maybe: '❔ شاید' })[k] + '</button>'; });
      if (m.kind === 'announce' && m.needs_ack) h += '<button class="mm-b' + (m.my.rsvp === 'ack' ? ' on' : ' pri') + '" data-a="rsvp:ack"' + (m.my.rsvp === 'ack' ? ' disabled' : '') + '>' + (m.my.rsvp === 'ack' ? '👁 خواندم ✓' : '👁 خواندم') + '</button>';
    }
    if (m.kind === 'meeting' && m.can_minutes) h += '<button class="mm-b' + (m.needs_minutes ? ' pri' : '') + '" data-a="minutes">📝 ' + (m.minutes_sent_at ? 'صورتجلسه (ویرایش)' : 'صورتجلسه') + '</button>';
    if (m.kind === 'meeting') h += '<button class="mm-b" data-a="detail">👁 جزئیات</button>';
    if (opts.admin && m.kind === 'meeting' && m.status === 'scheduled') h += '<button class="mm-b" data-a="edit">✏️ ویرایش</button><button class="mm-b bad" data-a="cancel">🚫 لغو</button>';
    if (opts.admin && m.status !== 'canceled' && ((c.none || 0) > 0 || (m.kind === 'announce' && m.needs_ack && (c.ack || 0) < m.total))) h += '<button class="mm-b" data-a="remind">🔔 یادآوری به بی‌پاسخ‌ها</button>';
    return h + '</div></div>';
  }

  function bind(root, opts) {
    opts = opts || {};
    var items = opts.items || function () { return []; };
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b || !root.contains(b)) return;
      var cardEl = b.closest('[data-mid]'); if (!cardEl) return;
      var id = +cardEl.getAttribute('data-mid'), a = b.getAttribute('data-a'), done = function () { if (opts.onChange) opts.onChange(); };
      var m = (items() || []).filter(function (x) { return x.id === id; })[0] || { id: id };
      if (a.indexOf('rsvp:') === 0) {
        var ans = a.slice(5), note = '';
        if (ans === 'no') { note = prompt('دلیل (اختیاری):', '') || ''; }
        b.disabled = true;
        api('/api/announce/' + id + '/rsvp/', { answer: ans, note: note }).then(done).catch(function (er) { alert(er.message); b.disabled = false; });
      } else if (a === 'minutes') openMinutes(id, done);
      else if (a === 'detail') openDetail(id);
      else if (a === 'edit') openEdit(id, done);
      else if (a === 'cancel') {
        var r = prompt('دلیلِ لغو (به همه‌یِ دعوت‌شدگان گفته می‌شود):', ''); if (r === null) return;
        api('/api/announce/' + id + '/cancel/', { reason: r }).then(done).catch(function (er) { alert(er.message); });
      } else if (a === 'remind') {
        b.disabled = true;
        api('/api/announce/' + id + '/remind/', {}).then(function (j) { alert('یادآوری فرستاده شد: ' + fa(j.sent) + ' نفر' + ((j.skipped || []).length ? '\nنرسید (بله/تلگرام وصل نیست): ' + j.skipped.join('، ') : '')); b.disabled = false; }).catch(function (er) { alert(er.message); b.disabled = false; });
      }
    });
  }

  /* ───── پنجره ───── */
  function modal(html) {
    css();
    var bg = document.createElement('div'); bg.className = 'mm-bg';
    bg.innerHTML = '<div class="mm-md">' + html + '</div>';
    bg.addEventListener('mousedown', function (e) { if (e.target === bg) bg.remove(); });
    document.body.appendChild(bg);
    return bg;
  }

  function openDetail(id) {
    api('/api/announce/' + id + '/').then(function (j) {
      var m = j.item, h = '<h3>🗓 ' + esc(m.title) + '</h3><div class="mm-s">' + esc(m.weekday) + ' ' + faDate(m.date) + ' · ' + fa(m.time) + (m.end ? '–' + fa(m.end) : '') + (m.place ? ' · 📍 ' + esc(m.place) : '') + (m.link ? ' · <a href="' + esc(m.link) + '" target="_blank" rel="noopener" style="color:#f0a500">لینک</a>' : '') + '</div>';
      if (m.status === 'canceled') h += '<div class="mm-msg bad">🚫 لغو شد' + (m.cancel_reason ? ': ' + esc(m.cancel_reason) : '') + '</div>';
      if (m.agenda) h += '<label>دستورِ جلسه</label><div class="mm-ag">' + esc(m.agenda) + '</div>';
      if (m.text) h += '<label>توضیح</label><div class="mm-ag">' + esc(m.text) + '</div>';
      h += '<label>دبیرِ جلسه</label><div>' + esc(m.secretary || '— (تعیین نشده)') + '</div>';
      if (m.attendees) h += '<label>دعوت‌شدگان (' + fa(m.attendees.length) + ')</label><div class="mm-ck">' + m.attendees.map(function (x) { return '<span class="mm-st" style="padding:2px 9px;font-size:12px">' + esc(x.name) + (x.role === 'host' ? ' 🏛️' : x.role === 'secretary' ? ' ✍️' : '') + (x.rsvp ? ' ' + ({ yes: '✅', no: '❌', maybe: '❔', ack: '👁' })[x.rsvp] : '') + (x.note ? ' («' + esc(x.note) + '»)' : '') + '</span>'; }).join('') + '</div>';
      if (m.minutes) {
        h += '<label>📝 صورتجلسه</label><div class="mm-ag">' + esc(m.minutes) + '</div>';
        if ((m.attended || []).length) h += '<label>حاضران</label><div>' + esc(m.attended.join('، ')) + '</div>';
        if ((m.decisions || []).length) h += '<label>مصوبه‌ها</label>' + m.decisions.map(function (d) { return '<div class="mm-s">• ' + esc(d.text) + (d.owner ? ' — ' + esc(d.owner) : '') + (d.due ? ' · تا ' + faDate(d.due) : '') + (d.deleg_id ? ' ✓ در پیگیری' : '') + '</div>'; }).join('');
      } else if (m.status !== 'canceled') h += '<div class="mm-s" style="margin-top:8px">صورتجلسه هنوز ثبت نشده.</div>';
      h += '<div class="mm-act"><button class="mm-b" data-x="1">بستن</button></div>';
      var bg = modal(h); bg.querySelector('[data-x]').onclick = function () { bg.remove(); };
    }).catch(function (er) { alert(er.message); });
  }

  function openMinutes(id, cb) {
    Promise.all([api('/api/announce/' + id + '/'), staff()]).then(function (r) {
      var m = r[0].item, st = r[1], att = (m.attendees || []).map(function (x) { return x.name; });
      var pre = (m.attended && m.attended.length) ? m.attended : (m.attendees || []).filter(function (x) { return x.rsvp === 'yes' || x.role === 'host' || x.role === 'secretary'; }).map(function (x) { return x.name; });
      var h = '<h3>📝 صورتجلسه — ' + esc(m.title) + '</h3><div class="mm-s">' + esc(m.weekday) + ' ' + faDate(m.date) + ' · ' + fa(m.time) + (m.place ? ' · ' + esc(m.place) : '') + '</div>';
      h += '<label>حاضران (تیک بزنید)</label><div class="mm-ck" id="mmAtt">' + att.map(function (n) { return '<label><input type="checkbox" value="' + esc(n) + '"' + (pre.indexOf(n) >= 0 ? ' checked' : '') + '>' + esc(n) + '</label>'; }).join('') + '</div>';
      h += '<label>متنِ صورتجلسه (بحث‌ها و نتیجه‌ها)</label><textarea id="mmTxt" maxlength="8000" placeholder="موضوع‌هایِ مطرح‌شده، نظرها و نتیجه‌یِ هر کدام…">' + esc(m.minutes || '') + '</textarea>';
      h += '<label>مصوبه‌ها — اگر «مسئول» و «موعد» بدهید، خودکار در «پیگیری و تحویل» ثبت و به او اطلاع داده می‌شود</label><div id="mmDec"></div><button class="mm-b" id="mmAdd">➕ مصوبه</button>';
      h += '<div class="mm-msg" id="mmMsg"></div><div class="mm-act"><button class="mm-b pri" id="mmSend">📤 ثبت و ارسال برایِ همه</button><button class="mm-b" id="mmSave">💾 فقط ذخیره (پیش‌نویس)</button><button class="mm-b" id="mmX">بستن</button></div>';
      h += '<div class="mm-s">«ارسال» صورتجلسه را به بله/تلگرامِ همه‌یِ دعوت‌شدگان می‌فرستد و جلسه «برگزارشده» می‌شود' + (m.minutes_sent_at ? ' (قبلاً هم فرستاده شده؛ این بار «اصلاح‌شده» ارسال می‌شود)' : '') + '.</div>';
      var bg = modal(h), dec = bg.querySelector('#mmDec');
      function addRow(d) {
        d = d || {}; var row = document.createElement('div'); row.className = 'mm-row'; row.setAttribute('data-id', d.deleg_id || '');
        row.innerHTML = '<input class="d-t" placeholder="متنِ مصوبه" value="' + esc(d.text || '') + '"><select class="d-o"><option value="">مسئول…</option>' + st.map(function (n) { return '<option' + (n === d.owner ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select><input class="d-d" placeholder="موعد ۱۴۰۵/۰۷/۲۵" value="' + esc(d.due ? d.due.replace(/-/g, '/') : '') + '"><button class="mm-b bad" type="button">✕</button>';
        row.querySelector('button').onclick = function () { row.remove(); }; if (d.deleg_id) { row.querySelector('.d-t').disabled = row.querySelector('.d-o').disabled = row.querySelector('.d-d').disabled = true; }
        dec.appendChild(row);
      }
      (m.decisions || []).forEach(addRow);
      bg.querySelector('#mmAdd').onclick = function () { addRow(); };
      bg.querySelector('#mmX').onclick = function () { bg.remove(); };
      function go(send) {
        var msg = bg.querySelector('#mmMsg'); msg.className = 'mm-msg'; msg.textContent = '';
        var decs = [], bad = 0;
        [].slice.call(dec.children).forEach(function (r, i) {
          var t = r.querySelector('.d-t').value.trim(), raw = r.querySelector('.d-d').value.trim(), due = normDate(raw);
          if (!t) return;
          if (raw && !due && !bad) { bad = i + 1; }
          decs.push({ text: t, owner: r.querySelector('.d-o').value, due: due, deleg_id: +r.getAttribute('data-id') || null });
        });
        if (bad) { msg.className = 'mm-msg bad'; msg.textContent = 'موعدِ مصوبه‌یِ ' + fa(bad) + ' را درست بنویسید (مثلاً ۱۴۰۵/۰۷/۲۵)'; return; }
        var body = { minutes: bg.querySelector('#mmTxt').value.trim(), attended: [].slice.call(bg.querySelectorAll('#mmAtt input:checked')).map(function (x) { return x.value; }), decisions: decs, send: send };
        if (send && !confirm('صورتجلسه همین حالا برایِ همه‌یِ دعوت‌شدگان فرستاده شود؟')) return;
        [].forEach.call(bg.querySelectorAll('.mm-act button'), function (b) { b.disabled = true; });
        api('/api/announce/' + id + '/minutes/', body).then(function (j) {
          msg.className = 'mm-msg ok'; msg.textContent = send ? ('✅ فرستاده شد: ' + fa(j.sent) + ' نفر' + (j.followups ? ' · ' + fa(j.followups) + ' مصوبه به «پیگیری» رفت' : '')) : '✅ ذخیره شد';
          setTimeout(function () { bg.remove(); if (cb) cb(); }, 900);
        }).catch(function (er) { msg.className = 'mm-msg bad'; msg.textContent = '❌ ' + er.message; [].forEach.call(bg.querySelectorAll('.mm-act button'), function (b) { b.disabled = false; }); });
      }
      bg.querySelector('#mmSend').onclick = function () { go(true); };
      bg.querySelector('#mmSave').onclick = function () { go(false); };
    }).catch(function (er) { alert(er.message); });
  }

  function openEdit(id, cb) {
    Promise.all([api('/api/announce/' + id + '/'), staff()]).then(function (r) {
      var m = r[0].item, st = r[1];
      var h = '<h3>✏️ ویرایشِ جلسه</h3><label>عنوان</label><input id="eT" value="' + esc(m.title) + '">' +
        '<div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:6px"><div><label>تاریخ (شمسی)</label><input id="eD" value="' + esc(m.date.replace(/-/g, '/')) + '"></div><div><label>شروع</label><input id="eS" type="time" value="' + esc(m.time) + '"></div><div><label>پایان</label><input id="eE" type="time" value="' + esc(m.end) + '"></div></div>' +
        '<label>مکان</label><input id="eP" value="' + esc(m.place) + '"><label>لینکِ جلسه‌یِ آنلاین</label><input id="eL" dir="ltr" value="' + esc(m.link) + '">' +
        '<label>دستورِ جلسه</label><textarea id="eA">' + esc(m.agenda) + '</textarea>' +
        '<label>دبیرِ جلسه</label><select id="eSec"><option value="">— بدونِ دبیر —</option>' + st.map(function (n) { return '<option' + (n === m.secretary ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select>' +
        '<div class="mm-s">با تغییرِ تاریخ/ساعت، پاسخ‌هایِ حضور پاک می‌شود و به همه‌یِ دعوت‌شدگان «تغییرِ جلسه» اطلاع داده می‌شود.</div><div class="mm-msg" id="eMsg"></div>' +
        '<div class="mm-act"><button class="mm-b pri" id="eOk">💾 ذخیره و اطلاع به همه</button><button class="mm-b" id="eX">انصراف</button></div>';
      var bg = modal(h);
      bg.querySelector('#eX').onclick = function () { bg.remove(); };
      bg.querySelector('#eOk').onclick = function () {
        var msg = bg.querySelector('#eMsg'); msg.className = 'mm-msg';
        var d = normDate(bg.querySelector('#eD').value); if (!d) { msg.className = 'mm-msg bad'; msg.textContent = 'تاریخ را درست بنویسید (۱۴۰۵/۰۷/۲۲)'; return; }
        var body = { title: bg.querySelector('#eT').value.trim(), date: d, time: bg.querySelector('#eS').value, end: bg.querySelector('#eE').value, place: bg.querySelector('#eP').value.trim(), link: bg.querySelector('#eL').value.trim(), agenda: bg.querySelector('#eA').value.trim(), secretary: bg.querySelector('#eSec').value };
        bg.querySelector('#eOk').disabled = true;
        api('/api/announce/' + id + '/edit/', body).then(function (j) { msg.className = 'mm-msg ok'; msg.textContent = j.changed ? ('✅ ذخیره شد · به ' + fa(j.notified) + ' نفر اطلاع داده شد') : 'تغییری نبود'; setTimeout(function () { bg.remove(); if (cb) cb(); }, 800); })
          .catch(function (er) { msg.className = 'mm-msg bad'; msg.textContent = '❌ ' + er.message; bg.querySelector('#eOk').disabled = false; });
      };
    }).catch(function (er) { alert(er.message); });
  }

  window.MadarMeet = { card: card, bind: bind, openMinutes: openMinutes, openDetail: openDetail, openEdit: openEdit, api: api, staff: staff, css: css,
    util: { fa: fa, en: en, esc: esc, todayJ: todayJ, addDays: addDays, normDate: normDate, normTime: normTime, faDate: faDate, weekday: weekday } };
})();
