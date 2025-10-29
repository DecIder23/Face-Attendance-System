const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const SEND_SMS = String(process.env.SEND_SMS || 'true').toLowerCase() === 'true';

let client = null;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
} else {
    console.warn('Twilio credentials not configured. SMS will not be sent.');
}

/**
 * Send an SMS using Twilio
 * @param {string} to - E.164 phone number (e.g., +923001234567)
 * @param {string} message - Text message to send
 * @returns {Promise<object>} - Result object { success, sid, error }
 */
async function sendSms(to, message) {
    if (!SEND_SMS) {
        console.log('SEND_SMS is false; skipping SMS to', to);
        return { success: false, error: 'SMS disabled by config' };
    }

    if (!client || !fromNumber) {
        console.warn('Twilio client not initialized or fromNumber missing. Skipping SMS to', to);
        return { success: false, error: 'Twilio not configured' };
    }
    // Normalize phone number to E.164
    let normalized = String(to || '').trim();
    // If empty, skip
    if (!normalized) {
        console.warn('Empty phone number, skipping SMS');
        return { success: false, error: 'Empty phone number' };
    }

    // If already starts with +, assume it's OK
    if (!normalized.startsWith('+')) {
        // If it starts with 0, remove leading 0 and prefix +92
        if (normalized.startsWith('0')) {
            normalized = '+92' + normalized.slice(1);
        } else if (normalized.startsWith('92')) {
            normalized = '+' + normalized;
        } else if (normalized.length === 10) {
            // local number without leading zero e.g., 3244323123 -> +923244323123
            normalized = '+92' + normalized;
        } else {
            // fallback: prefix + if missing
            normalized = '+' + normalized;
        }
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: fromNumber,
            to: normalized
        });
        console.log(`SMS sent to ${normalized}. SID: ${result.sid}`);
        return { success: true, sid: result.sid };
    } catch (error) {
        console.error('Error sending SMS to', normalized, error && error.message ? error.message : error);
        return { success: false, error: error && error.message ? error.message : String(error) };
    }
}

module.exports = { sendSms };
