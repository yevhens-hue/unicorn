class StripeService {
  /**
   * Mocks a Stripe Checkout Session creation.
   * @param {number} buyerId 
   * @param {number} amount 
   * @returns {Promise<string>} A mock URL representing the Stripe Checkout page
   */
  static async createCheckoutSession(buyerId, amount) {
    console.log(`[StripeService] Creating checkout session for Buyer ${buyerId} for amount $${amount}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Return a mock URL
    return `https://checkout.stripe.com/pay/mock_session_req_b${buyerId}_amt${amount}`;
  }

  /**
   * Mocks handling a webhook event from Stripe.
   * @param {Object} event 
   * @returns {boolean} true if handled successfully
   */
  static async handleWebhook(event) {
    console.log(`[StripeService] Handling Webhook Event: ${event.type}`);
    
    if (event.type === 'checkout.session.completed') {
      console.log(`[StripeService] Payment successful for Buyer ${event.data.buyerId}, Amount: $${event.data.amount}`);
      return true;
    }
    return false;
  }
    
  /**
   * Processes automatic Stripe PPA debit ($150) from winning contractor wallet on appointment confirmation.
   * 
   * @param {number} leadId 
   * @param {number} amount 
   * @param {string} buyerName 
   * @returns {Promise<{success: boolean, leadId: number, amount: number, transactionId: string, status: string, timestamp: string}>}
   */
  static async processPpaDebit(leadId, amount = 150, buyerName = 'Primary Winning Contractor') {
    const transactionId = `txn_ppa_${Date.now()}_lead${leadId}`;
    console.log(`\n================= STRIPE AUTOMATIC PPA DEBIT =================`);
    console.log(`Lead ID: #${leadId}`);
    console.log(`Amount Debited: $${amount}.00 USD`);
    console.log(`Debited Contractor: ${buyerName}`);
    console.log(`Transaction ID: ${transactionId}`);
    console.log(`Status: SUCCEEDED`);
    console.log(`=================================================================\n`);

    return {
      success: true,
      leadId,
      amount,
      buyerName,
      transactionId,
      status: 'succeeded',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = StripeService;
