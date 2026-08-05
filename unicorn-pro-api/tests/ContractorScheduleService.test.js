const ContractorScheduleService = require('../src/services/ContractorScheduleService');

describe('ContractorScheduleService (Dynamic Scheduling & Calendar Engine)', () => {
  it('should generate dynamic available slots starting from tomorrow', () => {
    const leadId = 42;
    const slots = ContractorScheduleService.generateAvailableSlots(leadId);

    expect(slots.length).toBeGreaterThanOrEqual(3);
    
    // First slot should be tomorrow morning
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expectedMonth = tomorrow.toLocaleDateString('en-US', { month: 'short' });

    expect(slots[0].label).toContain(expectedMonth);
    expect(slots[0].callbackData).toContain('reschedule_slot:42:');
  });

  it('should structure interactive Telegram inline keyboard buttons with real dates', () => {
    const leadId = 100;
    const keyboard = ContractorScheduleService.getInteractiveSlotButtons(leadId);

    expect(keyboard).toHaveProperty('inline_keyboard');
    expect(keyboard.inline_keyboard.length).toBe(2); // 2 rows of buttons
    expect(keyboard.inline_keyboard[0][0].callback_data).toContain('reschedule_slot:100:');
    expect(keyboard.inline_keyboard[1][1].callback_data).toBe('approve_ppa:100');
  });

  it('should perform Google Calendar availability check fallback', async () => {
    const availability = await ContractorScheduleService.checkGoogleCalendarAvailability(
      'contractor@example.com',
      new Date(),
      new Date(Date.now() + 86400000)
    );

    expect(availability).toHaveProperty('provider');
    expect(availability.provider).toBe('GoogleCalendar');
    expect(availability).toHaveProperty('isAvailable');
  });
});
