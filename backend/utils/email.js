export const sendOTPEmail = async (email, otp) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`========================================`);
    console.log(`[EMAIL OTP MOCK SERVICE - NO RESEND KEY]`);
    console.log(`To: ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`========================================`);
    return true;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'LotusRain Ai Astrology <onboarding@resend.dev>', // Resend free sandbox address
        to: email,
        subject: 'Verify Your Cosmic Account - OTP Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #f9f9ff;">
            <h2 style="color: #4f46e5; text-align: center;">Verify Your Cosmic Account</h2>
            <p>Namaste,</p>
            <p>Thank you for registering with <strong>LotusRain Ai Astrology</strong>. To complete your registration, please use the following One-Time Password (OTP) verification code:</p>
            <div style="background-color: #eef2ff; border: 1px dashed #4f46e5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4f46e5;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #6b7280; text-align: center;">This code is valid for 10 minutes. Please do not share this OTP with anyone.</p>
            <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="font-size: 11px; color: #9ca3af; text-align: center;">LotusRain Ai Astrology • Personal Advisor for Jotish Enthusiast</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    console.log(`[Resend] OTP email dispatched successfully to: ${email}`);
    return true;
  } catch (error) {
    console.error("Resend OTP Email Error:", error);
    throw error;
  }
};

export const sendVisitNotificationEmail = async (visitorDetails) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`========================================`);
    console.log(`[MOCK VISIT EMAIL ALERT - NO RESEND KEY]`);
    console.log(`Notification for visit:`, visitorDetails);
    console.log(`========================================`);
    return true;
  }

  try {
    const { name, email, mobile, sessionId, activity } = visitorDetails;
    const activityText = activity ? `Activity: ${activity}` : 'Action: Opened website / loaded page';

    // Send the alert email to the admin. 
    // In free sandboxed Resend accounts, this must match the account owner's email address.
    const destinationEmail = process.env.ADMIN_ALERT_EMAIL || 'cowstudio.ai@gmail.com'; 

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'LotusRain Alerts <onboarding@resend.dev>',
        to: destinationEmail,
        subject: `🚨 Alert: New Visitor Activity on LotusRain Astrology`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #4f46e5; border-bottom: 2px solid #eef2ff; padding-bottom: 10px; margin-top: 0;">🚨 New Visitor Activity Alert</h2>
            <p>Pranam Admin,</p>
            <p>A user is currently active on <strong>LotusRain Ai Astrology</strong>:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f9f9ff;">
                <td style="padding: 10px; font-weight: bold; width: 30%; border-bottom: 1px solid #eef2ff;">Name:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eef2ff;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eef2ff;">Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eef2ff;">${email}</td>
              </tr>
              <tr style="background-color: #f9f9ff;">
                <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eef2ff;">Mobile:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eef2ff;">${mobile}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eef2ff;">Session ID:</td>
                <td style="padding: 10px; font-family: monospace; font-size: 12px; border-bottom: 1px solid #eef2ff;">${sessionId}</td>
              </tr>
              <tr style="background-color: #fdf2f8;">
                <td style="padding: 10px; font-weight: bold; color: #db2777; border-bottom: 1px solid #eef2ff;">Activity:</td>
                <td style="padding: 10px; font-weight: bold; color: #db2777; border-bottom: 1px solid #eef2ff;">${activityText}</td>
              </tr>
            </table>
            <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px;">
              Go to your admin panel to monitor the session and take over the chat if needed.
            </p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    console.log(`[SMTP] Visit notification email sent successfully to: ${destinationEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending visit notification email:", error);
    throw error;
  }
};
