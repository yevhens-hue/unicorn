const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TelegramAlertService {
  /**
   * Calculates the Fill Rate (sold / total * 100) and sends a Telegram alert
   * if the rate drops below 70%. (Mocked API call)
   */
  static async checkFillRateAndAlert() {
    try {
      console.log(`[TelegramAlertService] Checking Fill Rate...`);
      
      // Calculate total leads and unsold leads
      const [totalLeads, unsoldLeads] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: 'Unsold' } })
      ]);

      if (totalLeads === 0) {
        console.log(`[TelegramAlertService] No leads found. Skipping alert.`);
        return;
      }

      const soldLeads = totalLeads - unsoldLeads;
      const fillRate = (soldLeads / totalLeads) * 100;
      
      console.log(`[TelegramAlertService] Current Fill Rate: ${fillRate.toFixed(2)}% (${soldLeads}/${totalLeads})`);

      if (fillRate < 70) {
        // Send alert
        const message = `🚨 *URGENT:* Platform Fill Rate dropped below 70%!\n\n`
          + `*Current Rate:* ${fillRate.toFixed(2)}%\n`
          + `*Unsold Leads:* ${unsoldLeads}\n`
          + `*Total Leads:* ${totalLeads}\n\n`
          + `_Action Required:_ Check buyer coverage and floor prices.`;
          
        await this.sendMessage(message);
      } else {
        console.log(`[TelegramAlertService] Fill rate is healthy. No alert needed.`);
      }

    } catch (e) {
      console.error(`[TelegramAlertService] Error calculating Fill Rate:`, e);
    }
  }

  /**
   * Mocks sending a message to Telegram via Bot API.
   * @param {string} message 
   */
  static async sendMessage(message) {
    // In real life: axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id, text: message })
    console.log(`\n================= TELEGRAM ALERT =================`);
    console.log(message);
    console.log(`==================================================\n`);
  }
}

module.exports = TelegramAlertService;
