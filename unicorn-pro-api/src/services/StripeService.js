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
}

module.exports = StripeService;
