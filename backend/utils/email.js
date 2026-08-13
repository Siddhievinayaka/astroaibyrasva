import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email, otp) => {
  // Fallback to console printing if no SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`========================================`);
    console.log(`[EMAIL OTP MOCK SERVICE]`);
    console.log(`To: ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Configure SMTP_USER and SMTP_PASS in .env to send real emails.`);
    console.log(`========================================`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"LotusRain Ai Astrology" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Cosmic Account - OTP Verification Code',
      text: `Your OTP code for verification is: ${otp}. This code is valid for 10 minutes.`,
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
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Nodemailer error:", error);
    throw error;
  }
};
