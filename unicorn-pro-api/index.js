const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const LeadController = require('./src/controllers/LeadController');

// ---------------------------------------------------------
// PING-POST ENGINE
// ---------------------------------------------------------
app.post('/api/leads', LeadController.submitLead);

// ---------------------------------------------------------
// AUTH (MVP: simple token check)
// ---------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
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

// Auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = Buffer.from(auth.slice(7), 'base64').toString('utf8');
    const [buyerId] = decoded.split(':');
    req.buyerId = parseInt(buyerId);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

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
  });
}

module.exports = app;
