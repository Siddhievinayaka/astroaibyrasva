import twilio from 'twilio';

export const sendWhatsAppVisitNotification = async (visitData) => {
  const adminWhatsAppNumber = 'whatsapp:+917835915574';
  const { name, email, mobile, eventType, timestamp = new Date() } = visitData;

  const messageText = `🔔 *Ra_mei AI Astrology Alert*\n\n` +
    `👤 *User*: ${name || 'Anonymous Visitor'}\n` +
    `📧 *Email*: ${email || 'N/A'}\n` +
    `📱 *Mobile*: ${mobile || 'N/A'}\n` +
    `⚡ *Event*: ${eventType || 'Website Visit'}\n` +
    `⏰ *Time*: ${new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
    console.log(`========================================`);
    console.log(`[WHATSAPP MOCK SERVICE]`);
    console.log(`To Admin: +91 7835915574`);
    console.log(`Content: \n${messageText}`);
    console.log(`Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in .env to send real WhatsApp alerts.`);
    console.log(`========================================`);
    return true;
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') 
      ? process.env.TWILIO_WHATSAPP_NUMBER 
      : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

    await client.messages.create({
      body: messageText,
      from: twilioFrom,
      to: adminWhatsAppNumber
    });
    console.log(`WhatsApp visit notification sent to admin successfully.`);
    return true;
  } catch (error) {
    console.error("Twilio WhatsApp error:", error);
    // Do not crash the server if notification fails
    return false;
  }
};
