const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AIAgentService {
  /**
   * Qualifies an incoming lead using Anthropic Claude API or built-in deterministic rules.
   * Extracts category, urgency rating, estimated project value, and whether manual approval is needed.
   */
  static async qualifyLead(leadData) {
    const { name, serviceType, zipCode, projectScope, urgency, timeframe, isOwner } = leadData;
    
    // Default rule-based qualification
    let estimatedBudget = 4500; // default estimate in USD
    let category = serviceType || 'HVAC';
    let priority = 2; // 1: Urgent, 2: This week, 3: Whenever
    let needsApproval = false;
    let qualificationReason = [];

    // Analyze urgency
    if (urgency === 'Emergency' || urgency === 'Immediate' || timeframe === 'Immediate (24-48 hours)') {
      priority = 1;
      qualificationReason.push("High Urgency: Emergency service request within 24-48h");
    }

    // Estimate budget based on vertical & scope
    const scopeLower = (projectScope || '').toLowerCase();
    const serviceLower = (serviceType || '').toLowerCase();

    if (serviceLower.includes('roof') || scopeLower.includes('replace') || scopeLower.includes('full')) {
      estimatedBudget = 12500;
      category = 'Roofing';
    } else if (serviceLower.includes('hvac') || scopeLower.includes('unit') || scopeLower.includes('heat')) {
      estimatedBudget = 8500;
      category = 'HVAC';
    } else if (serviceLower.includes('window') || scopeLower.includes('window')) {
      estimatedBudget = 6200;
      category = 'Windows';
    } else if (serviceLower.includes('solar')) {
      estimatedBudget = 22000;
      category = 'Solar';
    }

    // Approval gate: If budget >= $10,000 or non-homeowner or complex project
    if (estimatedBudget >= 10000 || !isOwner) {
      needsApproval = true;
      qualificationReason.push(`High Value / Risk: Estimated project budget $${estimatedBudget.toLocaleString()} >= $10,000 threshold or non-owner lead.`);
    }

    // Try Anthropic Claude API if key is present
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        
        const prompt = `Analyze this Home Services Lead:
Name: ${name}
Service: ${serviceType}
ZIP: ${zipCode}
Is Homeowner: ${isOwner}
Urgency: ${urgency}
Scope: ${projectScope}

Return JSON with:
{
  "category": "HVAC|Roofing|Windows|Solar|Plumbing|Other",
  "priority": 1|2|3,
  "estimatedBudgetUSD": number,
  "needsApproval": boolean,
  "summary": "1 sentence breakdown"
}`;

        const response = await anthropic.messages.create({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        });

        const text = response.content[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const aiParsed = JSON.parse(jsonMatch[0]);
          category = aiParsed.category || category;
          priority = aiParsed.priority || priority;
          estimatedBudget = aiParsed.estimatedBudgetUSD || estimatedBudget;
          needsApproval = aiParsed.needsApproval ?? needsApproval;
          qualificationReason.push(`Claude AI Analysis: ${aiParsed.summary}`);
        }
      } catch (err) {
        console.warn('[AIAgentService] Claude API call skipped/fallback:', err.message);
      }
    }

    return {
      category,
      priority,
      estimatedBudget,
      needsApproval,
      reasons: qualificationReason,
      qualifiedAt: new Date().toISOString()
    };
  }

  /**
   * Generates a 20:30 Executive Daily Digest briefing for the Admin / Chief of Staff.
   */
  static async generateDailyDigest() {
    try {
      const [totalLeads, unsoldLeads, soldLeads, purchases, recentLeads] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: 'Unsold' } }),
        prisma.lead.count({ where: { status: { in: ['Exclusive', 'Shared'] } } }),
        prisma.leadPurchase.findMany({ select: { price: true } }),
        prisma.lead.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);

      const totalRevenue = purchases.reduce((sum, p) => sum + p.price, 0);
      const fillRate = totalLeads > 0 ? ((soldLeads / totalLeads) * 100).toFixed(1) : '0.0';

      const highValuePending = recentLeads.filter(l => 
        l.appointmentStatus === 'Pending' || l.status === 'Unsold'
      );

      const briefText = 
