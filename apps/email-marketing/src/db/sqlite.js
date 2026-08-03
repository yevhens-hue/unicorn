import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = path.resolve(process.cwd(), 'email_marketing.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    subscriber_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subscribers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    status TEXT DEFAULT 'active', -- active, unsubscribed, bounced
    tags TEXT DEFAULT '[]', -- JSON array of tags
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS list_subscribers (
    list_id TEXT NOT NULL,
    subscriber_id TEXT NOT NULL,
    PRIMARY KEY (list_id, subscriber_id),
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
    FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- welcome, newsletter, promo, transactional
    html_content TEXT NOT NULL,
    preview_text TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_id TEXT,
    list_id TEXT,
    status TEXT DEFAULT 'draft', -- draft, scheduled, sending, sent
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    total_recipients INTEGER DEFAULT 0,
    scheduled_at TEXT,
    sent_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS automations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- list_joined, tag_added, link_clicked
    status TEXT DEFAULT 'active', -- active, paused, draft
    nodes_json TEXT NOT NULL, -- JSON workflow nodes
    edges_json TEXT NOT NULL, -- JSON workflow edges
    total_runs INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS automation_logs (
    id TEXT PRIMARY KEY,
    automation_id TEXT NOT NULL,
    subscriber_email TEXT NOT NULL,
    step_name TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    executed_at TEXT NOT NULL,
    FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
  );
`);

// Seed Data helper
export function seedDatabase() {
  const checkLists = db.prepare('SELECT COUNT(*) as count FROM lists').get();
  if (checkLists.count > 0) {
    return; // Already seeded
  }

  console.log('🌱 Seeding email marketing database with initial data...');

  const now = new Date().toISOString();

  // 1. Lists
  const insertList = db.prepare('INSERT INTO lists (id, name, description, subscriber_count, created_at) VALUES (?, ?, ?, ?, ?)');
  insertList.run('list_1', 'VIP Клиенты (VIP Clients)', 'Клиенты с премиум-доступом и высокими чеками', 3, now);
  insertList.run('list_2', 'Подписчики на рассылку (Newsletter)', 'Общий список подписчиков блога и новостей', 6, now);
  insertList.run('list_3', 'Новые пользователи (Onboarding)', 'Зарегистрировались за последние 30 дней', 4, now);

  // 2. Subscribers
  const insertSub = db.prepare('INSERT INTO subscribers (id, email, first_name, last_name, status, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const subs = [
    ['sub_1', 'alex.petrov@techcorp.io', 'Алексей', 'Петров', 'active', JSON.stringify(['VIP', 'B2B', 'Ежемесячно']), now],
    ['sub_2', 'elena.sidorova@gmail.com', 'Елена', 'Сидорова', 'active', JSON.stringify(['Новичок', 'Вебинар']), now],
    ['sub_3', 'dmitry.ivanov@yandex.ru', 'Дмитрий', 'Иванов', 'active', JSON.stringify(['VIP', 'Конверсия']), now],
    ['sub_4', 'anna.kravets@company.ua', 'Анна', 'Кравец', 'active', JSON.stringify(['B2B', 'Промо']), now],
    ['sub_5', 'max.volkov@digital.org', 'Максим', 'Волков', 'unsubscribed', JSON.stringify(['Старый']), now],
    ['sub_6', 'olga.stepanova@mail.ru', 'Ольга', 'Степанова', 'active', JSON.stringify(['Новичок']), now],
    ['sub_7', 'sergey.smirnov@inbox.ru', 'Сергей', 'Смирнов', 'active', JSON.stringify(['VIP']), now]
  ];
  subs.forEach(s => insertSub.run(...s));

  // List subscribers links
  const insertLink = db.prepare('INSERT INTO list_subscribers (list_id, subscriber_id) VALUES (?, ?)');
  const links = [
    ['list_1', 'sub_1'], ['list_1', 'sub_3'], ['list_1', 'sub_7'],
    ['list_2', 'sub_1'], ['list_2', 'sub_2'], ['list_2', 'sub_3'], ['list_2', 'sub_4'], ['list_2', 'sub_6'], ['list_2', 'sub_7'],
    ['list_3', 'sub_2'], ['list_3', 'sub_4'], ['list_3', 'sub_6'], ['list_3', 'sub_7']
  ];
  links.forEach(l => insertLink.run(...l));

  // 3. Templates
  const insertTpl = db.prepare('INSERT INTO templates (id, name, subject, category, html_content, preview_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  
  const welcomeHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
  <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #6366f1;">
    <h1 style="color: #4f46e5; margin: 0;">🚀 Добро пожаловать на платформу!</h1>
  </div>
  <div style="padding: 20px 0; color: #334155; line-height: 1.6;">
    <p>Здравствуйте, <strong>{{first_name}}</strong>!</p>
    <p>Спасибо за регистрацию. Мы рады приветствовать вас в нашем сообществе. С нашей платформой вы сможете автоматизировать email-маркетинг, увеличивать открываемость писем и привлекать клиентов.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://example.com/start" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Начать работу →</a>
    </div>
    <p>Если у вас возникнут вопросы, наш отдел заботы всегда на связи.</p>
  </div>
  <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #94a3b8; font-size: 12px;">
    © 2026 Email Marketing Platform. Вы получили это письмо, так как зарегистрировались на сайте.
  </div>
</div>`.trim();

  const promoHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #faf5ff;">
  <div style="background: linear-gradient(135deg, #a855f7, #6366f1); padding: 30px; border-radius: 10px; text-align: center; color: white;">
    <h2 style="margin: 0; font-size: 28px;">🔥 Спецпредложение: Скидка 40%</h2>
    <p style="font-size: 16px; opacity: 0.9;">Только в течение 48 часов!</p>
  </div>
  <div style="padding: 20px; color: #1e1b4b; line-height: 1.6;">
    <p>Приветствуем, <strong>{{first_name}}</strong>!</p>
    <p>Получите доступ ко всем премиум-функциям автоматизации со скидкой 40% по промокоду <strong>EMAIL2026</strong>.</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="https://example.com/promo" style="background: #9333ea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Активировать промокод</a>
    </div>
  </div>
</div>`.trim();

  insertTpl.run('tpl_1', 'Приветственное письмо (Welcome Email)', 'Добро пожаловать в нашу систему!', 'welcome', welcomeHtml, 'Ваш доступ успешно активирован', now, now);
  insertTpl.run('tpl_2', 'Промо-акция Скидка 40%', 'Закрытая распродажа: Скидка 40% на все тарифы', 'promo', promoHtml, 'Эксклюзивное предложение для подписчиков', now, now);

  // 4. Campaigns
  const insertCamp = db.prepare('INSERT INTO campaigns (id, name, subject, template_id, list_id, status, sent_count, open_count, click_count, total_recipients, scheduled_at, sent_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertCamp.run('camp_1', 'Анонс обновления платформы Q3', '🚀 Встречайте новый конструктор цепочек писем', 'tpl_1', 'list_2', 'sent', 6, 5, 3, 6, null, now, now);
  insertCamp.run('camp_2', 'Спецпредложение для VIP клиентов', '🔥 Эксклюзивная скидка 40% для VIP участников', 'tpl_2', 'list_1', 'sent', 3, 3, 2, 3, null, now, now);
  insertCamp.run('camp_3', 'Приветственная серия Onboarding', 'Как выстроить первый воронку продаж за 10 минут', 'tpl_1', 'list_3', 'draft', 0, 0, 0, 4, null, null, now);

  // 5. Automations
  const insertAuto = db.prepare('INSERT INTO automations (id, name, trigger_type, status, nodes_json, edges_json, total_runs, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  
  const nodes1 = [
    { id: '1', type: 'trigger', data: { label: 'Подписка на список "Новые пользователи"', icon: 'UserPlus' } },
    { id: '2', type: 'action', data: { label: 'Отправить "Приветственное письмо"', icon: 'Mail', templateId: 'tpl_1' } },
    { id: '3', type: 'delay', data: { label: 'Задержка 2 дня', icon: 'Clock', duration: '2 дня' } },
    { id: '4', type: 'condition', data: { label: 'Письмо было открыто?', icon: 'HelpCircle' } },
    { id: '5', type: 'action', data: { label: 'Добавить тег "Вовлечен"', icon: 'Tag', tag: 'Вовлечен' } }
  ];
  const edges1 = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
    { id: 'e3-4', source: '3', target: '4' },
    { id: 'e4-5', source: '4', target: '5', label: 'Да' }
  ];

  insertAuto.run('auto_1', 'Цепочка приветствия новых пользователей', 'list_joined', 'active', JSON.stringify(nodes1), JSON.stringify(edges1), 14, now);

  // 6. Automation Logs
  const insertLog = db.prepare('INSERT INTO automation_logs (id, automation_id, subscriber_email, step_name, status, executed_at) VALUES (?, ?, ?, ?, ?, ?)');
  insertLog.run('log_1', 'auto_1', 'elena.sidorova@gmail.com', 'Приветственное письмо', 'completed', now);
  insertLog.run('log_2', 'auto_1', 'anna.kravets@company.ua', 'Добавить тег "Вовлечен"', 'completed', now);

  console.log('✅ Seeding completed successfully!');
}

// Seed upon module load if empty
seedDatabase();

export default db;
