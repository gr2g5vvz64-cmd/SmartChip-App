// ⚠️ (۱۴۰۵/۰۶/۱۸) سرویس‌ورکرِ مشترکِ همه‌ی اپ‌های اسمارت‌چیپ (CRM, ERP,
// Price List, دفتر ارزی, مدیریت کارمندان).
//
// ⚠️⚠️ فیکسِ باگِ حیاتی: نسخه‌ی قبلی هیچ چکی برای «هم‌مبدأ بودن»
// (same-origin) نداشت — یعنی داشت درخواست‌های API به بک‌اند
// (smartchip-backend.onrender.com، که یه دامنه‌ی کاملاً جداست) رو هم
// می‌گرفت و سعی می‌کرد کش/مدیریت‌شون کنه. وقتی fetch به یه سرویسِ
// cross-origin از داخلِ سرویس‌ورکر با مشکل مواجه می‌شد (مثلاً سردیِ
// اولیه‌ی رندر، یا هر پیچیدگیِ شبکه‌ای)، سرویس‌ورکر نمی‌تونست Response
// معتبری برگردونه (خطای «Failed to convert value to 'Response'») و
// کلِ درخواست به‌جای یه خطای عادیِ شبکه، کاملاً می‌شکست. همچنین باعثِ
// تداخل با preloadِ فونت هم می‌شد.
//
// فیکس: سرویس‌ورکر فقط رو درخواست‌های **هم‌مبدأ** (خودِ فایل‌های
// استاتیکِ سایت) دخالت می‌کنه. هر درخواستِ cross-origin (API، فونت،
// هر چیزِ دیگه‌ای از دامنه‌ی دیگه) رو کاملاً دست‌نخورده و بدونِ دخالت
// به مرورگر می‌سپاریم.
//
// وقتی یه نسخه‌ی جدیدِ این فایل (sw.js) دیپلوی بشه، عددِ CACHE_VERSION
// رو دستی عوض کنید تا کشِ قدیمی پاک بشه.
const CACHE_VERSION = 'smartchip-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // ⚠️ مهم‌ترین خط: اگه درخواست مالِ دامنه‌ی دیگه‌ایه (API بک‌اند، فونتِ
  // گوگل، هرچیزِ دیگه)، اصلاً دخالت نکن — بذار مرورگر خودش عادی مدیریت کنه.
  if (url.origin !== self.location.origin) {
    return;
  }

  const isStaticAsset = /\.(png|jpg|jpeg|svg|ico|woff2?)$/.test(url.pathname);

  if (isStaticAsset) {
    // فایل‌های استاتیکِ خودِ سایت (آیکون‌ها) به‌ندرت عوض می‌شن — cache-first
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
        return res;
      }))
    );
  } else {
    // صفحاتِ HTML/JSِ خودِ سایت — network-first، تا همیشه نسخه‌ی تازه بیاد
    event.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
