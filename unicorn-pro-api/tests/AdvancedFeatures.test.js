const ContractorScheduleService = require('../src/services/ContractorScheduleService');
const BigQueryStreamService = require('../src/services/BigQueryStreamService');

describe('Advanced Features Engine: Calendar Sync & BigQuery ROAS Analytics', () => {
  it('should create a Google Calendar appointment event for contractor', async () => {
    const lead = {
      id: 14,
      name: 'Yevhen Verified Customer',
      phone: '+380991234567',
      serviceType: 'Roofing',
      zipCode: '90210',
      projectScope: 'Roof Repair Estimate'
    };

    const eventResult = await ContractorScheduleService.createCalendarEvent('contractor@pro-roofing.com', lead, 'Fri, Aug 7 @ 2:00 PM');

    expect(eventResult.success).toBe(true);
    expect(eventResult.eventId).toBeDefined();
    expect(eventResult.summary).toContain('Roofing Estimate');
    expect(eventResult.contractorEmail).toBe('contractor@pro-roofing.com');
  });

  it('should stream PPA conversion event to BigQuery data warehouse for ROAS tracking', async () => {
    const lead = {
      id: 14,
      serviceType: 'Roofing',
      zipCode: '90210',
      utmSource: 'google_ads',
      utmMedium: 'cpc',
      utmCampaign: 'roofing_ppa_search',
      adSpend: 25.00
    };

    const streamResult = await BigQueryStreamService.streamPpaConversionEvent(lead, 150.00, 'AI_VOICE_OUTBOUND');

    expect(streamResult.streamed).toBe(true);
    expect(streamResult.row.lead_id).toBe(14);
    expect(streamResult.row.ppa_revenue).toBe(150.00);
    expect(streamResult.row.ad_spend).toBe(25.00);
    expect(streamResult.row.roas_multiplier).toBe(6.0); // 150 / 25 = 6.0x ROAS
    expect(streamResult.row.conversion_channel).toBe('AI_VOICE_OUTBOUND');
  });
});
