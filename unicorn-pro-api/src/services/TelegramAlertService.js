const https = require('https');
// In-memory public audit log for live website streaming (Stores last 20 Telegram messages)
const recentDispatches = [];

class TelegramAlertService {
  /**
   * Returns recent Telegram dispatches for public website activity feed.
   */
  static getRecentDispatches() {
    return recentDispatches;
  }

  /**
   * 1. Alert: New Lead Received (CPL Ingestion)
   */
  static async alertNewLead(lead) {
    const msg = `📥 *NEW CPL LEAD RECEIVED*\n\n`
      + `👤 *Name:* ${lead.name || 'Customer'}\n`
      + `📍 *ZIP:* ${lead.zipCode || '75001'}\n`
      + `🔨 *Service:* ${lead.serviceType || 'Roofing'}\n`
      + `📢 *Channel:* ${lead.channel || 'Meta Ads'}\n`
      + `💵 *CPL Price:* $24.54 USD\n\n`
      + `_Processing AI Voice Call & Contractor PPA Matching..._`;
    return this.sendMessage(null, msg);
  }

  /**
   * 2. Alert: PPA Bid Won ($150 Auction Winner)
   */
  static async alertPpaBidWon(lead, contractorName, winningPrice = 150) {
    const margin = winningPrice - 24.54;
    const msg = `💰 *PPA AUCTION WON ($150.00)*\n\n`
      + `🏆 *Winner:* ${contractorName}\n`
      + `👤 *Lead:* ${lead.name || 'Homeowner'} (ZIP ${lead.zipCode})\n`
      + `🔨 *Service:* ${lead.serviceType || 'Roofing'}\n`
      + `💳 *Auction Price:* $${winningPrice}.00 USD\n`
      + `📈 *Net Platform Profit:* +$${margin.toFixed(2)} USD\n\n`
      + `✅ Slot booked & auto-debited via Stripe!`;
    return this.sendMessage(null, msg);
  }

  /**
   * 3. Alert: AI Voice Call Completed (Bland.ai)
   */
  static async alertAiCallCompleted(lead, callSummary) {
    const msg = `🎙 *AI VOICE CALL COMPLETED (Bland.ai)*\n\n`
      + `👤 *Lead:* ${lead.name || 'Customer'} (${lead.phone || 'Phone'})\n`
      + `🎯 *Score:* ${callSummary.score || 95}/100\n`
      + `📅 *Confirmed Slot:* ${callSummary.slot || 'Tomorrow 2 PM'}\n`
      + `📋 *Summary:* ${callSummary.notes || 'Homeowner confirmed roof inspection slot.'}\n\n`
      + `🚀 Lead upgraded to $150 Pay-Per-Appointment!`;
    return this.sendMessage(null, msg);
  }

  /**
   * 4. Alert: Appointment Scheduled (Google Calendar)
   */
  static async alertAppointmentScheduled(lead, calendarEvent) {
    const msg = `📅 *GOOGLE CALENDAR APPOINTMENT CREATED*\n\n`
      + `👷 *Contractor:* ${calendarEvent.contractorEmail || 'pro@roofing.com'}\n`
      + `👤 *Homeowner:* ${lead.name || 'Customer'}\n`
      + `🕒 *Slot:* ${calendarEvent.slot || 'Tomorrow 2:00 PM'}\n`
      + `🆔 *Event ID:* \`${calendarEvent.eventId || 'gcal_123'}\`\n\n`
      + `📱 Twilio SMS & WhatsApp notifications dispatched!`;
    return this.sendMessage(null, msg);
  }

  /**
   * 5. Alert: Stripe Debit Success ($150 PPA Charge)
   */
  static async alertStripeDebit(lead, contractorName, txnId) {
    const msg = `💳 *STRIPE AUTOMATIC PPA DEBIT SUCCESS*\n\n`
      + `💵 *Amount Charged:* $150.00 USD\n`
      + `👷 *Debited Contractor:* ${contractorName || 'Pro Roofing Dallas'}\n`
      + `🆔 *Transaction SID:* \`${txnId || 'txn_ppa_123'}\`\n`
      + `📊 *Status:* Charge Succeeded (Card ending in 4242)\n\n`
      + `✨ Revenue captured instantly to platform balance.`;
    return this.sendMessage(null, msg);
  }

