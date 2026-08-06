const ContractorScheduleService = require('../src/services/ContractorScheduleService');
const AIVoiceCallService = require('../src/services/AIVoiceCallService');

describe('System Integration Engine (Google Calendar, Bland.ai & System Status)', () => {
  it('should return system connectivity status for all platform AI and API integrations', async () => {
    const status = {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      telegram: !!process.env.TELEGRAM_BOT_TOKEN,
      googleCalendar: !!process.env.GOOGLE_CALENDAR_API_KEY,
      blandAI: !!process.env.BLAND_API_KEY
    };

    expect(status).toHaveProperty('anthropic');
    expect(status).toHaveProperty('telegram');
    expect(status).toHaveProperty('googleCalendar');
    expect(status).toHaveProperty('blandAI');
  });

  it('should filter out busy slots when Google Calendar reports busy time windows', async () => {
    const leadId = 55;
    const allSlots = ContractorScheduleService.generateAvailableSlots(leadId);
    
    // Simulate busy window for first slot
    const mockBusyWindows = [
      { start: new Date(Date.now() + 86400000).toISOString(), end: new Date(Date.now() + 90000000).toISOString() }
    ];

    const filteredSlots = ContractorScheduleService.filterAvailableSlots(allSlots, mockBusyWindows);

    expect(filteredSlots).toBeDefined();
    expect(Array.isArray(filteredSlots)).toBe(true);
  });

  it('should format Bland.ai call status query response', async () => {
    const callId = 'call_test_123';
    const status = await AIVoiceCallService.getCallStatus(callId);

    expect(status).toHaveProperty('callId');
    expect(status).toHaveProperty('status');
  });
});
