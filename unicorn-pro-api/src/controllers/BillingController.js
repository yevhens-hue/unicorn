const StripeService = require('../services/StripeService');
const prisma = require('../lib/prisma');

class BillingController {
  
  /**
   * Generates a checkout session for adding funds.
   */
  static async topUp(req, res) {
    const buyerId = req.buyerId;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    
    try {
      const url = await StripeService.createCheckoutSession(buyerId, amount);
      return res.status(200).json({ checkoutUrl: url, amount });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to create checkout session" });
    }
  }

  /**
   * Webhook to receive payment success from Stripe (Mocked).
   */
  static async webhook(req, res) {
    const event = req.body; // In real life, verify Stripe signature first
    
    try {
      const handled = await StripeService.handleWebhook(event);
      
      if (handled && event.type === 'checkout.session.completed') {
        const { buyerId, amount } = event.data;
        
        // Update balance in DB
        await prisma.buyer.update({
          where: { id: parseInt(buyerId) },
          data: { balance: { increment: parseFloat(amount) } }
        });
      }
      
      return res.status(200).json({ received: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Webhook error" });
    }
  }
}

module.exports = BillingController;
