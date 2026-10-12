/* 🪪 madar-customer-card.js — کارتِ یکپارچه‌یِ مشتری + نرمال‌سازیِ جستجو (۱۴۰۵/۰۷/۲۱)
   در «مشتریان» و «یکپارچگیِ مشتریان» مشترک است.
   MadarCC.norm(text)  ← نرمال‌سازیِ نام برایِ جستجو (ي/ی، ك/ک، نیم‌فاصله، ارقام)
   MadarCC.html(d)     ← d = پاسخِ /api/customers/identity/profile/ */
(function () {
  var D1 = '۰۱۲۳۴۵۶۷۸۹', D2 = '٠١٢٣٤٥٦٧٨٩';
  function norm(s) {
    s = String(s == null ? '' : s);
    s = s.replace(/[۰-۹]/g, function (c) { return D1.indexOf(c); }).replace(/[٠-٩]/g, function (c) { return D2.indexOf(c); });
    return s.replace(/ي/g, 'ی').replace(/ى/g, 'ی').replace(/ك/g, 'ک').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه')
      .replace(/[‌ ]/g, ' ').replace(/[‎‏]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function fa(n) { return String(n == null ? '' : n).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }); }
  function num(n) { return fa(Math.round(Number(n || 0)).toLocaleString('en')); }
  function html(d) {
    var c = d.customer, L = d.leads, Ch = d.cheques, Db = d.debts, Lg = d.ledger;
    var kp = '';
    if (L) kp += '<div><b>' + fa(L.open) + '</b>لیدِ باز از ' + fa(L.total) + '</div>';
    if (Lg) kp += '<div><b style="color:' + (Lg.yuan > 0 ? 'var(--warn)' : 'var(--ok)') + '">' + num(Lg.yuan) + ' ¥</b>مانده‌یِ یوانی</div><div><b>' + fa(Lg.open_orders) + '</b>فاکتورِ باز</div>';
    if (Ch) kp += '<div><b class="' + (Ch.returned_open ? 'bad' : 'good') + '">' + fa(Ch.returned_open) + '</b>چکِ برگشتیِ باز</div><div><b>' + fa(Ch.received_unregistered) + '</b>چکِ بدونِ صیادی</div>';
    if (Db) kp += '<div><b class="' + (Db.open ? 'bad' : 'good') + '">' + fa(Db.open) + '</b>پرونده‌یِ وصولِ باز</div>';
    var parts = (d.parts || []).map(function (p) {
      return '<span class="tag">' + esc(p.label) + ': ' + fa(p.records) + (p.variants.length ? ' <span style="color:var(--warn)">(املایِ دیگر: ' + esc(p.variants.join('، ')) + ')</span>' : '') + '</span>';
    }).join('');
    var meta = [c.category, c.province, c.mobile].filter(Boolean).join(' · ') + (c.assigned_staff_name ? ' · کارشناس: ' + c.assigned_staff_name : '');
    return '<div class="row"><b style="font-size:16px">' + esc(c.name) + '</b><span class="tag">' + esc(c.abbr) + '</span>' +
      (c.priority ? '<span class="tag">اولویت ' + esc(c.priority) + '</span>' : '') +
      (c.vip && c.vip !== 'normal' ? '<span class="tag ok">' + esc(c.vip) + '</span>' : '') +
      '<span class="sub" style="margin:0">' + esc(meta) + '</span></div>' +
      (kp ? '<div class="kp" style="margin-top:10px">' + kp + '</div>' : '') +
      '<div style="margin-top:10px">' + parts + '</div>' +
      ((d.aliases || []).length ? '<div class="sub" style="margin-top:8px">نام‌هایِ دیگر: ' + d.aliases.map(function (a) { return esc(a.alias); }).join('، ') + '</div>' : '');
  }
  window.MadarCC = {norm: norm, html: html, esc: esc, fa: fa};
})();
