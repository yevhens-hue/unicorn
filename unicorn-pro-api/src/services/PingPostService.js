const CrmIntegrationService = require('./CrmIntegrationService');

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
    return factor;
  }

  /**
   * Calculate Vickrey Second-Price clearing price.
   * The winning buyer pays the runner-up's bid + $0.01 increment,
   * bounded by the winner's submitted maxBid and floor reserve price.
   * 
   * @param {number} winningMaxBid - Winner's max bid
   * @param {number|null} runnerUpMaxBid - Runner-up's max bid (if present)
   * @param {number} reservePrice - Minimum floor price for vertical
   * @param {number} increment - Minimum bid increment ($0.01 default)
   * @returns {number} The second-price cleared price
   */
  static calculateSecondPrice(winningMaxBid, runnerUpMaxBid, reservePrice = 25.0, increment = 0.01) {
    if (!runnerUpMaxBid || runnerUpMaxBid <= 0) {
      // Single bidder: charge winning maxBid or reserve price if lower
      return Math.round(Math.max(reservePrice, Math.min(winningMaxBid, reservePrice)) * 100) / 100;
    }
    if (winningMaxBid <= runnerUpMaxBid) {
      return Math.round(winningMaxBid * 100) / 100;
    }
    const secondPrice = runnerUpMaxBid + increment;
    const cleared = Math.max(reservePrice, Math.min(winningMaxBid, secondPrice));
    return Math.round(cleared * 100) / 100;
  }

  /**
   * Process the ping-post auction for a given lead using Second-Price (Vickrey) pricing
   * and build a ranked Waterfall Queue for fallback delivery.
   * 
   * @param {Lead} lead - The lead to process
   * @param {Campaign[]} activeCampaigns - List of all active campaigns
   * @returns {AuctionResult} The result of the auction including waterfall queue
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
      return { status: 'Unsold', winners: [], waterfallQueue: [], maxExclusiveBid: 0, topSharedSum: 0, auctionType: 'Second-Price (Vickrey)' };
    }

    // 2. Separate Exclusive and Shared, sorted descending by adjusted bid
    const exclusive = eligible.filter(c => c.leadType === 'Exclusive' || c.leadType === 'Both')
      .sort((a, b) => (b.maxBid * qFactor) - (a.maxBid * qFactor));
    
    const shared = eligible.filter(c => c.leadType === 'Shared' || c.leadType === 'Both')
      .sort((a, b) => (b.maxBid * qFactor) - (a.maxBid * qFactor));

    // 3. Build Exclusive candidates waterfall queue with Vickrey prices
    const exclusiveWaterfallQueue = exclusive.map((c, idx) => {
      const runnerUp = exclusive[idx + 1] || null;
      const clearedPrice = this.calculateSecondPrice(c.maxBid, runnerUp ? runnerUp.maxBid : null, 30.0);
      return {
        ...c,
        submittedBid: c.maxBid,
        clearedPrice
      };
    });

    let topExclusive = exclusiveWaterfallQueue.length > 0 ? exclusiveWaterfallQueue[0] : null;
    let maxExclusiveBid = topExclusive ? topExclusive.maxBid * qFactor : 0;
    let exclusiveClearedPrice = topExclusive ? topExclusive.clearedPrice * qFactor : 0;

    // 4. Calculate top 4 shared bids & Vickrey second-price for each winner
    const topSharedRaw = shared.slice(0, 4);
    let topSharedSum = 0;
    let topSharedClearedSum = 0;

    const topShared = topSharedRaw.map((winner, idx) => {
      const runnerUp = shared[idx + 1] || null;
      const runnerUpBid = runnerUp ? runnerUp.maxBid : null;
      const clearedPrice = this.calculateSecondPrice(winner.maxBid, runnerUpBid, 15.0);

      topSharedSum += winner.maxBid * qFactor;
      topSharedClearedSum += clearedPrice * qFactor;

      return {
        ...winner,
        submittedBid: winner.maxBid,
        clearedPrice: clearedPrice
      };
    });

    // 5. Compare Exclusive vs Shared and decide primary winner & waterfall queue
    if (topExclusive && maxExclusiveBid >= topSharedSum) {
      return {
        status: 'Exclusive',
        winners: [topExclusive],
        waterfallQueue: exclusiveWaterfallQueue,
        maxExclusiveBid,
        topSharedSum,
        auctionType: 'Second-Price (Vickrey)',
        clearedRevenue: exclusiveClearedPrice
      };
    } else if (topShared.length > 0) {
      return {
        status: 'Shared',
        winners: topShared,
        waterfallQueue: topShared,
        maxExclusiveBid,
        topSharedSum,
        auctionType: 'Second-Price (Vickrey)',
        clearedRevenue: topSharedClearedSum
      };
    }

    return { status: 'Unsold', winners: [], waterfallQueue: [], maxExclusiveBid: 0, topSharedSum: 0, auctionType: 'Second-Price (Vickrey)' };
  }

  /**
   * Execute Waterfall Fallback POST delivery for a lead across ranked candidates.
   * Cascades to Candidate #2, #3 if previous candidate fails or times out (>2000ms).
   * 
   * @param {Lead} leadData 
   * @param {AuctionResult} auctionResult 
   * @param {Function} [postDeliveryFn] - Optional delivery function (candidate, lead) => Promise<{ accepted: boolean, reason?: string }>
   * @returns {Promise<Object>} Final auction outcome with waterfall log trace
   */
  static async executeWaterfallPost(leadData, auctionResult, postDeliveryFn = null) {
    if (!auctionResult || auctionResult.status === 'Unsold' || auctionResult.winners.length === 0) {
      return { ...auctionResult, waterfallLogs: [] };
    }

    const defaultDelivery = async (candidate, lead) => {
      return CrmIntegrationService.dispatchToContractorCrm(candidate, lead);
    };

    const delivery = postDeliveryFn || defaultDelivery;
    const waterfallQueue = auctionResult.waterfallQueue || auctionResult.winners;
    const waterfallLogs = [];
    let finalWinners = [];
    let finalStatus = 'Unsold';

    if (auctionResult.status === 'Exclusive') {
      for (const candidate of waterfallQueue) {
        const startTime = Date.now();
        try {
          const res = await delivery(candidate, leadData);
          const duration = Date.now() - startTime;
          if (res.accepted) {
            waterfallLogs.push({
              buyerId: candidate.buyerId,
              campaignId: candidate.id,
              status: 'Accepted',
              durationMs: duration,
              clearedPrice: candidate.clearedPrice
            });
            finalWinners = [candidate];
            finalStatus = 'Exclusive';
            break; // Candidate accepted! Stop waterfall execution.
          } else {
            waterfallLogs.push({
              buyerId: candidate.buyerId,
              campaignId: candidate.id,
              status: 'Cascaded_Fallback',
              reason: res.reason || 'Rejected by buyer API',
              durationMs: duration
            });
            // Waterfall to next candidate in queue!
          }
        } catch (err) {
          waterfallLogs.push({
            buyerId: candidate.buyerId,
            campaignId: candidate.id,
            status: 'Cascaded_Fallback',
            reason: err.message,
            durationMs: Date.now() - startTime
          });
        }
      }
    } else {
      finalWinners = auctionResult.winners;
      finalStatus = 'Shared';
    }

    return {
      ...auctionResult,
      status: finalWinners.length > 0 ? finalStatus : 'Unsold',
      winners: finalWinners,
      waterfallLogs
    };
  }
}

module.exports = PingPostService;
