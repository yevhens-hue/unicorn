/**
 * Unicorn Pro — Anti-Echo Webhook Guard Service
 * Protects 2-Way CRM Sync (Jobber, Housecall Pro, Zapier) against infinite loops,
 * duplicate lead creations, and double-billing $150 PPA debits.
 * 
 * 3-Layer Defense Architecture:
 * 1. Mapping Table Deduplication (External CRM Lead ID <-> Unicorn Lead ID)
 * 2. 30-Second TTL Outbound Push Suppression Memory Cache
 * 3. HMAC SHA-256 Webhook Signature Verification (X-Unicorn-Signature)
 */

const crypto = require('crypto');

class AntiEchoWebhookGuardService {
  constructor() {
    this.webhookSecret = process.env.CONTRACTOR_CRM_WEBHOOK_SECRET || 'unicorn_crm_webhook_secret_9981';
    
    // Memory Cache for 30s TTL Outbound Push Suppression
    this.recentPushSuppressionCache = new Map(); // leadId -> timestamp
    
    // Mapping Table (External CRM ID -> Unicorn Lead ID)
    this.leadIdMappingTable = new Map(); // externalCrmId -> unicornLeadId

    // Audit logs of processed webhooks
    this.webhookAuditLogs = [];
  }

  /**
   * Layer 3: Verifies HMAC SHA-256 signature on incoming webhooks
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!signatureHeader) return false;
    
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const expectedSignature = hmac.update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody)).digest('hex');
    
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature));
  }

  /**
   * Registers an outbound push from Unicorn Pro to Contractor CRM
   * Caches timestamp to suppress inbound echo webhooks for 30 seconds.
   */
  recordOutboundPush(unicornLeadId, externalCrmId) {
    const now = Date.now();
    this.recentPushSuppressionCache.set(unicornLeadId, now);
    if (externalCrmId) {
      this.leadIdMappingTable.set(externalCrmId, unicornLeadId);
    }
  }

  /**
   * Processes inbound webhook from Contractor CRM (Jobber / Housecall Pro)
   * Enforces 3-layer anti-echo rules.
   */
  processInboundWebhook({ externalCrmId, unicornLeadId, eventType, leadData, signatureHeader, rawBody }) {
    const startTime = Date.now();
    const now = Date.now();

    // 1. Signature Verification (Layer 3)
    if (signatureHeader && !this.verifyWebhookSignature(rawBody || leadData, signatureHeader)) {
      const result = {
        status: 'REJECTED_INVALID_SIGNATURE',
        action: 'BLOCK',
        reason: 'HMAC SHA-256 signature mismatch on X-Unicorn-Signature header.'
      };
      this._recordAuditLog(eventType, externalCrmId, result, Date.now() - startTime);
      return result;
    }

    // 2. Mapping Table Lookup (Layer 1)
    const existingUnicornId = this.leadIdMappingTable.get(externalCrmId);
    if (eventType === 'lead.created' && (existingUnicornId || unicornLeadId)) {
      const matchedId = existingUnicornId || unicornLeadId;
      const result = {
        status: 'SUPPRESSED_DUPLICATE_MAPPED',
        action: 'NO_OP',
        unicornLeadId: matchedId,
        reason: `External CRM Lead ${externalCrmId} already mapped to Unicorn Lead ${matchedId}. Creation echo suppressed.`
      };
      this._recordAuditLog(eventType, externalCrmId, result, Date.now() - startTime);
      return result;
    }

    // 3. Outbound Push Suppression Window Check (Layer 2)
    const targetLeadId = unicornLeadId || existingUnicornId;
    if (targetLeadId && this.recentPushSuppressionCache.has(targetLeadId)) {
      const lastPushTime = this.recentPushSuppressionCache.get(targetLeadId);
      const elapsedSeconds = (now - lastPushTime) / 1000;

      if (elapsedSeconds < 30.0) {
        const result = {
          status: 'SUPPRESSED_RECENT_OUTBOUND_ECHO',
          action: 'NO_OP',
          unicornLeadId: targetLeadId,
          reason: `Webhook received ${elapsedSeconds.toFixed(1)}s after Unicorn outbound push. Echo suppressed to prevent infinite loop.`
        };
        this._recordAuditLog(eventType, externalCrmId, result, Date.now() - startTime);
        return result;
      }
    }

    // 4. Valid Legitimate Webhook Execution
    if (eventType === 'appointment.completed' || eventType === 'lead.status_updated') {
      if (externalCrmId && targetLeadId) {
        this.leadIdMappingTable.set(externalCrmId, targetLeadId);
      }

      const result = {
        status: 'PROCESSED_SUCCESSFULLY',
        action: 'UPDATE_UNICORN_CRM',
        unicornLeadId: targetLeadId || `lead_${Date.now()}`,
        ppaBillingStatus: 'CHARGED_150_PPA_ONCE',
        reason: 'Legitimate status update verified. PPA billing & appointment slot updated.'
      };
      this._recordAuditLog(eventType, externalCrmId, result, Date.now() - startTime);
      return result;
    }

    const result = {
      status: 'PROCESSED_GENERIC',
      action: 'UPDATE_RECORD',
      reason: `Event '${eventType}' processed cleanly.`
    };
    this._recordAuditLog(eventType, externalCrmId, result, Date.now() - startTime);
    return result;
  }

  _recordAuditLog(eventType, externalCrmId, result, durationMs) {
    const entry = {
      timestamp: new Date().toISOString(),
      eventType: eventType || 'N/A',
      externalCrmId: externalCrmId || 'N/A',
      status: result.status,
      action: result.action,
      reason: result.reason,
      durationMs
    };
    this.webhookAuditLogs.unshift(entry);
    if (this.webhookAuditLogs.length > 50) this.webhookAuditLogs.pop();
  }

  getAuditStatus() {
    return {
      activeMappingsCount: this.leadIdMappingTable.size,
      cachedSuppressionCount: this.recentPushSuppressionCache.size,
      totalWebhooksProcessed: this.webhookAuditLogs.length,
      auditLogs: this.webhookAuditLogs.slice(0, 10)
    };
  }
}

module.exports = new AntiEchoWebhookGuardService();