`🦄 *UNICORN CHIEF OF STAFF — DAILY EXECUTIVE BRIEFING* 🦄
📅 *Date:* ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}

📊 *PERFORMANCE METRICS:*
• Total Revenue: *$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}*
• Total Leads Processed: *${totalLeads}*
• Platform Fill Rate: *${fillRate}%* (${soldLeads} sold / ${unsoldLeads} unsold)

⚠️ *ACTION ITEMS FOR TONIGHT:*
${highValuePending.length > 0 
  ? highValuePending.map(l => `• Lead #${l.id} (${l.serviceType}, ZIP ${l.zipCode}) — ${l.name} (${l.phone})`).join('\n')
  : '• All high-value leads are confirmed & assigned. No pending approvals.'}

🎯 *RECOMMENDED FOCUS:*
${unsoldLeads > 0 
  ? `Run AI Outbound Booker on ${unsoldLeads} unsold leads to convert them into Pay-Per-Appointment ($150 PPA).`
  : 'Expand Native Ad campaigns (Taboola/Outbrain) for highest ROAS (61.3% ROI).'}`;

      return {
        digest: briefText,
        metrics: {
          totalRevenue,
          totalLeads,
          fillRate: parseFloat(fillRate),
          unsoldLeads,
          pendingApprovalCount: highValuePending.length
        }
      };
    } catch (e) {
      console.error('[AIAgentService] Error generating daily digest:', e);
      throw e;
    }
  }

  /**
   * Sends an interactive Telegram Confirmation Card with Inline Buttons
   * for high-value leads requiring human approval.
   */
  static async sendTelegramApprovalCard(lead, qualification) {
    const message = 
`🚨 *APPROVAL REQUIRED — HIGH VALUE LEAD* 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Name:* ${lead.name}
📞 *Phone:* ${lead.phone}
📍 *ZIP Code:* ${lead.zipCode}
🔨 *Vertical:* ${lead.serviceType}
💰 *Est. Project Value:* $${qualification.estimatedBudget.toLocaleString()}
⚠️ *Urgency:* ${lead.urgency}

📋 *AI Qualification Notes:*
${qualification.reasons.map(r => `• ${r}`).join('\n')}

Click below to approve for $150 Pay-Per-Appointment auction:`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✓ Approve PPA ($150)', callback_data: `approve_ppa:${lead.id}` },
          { text: '✎ Edit / Reschedule', callback_data: `edit_lead:${lead.id}` }
        ],
        [
          { text: '✗ Reject Lead', callback_data: `reject_lead:${lead.id}` }
        ]
      ]
    };

    console.log(`\n================= TELEGRAM INTERACTIVE CARD =================`);
    console.log(message);
    console.log(`Inline Buttons:`, JSON.stringify(inlineKeyboard));
    console.log(`===========================================================\n`);

    return { message, inlineKeyboard };
  }

  /**
   * Handles incoming Telegram webhook callback queries and commands.
   */
  static async handleTelegramWebhook(update) {
    if (update.callback_query) {
      const data = update.callback_query.data;
      if (data.startsWith('approve_ppa:')) {
        const leadId = parseInt(data.split(':')[1]);
        const updatedLead = await prisma.lead.update({
          where: { id: leadId },
          data: {
            leadType: 'PPA_CALLCENTER',
            appointmentStatus: 'Confirmed'
          }
        });
        return { success: true, message: `✅ Lead #${leadId} approved for PPA auction!`, lead: updatedLead };
      } else if (data.startsWith('reject_lead:')) {
        const leadId = parseInt(data.split(':')[1]);
        const updatedLead = await prisma.lead.update({
          where: { id: leadId },
          data: { status: 'Unsold', appointmentStatus: 'Cancelled' }
        });
        return { success: true, message: `❌ Lead #${leadId} rejected.`, lead: updatedLead };
      }
    }
    return { success: true, message: 'Webhook processed' };
  }
}

module.exports = AIAgentService;
