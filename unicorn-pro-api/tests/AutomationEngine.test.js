const StripeService = require('../src/services/StripeService');
const AIVoiceCallService = require('../src/services/AIVoiceCallService');
const ContractorScheduleService = require('../src/services/ContractorScheduleService');

describe('Automation Engine: Zero-Touch Call & Stripe Auto-Debit', () => {
  it('should process Stripe PPA auto-debit for $150 on appointment confirmation', async () => {
    const debitResult = await StripeService.processPpaDebit(13, 150, 'Buyer #1 Roofing Pro');
    expect(debitResult.success).toBe(true);
    expect(debitResult.amount).toBe(150);
    expect(debitResult.leadId).toBe(13);
    expect(debitResult.status).toBe('succeeded');
    expect(debitResult.transactionId).toBeDefined();
  });

  it('should handle call webhook and invoke Stripe PPA debit', async () => {
    const webhookPayload = {
      leadId: 13,
      extractedSlot: 'Fri, Aug 7 @ 2:00 PM',
      userIntent: 'confirm_appointment',
      transcript: 'Customer confirmed for Friday 2 PM appointment.'
    };

    const webhookResult = await AIVoiceCallService.handleCallWebhook(webhookPayload);
    expect(webhookResult.success).toBe(true);
    expect(webhookResult.stripeDebit).toBeDefined();
    expect(webhookResult.stripeDebit.success).toBe(true);
    expect(webhookResult.stripeDebit.amount).toBe(150);
  });
});
