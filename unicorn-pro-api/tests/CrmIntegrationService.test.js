const CrmIntegrationService = require('../src/services/CrmIntegrationService');

describe('CrmIntegrationService', () => {
  const sampleLead = {
    name: 'John Smith',
    phone: '1234567890',
    email: 'john@example.com',
    serviceType: 'HVAC',
    zipCode: '90210',
    propertyType: 'Single Family',
    urgency: 'Emergency',
    appointmentDate: '2026-08-01',
    appointmentTime: '10:00 AM'
  };

  test('formatServiceTitanPayload formats payload correctly for ServiceTitan Booking API', () => {
    const payload = CrmIntegrationService.formatServiceTitanPayload(sampleLead);
    expect(payload.summary).toContain('HVAC Booking - John Smith');
    expect(payload.customer.firstName).toBe('John');
    expect(payload.customer.lastName).toBe('Smith');
    expect(payload.customer.phone).toBe('1234567890');
    expect(payload.customer.address.zip).toBe('90210');
    expect(payload.appointment.start).toBe('2026-08-01T10:00 AM');
  });

  test('formatSalesforcePayload formats payload correctly for Salesforce Lead SObject API', () => {
    const payload = CrmIntegrationService.formatSalesforcePayload(sampleLead);
    expect(payload.FirstName).toBe('John');
    expect(payload.LastName).toBe('Smith');
    expect(payload.Phone).toBe('1234567890');
    expect(payload.PostalCode).toBe('90210');
    expect(payload.LeadSource).toContain('Unicorn Pro');
  });

  test('formatHubSpotPayload formats payload correctly for HubSpot Contacts API', () => {
    const payload = CrmIntegrationService.formatHubSpotPayload(sampleLead);
    expect(payload.properties.firstname).toBe('John');
    expect(payload.properties.lastname).toBe('Smith');
    expect(payload.properties.phone).toBe('1234567890');
    expect(payload.properties.zip).toBe('90210');
    expect(payload.properties.service_vertical).toBe('HVAC');
  });

  test('dispatchToContractorCrm correctly dispatches to ServiceTitan CRM endpoint', async () => {
    const candidate = {
      id: 101,
      crmType: 'ServiceTitan',
      crmApiKey: 'test-st-key',
      crmEndpoint: 'https://api.servicetitan.io/jpm/v2/bookings'
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ bookingId: 'ST-998822' })
    });

    const result = await CrmIntegrationService.dispatchToContractorCrm(candidate, sampleLead, mockFetch);
    expect(result.accepted).toBe(true);
    expect(result.crm).toBe('ServiceTitan');
    expect(result.responseId).toBe('ST-998822');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('dispatchToContractorCrm correctly dispatches to Salesforce Lead API', async () => {
    const candidate = {
      id: 102,
      crmType: 'Salesforce',
      crmApiKey: 'sf-bearer-token',
      crmEndpoint: 'https://login.salesforce.com/services/data/v58.0/sobjects/Lead'
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: '00Q5f000001abc' })
    });

    const result = await CrmIntegrationService.dispatchToContractorCrm(candidate, sampleLead, mockFetch);
    expect(result.accepted).toBe(true);
    expect(result.crm).toBe('Salesforce');
    expect(result.responseId).toBe('00Q5f000001abc');
  });

  test('dispatchToContractorCrm correctly dispatches to HubSpot Contacts API', async () => {
    const candidate = {
      id: 103,
      crmType: 'HubSpot',
      crmApiKey: 'hs-api-key',
      crmEndpoint: 'https://api.hubapi.com/crm/v3/objects/contacts'
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: '88771122' })
    });

    const result = await CrmIntegrationService.dispatchToContractorCrm(candidate, sampleLead, mockFetch);
    expect(result.accepted).toBe(true);
    expect(result.crm).toBe('HubSpot');
    expect(result.responseId).toBe('88771122');
  });

  test('dispatchToContractorCrm handles CRM rejection or HTTP error gracefully', async () => {
    const candidate = {
      id: 104,
      crmType: 'ServiceTitan',
      crmEndpoint: 'https://api.servicetitan.io/jpm/v2/bookings'
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503
    });

    const result = await CrmIntegrationService.dispatchToContractorCrm(candidate, sampleLead, mockFetch);
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain('HTTP 503');
  });
});
