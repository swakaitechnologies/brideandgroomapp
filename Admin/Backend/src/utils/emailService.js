const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendBroadcastEmail = async (email, title, content) => {
    const mailOptions = {
        from: `"Saathi Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `System Update: ${title}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Saathi Matrimony Update</h2>
        <h3 style="color: #333;">${title}</h3>
        <p style="color: #555; line-height: 1.6; font-size: 14px;">${content}</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 11px; color: #999; text-align: center;">This is a system-generated broadcast from Saathi Matrimony Admin.</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`Failed to send broadcast email to ${email}:`, error.message);
    }
};

const sendReportNotificationEmail = async (email, subject, message) => {
    const mailOptions = {
        from: `"Saathi Moderation" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Saathi Matrimony - Report Update</h2>
        <p style="color: #333; font-size: 16px;">Hello,</p>
        <p style="color: #555; line-height: 1.6; font-size: 14px;">${message}</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 11px; color: #999; text-align: center;">This is an automated message from Saathi Matrimony Moderation Team.</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`Failed to send report notification email to ${email}:`, error.message);
    }
};

module.exports = { sendBroadcastEmail, sendReportNotificationEmail };
