# اسم نداره — Esm Nadareh

فروشگاه کالکشنی برند **اسم نداره**؛ سایت دوزبانه (فارسی / English) با پنل مدیریت.

A bilingual (fa/en) collection store for the Esm Nadareh label, with a full
admin panel.

---

## Stack

| لایه | ابزار |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions) |
| UI | React 19 · TypeScript · Tailwind CSS v4 |
| Data | PostgreSQL · Prisma 7 (`@prisma/adapter-pg`) |
| Auth | JWT در کوکی httpOnly (`jose`) + `bcryptjs` |
| پرداخت | زرین‌پال (v4) با درگاه شبیه‌سازی‌شده به‌عنوان پیش‌فرض توسعه |
| ایمیل | SMTP از طریق `nodemailer` (بدون تنظیم، در لاگ چاپ می‌شود) |
| Icons | lucide-react |

---

## راه‌اندازی / Setup

پروژه روی این سیستم از قبل راه‌اندازی شده است. برای اجرای روزمره فقط:

```bash
npm run db:start     # دیتابیس محلی پروژه (پورت 5544)
npm run dev          # http://localhost:3000
```

> `.env` از قبل پر شده و `AUTH_SECRET` تصادفی ساخته شده است.

### دیتابیس

پورت ۵۴۳۲ و ۵۴۳۳ روی این سیستم متعلق به دو نصب دیگر PostgreSQL هستند و رمزشان
در دسترس نبود، بنابراین پروژه یک **خوشهٔ مستقل و دورانداختنی** در `.pgdata/`
دارد که روی پورت **۵۵۴۴** گوش می‌دهد. این پوشه در `.gitignore` است.

```bash
npm run db:start     # روشن کردن
npm run db:stop      # خاموش کردن
npm run db:status    # وضعیت
```

اگر می‌خواهید از سرور PostgreSQL خودتان استفاده کنید، کافی است `DATABASE_URL`
را در `.env` عوض کنید و این اسکریپت‌ها را نادیده بگیرید:

```bash
psql -U postgres -c "CREATE DATABASE esmnadareh;"
# DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/esmnadareh?schema=public"
npm run setup        # = prisma migrate dev --name init && prisma db seed
```

### راه‌اندازی از صفر (روی سیستم دیگر)

```bash
npm install
cp .env.example .env
# AUTH_SECRET: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

PGPASSWORD=your-password npm run db:init   # ساخت خوشهٔ محلی (اختیاری)
npm run db:start
npm run setup                              # migrate + seed
npm run dev
```

آدرس ریشه به‌صورت خودکار به `/fa` یا `/en` هدایت می‌شود (بر اساس کوکی، سپس
`Accept-Language`).

### حساب‌های نمونه

| نقش | ایمیل | رمز |
| --- | --- | --- |
| مدیر | `admin@esmnadareh.com` | `Admin!2345` |
| مشتری | `customer@esmnadareh.com` | `Customer!2345` |

این دو حساب در `prisma/seed.ts` ساخته می‌شوند و روی محیط واقعی باید حذف شوند.
همچنین جعبهٔ «demo» در صفحهٔ ورود (`src/app/[locale]/login/page.tsx`) را بردارید.

---

## اسکریپت‌ها

| دستور | کار |
| --- | --- |
| `npm run dev` | سرور توسعه |
| `npm run build` | `prisma generate` + بیلد پروداکشن |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | ساخت/اعمال مایگریشن |
| `npm run db:seed` | پر کردن دیتابیس از `prisma/catalog.ts` |
| `npm run db:reset` | پاک کردن و ساخت دوبارهٔ کامل |
| `npm run db:studio` | Prisma Studio |
| `npm run db:start` / `db:stop` / `db:status` | مدیریت خوشهٔ محلی `.pgdata` |
| `npm run gen:images` | تولید دوبارهٔ تصاویر SVG |
| `npm run sweep` | آزادسازی دستی رزروهای منقضی (نیازمند `CRON_SECRET`) |

---

## ساختار

