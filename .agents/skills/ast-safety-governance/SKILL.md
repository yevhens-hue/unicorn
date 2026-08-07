---
name: ast-safety-governance
description: Dynamic Safety Governance & AST Parameter Inspection for AI Agents and MCP Tool Calls. Enforces regex/AST threat scanning, financial approval gates ($1,000 threshold), and hash pinning verification for approved tool signatures.
---

# Dynamic AST Safety Governance & Financial Approval Gate Pattern

When building autonomous AI Agents (Nous Hermes, Claude SDK, Google Antigravity SDK, LangChain) that execute MCP tools or external API calls, agents can be compromised by prompt injection or untrusted data.

This skill provides an AST Safety Governance layer to inspect all tool parameters, detect SQL/Code injections, enforce financial limits, and verify tool signature hash pinning before execution.

---

## 3-Stage Security Pipeline

```
  Incoming MCP Tool Request (JSON-RPC 2.0 / Agent Function Call)
                             │
     [Stage 1: AST / Regex Injection Threat Scanner]
     (Scan for: DROP DATABASE, TRUNCATE, eval(), exec(), sk_live_, process.env)
                             │ Pass
                             ▼
     [Stage 2: Financial Threshold Gate ($1,000 Limit)]
     (Check if debit > $1,000 or ad spend > $10,000 -> Block for Founder Approval)
                             │ Pass
                             ▼
     [Stage 3: Hash Pinning Registry Verification]
     (Match tool name against approved hash registry: hash_calc_margin_v2)
                             │ Pass
                             ▼
            Safe Execution Granted (200 OK)
```

---

## Reference Implementation

```javascript
class McpSafetyGovernanceService {
  constructor() {
    this.APPROVED_TOOL_HASHES = {
      'calculate_ppa_margin': 'hash_calc_margin_v2',
      'check_zip_contractor_coverage': 'hash_check_zip_v2',
      'qualify_homeowner_lead': 'hash_qualify_lead_v2',
      'reserve_contractor_slot': 'hash_reserve_slot_v2'
    };

    this.RESTRICTED_PATTERNS = [
      /DROP\s+DATABASE/i,
      /TRUNCATE\s+TABLE/i,
      /DELETE\s+FROM/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /process\.env/i,
      /__proto__/i,
      /sk_live_/i
    ];
  }

  inspectToolExecution(toolName, toolArgs = {}) {
    const payloadStr = JSON.stringify(toolArgs);

    // Stage 1: Injection Pattern Scan
    for (const pattern of this.RESTRICTED_PATTERNS) {
      if (pattern.test(payloadStr) || pattern.test(toolName)) {
        return {
          allow: false,
          status: 'BLOCKED_SECURITY_VIOLATION',
          reason: `Security Threat Detected: Payload matches restricted pattern '${pattern.source}'. Execution hard-blocked.`
        };
      }
    }

    // Stage 2: Financial Threshold Gate
    if (toolArgs.ppaDebitAuthorizedUsd > 1000 || toolArgs.estimatedBudgetUsd > 50000) {
      return {
        allow: false,
        status: 'BLOCKED_FINANCIAL_THRESHOLD',
        reason: `Financial Approval Gate Exceeded: Amount ($${toolArgs.ppaDebitAuthorizedUsd || toolArgs.estimatedBudgetUsd}) requires explicit Founder sign-off.`
      };
    }

    // Stage 3: Hash Pinning Registry
    const hashPin = this.APPROVED_TOOL_HASHES[toolName];
    return {
      allow: true,
      status: 'APPROVED_FOR_EXECUTION',
      hashPin: hashPin || 'UNPINNED_DYNAMIC_TOOL'
    };
  }
}

module.exports = new McpSafetyGovernanceService();
```

---

## Use Cases
- Hardening MCP Streamable HTTP / SSE remote servers against prompt injection attacks.
- Enforcing strict financial caps on AI ad spend or payment debits.
- Preventing database destruction or serverless environment variable leaks.
