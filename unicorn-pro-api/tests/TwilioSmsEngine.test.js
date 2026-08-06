const TwilioService = require('../src/services/TwilioService');
const AIVoiceCallService = require('../src/services/AIVoiceCallService');

describe('Twilio SMS & WhatsApp Confirmation Engine', () => {
  it('should format and dispatch SMS confirmation with quick-reply 1/2 instructions', async () => {
    const lead = {
      id: 14,
      name: 'Yevhen Test Customer',
      phone: '+380991234567',
      serviceType: 'Roofing'
    };

    const smsResult = await TwilioService.sendAppointmentSmsConfirmation(lead, 'Fri, Aug 7 @ 2:00 PM', 'ProRoofing Solutions');

    expect(smsResult.success).toBe(true);
    expect(smsResult.messageSid).toBeDefined();
    expect(smsResult.recipientPhone).toBe('+380991234567');
    expect(smsResult.textBody).toContain('Fri, Aug 7 @ 2:00 PM');
    expect(smsResult.textBody).toContain('Reply "1" to Confirm or "2" to Reschedule');
  });

  it('should include SMS confirmation dispatch when handling voice webhook confirmation', async () => {
    const payload = {
      leadId: 14,
      extractedSlot: 'Fri, Aug 7 @ 2:00 PM',
      userIntent: 'Confirmed',
      transcript: 'Customer confirmed appointment.'
    };

    const webhookResult = await AIVoiceCallService.handleCallWebhook(payload);

    expect(webhookResult.success).toBe(true);
    expect(webhookResult.smsConfirmation).toBeDefined();
    expect(webhookResult.smsConfirmation.success).toBe(true);
    expect(webhookResult.smsConfirmation.textBody).toContain('Reply "1" to Confirm');
  });
});
