// ⚠️ (۱۴۰۵/۰۶/۱۸) سرویس‌ورکرِ مشترکِ همه‌ی اپ‌های اسمارت‌چیپ (CRM, ERP,
// Price List, دفتر ارزی, مدیریت کارمندان).
//
// نکته‌ی حیاتی: طبقِ هشدارِ صریح به کاربر، این‌جا از استراتژیِ
// «network-first» استفاده شده — یعنی هر بار صفحه باز می‌شه، اول تلاش
// می‌کنه از سرور (نسخه‌ی تازه) بگیره؛ فقط اگه اینترنت نبود، از کش
// برمی‌گرده. این دقیقاً جلوی همون مشکلِ رایج رو می‌گیره که «آپدیت
// فرستادم ولی کاربر هنوز نسخه‌ی قدیمی رو می‌بینه» — چون کش هیچ‌وقت
// ارجحیت نداره، فقط یه پشتیبانِ آفلاینه.
//
// وقتی یه نسخه‌ی جدیدِ این فایل (sw.js) دیپلوی بشه، عددِ CACHE_VERSION
// رو دستی عوض کنید تا کشِ قدیمی پاک بشه.
const CACHE_VERSION = 'smartchip-v1';

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
  const isStaticAsset = /\.(png|jpg|jpeg|svg|ico|woff2?)$/.test(url.pathname);

  if (isStaticAsset) {
    // فایل‌های استاتیک (آیکون، فونت) به‌ندرت عوض می‌شن — cache-first
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
        return res;
      }))
    );
  } else {
    // صفحاتِ HTML/JS — network-first، تا همیشه نسخه‌ی تازه بیاد
    event.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
