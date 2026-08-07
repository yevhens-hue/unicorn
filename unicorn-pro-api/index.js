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
const WebhookController = require('./src/controllers/WebhookController');
const NightlyDigestCronService = require('./src/services/NightlyDigestCronService');
const McpServerService = require('./src/services/McpServerService');

const router = express.Router();

// ---------------------------------------------------------
// PING-POST ENGINE & AI AGENT ENDPOINTS
// ---------------------------------------------------------
router.post('/leads', LeadController.submitLead);
router.post('/agent/cos/run-cycle', AgentController.runCosCycle);
router.get('/agent/cos/status', AgentController.getCosStatus);
router.post('/agent/voice/test-objection', AgentController.testObjection);

// ANTI-ECHO WEBHOOK GUARD ENDPOINTS (CRM 2-WAY SYNC)
router.post('/webhooks/contractor-crm/sync', WebhookController.syncContractorCrmWebhook);
router.get('/webhooks/contractor-crm/status', WebhookController.getGuardStatus);

// NIGHTLY 20:30 FOUNDER EXECUTIVE BRIEFING ENDPOINTS
const handleNightlyDigestTrigger = async (req, res) => {
  const result = await NightlyDigestCronService.triggerNightlyDigest(req.body || {});
  return res.status(200).json({ status: 'SUCCESS', digest: result });
};
const handleNightlyDigestStatus = (req, res) => {
  return res.status(200).json(NightlyDigestCronService.getStatus());
};

router.post('/agent/cos/trigger-nightly-digest', handleNightlyDigestTrigger);
router.get('/agent/cos/nightly-digest/status', handleNightlyDigestStatus);

// ---------------------------------------------------------
// MODEL CONTEXT PROTOCOL (MCP) REMOTE STREAMABLE HTTP / SSE API
// ---------------------------------------------------------
const handleMcpRoute = (req, res) => McpServerService.handleMcpHttpRequest(req, res);
router.all('/mcp/sse', handleMcpRoute);
router.all('/mcp/message', handleMcpRoute);
router.all('/mcp', handleMcpRoute);

// ---------------------------------------------------------
// PUBLIC TELEGRAM FEED API
// ---------------------------------------------------------
router.get('/telegram/feed', (req, res) => {
  const dispatches = TelegramAlertService.getRecentDispatches();
  res.json({
    status: 'online',
    botUsername: '@Unicornmarketingbot',
    chatId: '264172207',
    totalDispatches: dispatches.length,
    dispatches
  });
});

app.use('/api', router);
app.use(router);

module.exports = app;
