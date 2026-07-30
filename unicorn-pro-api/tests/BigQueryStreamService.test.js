const BigQueryStreamService = require('../src/services/BigQueryStreamService');

describe('BigQueryStreamService', () => {
  const sampleLead = {
    id: 99,
    serviceType: 'HVAC',
    zipCode: '90210',
    leadType: 'PPA_ONLINE',
    utmSource: 'facebook',
    utmMedium: 'cpc',
    utmCampaign: 'hvac_emergency_v1',
    subId: 'fb_buyer_unit_01',
    adSpend: 18.50
  };

  const sampleAuctionResult = {
    status: 'Exclusive',
    winners: [
      { buyerId: 10, maxBid: 90, clearedPrice: 60.01, submittedBid: 90 }
    ],
    waterfallLogs: [{ buyerId: 10, status: 'Accepted' }]
  };

  test('formatAuctionEventRow formats row correctly for BigQuery Streaming table', () => {
    const row = BigQueryStreamService.formatAuctionEventRow(sampleLead, sampleAuctionResult);

    expect(row.event_id).toContain('evt_');
    expect(row.lead_id).toBe(99);
    expect(row.service_type).toBe('HVAC');
    expect(row.utm_source).toBe('facebook');
    expect(row.sub_id).toBe('fb_buyer_unit_01');
    expect(row.submitted_max_bid).toBe(90);
    expect(row.cleared_price).toBe(60.01);
    expect(row.ad_spend).toBe(18.50);
    expect(row.net_margin).toBe(41.51); // 60.01 - 18.50 = 41.51
    expect(row.platform_fee).toBe(9.00); // 15% of 60.01 rounded = 9.00
  });

  test('streamAuctionEvent returns simulated stream result when BigQuery creds not configured', async () => {
    const result = await BigQueryStreamService.streamAuctionEvent(sampleLead, sampleAuctionResult);

    expect(result.streamed).toBe(true);
    expect(result.row).toBeDefined();
    expect(result.row.cleared_price).toBe(60.01);
  });
});
