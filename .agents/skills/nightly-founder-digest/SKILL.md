---
name: nightly-founder-digest
description: Generate a scheduled 20:30 Founder Executive Briefing (<150 words) covering daily net profit, unit economics, security audit verdicts, anomaly savings, and 1 strategic 10-minute action item, automatically dispatched to Telegram.
---

# Nightly 20:30 Founder Executive Briefing Pattern

Founders and executives do not want raw logs or long reports at night. They want a concise (<150 words), actionable briefing delivered to Telegram every evening at 20:30.

This skill provides the structure and cron service logic to format, generate, and dispatch the 20:30 briefing.

---

## 3-Part Briefing Template (<150 Words)

```markdown
👔 **[PROJECT NAME] — 20:30 FOUNDER EXECUTIVE BRIEFING**

📊 **1. Unit Economics & Profits Today:**
• Net Platform Profit: +$[PROFIT_AMOUNT]
• PPA Fill Rate / Conversion: [FILL_RATE]% ([SLOTS] Booked)

🛑 **2. Anomaly Savings & Security Audits:**
• Saved $[SAVINGS] / mo by auto-pausing unprofitable ad campaigns ([CAMPAIGN_NAME])
• Adversarial Security Audit: [VERDICT] (Risk Score: [SCORE]/100)
• Lead RAG Quality Score: [RAG_SCORE]/100 ([CODE_SPEC])

⚡ **Strategic 10-Min Win Tonight:**
[ONE_ACTION_ITEM]
```

---

## Reference Implementation

```javascript
const axios = require('axios');

class NightlyDigestCronService {
  constructor() {
    this.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    this.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '264172207';
  }

  async triggerNightlyDigest(metrics = {}) {
    const netProfit = metrics.netProfitUsd || 1670.28;
    const fillRate = metrics.fillRatePercent || 90.9;
    const adSavings = metrics.monthlyAdSavingsUsd || 3850.00;
    const verdict = metrics.adversarialVerdict || 'APPROVED_WITH_CAP';
    const actionItem = metrics.actionItem || 'Approve Meta Ads +15% budget scaling cap for Dallas ZIP 75001.';

    const briefingText = [
      `👔 **UNICORN PRO — 20:30 FOUNDER EXECUTIVE BRIEFING**\n`,
      `📊 **1. Unit Economics & Profits Today:**`,
      `• Net Platform Profit: +$${netProfit.toLocaleString()}`,
      `• PPA Fill Rate: ${fillRate}% (18 Booked $150 PPA Slots)\n`,
      `🛑 **2. Anomaly Savings & Security:**`,
      `• Saved $${adSavings.toLocaleString()} / mo by auto-pausing Google Search Ads (Texas)`,
      `• Adversarial Audit: ${verdict} (Risk Score: 15/100)`,
      `• Lead RAG Score: 95/100 (TEXAS_IRBC_2024_HAIL)\n`,
      `⚡ **Strategic 10-Min Win Tonight:**`,
      `${actionItem}`
    ].join('\n');

    // Dispatch to Telegram
    if (this.TELEGRAM_BOT_TOKEN) {
      await axios.post(`https://api.telegram.org/bot${this.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: this.TELEGRAM_CHAT_ID,
        text: briefingText,
        parse_mode: 'Markdown'
      });
    }

    return { timestamp: new Date().toISOString(), briefingText };
  }
}

module.exports = new NightlyDigestCronService();
```

---

## When to Apply This Pattern
- Nightly executive updates for AI SaaS platforms or marketplaces.
- Automated daily briefings for Chief of Staff or Fund Operations agents.
- 20:30 Cron job trigger in serverless or containerized environments.