```
prisma/
  schema.prisma      مدل داده
  catalog.ts         کاتالوگ نمونه — منبع واحد برای seed و تولید تصاویر
  seed.ts
scripts/
  generate-images.ts تولید تصاویر ادیتوریال SVG در public/media
src/
  app/[locale]/      همهٔ صفحات، زیر پیشوند زبان
    admin/           پنل مدیریت (فقط ADMIN) — شامل کدهای تخفیف و نظرها
    account/         حساب کاربری (فقط کاربر وارد‌شده)
    checkout/        سبد → درگاه → نتیجه
  app/api/
    payments/callback/[orderId]   بازگشت از درگاه؛ تأیید و تسویه
    inventory/sweep               آزادسازی رزروهای منقضی (برای cron)
  actions/           Server Actions (cart, wishlist, auth, checkout, reviews, admin…)
  components/        brand · layout · commerce · account · admin · ui
  i18n/              دیکشنری‌های fa/en و تنظیمات locale
  lib/
    inventory.ts     رزرو موجودی و بازگرداندن آن
    payments/        انتخاب درگاه، شروع پرداخت، تسویه (zarinpal · simulated)
    mail/            قالب‌ها و ارسال ایمیل تراکنشی
    coupons.ts       ارزیابی کد تخفیف و قیمت‌گذاری سبد
    reviews.ts       میانگین امتیاز و نظرهای تأییدشده
    uploads.ts       ذخیرهٔ امن تصاویر بارگذاری‌شده
    prisma · auth · session · cart · queries · format
  proxy.ts           مسیریابی زبان + محافظت از /account و /admin
```

---

## تنظیمات محیط

همهٔ کلیدها در `.env.example` توضیح داده شده‌اند. جز `DATABASE_URL` و
`AUTH_SECRET`، بقیه اختیاری‌اند و نبودشان رفتار امن پیش‌فرض دارد:

| کلید | اگر تنظیم نشود |
| --- | --- |
| `ZARINPAL_MERCHANT_ID` | درگاه شبیه‌سازی‌شده فعال می‌ماند (`ZARINPAL_SANDBOX=1` برای محیط تست زرین‌پال) |
| `SMTP_HOST` | ایمیل‌ها به‌جای ارسال، در لاگ سرور چاپ می‌شوند |
| `SHOP_EMAIL` | رونوشت سفارش‌های جدید به فروشگاه ارسال نمی‌شود |
| `CRON_SECRET` | مسیر `/api/inventory/sweep` بسته می‌ماند |

---

## سفارش، موجودی و پرداخت

**موجودی از لحظهٔ ثبت سفارش کنار گذاشته می‌شود، نه از لحظهٔ پرداخت.** ثبت سفارش
`ProductVariant.stock` را کم می‌کند و یک `StockReservation` با مهلت ۲۰ دقیقه
می‌سازد؛ بنابراین «موجود است» همیشه یعنی «همین حالا قابل خرید است». پرداخت
موفق رزرو را مصرف می‌کند، و پرداخت ناموفق، لغو یا پایان مهلت آن را برمی‌گرداند
(`lib/inventory.ts`). اگر مهلت تمام شده باشد، حتی بازگشت موفق از درگاه هم سفارش
را تسویه نمی‌کند — چون کالا دیگر برای این سفارش نیست.

پاک‌سازی رزروهای منقضی خودش هنگام تسویه و باز شدن صفحهٔ درگاه انجام می‌شود. برای
فروشگاه کم‌رفت‌وآمد یک cron هم اضافه کنید:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://example.com/api/inventory/sweep
```

**درگاه پرداخت با تنظیمات عوض می‌شود، نه با کد.** `lib/payments/` یک واسط دارد
با دو پیاده‌سازی: `zarinpal` و `simulated`. هر دو از یک مسیر بازگشت واحد
(`/api/payments/callback/[orderId]`) عبور می‌کنند، پس همان مسیری که در توسعه
آزمایش می‌شود، در پروداکشن اجرا می‌شود. پارامترهای `Status` و `Authority` هرگز
مبنای تسویه نیستند؛ تأیید همیشه با خود درگاه و با مبلغی که سرور نگه داشته انجام
می‌شود.

---

## نکته‌های طراحی

**پالت از خود لوگو گرفته شده**، نه از طلایی/نقره‌ای پیش‌فرض: مشکی عمیق
(`#0B0A0A`)، آف‌وایت کاغذی (`#F4F1ED`) و قرمز آجری (`#A8412E`) که رنگ حروف
بریده‌شدهٔ نشان برند است. رنگ تأکیدی فقط روی دکمه‌ها، قیمت‌ها و خط‌های باریک
استفاده می‌شود.

