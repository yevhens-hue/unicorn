const PingPostService = require('../services/PingPostService');
const CampaignRepository = require('../repositories/CampaignRepository');
const LeadRepository = require('../repositories/LeadRepository');
const TwilioService = require('../services/TwilioService');
const TrustedFormService = require('../services/TrustedFormService');
const BigQueryStreamService = require('../services/BigQueryStreamService');
const AIAgentService = require('../services/AIAgentService');

class LeadController {
  static async submitLead(req, res) {
    const { vertical, serviceType, zipCode, propertyType, isOwner, urgency, timeframe, projectScope, name, phone, email, tcpa, leadType, appointmentDate, appointmentTime, appointmentStatus, utmSource, utmMedium, utmCampaign, subId, adSpend } = req.body;

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

      // 0b. AI Agent Chief of Staff Qualification
      const aiQualification = await AIAgentService.qualifyLead({
        name, serviceType, zipCode, projectScope, urgency, timeframe, isOwner
      });

      // 1. Fetch matching campaigns via Repository
      const activeCampaigns = await CampaignRepository.getActiveMatchingCampaigns(serviceType, zipCode);

      // 2. Delegate to PingPostService for Second-Price Auction & Waterfall Queue
      const leadData = { 
        vertical: aiQualification.category || vertical || serviceType, 
        serviceType, 
        zipCode, 
        propertyType: propertyType || 'Single Family', 
        isOwner: isOwner !== undefined ? isOwner : true, 
        urgency: urgency || 'Standard', 
        timeframe: timeframe || 'Immediate', 
        projectScope: projectScope || 'Service Estimate', 
        name, 
        phone, 
        email: email || 'customer@example.com', 
        tcpa: tcpa !== undefined ? tcpa : true,
        status: 'Unsold',
        leadType: leadType || (appointmentDate ? 'PPA_ONLINE' : 'CPL'),
        appointmentDate: appointmentDate || null,
        appointmentTime: appointmentTime || null,
        appointmentStatus: appointmentStatus || (appointmentDate ? 'Confirmed' : 'Pending')
      };
      
      const rawAuctionResult = PingPostService.processAuction(leadData, activeCampaigns);

      // 3. Execute Waterfall Fallback Delivery
      const auctionResult = await PingPostService.executeWaterfallPost(leadData, rawAuctionResult);

      // 4. Stream event to BigQuery Data Warehouse for real-time ROAS tracking
      await BigQueryStreamService.streamAuctionEvent(leadData, auctionResult);

      // 5. Record Lead & Transactions atomically if sold
      let newLead;
      if (auctionResult.status === 'Unsold') {
        newLead = await LeadRepository.saveUnsoldLead(leadData);
        // Trigger AI Agent Telegram Approval / Rescue Card if high value or unsold
        if (aiQualification.needsApproval || aiQualification.estimatedBudget >= 10000) {
          await AIAgentService.sendTelegramApprovalCard(newLead, aiQualification);
        }
        return res.status(201).json({ success: true, auctionResult, leadId: newLead.id, aiQualification });
      }

      newLead = await LeadRepository.saveSoldLeadWithTransactions(
        leadData, 
        auctionResult.winners, 
        auctionResult.status
      );

      // Trigger Telegram Approval Card if high value
      if (aiQualification.needsApproval) {
        await AIAgentService.sendTelegramApprovalCard(newLead, aiQualification);
      }

      const safeWinners = auctionResult.winners.map(campaign => ({
        companyName: campaign.buyer.name,
        matchedCampaign: campaign.name
      }));

      const safeAuctionResult = {
        status: auctionResult.status,
        winners: safeWinners,
        waterfallLogs: auctionResult.waterfallLogs || []
      };

      return res.status(201).json({
        success: true,
        auctionResult: safeAuctionResult,
        leadId: newLead.id
      });

    } catch (error) {
      console.error("Auction Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
}

module.exports = LeadController;
