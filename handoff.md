# 🦄 Unicorn Pro — Handoff Document
> Сесія збережена: 2026-07-26T00:15:00+02:00

---

## 📍 Поточний стан проєкту

| Фаза | Опис | Статус |
|------|------|--------|
| Phase 1 | Аналіз ринку, вибір вертикалі (HVAC), MVP-скоуп | ✅ Done |
| Phase 2 | Prisma schema, Repositories (DAO), Unit-тести (Jest) | ✅ Done |
| Phase 3 | React/Vite фронтенд, B2C Funnel, B2B Portal, Vitest | ✅ Done |
| Deploy  | GitHub + Vercel фронтенд + Vercel API задеплоєно | ✅ Done |

---

## 🔗 Посилання

| Ресурс | URL |
|--------|-----|
| GitHub репозиторій | https://github.com/yevhens-hue/unicorn |
| Frontend (Vercel) | https://unicorn-one-opal.vercel.app/ |
| Backend API (Vercel) | https://unicorn-pro-api-yevhens-hues-projects.vercel.app/ |
| Supabase Project ID | roxdzvzlvvmmeufeyqkb |

---

## 🗂 Структура репозиторію

```
Unicorn/
├── unicorn-pro-api/        # Express.js бекенд
│   ├── src/
│   │   ├── controllers/LeadController.js
│   │   ├── repositories/CampaignRepository.js
│   │   ├── repositories/LeadRepository.js
│   │   ├── services/PingPostService.js
│   │   └── types/index.js
│   ├── prisma/
│   │   ├── schema.prisma   # Buyer, Campaign, Lead, LeadPurchase
│   │   └── seed.js
│   ├── tests/
│   ├── index.js            # Express + всі API ендпоінти
│   └── vercel.json
└── unicorn-pro-mvp/        # React/Vite фронтенд
    ├── src/
    │   ├── pages/B2CFunnel.jsx   # 4-крокова воронка
    │   ├── pages/B2BPortal.jsx   # Кабінет підрядника
    │   ├── components/PhoneInput.jsx
    │   └── tests/
    └── vercel.json
```

---

## 🔴 Критичні задачі для наступної сесії

### ПРІОРИТЕТ 1 — Підключити фронтенд до бекенду

Фронтенд звертається на `localhost:3001` — API-запити не досягають бекенду.

**Що зробити:**
1. Vercel → проєкт `unicorn` (фронтенд) → Settings → Environment Variables
2. Додати: Key=`VITE_API_URL`, Value=`https://unicorn-pro-api-yevhens-hues-projects.vercel.app`
3. Redeploy фронтенду

---

### ПРІОРИТЕТ 2 — Запустити міграції та seed у Supabase

Продакшн база порожня. API впаде при першому запиті.

```bash
cd unicorn-pro-api
# Спочатку заповни .env правильним DATABASE_URL з Supabase
npx prisma migrate deploy   # створить таблиці
node prisma/seed.js         # заповнить тестовими даними
```

---

### ПРІОРИТЕТ 3 — Додати обробку помилок в API

Всі `await prisma.*` в `index.js` без `try/catch`. Потрібно обернути в:
```js
try { ... } catch(e) { res.status(500).json({ error: e.message }) }
```

---

### ПРІОРИТЕТ 4 — Оновлене завдання від Еда

Перехід від моделі CPL (cost-per-lead) до **booked appointments** (cost-per-appointment).
- Підрядники платять не за лід, а за реальний записаний візит
- Потрібно: Calendar API, SMS-підтвердження (Twilio), статуси апоінтментів, новий флоу оплати
- Зробити MVP або wireframes нової моделі

---

## 🏗 Архітектура Ping-Post аукціону

```
POST /api/leads (B2C submit)
    → CampaignRepository.getActiveMatchingCampaigns(zipCode)
    → PingPostService.runAuction(lead, campaigns)
        1 buyer  → Exclusive ($maxBid)
        2-3      → Shared ($maxBid * 0.6 each)
        0        → Unsold
    → LeadRepository.saveTransaction() → Supabase
    → Response: winners[] → B2C Thank You page
```

---

## 🧩 Технічний стек

| Шар | Технологія |
|-----|------------|
| Frontend | React 19, Vite, Framer Motion, Lucide Icons |
| Backend | Node.js, Express.js, Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Testing | Vitest + Testing Library (FE), Jest (BE) |
| Deploy | Vercel + GitHub Actions CI |

---

## 📌 Environment Variables

### Backend (Vercel unicorn-pro-api)
```
DATABASE_URL=postgresql://postgres.roxdzvzlvvmmeufeyqkb:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### Frontend (Vercel unicorn)
```
VITE_API_URL=https://unicorn-pro-api-yevhens-hues-projects.vercel.app
```

---

## 📋 Команди для швидкого старту

```bash
# Backend
cd unicorn-pro-api && npm install && npx prisma generate && node index.js

# Frontend
cd unicorn-pro-mvp && npm install && npm run dev

# Тести
cd unicorn-pro-api && npm test
cd unicorn-pro-mvp && npm run test
```
