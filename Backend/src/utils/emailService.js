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
  const url = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Bride&Groom" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - Bride&Groom",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .email-container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            border: 1px solid #f1f5f9;
          }
          .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 40px 20px;
            text-align: center;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #d4af37;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 5px;
          }
          .tagline {
            color: #94a3b8;
            font-size: 14px;
            margin: 0;
          }
          .content {
            padding: 40px 30px;
            color: #334155;
            line-height: 1.6;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .verify-button {
            background-color: #d4af37;
            color: #ffffff !important;
            padding: 16px 36px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
            transition: all 0.3s ease;
          }
          .footer {
            background-color: #f8fafc;
            padding: 25px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #f1f5f9;
          }
          .social-links { margin-top: 15px; }
          .social-links a { color: #d4af37; text-decoration: none; margin: 0 10px; }
        </style>
      </head>
      <body style="background-color: #f1f5f9; padding: 20px; margin: 0;">
        <div class="email-container">
          <div class="header">
            <a href="${process.env.FRONTEND_URL || "https://brideandgroom.co.in"}">
              <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 60px; filter: brightness(0) invert(1);">
            </a>
            <p class="tagline">Where Tradition Meets Excellence</p>
          </div>
          <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">Welcome to our community!</h2>
            <p>Thank you for choosing Bride&Groom. We're excited to help you find your perfect match. To get started and ensure your account is secure, please verify your email address:</p>
            
            <div class="button-container">
              <a href="${url}" class="verify-button">Verify Email Address</a>
            </div>
            
            <p style="font-size: 14px; color: #64748b;">This verification link will remain active for 24 hours. If you did not create an account on Bride&Groom, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Bride&Groom Matrimony. All Rights Reserved.</p>
            <p>Made with ❤️ for meaningful connections</p>
            <div class="social-links">
              <a href="#">Facebook</a> | <a href="#">Instagram</a> | <a href="#">Twitter</a>
            </div>
          </div>
        </div>
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
      </head>
      <body style="margin: 0; padding: 0; background-color: #fcfbfa; font-family: 'Plus Jakarta Sans', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fcfbfa; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid #e5e0f0;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #4b0082 0%, #380062 100%); padding: 40px; text-align: center;">
                    <a href="${process.env.FRONTEND_URL || "https://brideandgroom.co.in"}">
                      <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 50px; filter: brightness(0) invert(1);">
                    </a>
                    <p style="font-size: 11px; color: #d4af37; letter-spacing: 3px; text-transform: uppercase; margin: 6px 0 0; font-weight: 600;">Secure Password Recovery</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 45px 40px; text-align: center;">
                    <div style="width: 64px; height: 64px; background-color: #f3f0ff; border-radius: 20px; display: inline-block; text-align: center; margin-bottom: 24px; line-height: 64px;">
                      <span style="font-size: 32px;">🔐</span>
                    </div>
                    <h2 style="font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 600; color: #1e293b; margin: 0 0 16px;">Password Reset Request</h2>
                    <p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 32px;">
                      We received a request to reset the password for your account. To choose a new password and regain access, please click the button below.
                    </p>
                    
                    <a href="${url}" style="display: inline-block; background-color: #4b0082; color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 100px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 10px 20px rgba(75, 0, 130, 0.2);">
                      RESET MY PASSWORD
                    </a>
                    
                    <p style="font-size: 13px; color: #94a3b8; margin: 32px 0 0;">
                      This link will expire in 60 minutes. <br>
                      If you didn't request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #fcfbfa; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="font-size: 11px; color: #64748b; margin: 0;">&copy; 2026 Bride&Groom Matrimony. All rights reserved.</p>
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
      </head>
      <body style="margin: 0; padding: 0; background-color: #fcfbfa; font-family: 'Plus Jakarta Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <!-- Outer Wrapper -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fcfbfa; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; border-radius: 32px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(75, 0, 130, 0.15); border: 1px solid #e5e0f0;">

                <!-- ============ HERO HEADER ============ -->
                <tr>
                  <td style="background: linear-gradient(135deg, #4b0082 0%, #380062 50%, #2d004f 100%); padding: 50px 40px 45px; text-align: center; position: relative;">
                    <!-- Brand Logo -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                            <span style="font-size: 28px; line-height: 1;">❤️</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <a href="${process.env.FRONTEND_URL || "https://brideandgroom.co.in"}">
                            <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 55px; filter: brightness(0) invert(1); margin-bottom: 8px;">
                          </a>
                          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #d4af37; letter-spacing: 4px; text-transform: uppercase; margin: 0; font-weight: 600;">Heritage Matrimony</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ============ VERIFICATION SUCCESS BADGE ============ -->
                <tr>
                  <td style="background-color: #ffffff; padding: 40px 40px 0; text-align: center;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <div style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 8px 24px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">
                            ✓ Email Verified Successfully
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ============ MAIN CONTENT ============ -->
                <tr>
                  <td style="background-color: #ffffff; padding: 30px 40px 20px; text-align: center;">
                    <h2 style="font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 600; color: #000000; margin: 0 0 12px; letter-spacing: -0.5px; line-height: 1.2;">
                      Congratulations, <span style="color: #4b0082;">${firstName}!</span>
                    </h2>
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; color: #222222; line-height: 1.8; margin: 0 0 10px; font-weight: 500;">
                      Your <span style="color: #4b0082; font-weight: 700;">sacred journey</span> toward finding a life partner has formally begun. We are honored to welcome you into our exclusive sanctuary of genuine connections.
                    </p>
                  </td>
                </tr>

                <!-- ============ "HOW IT WORKS" STEPS (Matching Landing Page) ============ -->
                <tr>
                  <td style="background-color: #ffffff; padding: 10px 30px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <!-- Section Header -->
                      <tr>
                        <td style="padding-bottom: 20px; text-align: center;">
                          <p style="font-family: 'Outfit', sans-serif; font-size: 11px; color: #4b0082; letter-spacing: 3px; text-transform: uppercase; margin: 0; font-weight: 700;">Your Next Steps</p>
                        </td>
                      </tr>
                      <!-- Step 1 -->
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f0ff; border-radius: 20px; border: 1px solid #e5e0f0;">
                            <tr>
                              <td style="padding: 20px 24px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td width="50" valign="top">
                                      <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #dbeafe, #eff6ff); border: 1px solid #bfdbfe; border-radius: 14px; text-align: center; line-height: 44px; font-size: 20px;">
                                        👤
                                      </div>
                                    </td>
                                    <td style="padding-left: 16px;">
                                      <p style="font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 600; color: #000000; margin: 0 0 4px;">Complete Your Profile</p>
                                      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #222222; margin: 0; line-height: 1.5; font-weight: 500;">Profiles with photos and details get <strong style="color: #4b0082;">3x more visibility</strong></p>
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
                        <td style="padding-bottom: 12px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f0ff; border-radius: 20px; border: 1px solid #e5e0f0;">
                            <tr>
                              <td style="padding: 20px 24px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td width="50" valign="top">
                                      <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #fef3c7, #fffbeb); border: 1px solid #fde68a; border-radius: 14px; text-align: center; line-height: 44px; font-size: 20px;">
                                        🔍
                                      </div>
                                    </td>
                                    <td style="padding-left: 16px;">
                                      <p style="font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 600; color: #000000; margin: 0 0 4px;">Browse Verified Matches</p>
                                      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #222222; margin: 0; line-height: 1.5; font-weight: 500;">Explore curated profiles filtered by your preferences</p>
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
                        <td style="padding-bottom: 12px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f0ff; border-radius: 20px; border: 1px solid #e5e0f0;">
                            <tr>
                              <td style="padding: 20px 24px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td width="50" valign="top">
                                      <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #fce7f3, #fdf2f8); border: 1px solid #fbcfe8; border-radius: 14px; text-align: center; line-height: 44px; font-size: 20px;">
                                        💬
                                      </div>
                                    </td>
                                    <td style="padding-left: 16px;">
                                      <p style="font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 600; color: #000000; margin: 0 0 4px;">Connect & Chat</p>
                                      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #222222; margin: 0; line-height: 1.5; font-weight: 500;">Start meaningful conversations in a safe, private space</p>
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

                <!-- ============ CTA BUTTONS (Matching Landing Page) ============ -->
                <tr>
                  <td style="background-color: #ffffff; padding: 15px 40px 30px; text-align: center;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom: 12px;">
                          <a href="${profileUrl}" style="display: inline-block; background-color: #4b0082; color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 100px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 10px 30px rgba(75, 0, 130, 0.3);">
                            Complete Your Profile →
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <a href="${matchesUrl}" style="display: inline-block; background-color: transparent; color: #4b0082; text-decoration: none; padding: 14px 40px; border-radius: 100px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600; border: 2px solid #e5e0f0;">
                            Explore Matches
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ============ TRUST SECTION (Matching Landing Page Trust Section) ============ -->
                <tr>
                  <td style="padding: 0 30px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #4b0082 0%, #380062 100%); border-radius: 24px; overflow: hidden;">
                      <tr>
                        <td style="padding: 30px 30px; text-align: center;">
                          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10px; color: #d4af37; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px; font-weight: 700;">Our Sacred Oath</p>
                          <p style="font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 600; color: #ffffff; margin: 0 0 20px; line-height: 1.3;">Trust is our <em style="color: #d4af37;">Legacy</em></p>
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="33%" style="text-align: center; padding: 12px 8px;">
                                <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 16px 8px;">
                                  <p style="font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 600; color: #d4af37; margin: 0;">10k+</p>
                                  <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9px; color: rgba(255,255,255,0.8); letter-spacing: 1.5px; text-transform: uppercase; margin: 4px 0 0; font-weight: 600;">Success Stories</p>
                                </div>
                              </td>
                              <td width="33%" style="text-align: center; padding: 12px 8px;">
                                <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 16px 8px;">
                                  <p style="font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 600; color: #ffffff; margin: 0;">50k+</p>
                                  <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9px; color: rgba(255,255,255,0.8); letter-spacing: 1.5px; text-transform: uppercase; margin: 4px 0 0; font-weight: 600;">Active Members</p>
                                </div>
                              </td>
                              <td width="33%" style="text-align: center; padding: 12px 8px;">
                                <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 16px 8px;">
                                  <p style="font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 600; color: #d4af37; margin: 0;">100%</p>
                                  <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9px; color: rgba(255,255,255,0.8); letter-spacing: 1.5px; text-transform: uppercase; margin: 4px 0 0; font-weight: 600;">Trust Rating</p>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ============ FOOTER (Matching Landing Page Footer) ============ -->
                <tr>
                  <td style="background-color: #0A0514; padding: 35px 40px; text-align: center;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom: 16px;">
                          <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 45px; filter: brightness(0) invert(1);">
                          <span style="display: block; font-size: 9px; color: #d4af37; letter-spacing: 3px; text-transform: uppercase; margin-top: 4px; font-weight: 600;">Heritage Matrimony</span>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 16px;">
                          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; font-weight: 500; line-height: 1.6; font-style: italic;">
                            "Where tradition meets the extraordinary."
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 20px;">
                          <!--[if mso]><table><tr><td><![endif]-->
                          <a href="#" style="display: inline-block; width: 36px; height: 36px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; text-decoration: none; text-align: center; line-height: 36px; font-size: 14px; margin: 0 4px;">📘</a>
                          <a href="#" style="display: inline-block; width: 36px; height: 36px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; text-decoration: none; text-align: center; line-height: 36px; font-size: 14px; margin: 0 4px;">📸</a>
                          <a href="#" style="display: inline-block; width: 36px; height: 36px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; text-decoration: none; text-align: center; line-height: 36px; font-size: 14px; margin: 0 4px;">🐦</a>
                          <!--[if mso]></td></tr></table><![endif]-->
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
                          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10px; color: rgba(255,255,255,0.4); margin: 0 0 6px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">&copy; 2026 Bride&Groom Matrimony</p>
                          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10px; color: rgba(255,255,255,0.3); margin: 0; letter-spacing: 1px;">
                            Made with ❤️ by <a href="https://swakai.in" style="color: #d4af37; text-decoration: none;">SwaKai Technologies</a>
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
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                
                <!-- Header -->
                <tr>
                   <td style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center;">
                    <a href="${process.env.FRONTEND_URL || "https://brideandgroom.co.in"}">
                      <img src="${LOGO_URL}" alt="${PLATFORM_NAME}" style="height: 50px; filter: brightness(0) invert(1);">
                    </a>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px; color: #334155;">
                    ${content}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f1f5f9; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="font-size: 12px; color: #64748b; margin: 0;">&copy; 2026 ${PLATFORM_NAME}. All rights reserved.</p>
                    <div style="margin-top: 15px;">
                      <a href="#" style="color: #4b0082; text-decoration: none; font-size: 11px; margin: 0 10px;">Unsubscribe</a>
                    </div>
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
