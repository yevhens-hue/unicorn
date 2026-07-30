# 🦄 Unicorn Pro — Handoff Document
> Сесія збережена: 2026-07-30T00:27:00+02:00

---

## 📍 Поточний стан проєкту

| Фаза | Опис | Статус |
|------|------|--------|
| Phase 1 | Аналіз ринку (Angi, Networx), вибір вертикалі (HVAC/Insurance), MVP-скоуп | ✅ Done |
| Phase 2 | Prisma schema, Repositories (DAO), Unit-тести (Jest), Ping-Post Engine | ✅ Done |
| Phase 3 | React 19 / Vite фронтенди (B2C Funnel, B2B Portal, Admin Dashboard) | ✅ Done |
| Phase 4 | Домени, Vercel Deploy & Excel / Google Sheets Экспорт | ✅ Done |
| Phase 5 | Інтеграція LM-style (LeadsMarket) Second-Price (Vickrey) аукціону та биллинг | ✅ Done |

---

## 🔗 Живі Посилання на Продукт

| Ресурс | URL |
|--------|-----|
| GitHub репозиторій | https://github.com/yevhens-hue/unicorn |
| Admin Dashboard | https://unicorn-admin-dashboard.vercel.app/ |
| Admin App Backup | https://unicorn-admin-app.vercel.app/ |
| B2B Contractor Portal | https://unicorn-b2b.vercel.app/ |
| B2C LeadGen Funnel | https://unicorn-b2c.vercel.app/ |
| Backend API (Vercel) | https://unicorn-pro-api-yevhens-hues-projects.vercel.app |
| Supabase Project ID | `roxdzvzlvvmmeufeyqkb` |

---

## 🗂 Досягнення сесії

1. **Виправлення доменів та конфігурації Vercel:**
   - Перейменовано конфігурацію Vercel з опечатного `unicorn-abmin` на `unicorn-admin`.
   - Прив'язано активні чисті домени `unicorn-admin-dashboard.vercel.app` та `unicorn-admin-app.vercel.app`.

2. **Модуль экспорту в Excel и Google Sheets:**
   - **Бекенд (`unicorn-pro-api/index.js`):** Додано ендпоінти експорту з префіксом UTF-8 BOM (`\uFEFF`), що гарантує нативне відкриття CSV в Excel по окремих колонках.
   - **Адмінка & B2B Кабінет:** Додано кнопки `📊 Excel (.csv)` та `🟢 Google Sheets` (копіювання TSV в буфер обмена + автоматичне відкриття `sheets.new`).

3. **Продуктова аналітика & Сравнительный анализ с LeadsMarket:**
   - Описана покрокова послідовність проходження ліда (B2C -> Twilio/TCPA validation -> Ping-Post Auction -> DB billing -> B2B Inbox -> Admin CRM).
   - Проведено розбір відмінностей з корпоративною платформою LeadsMarket (LM/LeadBrain) на основі наданих SOP і PRD документів.

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
│   ├── index.js            # Express + API ендпоінти (включаючи CSV/Excel export)
│   └── vercel.json
├── apps/
│   ├── admin/              # React/Vite Admin Dashboard
│   ├── b2b/                # React/Vite B2B Contractor Portal
│   └── b2c/                # React/Vite B2C Funnel
└── unicorn-pro/            # HTML/JS статична презентація
```

---

## 🔴 Задачі для наступної сесії

1. **Запуск Prisma міграцій та seed у продакшн БД Supabase:**
   ```bash
   cd unicorn-pro-api
   npx prisma migrate deploy
   node prisma/seed.js
   ```
2. **Розширення PPA (Pay-Per-Appointment) функціоналу:**
   - Интеграция Calendar API для бронирования слотов.
   - Отправка SMS-подтверждений через Twilio.
3. **Имплементация Second-Price Auction & Waterfall (LM-style):**
   - Расчет итоговой цены по 2-й ставке + комиссия платформы.
   - Cascade fallback при отломанном Post от байера.

---

## 📋 Команды для быстрого запуска

```bash
# Backend
cd unicorn-pro-api && npm install && npx prisma generate && node index.js

# Apps
cd apps/admin && npm run dev
cd apps/b2b && npm run dev
cd apps/b2c && npm run dev
```
