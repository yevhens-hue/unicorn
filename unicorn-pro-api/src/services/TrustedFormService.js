class TrustedFormService {
  /**
   * Validates a TrustedForm Certificate URL with ActiveProspect.
   * In Mock mode, it rejects certificates if tcpa=false or certUrl is missing.
   * @param {boolean} tcpaConsent 
   * @returns {Promise<boolean>} true if valid, false if invalid
   */
  static async verifyCert(tcpaConsent) {
    console.log(`[TrustedFormService] Verifying TCPA consent: ${tcpaConsent}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock logic:
    // If the TCPA checkbox wasn't checked, reject.
    if (!tcpaConsent) {
      console.warn(`[TrustedFormService] TCPA Consent missing. Rejecting.`);
      return false;
    }

    console.log(`[TrustedFormService] TCPA verified successfully via TrustedForm.`);
    return true;
  }
}

module.exports = TrustedFormService;
