/**
 * @typedef {import('../types').Lead} Lead
 * @typedef {import('../types').Campaign} Campaign
 * @typedef {import('../types').AuctionResult} AuctionResult
 */

class PingPostService {
  /**
   * Calculate the dynamic quality factor of a lead.
   * Emergency urgency increases the bid value multiplier.
   * 
   * @param {Lead} lead - The incoming lead
   * @returns {number} The quality multiplier (e.g., 1.5 for Emergency)
   */
  static calculateQualityFactor(lead) {
    let factor = 1.0;
    if (lead.urgency === 'Emergency') factor += 0.5;
    // can add more rules based on zipCode matching etc.
    return factor;
  }

  /**
   * Process the ping-post auction for a given lead against active campaigns.
   * 
   * @param {Lead} lead - The lead to process
   * @param {Campaign[]} activeCampaigns - List of all active campaigns
   * @returns {AuctionResult} The result of the auction
   */
  static processAuction(lead, activeCampaigns) {
    const qFactor = this.calculateQualityFactor(lead);

    // 1. Filter eligible campaigns
    const eligible = activeCampaigns.filter(c => {
      // Must match vertical or serviceType
      if (c.vertical !== lead.vertical && c.vertical !== lead.serviceType) return false;
      // Must match ZIP (or 'all')
      if (c.zipCodes !== 'all' && !c.zipCodes.includes(lead.zipCode)) return false;
      // Buyer must have enough balance to cover their bid
      if (c.buyer && c.buyer.balance < c.maxBid) return false;
      return true;
    });

    if (eligible.length === 0) {
      return { status: 'Unsold', winners: [], maxExclusiveBid: 0, topSharedSum: 0 };
    }

    // 2. Separate Exclusive and Shared, applying quality factor to bids
    const exclusive = eligible.filter(c => c.leadType === 'Exclusive' || c.leadType === 'Both')
      .sort((a, b) => (b.maxBid * qFactor) - (a.maxBid * qFactor));
    
    const shared = eligible.filter(c => c.leadType === 'Shared' || c.leadType === 'Both')
      .sort((a, b) => (b.maxBid * qFactor) - (a.maxBid * qFactor));

    // 3. Find top exclusive bid
    const topExclusive = exclusive.length > 0 ? exclusive[0] : null;
    const maxExclusiveBid = topExclusive ? topExclusive.maxBid * qFactor : 0;

    // 4. Calculate sum of top 4 shared bids
    const topShared = shared.slice(0, 4);
    const topSharedSum = topShared.reduce((sum, c) => sum + (c.maxBid * qFactor), 0);

    // 5. Compare and decide winner
    if (topExclusive && maxExclusiveBid >= topSharedSum) {
      return {
        status: 'Exclusive',
        winners: [topExclusive],
        maxExclusiveBid,
        topSharedSum
      };
    } else if (topShared.length > 0) {
      return {
        status: 'Shared',
        winners: topShared,
        maxExclusiveBid,
        topSharedSum
      };
    }

    return { status: 'Unsold', winners: [], maxExclusiveBid: 0, topSharedSum: 0 };
  }
}

module.exports = PingPostService;
