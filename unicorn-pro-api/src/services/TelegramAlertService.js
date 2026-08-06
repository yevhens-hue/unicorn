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
        const message = `🚨 *URGENT:* Platform Fill Rate dropped below 70%!\n\n`
          + `*Current Rate:* ${fillRate.toFixed(2)}%\n`
          + `*Unsold Leads:* ${unsoldLeads}\n`
          + `*Total Leads:* ${totalLeads}\n\n`
          + `_Action Required:_ Check buyer coverage and floor prices.`;
          
        await this.sendMessage(process.env.TELEGRAM_CHAT_ID || '264172207', message);
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
    const publicChannelId = process.env.TELEGRAM_CHANNEL_ID || '@UnicornProLiveAlerts';

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