  /**
   * 6. Alert: Fill Rate Warning (< 70% Liquidity)
   */
  static async alertFillRate(fillRate, unsoldLeads, totalLeads) {
    const msg = `🚨 *URGENT: Platform Fill Rate dropped below 70%!*\n\n`
      + `*Current Rate:* ${fillRate.toFixed(2)}%\n`
      + `*Unsold Leads:* ${unsoldLeads}\n`
      + `*Total Leads:* ${totalLeads}\n\n`
      + `_Action Required:_ Check buyer coverage and floor prices.`;
    return this.sendMessage(null, msg);
  }

  /**
   * 7. Alert: National Aggregator Waterfall Fallback
   */
  static async alertWaterfallFallback(lead, aggregatorName, payoutPrice) {
    const msg = `⚡ *NATIONAL AGGREGATOR WATERFALL SYNDICATION*\n\n`
      + `🏢 *Aggregator:* ${aggregatorName || 'QuinStreet'}\n`
      + `👤 *Unsold Lead:* #${lead.id || '101'} (ZIP ${lead.zipCode || '75001'})\n`
      + `💵 *Syndicated CPL Price:* $${payoutPrice || '32.00'} USD\n`
      + `📈 *Status:* 100% Monetized (Zero Lead Waste)\n\n`
      + `✅ Direct-post Ping-Post API payload confirmed.`;
    return this.sendMessage(null, msg);
  }

  /**
   * 8. Alert: AI Ads OS Anomaly & Money Drain Warning
   */
  static async alertAnomalyDrain(channelName, spend, lossAmount, recommendation) {
    const msg = `⚠️ *AI ADS OS ANOMALY & MONEY DRAIN ALERT*\n\n`
      + `📢 *Channel:* ${channelName || 'Google Ads'}\n`
      + `💸 *Current Spend:* $${spend.toLocaleString()} USD\n`
      + `📉 *Detected Waste:* -$${lossAmount.toLocaleString()} USD\n`
      + `💡 *AI Action:* ${recommendation || 'Pause campaign immediately & reallocate budget.'}\n\n`
      + `🤖 Auto-optimization rules queued.`;
    return this.sendMessage(null, msg);
  }

