class TwilioService {
  /**
   * Validates a phone number using Twilio Lookup API.
   * In Mock mode, it rejects numbers starting with '555' (VoIP/Fake).
   * @param {string} phoneNumber 
   * @returns {Promise<boolean>} true if valid, false if invalid
   */
  static async validatePhone(phoneNumber) {
    console.log(`[TwilioService] Looking up phone number: ${phoneNumber}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock logic: 
    // Reject fake numbers starting with '555' or very short numbers
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length < 10) {
      console.warn(`[TwilioService] Invalid length: ${phoneNumber}`);
      return false;
    }
    
    // Check if it's a "fake" 555 number
    if (cleaned.startsWith('1555') || cleaned.startsWith('555') || cleaned.slice(-10).startsWith('555')) {
      console.warn(`[TwilioService] Phone identified as VoIP/Fake: ${phoneNumber}`);
      return false;
    }

    console.log(`[TwilioService] Phone is valid: ${phoneNumber}`);
    return true;
  }
}

module.exports = TwilioService;
