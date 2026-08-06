const AIVoiceCallService = require('../src/services/AIVoiceCallService');

describe('AIVoiceCallService (AI Voice Outbound Booker Agent)', () => {
  it('should generate a natural personalized AI Voice Call prompt script', () => {
    const lead = {
      id: 77,
      name: 'Michael Jordan',
      serviceType: 'Roofing',
      zipCode: '90210',
      urgency: 'Emergency'
    };

    const prompt = AIVoiceCallService.generateCallPrompt(lead);

    expect(prompt).toContain('Michael Jordan');
    expect(prompt).toContain('Roofing');
    expect(prompt).toContain('90210');
    expect(prompt).toContain('confirm your estimate appointment');
  });

  it('should trigger outbound AI voice call dispatch', async () => {
    const lead = {
      id: 77,
      name: 'Michael Jordan',
      phone: '+15550199',
      serviceType: 'Roofing',
      zipCode: '90210'
    };

    const callResult = await AIVoiceCallService.initiateOutboundCall(lead);

    expect(callResult).toHaveProperty('callId');
    expect(callResult.recipientPhone).toBe('+15550199');
  }, 15000);

  it('should block outbound AI voice call if TCPA consent is explicitly missing', async () => {
    const leadWithoutTcpa = {
      id: 88,
      name: 'John Doe',
      phone: '+15550199',
      serviceType: 'Roofing',
      tcpa: false
    };

    const callResult = await AIVoiceCallService.initiateOutboundCall(leadWithoutTcpa);

    expect(callResult.success).toBe(false);
    expect(callResult.error).toBe('TCPA_CONSENT_MISSING');
  });

  it('should handle AI voice call webhook, extract confirmed appointment, and update lead to PPA_CALLCENTER', async () => {
    const webhookPayload = {
      callId: 'call_live_77',
      leadId: 11, // Lead #11 in database
      status: 'completed',
      transcript: 'Customer confirmed appointment for Tomorrow 2 PM after discussing estimate scope',
      extractedSlot: 'Tomorrow 2 PM',
      userIntent: 'Confirmed'
    };

    const result = await AIVoiceCallService.handleCallWebhook(webhookPayload);

    expect(result.success).toBe(true);
    expect(result.lead.appointmentStatus).toBe('Confirmed');
    expect(result.lead.leadType).toBe('PPA_CALLCENTER');
    expect(result.message).toContain('AI Voice Call Completed');
  });
});
