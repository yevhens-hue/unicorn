const express = require('express');
const cors = require('cors');
const app = express();
const prisma = require('./src/lib/prisma');

app.use(cors());
app.use(express.json());

// Vercel Serverless URL Normalization
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace('/api/api/', '/api/');
  } else if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
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
app.post('/api/leads', LeadController.submitLead);
app.post('/api/agent/cos/run-cycle', AgentController.runCosCycle);
app.get('/api/agent/cos/status', AgentController.getCosStatus);
app.post('/api/agent/voice/test-objection', AgentController.testObjection);

// ANTI-ECHO WEBHOOK GUARD ENDPOINTS (CRM 2-WAY SYNC)
app.post('/api/webhooks/contractor-crm/sync', WebhookController.syncContractorCrmWebhook);
app.get('/api/webhooks/contractor-crm/status', WebhookController.getGuardStatus);

// NIGHTLY 20:30 FOUNDER EXECUTIVE BRIEFING ENDPOINTS
app.post('/api/agent/cos/trigger-nightly-digest', async (req, res) => {
  const result = await NightlyDigestCronService.triggerNightlyDigest(req.body || {});
  return res.status(200).json({ status: 'SUCCESS', digest: result });
});
app.get('/api/agent/cos/nightly-digest/status', (req, res) => {
  return res.status(200).json(NightlyDigestCronService.getStatus());
});

// ---------------------------------------------------------
// MODEL CONTEXT PROTOCOL (MCP) REMOTE STREAMABLE HTTP / SSE API
// ---------------------------------------------------------
const handleMcpRoute = (req, res) => McpServerService.handleMcpHttpRequest(req, res);
app.all('/api/mcp/sse', handleMcpRoute);
app.all('/api/mcp/message', handleMcpRoute);
app.all('/api/mcp', handleMcpRoute);

// ---------------------------------------------------------
// PUBLIC TELEGRAM FEED API
// ---------------------------------------------------------
app.get('/api/telegram/feed', (req, res) => {
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
