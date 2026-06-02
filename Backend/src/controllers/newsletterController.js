const { User } = require("../models/associations");
const { sendNewsletterEmail } = require("../utils/emailService");
const logger = require("../utils/logger");

/**
 * Newsletter Controller
 * Handles subscription and sending of newsletters
 */

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // In a real app, you might have a Newsletter model
    // For now, we can mark the user as subscribed if they exist, 
    // or just log it if they don't.
    const user = await User.findOne({ where: { email } });
    
    if (user) {
      user.isSubscribed = true; // Assuming this column exists or will be added
      await user.save();
    }

    logger.info(`New newsletter subscription: ${email}`);

    res.status(200).json({ 
      success: true, 
      message: "Thank you for subscribing to our newsletter!" 
    });
  } catch (error) {
    logger.error("Newsletter Subscription Error:", error);
    res.status(500).json({ success: false, message: "Server error during subscription" });
  }
};

// Send newsletter (Admin only ideally)
exports.sendNewsletter = async (req, res) => {
  try {
    const { subject, content, targetEmails } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ success: false, message: "Subject and content are required" });
    }

    let emails = targetEmails;
    
    // If no target emails, send to all subscribed users
    if (!emails || emails.length === 0) {
      const subscribedUsers = await User.findAll({ 
        where: { isSubscribed: true },
        attributes: ['email'] 
      });
      emails = subscribedUsers.map(u => u.email);
    }

    if (emails.length === 0) {
      return res.status(200).json({ success: true, message: "No subscribers found to send to." });
    }

    // Send emails (in a real app, use a queue/worker)
    const sendPromises = emails.map(email => 
      sendNewsletterEmail(email, subject, content)
    );

    await Promise.allSettled(sendPromises);

    res.status(200).json({ 
      success: true, 
      message: `Newsletter sent to ${emails.length} subscribers.` 
    });
  } catch (error) {
    logger.error("Send Newsletter Error:", error);
    res.status(500).json({ success: false, message: "Server error while sending newsletter" });
  }
};
