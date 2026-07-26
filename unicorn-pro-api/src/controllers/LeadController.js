const PingPostService = require('../services/PingPostService');
const CampaignRepository = require('../repositories/CampaignRepository');
const LeadRepository = require('../repositories/LeadRepository');
const TwilioService = require('../services/TwilioService');
const TrustedFormService = require('../services/TrustedFormService');

class LeadController {
  static async submitLead(req, res) {
    const { vertical, serviceType, zipCode, propertyType, isOwner, urgency, timeframe, projectScope, name, phone, email, tcpa, leadType, appointmentDate, appointmentTime, appointmentStatus } = req.body;

    if (!serviceType || !zipCode || !name || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // 0. Preliminary Validations
      const isPhoneValid = await TwilioService.validatePhone(phone);
      if (!isPhoneValid) {
        return res.status(400).json({ error: "Invalid phone number format or VoIP detected" });
      }

      const isTcpaValid = await TrustedFormService.verifyCert(tcpa);
      if (!isTcpaValid) {
        return res.status(400).json({ error: "TCPA consent is required and must be validated via TrustedForm" });
      }

      // 1. Fetch matching campaigns via Repository
      const activeCampaigns = await CampaignRepository.getActiveMatchingCampaigns(serviceType, zipCode);

      // 2. Delegate to PingPostService
      const leadData = { 
        vertical, 
        serviceType, 
        zipCode, 
        propertyType, 
        isOwner, 
        urgency, 
        timeframe, 
        projectScope, 
        name, 
        phone, 
        email, 
        tcpa,
        leadType: leadType || (appointmentDate ? 'PPA_ONLINE' : 'CPL'),
        appointmentDate: appointmentDate || null,
        appointmentTime: appointmentTime || null,
        appointmentStatus: appointmentStatus || (appointmentDate ? 'Confirmed' : 'Pending')
      };
      
      const auctionResult = PingPostService.processAuction(leadData, activeCampaigns);

      // 3. Record Lead & Transactions atomically if sold
      let newLead;
      if (auctionResult.status === 'Unsold') {
        newLead = await LeadRepository.saveUnsoldLead(leadData);
        return res.status(201).json({ success: true, auctionResult, leadId: newLead.id });
      }

      newLead = await LeadRepository.saveSoldLeadWithTransactions(
        leadData, 
        auctionResult.winners, 
        auctionResult.status
      );

      const safeWinners = auctionResult.winners.map(campaign => ({
        companyName: campaign.buyer.name,
        matchedCampaign: campaign.name
      }));

      const safeAuctionResult = {
        status: auctionResult.status,
        winners: safeWinners
      };

      return res.status(201).json({
        success: true,
        auctionResult: safeAuctionResult,
        leadId: newLead.id
      });

    } catch (error) {
      console.error("Auction Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = LeadController;
