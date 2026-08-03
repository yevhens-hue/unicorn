import express from 'express';
import cors from 'cors';
import db from '../db/sqlite.js';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// 1. DASHBOARD & STATS API
// ----------------------------------------------------
app.get('/api/stats', (req, res) => {
  try {
    const totalSubs = db.prepare("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'").get().count;
    const totalCamp = db.prepare("SELECT COUNT(*) as count FROM campaigns").get().count;
    const totalSent = db.prepare("SELECT SUM(sent_count) as total FROM campaigns").get().total || 0;
    const totalOpen = db.prepare("SELECT SUM(open_count) as total FROM campaigns").get().total || 0;
    const totalClick = db.prepare("SELECT SUM(click_count) as total FROM campaigns").get().total || 0;

    const avgOpenRate = totalSent > 0 ? Math.round((totalOpen / totalSent) * 100) : 0;
    const avgClickRate = totalSent > 0 ? Math.round((totalClick / totalSent) * 100) : 0;

    const recentCampaigns = db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 5").all();
    const recentLogs = db.prepare("SELECT * FROM automation_logs ORDER BY executed_at DESC LIMIT 6").all();

    res.json({
      totalSubscribers: totalSubs,
      totalCampaigns: totalCamp,
      avgOpenRate,
      avgClickRate,
      recentCampaigns,
      recentLogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 2. SUBSCRIBERS API
// ----------------------------------------------------
app.get('/api/subscribers', (req, res) => {
  try {
    const { listId, search, status } = req.query;
    let query = `
      SELECT s.*, GROUP_CONCAT(l.name) as list_names 
      FROM subscribers s
      LEFT JOIN list_subscribers ls ON s.id = ls.subscriber_id
      LEFT JOIN lists l ON ls.list_id = l.id
    `;
    const params = [];
    const conditions = [];

    if (listId) {
      conditions.push('ls.list_id = ?');
      params.push(listId);
    }
    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }
    if (search) {
      conditions.push('(s.email LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' GROUP BY s.id ORDER BY s.created_at DESC';

    const subscribers = db.prepare(query).all(...params).map(s => ({
      ...s,
      tags: JSON.parse(s.tags || '[]'),
      lists: s.list_names ? s.list_names.split(',') : []
    }));

    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subscribers', (req, res) => {
  try {
    const { email, first_name, last_name, tags = [], listIds = [] } = req.body;
    const id = 'sub_' + Date.now();
    const now = new Date().toISOString();

    db.prepare('INSERT INTO subscribers (id, email, first_name, last_name, status, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, email, first_name || '', last_name || '', 'active', JSON.stringify(tags), now);

    const insertListLink = db.prepare('INSERT INTO list_subscribers (list_id, subscriber_id) VALUES (?, ?)');
    listIds.forEach(listId => {
      insertListLink.run(listId, id);
      db.prepare('UPDATE lists SET subscriber_count = subscriber_count + 1 WHERE id = ?').run(listId);
    });

    res.status(201).json({ id, email, first_name, last_name, status: 'active', tags, created_at: now });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/subscribers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, tags } = req.body;
    
    if (status) {
      db.prepare('UPDATE subscribers SET status = ? WHERE id = ?').run(status, id);
    }
    if (tags) {
      db.prepare('UPDATE subscribers SET tags = ? WHERE id = ?').run(JSON.stringify(tags), id);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/subscribers/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM subscribers WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 3. AUDIENCE LISTS API
// ----------------------------------------------------
app.get('/api/lists', (req, res) => {
  try {
    const lists = db.prepare('SELECT * FROM lists ORDER BY created_at DESC').all();
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/lists', (req, res) => {
  try {
    const { name, description } = req.body;
    const id = 'list_' + Date.now();
    const now = new Date().toISOString();

    db.prepare('INSERT INTO lists (id, name, description, subscriber_count, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, name, description || '', 0, now);

    res.status(201).json({ id, name, description, subscriber_count: 0, created_at: now });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 4. TEMPLATES API
// ----------------------------------------------------
app.get('/api/templates', (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/templates', (req, res) => {
  try {
    const { name, subject, category, html_content, preview_text } = req.body;
    const id = 'tpl_' + Date.now();
    const now = new Date().toISOString();

    db.prepare('INSERT INTO templates (id, name, subject, category, html_content, preview_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, subject, category || 'general', html_content, preview_text || '', now, now);

    res.status(201).json({ id, name, subject, category, html_content, preview_text, created_at: now });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 5. CAMPAIGNS & SSE LIVE STREAMING SIMULATOR
// ----------------------------------------------------
app.get('/api/campaigns', (req, res) => {
  try {
    const campaigns = db.prepare(`
      SELECT c.*, t.name as template_name, l.name as list_name 
      FROM campaigns c
      LEFT JOIN templates t ON c.template_id = t.id
      LEFT JOIN lists l ON c.list_id = l.id
      ORDER BY c.created_at DESC
    `).all();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/campaigns', (req, res) => {
  try {
    const { name, subject, template_id, list_id, scheduled_at } = req.body;
    const id = 'camp_' + Date.now();
    const now = new Date().toISOString();

    // Get count of recipients
    let recipients = 0;
    if (list_id) {
      recipients = db.prepare('SELECT COUNT(*) as count FROM list_subscribers WHERE list_id = ?').get(list_id).count;
    } else {
      recipients = db.prepare("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'").get().count;
    }

    const status = scheduled_at ? 'scheduled' : 'draft';

    db.prepare('INSERT INTO campaigns (id, name, subject, template_id, list_id, status, total_recipients, scheduled_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, subject, template_id, list_id, status, recipients, scheduled_at || null, now);

    res.status(201).json({ id, name, subject, template_id, list_id, status, total_recipients: recipients, created_at: now });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Real-Time Server-Sent Events (SSE) Live Sending Stream
app.get('/api/campaigns/:id/send-stream', (req, res) => {
  const { id } = req.params;

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  if (!campaign) {
    res.write(`data: ${JSON.stringify({ error: 'Campaign not found' })}\n\n`);
    return res.end();
  }

  // Get active subscribers for the target list
  let subscribers = [];
  if (campaign.list_id) {
    subscribers = db.prepare(`
      SELECT s.* FROM subscribers s
      JOIN list_subscribers ls ON s.id = ls.subscriber_id
      WHERE ls.list_id = ? AND s.status = 'active'
    `).all(campaign.list_id);
  } else {
    subscribers = db.prepare("SELECT * FROM subscribers WHERE status = 'active'").all();
  }

  if (subscribers.length === 0) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Нет активных подписчиков для рассылки' })}\n\n`);
    return res.end();
  }

  // Update status to 'sending'
  db.prepare("UPDATE campaigns SET status = 'sending', total_recipients = ? WHERE id = ?").run(subscribers.length, id);

  let sentCount = 0;
  let openCount = 0;
  let clickCount = 0;

  res.write(`data: ${JSON.stringify({ type: 'start', total: subscribers.length, campaignName: campaign.name })}\n\n`);

  const interval = setInterval(() => {
    if (sentCount < subscribers.length) {
      const sub = subscribers[sentCount];
      sentCount++;

      // Simulate realistic opens and clicks (e.g. 75% open, 45% click)
      const isOpen = Math.random() < 0.75;
      const isClick = isOpen && Math.random() < 0.5;

      if (isOpen) openCount++;
      if (isClick) clickCount++;

      // Update SQLite database progress
      db.prepare('UPDATE campaigns SET sent_count = ?, open_count = ?, click_count = ? WHERE id = ?')
        .run(sentCount, openCount, clickCount, id);

      res.write(`data: ${JSON.stringify({
        type: 'progress',
        current: sentCount,
        total: subscribers.length,
        email: sub.email,
        name: `${sub.first_name} ${sub.last_name}`.trim(),
        sentCount,
        openCount,
        clickCount,
        percentage: Math.round((sentCount / subscribers.length) * 100)
      })}\n\n`);

    } else {
      clearInterval(interval);
      const now = new Date().toISOString();
      db.prepare("UPDATE campaigns SET status = 'sent', sent_at = ? WHERE id = ?").run(now, id);

      res.write(`data: ${JSON.stringify({
        type: 'complete',
        sentCount,
        openCount,
        clickCount,
        openRate: Math.round((openCount / sentCount) * 100),
        clickRate: Math.round((clickCount / sentCount) * 100)
      })}\n\n`);

      res.end();
    }
  }, 600); // Send an email every 600ms for realistic visual feedback

  req.on('close', () => {
    clearInterval(interval);
  });
});

// ----------------------------------------------------
// 6. AUTOMATIONS API
// ----------------------------------------------------
app.get('/api/automations', (req, res) => {
  try {
    const automations = db.prepare('SELECT * FROM automations ORDER BY created_at DESC').all().map(a => ({
      ...a,
      nodes: JSON.parse(a.nodes_json),
      edges: JSON.parse(a.edges_json)
    }));
    res.json(automations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/automations', (req, res) => {
  try {
    const { name, trigger_type, nodes, edges } = req.body;
    const id = 'auto_' + Date.now();
    const now = new Date().toISOString();

    db.prepare('INSERT INTO automations (id, name, trigger_type, status, nodes_json, edges_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, trigger_type || 'list_joined', 'active', JSON.stringify(nodes || []), JSON.stringify(edges || []), now);

    res.status(201).json({ id, name, trigger_type, status: 'active', nodes, edges, created_at: now });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/automations/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE automations SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 7. ANALYTICS API
// ----------------------------------------------------
app.get('/api/analytics', (req, res) => {
  try {
    // Growth timeline data
    const growth = [
      { month: 'Янв', subscribers: 120, opens: 68 },
      { month: 'Фев', subscribers: 180, opens: 72 },
      { month: 'Мар', subscribers: 240, opens: 75 },
      { month: 'Апр', subscribers: 350, opens: 81 },
      { month: 'Май', subscribers: 490, opens: 84 },
      { month: 'Июн', subscribers: 620, opens: 88 }
    ];

    const campaignPerformance = db.prepare('SELECT name, sent_count, open_count, click_count FROM campaigns WHERE status = "sent"').all();

    res.json({ growth, campaignPerformance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`⚡ Email Marketing Express Server running at http://localhost:${PORT}`);
});
