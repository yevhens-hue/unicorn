const AntiEchoWebhookGuardService = require('../services/AntiEchoWebhookGuardService');

class WebhookController {
  static syncContractorCrmWebhook(req, res) {
    const signatureHeader = req.headers['x-unicorn-signature'] || req.headers['x-jobber-signature'];
    const { externalCrmId, unicornLeadId, eventType, leadData } = req.body || {};

    const result = AntiEchoWebhookGuardService.processInboundWebhook({
      externalCrmId,
      unicornLeadId,
      eventType: eventType || 'lead.created',
      leadData: leadData || req.body,
      signatureHeader,
      rawBody: req.body
    });

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      guardResult: result
    });
  }

  static getGuardStatus(req, res) {
    const status = AntiEchoWebhookGuardService.getAuditStatus();
    return res.status(200).json({
      serviceName: 'Anti-Echo Webhook Guard v1.0',
      status: 'ACTIVE',
      metrics: status
    });
  }
}

module.exports = WebhookController;
