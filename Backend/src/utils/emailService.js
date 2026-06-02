const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.hostinger.com",
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_PORT === "465", // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const LOGO_URL = process.env.LOGO_URL || "https://brideandgroom.co.in/Logo.png";
const PLATFORM_NAME = process.env.PLATFORM_NAME || "Bride&Groom";

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email Service Error:", error.message);
    if (error.message.includes("Username and Password not accepted")) {
      console.error(
        "👉 TIP: You are using a regular password. Google requires an 'App Password'.",
      );
    }
  } else {
    console.log("📧 Email Service is ready to send messages");
  }
});

const sendVerificationEmail = async (email, token) => {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
  const url = `${backendUrl}/api/auth/verify-email-link?token=${token}`;

  const mailOptions = {
    from: `"Bride&Groom" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - Bride&Groom",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @media only screen and (max-width: 600px) {
            .container-table { width: 100% !important; border-radius: 0px !important; }
            .content-padding { padding: 30px 20px !important; }
            .header-padding { padding: 30px 15px !important; }
            .verify-button { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F9F7FC; font-family: 'Plus Jakarta Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F9F7FC; padding: 40px 16px;">
          <tr>
            <td align="center">
              <!-- Main Card -->
              <table class="container-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px rgba(59, 30, 84, 0.05); border: 1px solid #E8E0F0;">
                
                <!-- Header -->
                <tr>
                  <td class="header-padding" style="background: linear-gradient(135deg, #3B1E54 0%, #2A143D 100%); padding: 45px 40px; text-align: center; border-bottom: 4px solid #D4AF37;">
                    <a href="https://brideandgroom.co.in" style="text-decoration: none; display: inline-block;">
                      <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 55px; border: 0; display: block; outline: none; margin: 0 auto;">
                    </a>
                    <div style="height: 2px; width: 60px; background-color: #D4AF37; margin: 20px auto 12px auto; border-radius: 2px;"></div>
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #D4AF37; letter-spacing: 3px; text-transform: uppercase; margin: 0; font-weight: 600;">
                      Where Tradition Meets Excellence
                    </p>
                  </td>
                </tr>
                
                <!-- Body Content -->
                <tr>
                  <td class="content-padding" style="padding: 45px 40px; background-color: #ffffff;">
                    <!-- Subtitle Badge -->
                    <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                      <tr>
                        <td align="center" style="background-color: #FAF5FF; border: 1px solid #E9D5FF; border-radius: 100px; padding: 6px 16px;">
                          <span style="font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; color: #7B39B6; text-transform: uppercase; letter-spacing: 1px;">📧 Email Verification</span>
                        </td>
                      </tr>
                    </table>

                    <h1 style="font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 700; color: #3B1E54; margin: 0 0 16px; text-align: center; line-height: 1.3;">
                      Confirm Your Email Address
                    </h1>
                    
                    <p style="font-size: 15px; color: #5C4B6E; line-height: 1.6; margin: 0 0 30px; text-align: center;">
                      Welcome to <strong style="color: #3B1E54;">${PLATFORM_NAME}</strong>! Your journey to find your soulmate is just one step away. Please click the button below to verify your email and activate your account.
                    </p>
                    
                    <!-- CTA Button Container -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 35px;">
                      <tr>
                        <td align="center">
                          <a href="${url}" class="verify-button" style="display: inline-block; background: linear-gradient(135deg, #3B1E54 0%, #2A143D 100%); color: #ffffff !important; text-decoration: none; padding: 18px 42px; border-radius: 100px; font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border: 1px solid #3B1E54; box-shadow: 0 10px 20px rgba(59, 30, 84, 0.15); text-align: center;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Decorative Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="border-bottom: 1px solid #E8E0F0;"></td>
                        <td width="30" align="center" style="font-size: 14px; color: #BDB3C7; font-weight: 600; font-family: 'Outfit', sans-serif; padding: 0 10px;">or</td>
                        <td style="border-bottom: 1px solid #E8E0F0;"></td>
                      </tr>
                    </table>

                    <p style="font-size: 14px; color: #5C4B6E; line-height: 1.5; margin: 0 0 15px; text-align: center;">
                      Copy and paste the verification code directly inside the mobile app if prompted:
                    </p>

                    <!-- Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF9FC; border: 1.5px dashed #C2B8D4; border-radius: 16px; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #7E6B8F; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif;">Verification Code</p>
                          <p style="margin: 8px 0 0; font-size: 26px; font-weight: 700; letter-spacing: 4px; color: #3B1E54; font-family: 'Outfit', sans-serif;">${token}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Info note -->
                    <p style="font-size: 12px; color: #7E6B8F; line-height: 1.5; margin: 0; text-align: center;">
                      This link and verification code will expire in 24 hours.<br>
                      If you did not register for an account on Bride&Groom, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #0A0514; padding: 35px 40px; text-align: center; border-top: 1px solid #E8E0F0;">
                    <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 40px; display: block; outline: none; margin: 0 auto 10px auto;">
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9px; color: #D4AF37; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 16px; font-weight: 700;">Heritage Matrimony</p>
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: rgba(255, 255, 255, 0.4); margin: 0 0 12px; line-height: 1.5;">
                      &copy; 2026 Bride&Groom Matrimony. All rights reserved.
                    </p>
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10px; color: rgba(255, 255, 255, 0.3); margin: 0; letter-spacing: 0.5px;">
                      Made with ❤️ by <a href="https://swakai.in" style="color: #D4AF37; text-decoration: none; font-weight: 600;">SwaKai Technologies</a>
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, token) => {
  const url = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Bride&Groom Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password - Bride&Groom",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @media only screen and (max-width: 600px) {
            .container-table { width: 100% !important; border-radius: 0px !important; }
            .content-padding { padding: 30px 20px !important; }
            .header-padding { padding: 30px 15px !important; }
            .action-button { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F9F7FC; font-family: 'Plus Jakarta Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F9F7FC; padding: 40px 16px;">
          <tr>
            <td align="center">
              <!-- Main Card -->
              <table class="container-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px rgba(59, 30, 84, 0.05); border: 1px solid #E8E0F0;">
                
                <!-- Header -->
                <tr>
                  <td class="header-padding" style="background: linear-gradient(135deg, #3B1E54 0%, #2A143D 100%); padding: 45px 40px; text-align: center; border-bottom: 4px solid #D4AF37;">
                    <a href="https://brideandgroom.co.in" style="text-decoration: none; display: inline-block;">
                      <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 55px; border: 0; display: block; outline: none; margin: 0 auto;">
                    </a>
                    <div style="height: 2px; width: 60px; background-color: #D4AF37; margin: 20px auto 12px auto; border-radius: 2px;"></div>
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #D4AF37; letter-spacing: 3px; text-transform: uppercase; margin: 0; font-weight: 600;">
                      Where Tradition Meets Excellence
                    </p>
                  </td>
                </tr>
                
                <!-- Body Content -->
                <tr>
                  <td class="content-padding" style="padding: 45px 40px; background-color: #ffffff;">
                    <!-- Subtitle Badge -->
                    <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                      <tr>
                        <td align="center" style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 100px; padding: 6px 16px;">
                          <span style="font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; color: #B45309; text-transform: uppercase; letter-spacing: 1px;">🔐 Password Recovery</span>
                        </td>
                      </tr>
                    </table>

                    <h1 style="font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 700; color: #3B1E54; margin: 0 0 16px; text-align: center; line-height: 1.3;">
                      Password Reset Request
                    </h1>
                    
                    <p style="font-size: 15px; color: #5C4B6E; line-height: 1.6; margin: 0 0 30px; text-align: center;">
                      We received a request to reset the password for your account on <strong style="color: #3B1E54;">${PLATFORM_NAME}</strong>. If you did not request this, you can safely ignore this email. Otherwise, please click the button below to reset your password.
                    </p>
                    
                    <!-- CTA Button Container -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 35px;">
                      <tr>
                        <td align="center">
                          <a href="${url}" class="action-button" style="display: inline-block; background: linear-gradient(135deg, #3B1E54 0%, #2A143D 100%); color: #ffffff !important; text-decoration: none; padding: 18px 42px; border-radius: 100px; font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border: 1px solid #3B1E54; box-shadow: 0 10px 20px rgba(59, 30, 84, 0.15); text-align: center;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Decorative Line -->
                    <hr style="border: 0; border-top: 1px solid #E8E0F0; margin-bottom: 30px;">
                    
                    <!-- Info note -->
                    <p style="font-size: 12px; color: #7E6B8F; line-height: 1.5; margin: 0; text-align: center;">
                      This password reset link will expire in 60 minutes.<br>
                      For security reasons, do not forward or share this email with anyone.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #0A0514; padding: 35px 40px; text-align: center; border-top: 1px solid #E8E0F0;">
                    <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 40px; display: block; outline: none; margin: 0 auto 10px auto;">
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9px; color: #D4AF37; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 16px; font-weight: 700;">Heritage Matrimony</p>
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: rgba(255, 255, 255, 0.4); margin: 0 0 12px; line-height: 1.5;">
                      &copy; 2026 Bride&Groom Matrimony. All rights reserved.
                    </p>
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10px; color: rgba(255, 255, 255, 0.3); margin: 0; letter-spacing: 0.5px;">
                      Made with ❤️ by <a href="https://swakai.in" style="color: #D4AF37; text-decoration: none; font-weight: 600;">SwaKai Technologies</a>
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email, firstName) => {
  const profileUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/profile`;
  const matchesUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/matches`;

  const mailOptions = {
    from: `"Bride&Groom" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🎉 Welcome to Bride&Groom — Your Sacred Journey Begins",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @media only screen and (max-width: 600px) {
            .container-table { width: 100% !important; border-radius: 0px !important; }
            .content-padding { padding: 30px 20px !important; }
            .header-padding { padding: 30px 15px !important; }
            .action-button { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
            .stat-cell { display: block !important; width: 100% !important; padding: 8px 0 !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F9F7FC; font-family: 'Plus Jakarta Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F9F7FC; padding: 40px 16px;">
          <tr>
            <td align="center">
              <!-- Main Card -->
              <table class="container-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px rgba(59, 30, 84, 0.05); border: 1px solid #E8E0F0;">
                
                <!-- Header -->
                <tr>
                  <td class="header-padding" style="background: linear-gradient(135deg, #3B1E54 0%, #2A143D 100%); padding: 45px 40px; text-align: center; border-bottom: 4px solid #D4AF37;">
                    <a href="https://brideandgroom.co.in" style="text-decoration: none; display: inline-block;">
                      <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 55px; border: 0; display: block; outline: none; margin: 0 auto;">
                    </a>
                    <div style="height: 2px; width: 60px; background-color: #D4AF37; margin: 20px auto 12px auto; border-radius: 2px;"></div>
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #D4AF37; letter-spacing: 3px; text-transform: uppercase; margin: 0; font-weight: 600;">
                      Where Tradition Meets Excellence
                    </p>
                  </td>
                </tr>

                <!-- Verification Success Badge -->
                <tr>
                  <td style="background-color: #ffffff; padding: 40px 40px 0; text-align: center;">
                    <table align="center" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 100px; padding: 8px 24px;">
                          <span style="font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1.5px;">✓ Email Verified Successfully</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Welcome Message -->
                <tr>
                  <td class="content-padding" style="padding: 30px 40px 20px; background-color: #ffffff; text-align: center;">
                    <h1 style="font-family: 'Outfit', sans-serif; font-size: 30px; font-weight: 700; color: #3B1E54; margin: 0 0 12px; line-height: 1.2;">
                      Welcome, <span style="color: #D4AF37;">${firstName}!</span>
                    </h1>
                    <p style="font-size: 16px; color: #5C4B6E; line-height: 1.8; margin: 0 0 20px; font-weight: 500;">
                      Your sacred journey toward finding a life partner has formally begun. We are honored to welcome you into our exclusive sanctuary of genuine connections.
                    </p>
                  </td>
                </tr>

                <!-- "Your Next Steps" section -->
                <tr>
                  <td class="content-padding" style="padding: 10px 40px 25px; background-color: #ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom: 20px;">
                          <p style="font-family: 'Outfit', sans-serif; font-size: 12px; color: #3B1E54; letter-spacing: 3px; text-transform: uppercase; margin: 0; font-weight: 700;">
                            Your Next Steps
                          </p>
                          <div style="height: 1.5px; width: 40px; background-color: #E8E0F0; margin: 8px auto 0 auto;"></div>
                        </td>
                      </tr>

                      <!-- Step 1 -->
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF9FC; border-radius: 18px; border: 1px solid #E8E0F0;">
                            <tr>
                              <td style="padding: 20px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td width="48" valign="top">
                                      <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%); border: 1px solid #E9D5FF; border-radius: 12px; text-align: center; line-height: 44px; font-size: 20px;">
                                        👤
                                      </div>
                                    </td>
                                    <td style="padding-left: 16px;">
                                      <p style="font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; color: #3B1E54; margin: 0 0 4px;">Complete Your Profile</p>
                                      <p style="font-size: 13px; color: #7E6B8F; margin: 0; line-height: 1.5;">
                                        Profiles with photos and complete details get <strong style="color: #3B1E54;">3x more matches</strong>.
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Step 2 -->
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF9FC; border-radius: 18px; border: 1px solid #E8E0F0;">
                            <tr>
                              <td style="padding: 20px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td width="48" valign="top">
                                      <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 1px solid #FCD34D; border-radius: 12px; text-align: center; line-height: 44px; font-size: 20px;">
                                        🔍
                                      </div>
                                    </td>
                                    <td style="padding-left: 16px;">
                                      <p style="font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; color: #3B1E54; margin: 0 0 4px;">Browse Verified Matches</p>
                                      <p style="font-size: 13px; color: #7E6B8F; margin: 0; line-height: 1.5;">
                                        Explore handpicked, verified profiles tailored perfectly to your preferences.
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Step 3 -->
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF9FC; border-radius: 18px; border: 1px solid #E8E0F0;">
                            <tr>
                              <td style="padding: 20px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td width="48" valign="top">
                                      <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%); border: 1px solid #F9A8D4; border-radius: 12px; text-align: center; line-height: 44px; font-size: 20px;">
                                        💬
                                      </div>
                                    </td>
                                    <td style="padding-left: 16px;">
                                      <p style="font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; color: #3B1E54; margin: 0 0 4px;">Connect & Chat</p>
                                      <p style="font-size: 13px; color: #7E6B8F; margin: 0; line-height: 1.5;">
                                        Initiate secure and meaningful conversations in a fully private workspace.
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Buttons -->
          <tr>
            <td class="content-padding" style="padding: 10px 40px 40px; background-color: #ffffff; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="${profileUrl}" class="action-button" style="display: inline-block; background: linear-gradient(135deg, #3B1E54 0%, #2A143D 100%); color: #ffffff !important; text-decoration: none; padding: 18px 48px; border-radius: 100px; font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border: 1px solid #3B1E54; box-shadow: 0 10px 20px rgba(59, 30, 84, 0.15); text-align: center;">
                      Complete Your Profile
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${matchesUrl}" style="display: inline-block; background-color: transparent; color: #3B1E54; text-decoration: none; padding: 14px 40px; border-radius: 100px; font-size: 13px; font-weight: 600; border: 2px solid #E8E0F0;">
                      Explore Matches
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Trust Section -->
          <tr>
            <td class="content-padding" style="padding: 40px; background: linear-gradient(135deg, #3B1E54 0%, #2A143D 100%); text-align: center; border-top: 4px solid #D4AF37;">
              <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10px; color: #D4AF37; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px; font-weight: 700;">Our Sacred Oath</p>
              <p style="font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 600; color: #ffffff; margin: 0 0 24px; line-height: 1.3;">
                Trust is our <em style="color: #D4AF37; font-style: normal;">Legacy</em>
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="stat-cell" width="33%" align="center" valign="top" style="padding: 0 8px;">
                    <div style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 18px 8px;">
                      <p style="font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 700; color: #D4AF37; margin: 0;">10k+</p>
                      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9px; color: rgba(255, 255, 255, 0.7); letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0; font-weight: 600;">Success Stories</p>
                    </div>
                  </td>
                  <td class="stat-cell" width="33%" align="center" valign="top" style="padding: 0 8px;">
                    <div style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 18px 8px;">
                      <p style="font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 700; color: #ffffff; margin: 0;">50k+</p>
                      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9px; color: rgba(255, 255, 255, 0.7); letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0; font-weight: 600;">Active Members</p>
                    </div>
                  </td>
                  <td class="stat-cell" width="33%" align="center" valign="top" style="padding: 0 8px;">
                    <div style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 18px 8px;">
                      <p style="font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 700; color: #D4AF37; margin: 0;">100%</p>
                      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9px; color: rgba(255, 255, 255, 0.7); letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0; font-weight: 600;">Verified Profiles</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0A0514; padding: 35px 40px; text-align: center; border-top: 1px solid #E8E0F0;">
              <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 40px; display: block; outline: none; margin: 0 auto 10px auto;">
              <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9px; color: #D4AF37; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 16px; font-weight: 700;">Heritage Matrimony</p>
              <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: rgba(255, 255, 255, 0.4); margin: 0 0 12px; line-height: 1.5; font-style: italic;">
                "Where tradition meets the extraordinary."
              </p>
              
              <!-- Social Icons -->
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="#" style="display: block; width: 36px; height: 36px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; text-decoration: none; text-align: center; line-height: 36px; font-size: 14px;">📘</a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="#" style="display: block; width: 36px; height: 36px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; text-decoration: none; text-align: center; line-height: 36px; font-size: 14px;">📸</a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="#" style="display: block; width: 36px; height: 36px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; text-decoration: none; text-align: center; line-height: 36px; font-size: 14px;">🐦</a>
                  </td>
                </tr>
              </table>
              
              <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10px; color: rgba(255, 255, 255, 0.3); margin: 0 0 6px; letter-spacing: 1.5px; text-transform: uppercase;">&copy; 2026 Bride&Groom Matrimony</p>
              <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10px; color: rgba(255, 255, 255, 0.2); margin: 0; letter-spacing: 0.5px;">
                Made with ❤️ by <a href="https://swakai.in" style="color: #D4AF37; text-decoration: none; font-weight: 600;">SwaKai Technologies</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendNewsletterEmail = async (email, subject, content) => {
  const mailOptions = {
    from: `"${PLATFORM_NAME}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @media only screen and (max-width: 600px) {
            .container-table { width: 100% !important; border-radius: 0px !important; }
            .content-padding { padding: 30px 20px !important; }
            .header-padding { padding: 30px 15px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F9F7FC; font-family: 'Plus Jakarta Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F9F7FC; padding: 40px 16px;">
          <tr>
            <td align="center">
              <!-- Main Card -->
              <table class="container-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px rgba(59, 30, 84, 0.05); border: 1px solid #E8E0F0;">
                
                <!-- Header -->
                <tr>
                  <td class="header-padding" style="background: linear-gradient(135deg, #3B1E54 0%, #2A143D 100%); padding: 45px 40px; text-align: center; border-bottom: 4px solid #D4AF37;">
                    <a href="https://brideandgroom.co.in" style="text-decoration: none; display: inline-block;">
                      <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 55px; border: 0; display: block; outline: none; margin: 0 auto;">
                    </a>
                    <div style="height: 2px; width: 60px; background-color: #D4AF37; margin: 20px auto 12px auto; border-radius: 2px;"></div>
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #D4AF37; letter-spacing: 3px; text-transform: uppercase; margin: 0; font-weight: 600;">
                      Where Tradition Meets Excellence
                    </p>
                  </td>
                </tr>
                
                <!-- Body Content -->
                <tr>
                  <td class="content-padding" style="padding: 45px 40px; background-color: #ffffff; color: #3b1e54; font-size: 15px; line-height: 1.7;">
                    ${content}
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #0A0514; padding: 35px 40px; text-align: center; border-top: 1px solid #E8E0F0;">
                    <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 40px; display: block; outline: none; margin: 0 auto 10px auto;">
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9px; color: #D4AF37; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 16px; font-weight: 700;">Heritage Matrimony</p>
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: rgba(255, 255, 255, 0.4); margin: 0 0 16px; line-height: 1.5;">
                      &copy; 2026 Bride&Groom Matrimony. All rights reserved.
                    </p>
                    <p style="margin: 0 0 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px;">
                      <a href="#" style="color: #D4AF37; text-decoration: none; font-weight: 600;">Unsubscribe from our newsletter</a>
                    </p>
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10px; color: rgba(255, 255, 255, 0.2); margin: 0; letter-spacing: 0.5px;">
                      Made with ❤️ by <a href="https://swakai.in" style="color: #D4AF37; text-decoration: none; font-weight: 600;">SwaKai Technologies</a>
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendWelcomeEmail,
  sendNewsletterEmail
};
