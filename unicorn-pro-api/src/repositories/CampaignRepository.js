const prisma = require('../lib/prisma');

/**
 * @typedef {import('../types').Campaign} Campaign
 */

class CampaignRepository {
  /**
   * Fetch active campaigns matching a given vertical and zip code.
   * @param {string} vertical 
   * @param {string} zipCode 
   * @returns {Promise<Campaign[]>}
   */
  static async getActiveMatchingCampaigns(vertical, zipCode) {
    return prisma.campaign.findMany({
      where: {
        isActive: true,
        OR: [
          { vertical: vertical },
          { zipCodes: 'all' },
          { zipCodes: { contains: zipCode } }
        ]
      },
      include: { buyer: true }
    });
  }
}

module.exports = CampaignRepository;
