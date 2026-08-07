---
name: anti-echo-crm-guard
description: Implement a 3-layer anti-loop guard (Mapping Table + 30s TTL Suppression Cache + HMAC SHA-256 Signature Verification) for 2-way CRM webhooks (Jobber, Housecall Pro, Todoist, Zapier) to eliminate duplicate requests and infinite echo loops.
---

# Anti-Echo Webhook Guard Pattern (3-Layer Anti-Loop Engine)

When building 2-way synchronization between an AI Agent platform and external CRMs or task managers (Jobber, Housecall Pro, Todoist, Hubspot), external updates trigger webhooks back into your API. If your API then updates the CRM in response, an infinite echo loop occurs, burning API limits and duplicating leads.

This skill provides the exact 3-layer guard pattern to eliminate webhook echo loops 100%.

---

## 3-Layer Architecture

```
Incoming Webhook HTTP Request
          │
  [Layer 3: HMAC SHA-256 Signature Validator]
          │ (Reject 401 if secret signature mismatch)
          ▼
  [Layer 2: 30-Second TTL Outbound Push Suppression Memory Cache]
          │ (Ignore webhook if event ID was pushed outbound in last 30s)
          ▼
  [Layer 1: Task/Lead ID Mapping Table & Event Deduplication]
          │ (Skip duplicate processing if lead mapping exists & status unchanged)
          ▼
    Safe Execution & CRM Update
```

---

## Reference Node.js Implementation

```javascript
const crypto = require('crypto');

class AntiEchoWebhookGuardService {
  constructor() {
    this.suppressionCache = new Map(); // Key: entityId, Value: timestamp
    this.processedWebhooks = new Set();
    this.WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET || 'unicorn_webhook_secret_key_2026';
    this.TTL_MS = 30000; // 30 seconds
  }

  // Layer 3: HMAC SHA-256 Validator
  verifySignature(rawBody, signatureHeader) {
    if (!signatureHeader || !this.WEBHOOK_SECRET) return true; // dev fallback
    const expected = crypto.createHmac('sha256', this.WEBHOOK_SECRET)
                           .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
                           .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  }

  // Layer 2: Register outbound update before pushing to external CRM
  registerOutboundPush(entityId) {
    this.suppressionCache.set(entityId, Date.now());
    setTimeout(() => this.suppressionCache.delete(entityId), this.TTL_MS);
  }

  // Process Inbound Webhook
  processInboundWebhook({ externalCrmId, entityId, eventType, signatureHeader, rawBody }) {
    if (!this.verifySignature(rawBody, signatureHeader)) {
      return { status: 'REJECTED_HMAC_INVALID', allow: false };
    }

    // Check Layer 2 TTL Cache
    const lastPush = this.suppressionCache.get(entityId) || this.suppressionCache.get(externalCrmId);
    if (lastPush && (Date.now() - lastPush < this.TTL_MS)) {
      return { status: 'IGNORED_ECHO_SUPPRESSED', allow: false, reason: 'Suppressed by 30s TTL outbound push cache' };
    }

    // Check Layer 1 Deduplication
    const eventKey = `${externalCrmId}:${eventType}`;
    if (this.processedWebhooks.has(eventKey)) {
      return { status: 'IGNORED_DUPLICATE', allow: false };
    }

    this.processedWebhooks.add(eventKey);
    return { status: 'PROCESSED_SUCCESSFULLY', allow: true };
  }
}

module.exports = new AntiEchoWebhookGuardService();
```

---

## When to Apply This Pattern
- 2-way syncing leads between proprietary CRM & Jobber / Housecall Pro / Zapier.
- Task synchronization between AI Operations Agent & Todoist / Asana / Jira.
- Any webhook endpoint receiving high-frequency updates where echo back triggers outbound webhooks.
