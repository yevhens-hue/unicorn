const request = require('supertest');
const app = require('../index'); // The express app

jest.mock('../src/repositories/CampaignRepository', () => ({
  getActiveMatchingCampaigns: jest.fn().mockResolvedValue([
    {
      id: 1,
      vertical: 'HVAC',
      zipCodes: 'all',
      leadType: 'Exclusive',
      maxBid: 50,
      isActive: true,
      buyer: { id: 1, name: 'Buyer A', balance: 100 }
    }
  ])
}));

jest.mock('../src/repositories/LeadRepository', () => ({
  saveUnsoldLead: jest.fn().mockResolvedValue({ id: 1 }),
  saveSoldLeadWithTransactions: jest.fn().mockResolvedValue({ id: 1 })
}));

describe('POST /api/leads', () => {
  it('should return 201 and auction result when lead is submitted', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({
        name: 'John Doe',
        phone: '1234567890',
        email: 'test@example.com',
        serviceType: 'HVAC',
        zipCode: '10001',
        urgency: 'This Week',
        address: '123 Main St',
        tcpa: true
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.auctionResult).toBeDefined();
    expect(res.body.auctionResult.status).toBe('Exclusive');
  });

  it('should return 400 if validation fails', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({
        firstName: 'John'
        // missing required fields
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
