/**
 * CrmIntegrationService
 * Native API Integrations with major Home Services & Enterprise CRMs:
 * - ServiceTitan (Job & Booking API)
 * - Salesforce (Lead SObject REST API)
 * - HubSpot (Contacts & Deals API v3)
 */
class CrmIntegrationService {
  /**
   * Format lead data for ServiceTitan Booking/Job API
   * @param {Object} lead 
   * @returns {Object} ServiceTitan API Payload
   */
  static formatServiceTitanPayload(lead) {
    const nameParts = (lead.name || 'Homeowner').trim().split(' ');
    const firstName = nameParts[0] || 'Homeowner';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    return {
      summary: `${lead.serviceType || 'Home Service'} Booking - ${lead.name}`,
      source: 'Unicorn Pro Exchange',
      jobType: lead.serviceType || 'General HVAC',
      customer: {
        firstName,
        lastName,
        phone: lead.phone,
        email: lead.email,
        address: {
          zip: lead.zipCode,
          propertyType: lead.propertyType || 'Residential'
        }
      },
      appointment: lead.appointmentDate ? {
        start: `${lead.appointmentDate}T${lead.appointmentTime || '09:00:00'}`,
        status: 'Booked'
      } : null,
      customFields: {
        urgency: lead.urgency || 'Normal',
        isOwner: lead.isOwner !== false,
        tcpaVerified: lead.tcpa !== false
      }
    };
  }

  /**
   * Format lead data for Salesforce Lead REST API (/services/data/v58.0/sobjects/Lead)
   * @param {Object} lead 
   * @returns {Object} Salesforce SObject Payload
   */
  static formatSalesforcePayload(lead) {
    const nameParts = (lead.name || 'Homeowner').trim().split(' ');
    const firstName = nameParts[0] || 'Homeowner';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    return {
      FirstName: firstName,
      LastName: lastName,
      Company: `${lead.name} (Residential)`,
      Phone: lead.phone,
      Email: lead.email,
      PostalCode: lead.zipCode,
      Industry: 'Home Services',
      LeadSource: 'Unicorn Pro PingPost Engine',
      Status: 'Open - Not Contacted',
      Description: `Service: ${lead.serviceType}, Urgency: ${lead.urgency}, Appointment: ${lead.appointmentDate || 'N/A'} @ ${lead.appointmentTime || 'N/A'}`
    };
  }

  /**
   * Format lead data for HubSpot CRM Contacts API (/crm/v3/objects/contacts)
   * @param {Object} lead 
   * @returns {Object} HubSpot Contacts API Payload
   */
  static formatHubSpotPayload(lead) {
    const nameParts = (lead.name || 'Homeowner').trim().split(' ');
    const firstName = nameParts[0] || 'Homeowner';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    return {
      properties: {
        firstname: firstName,
        lastname: lastName,
        phone: lead.phone,
        email: lead.email,
        zip: lead.zipCode,
        hs_lead_status: 'NEW',
        service_vertical: lead.serviceType || 'HVAC',
        appointment_date: lead.appointmentDate || '',
        urgency_level: lead.urgency || 'Standard'
      }
    };
  }

  /**
   * Dispatch lead to contractor CRM based on crmType (ServiceTitan, Salesforce, HubSpot, Generic)
   * 
   * @param {Object} candidate - Buyer campaign object containing crmType, crmApiKey, crmEndpoint
   * @param {Object} lead - Lead payload
   * @param {Function} [fetchFn] - Optional mock fetch function for isolated unit testing
   * @returns {Promise<{ accepted: boolean, crm: string, responseTimeMs: number, responseId?: string, reason?: string }>}
   */
  static async dispatchToContractorCrm(candidate, lead, fetchFn = null) {
    const crmType = (candidate.crmType || 'Generic').toLowerCase();
    let payload;
    let endpoint = candidate.crmEndpoint;
    let headers = { 'Content-Type': 'application/json' };

    switch (crmType) {
      case 'servicetitan':
        payload = this.formatServiceTitanPayload(lead);
        endpoint = endpoint || 'https://api.servicetitan.io/jpm/v2/bookings';
        if (candidate.crmApiKey) headers['ST-App-Key'] = candidate.crmApiKey;
        break;

      case 'salesforce':
        payload = this.formatSalesforcePayload(lead);
        endpoint = endpoint || 'https://login.salesforce.com/services/data/v58.0/sobjects/Lead';
        if (candidate.crmApiKey) headers['Authorization'] = `Bearer ${candidate.crmApiKey}`;
        break;

      case 'hubspot':
        payload = this.formatHubSpotPayload(lead);
        endpoint = endpoint || 'https://api.hubapi.com/crm/v3/objects/contacts';
        if (candidate.crmApiKey) headers['Authorization'] = `Bearer ${candidate.crmApiKey}`;
        break;

      default:
        // Generic Webhook POST
        payload = { lead, campaignId: candidate.id };
        endpoint = candidate.crmEndpoint || candidate.postEndpoint;
        break;
    }

    if (candidate.simulatesRejection) {
      return { accepted: false, crm: candidate.crmType || 'Generic', responseTimeMs: 50, reason: candidate.rejectionReason || 'CRM API rejected lead criteria' };
    }

    if (!endpoint) {
      // Mock internal CRM acceptance
      return { accepted: true, crm: candidate.crmType || 'Generic', responseTimeMs: 40, responseId: `CRM-${Date.now()}` };
    }

    const httpFetch = fetchFn || globalThis.fetch;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2000ms LM timeout limit
    const startTime = Date.now();

    try {
      const res = await httpFetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          accepted: data.accepted !== false,
          crm: candidate.crmType || 'Generic',
          responseTimeMs: duration,
          responseId: data.id || data.bookingId || `CRM-${Date.now()}`
        };
      }
      return { accepted: false, crm: candidate.crmType || 'Generic', responseTimeMs: duration, reason: `HTTP ${res.status}` };
    } catch (err) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      return {
        accepted: false,
        crm: candidate.crmType || 'Generic',
        responseTimeMs: duration,
        reason: err.name === 'AbortError' ? 'CRM API Timeout >2000ms' : err.message
      };
    }
  }
}

module.exports = CrmIntegrationService;