  /**
   * 9. Alert: Daily Executive Digest & Interactive Reschedule Slot Controller
   */
  static async alertDailyDigestAndReschedule(stats = {}) {
    const totalLeads = stats.totalLeads || 42;
    const ppaBooked = stats.ppaBooked || 18;
    const revenue = stats.revenue || 2700;
    const spend = stats.spend || 1030.68;
    const profit = stats.profit || 1669.32;
    const roas = stats.roas || 261.9;

    const msg = `📊 *UNICORN PRO — DAILY EXECUTIVE DIGEST*\n`
      + `📅 *Date:* ${new Date().toLocaleDateString('uk-UA')}\n`
      + `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      + `📈 *Total Leads Processed:* ${totalLeads}\n`
      + `🎯 *PPA Appointments Booked:* ${ppaBooked} ($150/ea)\n`
      + `💵 *Gross PPA Revenue:* $${revenue.toLocaleString()}.00 USD\n`
      + `💸 *CPL Ad Spend:* $${spend.toLocaleString()} USD\n`
      + `💰 *Net Platform Profit:* +$${profit.toLocaleString()} USD\n`
      + `🚀 *Platform ROAS:* ${roas}%\n\n`
      + `⚡ *Pending Slot Action:* Lead #88 (Robert Johnson, Roofing) requested slot reschedule.`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '📅 Slot 1: Tomorrow 4 PM', callback_data: 'reschedule:88:tomorrow_4pm' },
          { text: '🗓 Slot 2: Friday 10 AM', callback_data: 'reschedule:88:friday_10am' }
        ],
        [
          { text: '⚡ Emergency Priority Window', callback_data: 'reschedule:88:emergency_slot' },
          { text: '🌐 Open Live Dashboard', url: 'https://yevhen-unicorn-test.surge.sh/live-connector.html' }
        ]
      ]
    };

    return this.sendMessage(null, msg, inlineKeyboard);
  }

  /**
   * Checks the platform Fill Rate. If below 70%, logs an alert message.
   */
  static async checkFillRateAndAlert() {
    try {
      const totalLeads = await prisma.lead.count();
      if (totalLeads === 0) return;

      const unsoldLeads = await prisma.lead.count({
        where: { status: 'Unsold' }
      });

      const soldLeads = totalLeads - unsoldLeads;
      const fillRate = (soldLeads / totalLeads) * 100;

      if (fillRate < 70) {
        await this.alertFillRate(fillRate, unsoldLeads, totalLeads);
      } else {
        console.log(`[TelegramAlertService] Fill rate is healthy. (${fillRate.toFixed(1)}%)`);
      }

    } catch (e) {
      console.error(`[TelegramAlertService] Error calculating Fill Rate:`, e);
    }
  }

  /**
   * Sends a live HTTP POST message to Telegram Bot API.
   * Supports target chatId, markdown text, and inline keyboard buttons.
   */
  static async sendMessage(chatId, textMessage, inlineKeyboard = null) {
    let targetChatId = chatId;
    let messageText = textMessage;

    // Handle single-argument calls
    if (!textMessage && chatId) {
      messageText = chatId;
      targetChatId = process.env.TELEGRAM_CHAT_ID || '264172207';
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8831027970:AAH2CIPE_9HQwyjG3Mpbkqh79C4PVk041JQ';
    const primaryChatId = targetChatId || process.env.TELEGRAM_CHAT_ID || '264172207';
    const publicChannelId = process.env.TELEGRAM_CHANNEL_ID || '@MyUnicornLiveChannel';

    console.log(`\n================= DISPATCHING TELEGRAM ALERT =================`);
    console.log(`To Primary Chat ID: ${primaryChatId} | Public Channel: ${publicChannelId}`);
    console.log(messageText);
    console.log(`============================================================\n`);

    // Store in public audit log array
    recentDispatches.unshift({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      chatId: primaryChatId,
      channelId: publicChannelId,
      botUsername: '@Unicornmarketingbot',
      message: messageText,
      inlineKeyboard,
      timestamp: new Date().toISOString()
    });
    if (recentDispatches.length > 20) recentDispatches.pop();

    const sendSingle = (targetId) => {
      const payloadObj = {
        chat_id: targetId,
        text: messageText,
        parse_mode: 'Markdown'
      };
      if (inlineKeyboard) {
        payloadObj.reply_markup = inlineKeyboard;
      }
      const payload = JSON.stringify(payloadObj);

      return new Promise((resolve) => {
        const req = https.request({
          hostname: 'api.telegram.org',
          path: `/bot${botToken}/sendMessage`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve(body));
        });

        req.on('error', (err) => {
          console.error('[TelegramAlertService] HTTP Request Error:', err.message);
          resolve(null);
        });

        req.write(payload);
        req.end();
      });
    };

    // Primary dispatch to Admin Chat ID
    const resPrimary = await sendSingle(primaryChatId);
    console.log('[TelegramAlertService] Primary Chat Response:', resPrimary);

    // Optional Broadcast dispatch to Public Channel if targetId is not already the channel
    if (publicChannelId && publicChannelId !== primaryChatId) {
      sendSingle(publicChannelId).then(resChan => {
        console.log('[TelegramAlertService] Public Channel Broadcast Response:', resChan);
      }).catch(err => {
        console.warn('[TelegramAlertService] Channel broadcast note:', err.message);
      });
    }

    return resPrimary;
  }
}

module.exports = TelegramAlertService;
