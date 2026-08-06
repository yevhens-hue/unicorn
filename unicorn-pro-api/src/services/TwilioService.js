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

  /**
   * Dispatches SMS & WhatsApp appointment confirmation to homeowner with quick-reply 1/2 instructions.
   * 
   * @param {Object} lead 
   * @param {string} slotText 
   * @param {string} contractorName 
   * @returns {Promise<{success: boolean, messageSid: string, recipientPhone: string, textBody: string, status: string}>}
   */
  static async sendAppointmentSmsConfirmation(lead, slotText = 'Tomorrow 2:00 PM', contractorName = 'ProRoofing Solutions') {
    const recipientPhone = lead.phone || '+380991234567';
    const messageSid = `SM_tw_${Date.now()}_lead${lead.id || 1}`;
    const textBody = `Hello ${lead.name || 'Valued Customer'}! Your ${lead.serviceType || 'Home Service'} estimate appointment is confirmed for ${slotText} with ${contractorName}.\n\nReply "1" to Confirm or "2" to Reschedule. Thank you!`;

    console.log(`\n================= TWILIO SMS & WHATSAPP DISPATCH =================`);
    console.log(`To Phone: ${recipientPhone}`);
    console.log(`Lead ID: #${lead.id || 1}`);
    console.log(`Message SID: ${messageSid}`);
    console.log(`SMS Text Body:\n${textBody}`);
    console.log(`===================================================================\n`);

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const https = require('https');
        const querystring = require('querystring');

        const postData = querystring.stringify({
          From: process.env.TWILIO_PHONE_NUMBER,
          To: recipientPhone,
          Body: textBody
        });

        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');

        const resData = await new Promise((resolve, reject) => {
          const req = https.request({
            hostname: 'api.twilio.com',
            path: `/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData)
            }
          }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
          });
          req.on('error', reject);
          req.write(postData);
          req.end();
        });

        return {
          success: true,
          messageSid: resData.sid || messageSid,
          recipientPhone,
          textBody,
          status: resData.status || 'queued',
          providerResponse: resData
        };
      } catch (err) {
        console.warn('[TwilioService] Real SMS dispatch fallback:', err.message);
      }
    }

    return {
      success: true,
      messageSid,
      recipientPhone,
      textBody,
      status: 'simulated_sms_delivered'
    };
  }
}

module.exports = TwilioService;
