const AggregatorSyndicationService = require('../src/services/AggregatorSyndicationService');

describe('AggregatorSyndicationService (National Aggregator API Syndication)', () => {
  it('should post lead via Ping-Post API to QuinStreet and receive accepted payout', async () => {
    const leadData = {
      serviceType: 'Roofing',
      zipCode: '75001',
      name: 'Dallas Homeowner',
      phone: '+14155552671',
      email: 'dallas@example.com',
      tcpa: true
    };

    const res = await AggregatorSyndicationService.postToAggregatorNetwork('QuinStreet', leadData);

    expect(res.accepted).toBe(true);
    expect(res.payout).toBeGreaterThan(0);
    expect(res.network).toBe('QuinStreet');
  });

  it('should execute national waterfall fallback across all aggregators', async () => {
    const leadData = {
      serviceType: 'HVAC',
      zipCode: '90210',
      name: 'Beverly Hills Owner',
      phone: '+14155552672',
      email: 'beverly@example.com',
      tcpa: true
    };

    const fallbackRes = await AggregatorSyndicationService.executeNationalWaterfallFallback(leadData);

    expect(fallbackRes.accepted).toBe(true);
    expect(fallbackRes.payout).toBeGreaterThanOrEqual(25.00);
  });
});
