const AIAgentService = require('../src/services/AIAgentService');

describe('AIAgentService (Chief of Staff AI Engine)', () => {
  it('should correctly qualify a high-value emergency roofing lead and trigger manual approval', async () => {
    const lead = {
      name: 'Connor McDavid',
      serviceType: 'Roofing',
      zipCode: '90210',
      projectScope: 'Full roof replacement with solar panels',
      urgency: 'Emergency',
      timeframe: 'Immediate (24-48 hours)',
      isOwner: true
    };

    const qual = await AIAgentService.qualifyLead(lead);

    expect(qual.category).toBe('Roofing');
    expect(qual.priority).toBe(1);
    expect(qual.estimatedBudget).toBeGreaterThanOrEqual(10000);
    expect(qual.needsApproval).toBe(true);
    expect(qual.reasons.length).toBeGreaterThan(0);
  });

  it('should qualify a standard HVAC repair lead without requiring manual approval', async () => {
    const lead = {
      name: 'John Doe',
      serviceType: 'HVAC',
      zipCode: '33102',
      projectScope: 'AC maintenance check',
      urgency: 'Standard',
      timeframe: 'Next 2 weeks',
      isOwner: true
    };

    const qual = await AIAgentService.qualifyLead(lead);

    expect(qual.category).toBe('HVAC');
    expect(qual.priority).toBe(2);
    expect(qual.estimatedBudget).toBeLessThan(10000);
    expect(qual.needsApproval).toBe(false);
  });

  it('should generate an executive daily digest briefing containing key platform metrics', async () => {
    const digest = await AIAgentService.generateDailyDigest();

    expect(digest).toHaveProperty('digest');
    expect(digest.digest).toContain('UNICORN CHIEF OF STAFF');
    expect(digest.digest).toContain('PERFORMANCE METRICS');
    expect(digest).toHaveProperty('metrics');
    expect(digest.metrics).toHaveProperty('totalRevenue');
    expect(digest.metrics).toHaveProperty('fillRate');
  });

  it('should format Telegram approval card with inline keyboard buttons', async () => {
    const lead = { id: 9942, name: 'Alice Smith', phone: '555-0199', zipCode: '90210', serviceType: 'Roofing', urgency: 'Emergency' };
    const qualification = { estimatedBudget: 15000, reasons: ['Estimated budget $15,000 >= $10,000'] };

    const card = await AIAgentService.sendTelegramApprovalCard(lead, qualification);

    expect(card.message).toContain('APPROVAL REQUIRED');
    expect(card.message).toContain('Alice Smith');
    expect(card.inlineKeyboard.inline_keyboard[0][0].callback_data).toBe('approve_ppa:9942');
  });

  it('should handle Telegram webhook callbacks for approve_ppa', async () => {
    const update = {
      callback_query: {
        data: 'approve_ppa:11'
      }
    };

    const response = await AIAgentService.handleTelegramWebhook(update);

    expect(response.success).toBe(true);
    expect(response.message).toContain('Lead #11 approved');
  });
});
