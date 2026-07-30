const PingPostService = require('../src/services/PingPostService');

describe('PingPostService (Second-Price Vickrey Auction)', () => {
  let campaigns;
  let buyer;

  beforeEach(() => {
    buyer = { id: 1, name: 'Test Buyer', balance: 100 };
    campaigns = [
      { id: 1, buyerId: 1, vertical: 'HVAC', zipCodes: 'all', leadType: 'Exclusive', maxBid: 50, isActive: true, buyer },
      { id: 2, buyerId: 1, vertical: 'HVAC', zipCodes: 'all', leadType: 'Shared', maxBid: 20, isActive: true, buyer },
      { id: 3, buyerId: 1, vertical: 'HVAC', zipCodes: 'all', leadType: 'Shared', maxBid: 15, isActive: true, buyer },
      { id: 4, buyerId: 1, vertical: 'HVAC', zipCodes: 'all', leadType: 'Shared', maxBid: 10, isActive: true, buyer },
    ];
  });

  it('should choose Exclusive if its bid is greater than the sum of up to 4 top Shared bids', () => {
    const lead = { serviceType: 'HVAC', zipCode: '10001', urgency: 'This Week' };
    
    // Sum of shared = 20 + 15 + 10 = 45. Exclusive is 50. 50 > 45.
    const result = PingPostService.processAuction(lead, campaigns);
    
    expect(result.status).toBe('Exclusive');
    expect(result.winners.length).toBe(1);
    expect(result.winners[0].id).toBe(1);
    expect(result.auctionType).toContain('Second-Price');
  });

  it('should calculate Vickrey Second-Price clearing price correctly for exclusive auction with 2 bidders', () => {
    const buyer2 = { id: 2, name: 'Buyer B', balance: 100 };
    const twoExclusiveCampaigns = [
      { id: 1, buyerId: 1, vertical: 'HVAC', zipCodes: 'all', leadType: 'Exclusive', maxBid: 90, isActive: true, buyer },
      { id: 2, buyerId: 2, vertical: 'HVAC', zipCodes: 'all', leadType: 'Exclusive', maxBid: 60, isActive: true, buyer: buyer2 },
    ];

    const lead = { serviceType: 'HVAC', zipCode: '10001', urgency: 'This Week' };
    const result = PingPostService.processAuction(lead, twoExclusiveCampaigns);

    expect(result.status).toBe('Exclusive');
    expect(result.winners[0].id).toBe(1);
    expect(result.winners[0].submittedBid).toBe(90);
    // Winner 1 pays second price ($60 + $0.01 = $60.01)
    expect(result.winners[0].clearedPrice).toBe(60.01);
  });

  it('should choose Shared if the sum of top Shared bids is greater than the Exclusive bid', () => {
    campaigns[2].maxBid = 25; // Shared sum = 20 + 25 + 10 = 55. 55 > 50.
    
    const lead = { serviceType: 'HVAC', zipCode: '10001', urgency: 'This Week' };
    const result = PingPostService.processAuction(lead, campaigns);
    
    expect(result.status).toBe('Shared');
    expect(result.winners.length).toBe(3);
  });

  it('should calculate Vickrey Second-Price for shared auction bidders with floor reserve', () => {
    // 3 shared bidders: $30, $20, $10 with default floor reserve $15
    const sharedCampaigns = [
      { id: 1, buyerId: 1, vertical: 'HVAC', zipCodes: 'all', leadType: 'Shared', maxBid: 30, isActive: true, buyer },
      { id: 2, buyerId: 1, vertical: 'HVAC', zipCodes: 'all', leadType: 'Shared', maxBid: 20, isActive: true, buyer },
      { id: 3, buyerId: 1, vertical: 'HVAC', zipCodes: 'all', leadType: 'Shared', maxBid: 10, isActive: true, buyer },
    ];

    const lead = { serviceType: 'HVAC', zipCode: '10001', urgency: 'This Week' };
    const result = PingPostService.processAuction(lead, sharedCampaigns);

    expect(result.status).toBe('Shared');
    expect(result.winners[0].clearedPrice).toBe(20.01); // $30 cleared at runner-up $20 + $0.01
    expect(result.winners[1].clearedPrice).toBe(15.00); // $20 cleared at runner-up $10.01, bounded by floor reserve $15.00
    expect(result.winners[2].clearedPrice).toBe(15.00); // $10 cleared at floor reserve $15.00
  });

  it('should return Unsold if no matching campaigns are active', () => {
    const lead = { serviceType: 'Solar', zipCode: '10001', urgency: 'This Week' };
    const result = PingPostService.processAuction(lead, campaigns);
    
    expect(result.status).toBe('Unsold');
    expect(result.winners.length).toBe(0);
  });

  it('should ignore campaigns if buyer has insufficient balance', () => {
    buyer.balance = 15;
    const lead = { serviceType: 'HVAC', zipCode: '10001', urgency: 'This Week' };
    
    const result = PingPostService.processAuction(lead, campaigns);
    expect(result.status).toBe('Shared');
    expect(result.winners.length).toBe(2);
    expect(result.winners[0].id).toBe(3);
    expect(result.winners[1].id).toBe(4);
  });

  it('should execute Waterfall Cascading fallback to Buyer #2 when Buyer #1 rejects or times out', async () => {
    const buyer1 = { id: 1, name: 'Buyer 1', balance: 100 };
    const buyer2 = { id: 2, name: 'Buyer 2', balance: 100 };

    const twoExclusiveCampaigns = [
      { id: 1, buyerId: 1, vertical: 'HVAC', zipCodes: 'all', leadType: 'Exclusive', maxBid: 90, isActive: true, buyer: buyer1, simulatesRejection: true, rejectionReason: 'Timeout >2000ms' },
      { id: 2, buyerId: 2, vertical: 'HVAC', zipCodes: 'all', leadType: 'Exclusive', maxBid: 60, isActive: true, buyer: buyer2 },
    ];

    const lead = { serviceType: 'HVAC', zipCode: '10001', urgency: 'This Week' };
    const rawResult = PingPostService.processAuction(lead, twoExclusiveCampaigns);

    const finalResult = await PingPostService.executeWaterfallPost(lead, rawResult);

    // Buyer #1 failed -> Waterfall cascaded to Buyer #2
    expect(finalResult.status).toBe('Exclusive');
    expect(finalResult.winners.length).toBe(1);
    expect(finalResult.winners[0].id).toBe(2);
    expect(finalResult.winners[0].buyerId).toBe(2);
    expect(finalResult.waterfallLogs.length).toBe(2);
    expect(finalResult.waterfallLogs[0].status).toBe('Cascaded_Fallback');
    expect(finalResult.waterfallLogs[1].status).toBe('Accepted');
  });
});