**لوگو همیشه روی زمینهٔ مشکی خودش می‌نشیند** (`components/brand/logo.tsx`).
نشان برند برای زمینهٔ تیره طراحی شده و حروف سفیدش روی تم روشن ناپدید می‌شوند؛
بنابراین در یک «چیپ» مشکی با برش کاغذی قرار می‌گیرد که در تم تیره محو می‌شود و
در تم روشن مثل یک مهر خوانده می‌شود.

**تصاویر محصولات موقت‌اند.** عکاسی واقعی هنوز وجود ندارد، پس به‌جای جعبه‌های
خاکستری، `scripts/generate-images.ts` ترکیب‌بندی‌های ادیتوریال SVG با همان پالت
برند تولید می‌کند (۷۵ فایل، قطعی و قابل تولید دوباره). برای جایگزینی، از بخش
تصاویر در صفحهٔ ویرایش محصول عکس واقعی بارگذاری کنید؛ فایل‌ها در
`public/uploads/YYYY-MM/` ذخیره می‌شوند و از مخزن بیرون‌اند. نوع فایل از روی
بایت‌های ابتدایی تشخیص داده می‌شود نه از پسوند یا هدر مرورگر، و SVG پذیرفته
نمی‌شود (`lib/uploads.ts`).

**کد تخفیف هیچ‌جا ذخیره نمی‌شود، فقط ارزیابی می‌شود.** کد به سبد می‌چسبد و در هر
بار رندر و یک‌بار دیگر هنگام ثبت سفارش دوباره سنجیده می‌شود؛ سبدی که هفته‌ها در
کوکی مانده نباید با شرایط قدیمی حساب شود. تعداد استفاده هم ستون جداگانه ندارد و
از روی سفارش‌های لغونشده شمرده می‌شود، پس یک تسویهٔ نیمه‌کاره ظرفیت کد را
نمی‌بلعد (`lib/coupons.ts`).

**نظرها پس از تأیید منتشر می‌شوند.** هر نظر تازه — و هر ویرایش نظر تأییدشده —
به صف بررسی در `/admin/reviews` برمی‌گردد. میانگین امتیاز و `aggregateRating` در
داده‌های ساخت‌یافته فقط از نظرهای تأییدشده ساخته می‌شوند، و نشان «خرید تأییدشده»
وقتی می‌آید که همان حساب سفارشِ پرداخت‌شده‌ای با آن محصول داشته باشد.

**قیمت‌ها به تومان و به‌صورت عدد صحیح** در دیتابیس ذخیره می‌شوند؛ نمایش در
`lib/format.ts` بر اساس زبان انجام می‌شود (ارقام فارسی + «تومان» / ارقام لاتین + `T`).

**تم روی کوکی می‌نشیند، نه localStorage.** سرور کوکی `en_theme` را می‌خواند و
خودش کلاس را روی `<html>` می‌گذارد؛ بنابراین نه اسکریپت inline لازم است، نه
پرش تم در بارگذاری اول. تا وقتی کاربر انتخابی نکرده، هیچ کلاسی صادر نمی‌شود و
CSS با `prefers-color-scheme` ترجیح سیستم را دنبال می‌کند
(`lib/theme.ts` + بخش themes در `globals.css`).

---

## قبل از انتشار

- [ ] حذف حساب‌های نمونه و جعبهٔ demo در صفحهٔ ورود
- [ ] `ZARINPAL_MERCHANT_ID` واقعی — تا وقتی خالی باشد، درگاه شبیه‌سازی‌شده
      فعال است و «پرداخت موفق» بدون هیچ تراکنشی سفارش را تسویه می‌کند
- [ ] `SMTP_HOST` و `MAIL_FROM` تا رسید سفارش واقعاً ارسال شود
- [ ] `CRON_SECRET` و یک cron روی `/api/inventory/sweep`
- [ ] `AUTH_SECRET` تازه روی سرور، و `NEXT_PUBLIC_SITE_URL` واقعی
      (مسیر بازگشت درگاه از همین ساخته می‌شود)
- [ ] `npm run db:deploy` به‌جای `db:migrate` روی پروداکشن
- [ ] پشتیبان‌گیری از `public/uploads/` — تصاویر بارگذاری‌شده در مخزن نیستند
- [ ] جایگزینی تصاویر SVG با عکاسی محصول
