const express = require('express');
const cors = require('cors');
const app = express();
const prisma = require('./src/lib/prisma');

app.use(cors());
app.use(express.json());

const LeadController = require('./src/controllers/LeadController');
const BillingController = require('./src/controllers/BillingController');
const AgentController = require('./src/controllers/AgentController');
const TelegramAlertService = require('./src/services/TelegramAlertService');
const AIAgentService = require('./src/services/AIAgentService');
const AIVoiceCallService = require('./src/services/AIVoiceCallService');

// Normalize Vercel serverless URLs (e.g. /agent/digest -> /api/agent/digest)
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace('/api/api/', '/api/');
  } else if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
  }
  next();
});

const WebhookController = require('./src/controllers/WebhookController');

// ---------------------------------------------------------
// PING-POST ENGINE & AI AGENT ENDPOINTS
// ---------------------------------------------------------
app.post('/api/leads', LeadController.submitLead);
app.post('/api/agent/cos/run-cycle', AgentController.runCosCycle);
app.get('/api/agent/cos/status', AgentController.getCosStatus);
app.post('/api/agent/voice/test-objection', AgentController.testObjection);

const NightlyDigestCronService = require('./src/services/NightlyDigestCronService');

// ANTI-ECHO WEBHOOK GUARD ENDPOINTS (CRM 2-WAY SYNC)
app.post('/api/webhooks/contractor-crm/sync', WebhookController.syncContractorCrmWebhook);
app.get('/api/webhooks/contractor-crm/status', WebhookController.getGuardStatus);

// NIGHTLY 20:30 FOUNDER EXECUTIVE BRIEFING ENDPOINTS
const handleNightlyDigestTrigger = async (req, res) => {
  const result = await NightlyDigestCronService.triggerNightlyDigest(req.body || {});
  return res.status(200).json({ status: 'SUCCESS', digest: result });
};
const handleNightlyDigestStatus = (req, res) => {
  return res.status(200).json(NightlyDigestCronService.getStatus());
};

app.post('/api/agent/cos/trigger-nightly-digest', handleNightlyDigestTrigger);
app.post('/agent/cos/trigger-nightly-digest', handleNightlyDigestTrigger);
app.get('/api/agent/cos/nightly-digest/status', handleNightlyDigestStatus);
app.get('/agent/cos/nightly-digest/status', handleNightlyDigestStatus);

// Public Telegram Activity Feed API for live website streaming
const handleTelegramLiveFeed = (req, res) => {
  const dispatches = TelegramAlertService.getRecentDispatches();
  res.json({
    status: 'online',
    botUsername: '@Unicornmarketingbot',
    chatId: '264172207',
    totalDispatches: dispatches.length,
    dispatches
  });
};
// ---------------------------------------------------------
// MODEL CONTEXT PROTOCOL (MCP) REMOTE STREAMABLE HTTP / SSE API
// ---------------------------------------------------------
const McpServerService = require('./src/services/McpServerService');
const handleMcpRoute = (req, res) => McpServerService.handleMcpHttpRequest(req, res);

app.all('/api/mcp/sse', handleMcpRoute);
app.all('/mcp/sse', handleMcpRoute);
app.all('/api/mcp/message', handleMcpRoute);
app.all('/mcp/message', handleMcpRoute);
app.all('/api/mcp', handleMcpRoute);
app.all('/mcp', handleMcpRoute);

// ---------------------------------------------------------
// AI COS AGENT & VOICE BOOKER ENDPOINTS
// ---------------------------------------------------------
const handleCosRunCycle = (req, res) => AgentController.runCosCycle(req, res);
app.post('/api/agent/cos/run-cycle', handleCosRunCycle);
app.post('/agent/cos/run-cycle', handleCosRunCycle);
app.post('/api/api/agent/cos/run-cycle', handleCosRunCycle);

