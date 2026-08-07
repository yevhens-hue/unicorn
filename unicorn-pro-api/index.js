const express = require('express');
const cors = require('cors');
const app = express();
const prisma = require('./src/lib/prisma');

app.use(cors());
app.use(express.json());

// Canonical Vercel Middleware: Strip /api prefix so all routes match cleanly
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.substring(4);
  }
  if (!req.url.startsWith('/')) {
    req.url = '/' + req.url;
  }
  next();
});

const LeadController = require('./src/controllers/LeadController');
const BillingController = require('./src/controllers/BillingController');
const AgentController = require('./src/controllers/AgentController');
const TelegramAlertService = require('./src/services/TelegramAlertService');
const AIAgentService = require('./src/services/AIAgentService');
const AIVoiceCallService = require('./src/services/AIVoiceCallService');
const WebhookController = require('./src/controllers/WebhookController');
const NightlyDigestCronService = require('./src/services/NightlyDigestCronService');
const McpServerService = require('./src/services/McpServerService');

// ---------------------------------------------------------
// PING-POST ENGINE & AI AGENT ENDPOINTS
// ---------------------------------------------------------
app.post('/leads', LeadController.submitLead);
app.post('/agent/cos/run-cycle', AgentController.runCosCycle);
app.get('/agent/cos/status', AgentController.getCosStatus);
app.post('/agent/voice/test-objection', AgentController.testObjection);

// ANTI-ECHO WEBHOOK GUARD ENDPOINTS (CRM 2-WAY SYNC)
app.post('/webhooks/contractor-crm/sync', WebhookController.syncContractorCrmWebhook);
app.get('/webhooks/contractor-crm/status', WebhookController.getGuardStatus);

// NIGHTLY 20:30 FOUNDER EXECUTIVE BRIEFING ENDPOINTS
const handleNightlyDigestTrigger = async (req, res) => {
  const result = await NightlyDigestCronService.triggerNightlyDigest(req.body || {});
  return res.status(200).json({ status: 'SUCCESS', digest: result });
};
const handleNightlyDigestStatus = (req, res) => {
  return res.status(200).json(NightlyDigestCronService.getStatus());
};

app.post('/agent/cos/trigger-nightly-digest', handleNightlyDigestTrigger);
app.get('/agent/cos/nightly-digest/status', handleNightlyDigestStatus);

// ---------------------------------------------------------
// MODEL CONTEXT PROTOCOL (MCP) REMOTE STREAMABLE HTTP / SSE API
// ---------------------------------------------------------
const handleMcpRoute = (req, res) => McpServerService.handleMcpHttpRequest(req, res);
app.all('/mcp/sse', handleMcpRoute);
app.all('/mcp/message', handleMcpRoute);
app.all('/mcp', handleMcpRoute);

// ---------------------------------------------------------
// PUBLIC TELEGRAM FEED API
// ---------------------------------------------------------
app.get('/telegram/feed', (req, res) => {
  const dispatches = TelegramAlertService.getRecentDispatches();
  res.json({
    status: 'online',
    botUsername: '@Unicornmarketingbot',
    chatId: '264172207',
    totalDispatches: dispatches.length,
    dispatches
  });
});

module.exports = app;
