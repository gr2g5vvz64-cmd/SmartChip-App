// ⚠️ (۱۴۰۵/۰۷/۱۱) سرویس‌ورکرِ اختصاصیِ «یادآوری‌ها» — طبقِ درخواستِ صریحِ کاربر: فقط همین
// صفحه PWA باشه، نه بقیه‌ی اپ‌ها (CRM، ERP، دفترِ ارزی، …). به‌جایِ استفاده‌ی دوباره از
// sw.js مشترکِ قبلی، یک فایلِ جدا با همین اسم ساختیم و در reminders.html با
// {scope: './reminders.html'} ثبت می‌شه — یعنی مرورگر این سرویس‌ورکر رو فقط رویِ همین
// یک آدرس فعال می‌کنه و هیچ‌وقت رویِ crm.html، erp.html و بقیه کنترل نمی‌گیره، حتی اگه
// تویِ تبِ دیگه‌ای باز باشن.
//
// منطقِ کش دقیقاً همون نسخه‌ی فیکس‌شده‌ست (نه نسخه‌ی اولیه‌ای که باگ داشت):
//  ۱) فقط درخواست‌هایِ هم‌مبدأ رو می‌گیره — درخواست‌هایِ API به بک‌اند (دامنه‌ی جدا) دست‌نخورده رد می‌شن.
//  ۲) اگه fetch شکست خورد و کشی هم نبود، به‌جایِ resolve با undefined (که خطایِ
//     «Failed to convert value to 'Response'» می‌داد)، همون خطایِ اصلی رو throw می‌کنه تا
//     مرورگر خودش رفتارِ عادیِ «اتصال برقرار نشد» رو نشون بده.
const CACHE_VERSION = 'smartchip-reminders-v1';

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

  // درخواستِ دامنه‌یِ دیگه (API بک‌اند، فونت، …) — دست‌نخورده به مرورگر بسپار
  if (url.origin !== self.location.origin) {
    return;
  }

  const isStaticAsset = /\.(png|jpg|jpeg|svg|ico|woff2?)$/.test(url.pathname);

  if (isStaticAsset) {
    // آیکون‌ها و فونت‌هایِ خودِ سایت — به‌ندرت عوض می‌شن، cache-first
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
        return res;
      }))
    );
  } else {
    // خودِ reminders.html و مانیفستش — network-first، تا همیشه نسخه‌ی تازه بیاد
    event.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
        return res;
      }).catch(async (err) => {
        const cached = await caches.match(req);
        if (cached) return cached;
        throw err;
      })
    );
  }
});
