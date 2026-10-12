/*
 * 🧭 madar-tiles.js — «تنها فهرستِ بخش‌هایِ مدار» (۱۴۰۵/۰۷/۱۹)
 * صفحه‌یِ اصلی (index.html) و مدار موبایل (m.html) هر دو از همین فهرست ساخته می‌شوند؛
 * پس هر بخشِ تازه فقط یک‌بار اینجا اضافه شود، خودکار در دسکتاپ و گوشی می‌آید.
 *
 * هر ردیف: key | icon | title | desc | href | perm (مجوزِ «پنلِ دسترسی») | group | tile:false = کاشیِ صفحه‌یِ اصلی نیست (فقط میانبر)
 * ⚠️ بعد از افزودنِ ردیفِ تازه: اگر کاشیِ index نیاز به آیکونِ SVG دارد، TILE_ICON در index.html را هم کامل کنید.
 */
window.MADAR_GROUPS = [
  { id:'sales', title:'فروش و بازاریابی',    note:'مشتری، قیمت، پیگیری',        color:'#ff8a3d', icon:'crm' },
  { id:'fin',   title:'مالی و بازرگانی',      note:'پول، ارز، محموله',           color:'#2fd37a', icon:'fxLedger' },
  { id:'mgmt',  title:'مدیریت',               note:'دسترسی، کارکنان، تنظیمات',   color:'#e055f5', icon:'access' },
  { id:'admin', title:'اداری و منابع انسانی', note:'حضور، سازمان، کارهایِ روزانه', color:'#29b6f6', icon:'attendance' },
  { id:'more',  title:'ابزارها و راهنما',     note:'وزن‌نامه و راهنماها',         color:'#f2c94c', icon:'weights' }
];
window.MADAR_TILES = [
  { key:'me',         icon:'🏠', title:'داشبوردِ من',          desc:'کارتابل، پیگیری‌ها و میانبرهایِ خودم',                 href:'me.html',          perm:'page.me',          group:'me' },
  { key:'crm',        icon:'📞', title:'CRM فروش',             desc:'پیجویی و ثبت تماس با مشتری',                           href:'crm.html',         perm:'page.crm',         group:'sales' },
  { key:'priceList',  icon:'💰', title:'Price List',           desc:'ماشین‌حساب قیمت‌دهی قطعات',                            href:'pricelist.html',   perm:'page.pricelist',   group:'sales' },
  { key:'fxLedger',   icon:'💱', title:'دفتر ارزی',            desc:'تسویه ریال⇄یوان با مشتریان و تأمین‌کننده',              href:'fx-ledger.html',   perm:'page.fxledger',    group:'fin' },
  { key:'erp',        icon:'🏭', title:'ERP',                  desc:'تدارکات، بازرگانی، مالی، ردیابی محموله',               href:'erp.html',         perm:'page.erp',         group:'fin' },
  { key:'access',     icon:'🔑', title:'پنلِ دسترسی',          desc:'هر نقش و هر نفر چه بخش‌هایی را ببیند',                  href:'access.html',      perm:'access.manage',    group:'mgmt' },
  { key:'people',     icon:'👥', title:'مرکز افراد',          desc:'نقش، دسترسی، اتصالِ بله و تفویضِ هر نفر در یک جا',     href:'people.html',      perm:'access.manage',   group:'mgmt' },
  { key:'announce',   icon:'📢', title:'اعلانِ عمومی',        desc:'یک پیام به بله/تلگرامِ همه‌یِ کارمندان',                href:'announce.html',    perm:'access.manage',   group:'mgmt' },
  { key:'staffAdmin', icon:'👥', title:'مدیریت کارمندان',      desc:'افزودن/حذف دسترسی نیروها',                              href:'staff-admin.html', perm:'page.staffadmin',  group:'mgmt' },
  { key:'attendance', icon:'🕘', title:'حضور و غیاب',          desc:'ثبتِ ورود و خروج با کیوآرکد و گوشی',                    href:'attendance.html',  perm:'page.attendance',  group:'admin' },
  { key:'org',        icon:'🏢', title:'سازمان',               desc:'منابعِ انسانی · اداری · کارتابلِ من',                   href:'org.html',         perm:'page.org',         group:'admin' },
  { key:'reminders',  icon:'⏰', title:'یادآوری‌ها',           desc:'کارِ فردا، یادآوریِ آزاد و دوره‌ای، تقویم، پیگیری و تحویل', href:'reminders.html', perm:'page.reminders',   group:'admin' },
  { key:'weights',    icon:'⚖️', title:'وزن‌نامه‌ی قطعات',     desc:'وزنِ قطعات — جستجو، ویرایش، خروجیِ Excel',              href:'weights.html',     perm:'page.weights',     group:'more' },
  { key:'guide',      icon:'📖', title:'راهنمای مدار',      desc:'یک راهنما برایِ همه — نقش را عوض کنید تا ببینید هر کس چه می‌بیند',          href:'guide.html', perm:'page.guide',       group:'more' },
  { key:'roadmap',    icon:'🗺️', title:'نقشه‌یِ راه',          desc:'باگ و ایده‌ای دیدید؟ ثبت کنید؛ کارهایِ در جریان و انجام‌شده', href:'roadmap.html', perm:'page.roadmap',     group:'more', tile:false }
];
