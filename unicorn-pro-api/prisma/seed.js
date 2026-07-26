const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.leadPurchase.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.buyer.deleteMany();

  // Create buyers (contractors)
  const buyer1 = await prisma.buyer.create({
    data: {
      name: 'HVAC Masters LLC',
      email: 'demo@hvacmasters.com',
      password: 'demo1234',
      balance: 500.00,
    }
  });

  const buyer2 = await prisma.buyer.create({
    data: {
      name: 'CoolBreeze Services',
      email: 'demo@coolbreeze.com',
      password: 'demo1234',
      balance: 300.00,
    }
  });

  const buyer3 = await prisma.buyer.create({
    data: {
      name: 'ProRoof Solutions',
      email: 'demo@proroof.com',
      password: 'demo1234',
      balance: 750.00,
    }
  });

  // Create campaigns
  await prisma.campaign.createMany({
    data: [
      { buyerId: buyer1.id, name: 'HVAC Florida', vertical: 'HVAC', zipCodes: 'all', leadType: 'Both', maxBid: 85.00, dailyLimit: 10 },
      { buyerId: buyer1.id, name: 'Emergency Only', vertical: 'HVAC', zipCodes: '33101,33102,33103', leadType: 'Exclusive', maxBid: 120.00, dailyLimit: 5 },
      { buyerId: buyer2.id, name: 'CoolBreeze Miami', vertical: 'HVAC', zipCodes: 'all', leadType: 'Shared', maxBid: 60.00, dailyLimit: 20 },
      { buyerId: buyer3.id, name: 'Roofing National', vertical: 'Roofing', zipCodes: 'all', leadType: 'Both', maxBid: 95.00, dailyLimit: 15 },
    ]
  });

  // Create sample leads
  const lead1 = await prisma.lead.create({
    data: {
      serviceType: 'AC Repair', zipCode: '33101', propertyType: 'Residential',
      isOwner: true, urgency: 'Emergency', name: 'Maria Gonzalez',
      phone: '(305) 555-1234', email: 'maria@example.com', tcpa: true, status: 'Exclusive'
    }
  });

  const lead2 = await prisma.lead.create({
    data: {
      serviceType: 'Heating Install', zipCode: '33102', propertyType: 'Residential',
      isOwner: true, urgency: 'This Week', name: 'John Smith',
      phone: '(305) 555-5678', email: 'john@example.com', tcpa: true, status: 'Shared'
    }
  });

  // Create sample purchases
  await prisma.leadPurchase.create({ data: { leadId: lead1.id, buyerId: buyer1.id, price: 120.00, status: 'active' } });
  await prisma.leadPurchase.create({ data: { leadId: lead2.id, buyerId: buyer1.id, price: 51.00, status: 'active' } });
  await prisma.leadPurchase.create({ data: { leadId: lead2.id, buyerId: buyer2.id, price: 36.00, status: 'active' } });

  // Update balances
  await prisma.buyer.update({ where: { id: buyer1.id }, data: { balance: { decrement: 171.00 } } });
  await prisma.buyer.update({ where: { id: buyer2.id }, data: { balance: { decrement: 36.00 } } });

  console.log('Seed complete!');
  console.log('Demo logins:');
  console.log('  Email: demo@hvacmasters.com  Password: demo1234  (Balance: $329)');
  console.log('  Email: demo@coolbreeze.com   Password: demo1234  (Balance: $264)');
  console.log('  Email: demo@proroof.com      Password: demo1234  (Balance: $750)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