const handleCosStatus = (req, res) => AgentController.getCosStatus(req, res);
app.get('/api/agent/cos/status', handleCosStatus);
app.get('/agent/cos/status', handleCosStatus);
app.get('/api/api/agent/cos/status', handleCosStatus);

const handleTestObjection = (req, res) => AgentController.testObjection(req, res);
app.post('/api/agent/voice/test-objection', handleTestObjection);
app.post('/agent/voice/test-objection', handleTestObjection);
app.post('/api/api/agent/voice/test-objection', handleTestObjection);
const handleVoiceCall = async (req, res) => {
  try {
    const leadId = parseInt(req.params.leadId);
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const callResult = await AIVoiceCallService.initiateOutboundCall(lead);
    res.json(callResult);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
app.post('/api/agent/voice-call/:leadId', handleVoiceCall);
app.post('/agent/voice-call/:leadId', handleVoiceCall);
app.post('/api/api/agent/voice-call/:leadId', handleVoiceCall);

const handleVoiceWebhook = async (req, res) => {
  try {
    const result = await AIVoiceCallService.handleCallWebhook(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
app.post('/api/agent/voice-webhook', handleVoiceWebhook);
app.post('/agent/voice-webhook', handleVoiceWebhook);
app.post('/api/api/agent/voice-webhook', handleVoiceWebhook);

const handleVoiceStatus = async (req, res) => {
  try {
    const status = await AIVoiceCallService.getCallStatus(req.params.callId);
    res.json(status);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
app.get('/api/agent/voice-status/:callId', handleVoiceStatus);
app.get('/agent/voice-status/:callId', handleVoiceStatus);

const handleSystemStatus = async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      services: {
        anthropic: {
          configured: !!process.env.ANTHROPIC_API_KEY,
          status: process.env.ANTHROPIC_API_KEY ? '🟢 Connected' : '🟡 Fallback Mode'
        },
        telegram: {
          configured: !!process.env.TELEGRAM_BOT_TOKEN,
          botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Present' : 'Default',
          chatId: process.env.TELEGRAM_CHAT_ID || '264172207',
          status: '🟢 Connected'
        },
        googleCalendar: {
          configured: !!process.env.GOOGLE_CALENDAR_API_KEY,
          status: process.env.GOOGLE_CALENDAR_API_KEY ? '🟢 Connected' : '🟡 Dynamic Schedule Fallback'
        },
        blandAI: {
          configured: !!process.env.BLAND_API_KEY,
          status: process.env.BLAND_API_KEY ? '🟢 Connected' : '🟡 Voice Engine Simulation Mode'
        }
      }
    };
    res.json(status);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
app.get('/api/agent/system-status', handleSystemStatus);
app.get('/agent/system-status', handleSystemStatus);
app.get('/api/api/agent/system-status', handleSystemStatus);

// ---------------------------------------------------------
// AI COS AGENT (Chief of Staff) API
// ---------------------------------------------------------
const handleQualify = async (req, res) => {
  try {
    const qualification = await AIAgentService.qualifyLead(req.body);
    res.json(qualification);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
app.post('/api/agent/qualify', handleQualify);
app.post('/agent/qualify', handleQualify);

const handleDigest = async (req, res) => {
  try {
    const digestData = await AIAgentService.generateDailyDigest();
    res.json(digestData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
app.get('/api/agent/digest', handleDigest);
app.get('/agent/digest', handleDigest);

const handleTelegramWebhook = async (req, res) => {
  try {
    const result = await AIAgentService.handleTelegramWebhook(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
app.post('/api/agent/telegram-webhook', handleTelegramWebhook);
app.post('/agent/telegram-webhook', handleTelegramWebhook);

const handleApprovePpa = async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        leadType: 'PPA_CALLCENTER',
        appointmentStatus: 'Confirmed'
      }
    });
    res.json({ success: true, lead: updatedLead });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
app.post('/api/leads/:id/approve-ppa', handleApprovePpa);
app.post('/leads/:id/approve-ppa', handleApprovePpa);

// ---------------------------------------------------------
// AUTH (MVP: simple token check)
// ---------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Ensure demo account demo@hvacmasters.com / demo1234 always exists
    if (email === 'demo@hvacmasters.com' && password === 'demo1234') {
      let demoBuyer = await prisma.buyer.findUnique({ where: { email } });
      if (!demoBuyer) {
        demoBuyer = await prisma.buyer.create({
          data: {
            name: 'HVAC Masters LLC',
            email: 'demo@hvacmasters.com',
            password: 'demo1234',
            balance: 1000,
            campaigns: {
              create: [
                { name: 'Nationwide HVAC Pro', vertical: 'HVAC', zipCodes: 'all', leadType: 'Both', maxBid: 65, dailyLimit: 100 },
                { name: 'Nationwide Roofing Pro', vertical: 'Roofing', zipCodes: 'all', leadType: 'Both', maxBid: 75, dailyLimit: 100 }
              ]
            }
          }
        });
      }
      const token = Buffer.from(`${demoBuyer.id}:${demoBuyer.email}`).toString('base64');
      return res.json({ token, buyer: { id: demoBuyer.id, name: demoBuyer.name, email: demoBuyer.email, balance: demoBuyer.balance } });
    }

    const buyer = await prisma.buyer.findUnique({ where: { email } });
    if (!buyer || buyer.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Simple token: base64(buyerId) — replace with JWT in production
    const token = Buffer.from(`${buyer.id}:${buyer.email}`).toString('base64');
    res.json({ token, buyer: { id: buyer.id, name: buyer.name, email: buyer.email, balance: buyer.balance } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Register a new buyer account
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const existing = await prisma.buyer.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const buyer = await prisma.buyer.create({
      data: { name, email, password, balance: 0 }
    });
    const token = Buffer.from(`${buyer.id}:${buyer.email}`).toString('base64');
    res.status(201).json({ token, buyer: { id: buyer.id, name: buyer.name, email: buyer.email, balance: buyer.balance } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Auth middleware
async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = Buffer.from(auth.slice(7), 'base64').toString('utf8');
    const [buyerIdStr, email] = decoded.split(':');
    let buyerId = parseInt(buyerIdStr);

    let buyer = await prisma.buyer.findUnique({ where: { id: buyerId } });
    if (!buyer && email) {
      buyer = await prisma.buyer.findUnique({ where: { email } });
    }
    if (!buyer) {
      buyer = await prisma.buyer.findFirst({ where: { email: 'demo@hvacmasters.com' } });
    }

    if (!buyer) {
      return res.status(401).json({ error: 'Buyer account no longer exists. Please sign in again.' });
    }

    req.buyerId = buyer.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ---------------------------------------------------------
// BILLING API
// ---------------------------------------------------------
app.post('/api/billing/topup', authMiddleware, BillingController.topUp);
app.post('/api/billing/webhook', BillingController.webhook);

// ---------------------------------------------------------
// B2B PORTAL API
// ---------------------------------------------------------

// Get buyer profile & balance
app.get('/api/buyers/balance', authMiddleware, async (req, res) => {
  try {
    const buyer = await prisma.buyer.findUnique({ where: { id: req.buyerId } });
    if (!buyer) return res.status(404).json({ error: 'Buyer not found' });
    res.json({ balance: buyer.balance, name: buyer.name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get Inbox Leads
app.get('/api/leads/inbox', authMiddleware, async (req, res) => {
  try {
    const purchases = await prisma.leadPurchase.findMany({
      where: { buyerId: req.buyerId },
      include: { lead: true },
      orderBy: { createdAt: 'desc' }
    });
    const inbox = purchases.map(p => ({
      id: p.lead.id,
      purchaseId: p.id,
      name: p.lead.name,
      type: p.lead.serviceType,
      zip: p.lead.zipCode,
      urgency: p.lead.urgency,
      status: p.lead.status,
      returnStatus: p.status,
      price: p.price,
      time: p.createdAt,
      phone: p.lead.phone,
      email: p.lead.email
    }));
    res.json(inbox);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get Campaigns
app.get('/api/campaigns', authMiddleware, async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { buyerId: req.buyerId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(campaigns);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create Campaign
app.post('/api/campaigns', authMiddleware, async (req, res) => {
  try {
    const { name, vertical, zipCodes, leadType, maxBid, dailyLimit } = req.body;
    const campaign = await prisma.campaign.create({
      data: {
        buyerId: req.buyerId,
        name,
        vertical: vertical || 'HVAC',
        zipCodes: zipCodes || 'all',
        leadType: leadType || 'Both',
        maxBid: parseFloat(maxBid),
        dailyLimit: parseInt(dailyLimit) || 10,
        isActive: true
      }
    });
    res.json(campaign);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Toggle Campaign
app.post('/api/campaigns/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({ where: { id: parseInt(id) } });
    if (!campaign || campaign.buyerId !== req.buyerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = await prisma.campaign.update({
      where: { id: parseInt(id) },
      data: { isActive: !campaign.isActive }
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Return Lead
app.post('/api/leads/:id/return', authMiddleware, async (req, res) => {
  try {
    const purchaseId = parseInt(req.params.id);
    const { reason } = req.body;
    const purchase = await prisma.leadPurchase.findUnique({ where: { id: purchaseId } });
    if (!purchase || purchase.buyerId !== req.buyerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (purchase.status === 'returned') {
      return res.status(400).json({ error: 'Already returned' });
    }
    // Refund balance + mark as returned
    await prisma.$transaction([
      prisma.leadPurchase.update({
        where: { id: purchaseId },
        data: { status: 'returned', returnReason: reason || 'Not specified' }
      }),
      prisma.buyer.update({
        where: { id: req.buyerId },
        data: { balance: { increment: purchase.price } }
      })
    ]);
    res.json({ success: true, refunded: purchase.price });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Analytics
app.get('/api/analytics', authMiddleware, async (req, res) => {
  try {
    const purchases = await prisma.leadPurchase.findMany({
      where: { buyerId: req.buyerId },
      include: { lead: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by day
    const byDay = {};
    const byVertical = {};
    let totalSpend = 0;
    let returnedCount = 0;

    purchases.forEach(p => {
      const day = p.createdAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
      byVertical[p.lead.serviceType] = (byVertical[p.lead.serviceType] || 0) + p.price;
      totalSpend += p.price;
      if (p.status === 'returned') returnedCount++;
    });

    res.json({
      totalLeads: purchases.length,
      totalSpend: totalSpend.toFixed(2),
      returnRate: purchases.length ? ((returnedCount / purchases.length) * 100).toFixed(1) : 0,
      byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
      byVertical: Object.entries(byVertical).map(([name, spend]) => ({ name, spend: spend.toFixed(2) }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------------------------------------------------
// ADMIN API (hardcoded admin check for MVP)
// ---------------------------------------------------------
function adminMiddleware(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY && key !== 'unicorn-admin-2024') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Admin KPI
app.get('/api/admin/kpi', adminMiddleware, async (req, res) => {
  try {
    const [totalLeads, totalPurchases, unsoldLeads, buyers] = await Promise.all([
      prisma.lead.count(),
      prisma.leadPurchase.findMany({ where: { status: { not: 'returned' } } }),
      prisma.lead.count({ where: { status: 'Unsold' } }),
      prisma.buyer.findMany({ select: { balance: true } })
    ]);

    const totalRevenue = totalPurchases.reduce((sum, p) => sum + p.price * 0.15, 0); // 15% platform fee
    const fillRate = totalLeads ? (((totalLeads - unsoldLeads) / totalLeads) * 100).toFixed(1) : 0;
    const avgCPL = totalPurchases.length
      ? (totalPurchases.reduce((s, p) => s + p.price, 0) / totalPurchases.length).toFixed(2)
      : 0;

    res.json({ totalLeads, totalRevenue: totalRevenue.toFixed(2), fillRate, avgCPL, unsoldLeads });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: All leads
app.get('/api/admin/leads', adminMiddleware, async (req, res) => {
  try {
    const { status, vertical, zip } = req.query;
    const where = {};
    if (status) where.status = status;
    if (vertical) where.serviceType = vertical;
    if (zip) where.zipCode = zip;

    const leads = await prisma.lead.findMany({
      where,
      include: { purchases: { include: { buyer: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: Export leads as CSV
app.get('/api/admin/leads/export', adminMiddleware, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      include: { purchases: { include: { buyer: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const csvHeaders = [
      'lead_id', 'created_at', 'vertical', 'service_type', 'zip_code',
      'urgency', 'status', 'buyer', 'sold_price', 'return_reason',
      'lead_type', 'appointment_date', 'appointment_time'
    ];

    const rows = leads.map(l => {
      const primaryPurchase = l.purchases && l.purchases[0];
      const buyerName = l.purchases && l.purchases.length > 0
        ? l.purchases.map(p => p.buyer?.name || p.buyerId).join(';')
        : '';
      const soldPrice = primaryPurchase ? primaryPurchase.price : 0;
      const returnReason = primaryPurchase ? (primaryPurchase.returnReason || '') : '';

      return [
        `"L${String(l.id).padStart(6, '0')}"`,
        `"${new Date(l.createdAt).toISOString()}"`,
        `"${l.vertical || l.serviceType || ''}"`,
        `"${l.serviceType || ''}"`,
        `"${l.zipCode || ''}"`,
        `"${l.urgency || 'Standard'}"`,
        `"${l.status}"`,
        `"${buyerName}"`,
        soldPrice.toFixed(2),
        `"${returnReason}"`,
        `"${l.leadType || 'CPL'}"`,
        `"${l.appointmentDate || ''}"`,
        `"${l.appointmentTime || ''}"`
      ].join(',');
    });

    // Add UTF-8 BOM so Excel & Google Sheets automatically detect encoding & columns
    const csvContent = '\uFEFF' + [csvHeaders.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=unicorn_leads_export_${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: All buyers
app.get('/api/admin/buyers', adminMiddleware, async (req, res) => {
  try {
    const buyers = await prisma.buyer.findMany({
      include: {
        _count: { select: { purchases: true } },
        campaigns: { select: { id: true, isActive: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(buyers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: Adjust buyer balance
app.post('/api/admin/buyers/:id/balance', adminMiddleware, async (req, res) => {
  try {
    const { amount, note } = req.body;
    const buyer = await prisma.buyer.update({
      where: { id: parseInt(req.params.id) },
      data: { balance: { increment: parseFloat(amount) } }
    });
    res.json({ balance: buyer.balance, note });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: Freeze buyer
app.post('/api/admin/buyers/:id/freeze', adminMiddleware, async (req, res) => {
  try {
    await prisma.campaign.updateMany({
      where: { buyerId: parseInt(req.params.id) },
      data: { isActive: false }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: Auction logs
app.get('/api/admin/auction-logs', adminMiddleware, async (req, res) => {
  try {
    const logs = await prisma.leadPurchase.findMany({
      include: {
        lead: { select: { id: true, serviceType: true, zipCode: true, status: true, createdAt: true } },
        buyer: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Start server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Unicorn Pro API running on http://localhost:${PORT}`);
    
    // Start Telegram Alert Job (every 1 hour)
    // For demo/testing, running it every 15 seconds:
    setInterval(() => {
      TelegramAlertService.checkFillRateAndAlert();
    }, 15000);
  });
}

module.exports = app;
