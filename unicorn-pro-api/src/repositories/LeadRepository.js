const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class LeadRepository {
  /**
   * Save an unsold lead.
   * @param {Object} leadData
   * @returns {Promise<Object>}
   */
  static async saveUnsoldLead(leadData) {
    return prisma.lead.create({
      data: { ...leadData, status: 'Unsold' }
    });
  }

  /**
   * Save a sold lead and execute billing transactions atomically using Second-Price cleared prices.
   * @param {Object} leadData 
   * @param {import('../types').Campaign[]} winners 
   * @param {string} status 'Exclusive' or 'Shared'
   * @returns {Promise<Object>} The created lead
   */
  static async saveSoldLeadWithTransactions(leadData, winners, status) {
    return prisma.$transaction(async (tx) => {
      // 1. Create the lead
      const newLead = await tx.lead.create({
        data: { ...leadData, status }
      });

      // 2. Process each winner with its clearedPrice (Vickrey Second-Price)
      for (const campaign of winners) {
        // Use second-price cleared price if available, fallback to maxBid
        const chargePrice = campaign.clearedPrice !== undefined ? campaign.clearedPrice : campaign.maxBid;

        // a. Deduct balance using chargePrice
        await tx.buyer.update({
          where: { id: campaign.buyerId },
          data: { balance: { decrement: chargePrice } }
        });

        // b. Double check if balance dropped below 0
        const updatedBuyer = await tx.buyer.findUnique({
          where: { id: campaign.buyerId }
        });

        if (updatedBuyer.balance < 0) {
          throw new Error(`Insufficient funds for buyer ${campaign.buyerId} during transaction`);
        }

        // c. Create Purchase record with the actual second-price charged
        await tx.leadPurchase.create({
          data: {
            leadId: newLead.id,
            buyerId: campaign.buyerId,
            price: chargePrice
          }
        });
      }

      return newLead;
    });
  }
}

module.exports = LeadRepository;
