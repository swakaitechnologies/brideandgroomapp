const ContactRequest = require("../models/ContactRequest");
const Notification = require("../models/Notification");
const Profile = require("../models/Profile");
const { sendNotification } = require("../utils/notificationHelper");
const Photo = require("../models/Photo");
const Interest = require("../models/Interest");
const { ContactFilter } = require("../models/associations");
const { Op } = require("sequelize");

/**
 * Checks whether the sender meets the receiver's contact filter criteria.
 * Returns { allowed: true } or { allowed: false, reason: "..." }
 */
async function checkContactFilter(senderId, receiverId) {
  const filter = await ContactFilter.findOne({ where: { userId: receiverId } });

  // No filter record or filter disabled — allow
  if (!filter || !filter.isEnabled) {
    return { allowed: true };
  }

  const senderProfile = await Profile.findOne({ where: { userId: senderId } });
  if (!senderProfile) {
    return { allowed: false, reason: "Your profile is incomplete. Please complete your profile first." };
  }

  // --- Age check ---
  if (filter.minAge || filter.maxAge) {
    if (senderProfile.dob) {
      const today = new Date();
      const birth = new Date(senderProfile.dob);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

      if (filter.minAge && age < filter.minAge) {
        return { allowed: false, reason: `This member requires a minimum age of ${filter.minAge}.` };
      }
      if (filter.maxAge && age > filter.maxAge) {
        return { allowed: false, reason: `This member requires a maximum age of ${filter.maxAge}.` };
      }
    }
  }

  // --- Marital Status check ---
  if (filter.maritalStatus && Array.isArray(filter.maritalStatus) && filter.maritalStatus.length > 0) {
    const senderMS = (senderProfile.maritalStatus || "").toLowerCase();
    const allowed = filter.maritalStatus.map(s => s.toLowerCase());
    if (senderMS && !allowed.includes(senderMS)) {
      return { allowed: false, reason: "You do not meet this member's marital status criteria." };
    }
  }

  // --- Religion check ---
  if (filter.religion && Array.isArray(filter.religion) && filter.religion.length > 0) {
    const senderRel = (senderProfile.religion || "").toLowerCase();
    const allowed = filter.religion.map(s => s.toLowerCase());
    if (senderRel && !allowed.includes(senderRel)) {
      return { allowed: false, reason: "You do not meet this member's religion criteria." };
    }
  }

  // --- Mother Tongue check ---
  if (filter.motherTongue && Array.isArray(filter.motherTongue) && filter.motherTongue.length > 0) {
    const senderMT = (senderProfile.motherTongue || "").toLowerCase();
    const allowed = filter.motherTongue.map(s => s.toLowerCase());
    if (senderMT && !allowed.includes(senderMT)) {
      return { allowed: false, reason: "You do not meet this member's mother tongue criteria." };
    }
  }

  // --- Education check ---
  if (filter.education && Array.isArray(filter.education) && filter.education.length > 0) {
    const senderEdu = (senderProfile.highestDegree || "").toLowerCase();
    const allowed = filter.education.map(s => s.toLowerCase());
    if (senderEdu && !allowed.includes(senderEdu)) {
      return { allowed: false, reason: "You do not meet this member's education criteria." };
    }
  }

  // --- Income check ---
  if (filter.incomeRange) {
    const senderIncome = (senderProfile.income || "").toLowerCase();
    if (senderIncome && senderIncome !== filter.incomeRange.toLowerCase()) {
      return { allowed: false, reason: "You do not meet this member's income criteria." };
    }
  }

  // --- Country check ---
  if (filter.country) {
    const senderCountry = (senderProfile.country || "").toLowerCase();
    if (senderCountry && senderCountry !== filter.country.toLowerCase()) {
      return { allowed: false, reason: "You do not meet this member's location criteria." };
    }
  }

  // --- KYC Verified check ---
  if (filter.isKycRequired) {
    if (!senderProfile.isKycVerified) {
      return { allowed: false, reason: "This member requires KYC verification. Please complete your KYC first." };
    }
  }

  return { allowed: true };
}


exports.getContactRequests = async (req, res) => {
  try {
    const userId = req.userId;
    const { type, status } = req.query;
    
    const whereClause = type === "sent" ? { senderId: userId } : { receiverId: userId };
    if (status) {
      whereClause.status = status;
    }

    const requests = await ContactRequest.findAll({ where: whereClause });

    // Enhance with profile data
    const enhancedRequests = await Promise.all(
      requests.map(async (request) => {
        const otherId = type === "sent" ? request.receiverId : request.senderId;
        const profile = await Profile.findOne({
          where: { userId: otherId },
          attributes: [
            "firstName",
            "lastName",
            "city",
            "state",
            "dob",
            "gender",
            "profession",
            "userId",
            "height",
            "motherTongue",
            "religion",
            "caste",
          ],
          include: [{ model: Photo, as: "photos" }],
        });
        return {
          ...request.toJSON(),
          profile,
        };
      }),
    );

    res.status(200).json({ success: true, data: enhancedRequests });
  } catch (error) {
    console.error("Get Contact Requests Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.revealContactDirectly = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId } = req.body;

    if (senderId === receiverId) {
      return res.status(400).json({ success: false, message: "You cannot reveal your own contact" });
    }

    // 1. Check if already revealed
    const existing = await ContactRequest.findOne({
      where: { senderId, receiverId, status: "accepted" }
    });

    if (existing) {
      return res.status(200).json({ success: true, message: "Contact already revealed", data: existing });
    }

    // 1.5 Contact Filter Enforcement
    const filterCheck = await checkContactFilter(senderId, receiverId);
    if (!filterCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: filterCheck.reason,
      });
    }

    // 2. Check Subscription Limits
    const { checkFeatureLimit, incrementUsage } = require("../utils/subscriptionHelper");
    const { allowed, subscription, error } = await checkFeatureLimit(senderId, 'contacts');

    if (!allowed) {
      return res.status(403).json({ success: false, message: error });
    }

    // 3. Create Accepted Contact Request (Revealed)
    const contactRequest = await ContactRequest.create({
      senderId,
      receiverId,
      status: "accepted",
    });

    // 4. Increment Usage
    await incrementUsage(subscription.id, 'contacts');

    // 5. Notify the receiver that someone viewed their contact (Optional but good UX)
    const senderProfile = await Profile.findOne({ where: { userId: senderId } });
    const senderName = senderProfile ? `${senderProfile.firstName} ${senderProfile.lastName}` : "Someone";

    await sendNotification({
      receiverId: receiverId,
      senderId: senderId,
      type: "contact_reveal",
      message: `${senderName} viewed your contact details.`,
      relatedId: contactRequest.id,
    });

    const receiverProfile = await Profile.findOne({ where: { userId: receiverId } });

    res.status(201).json({
      success: true,
      message: "Contact revealed successfully",
      data: {
        mobile: receiverProfile ? receiverProfile.mobile : null,
        email: receiverProfile ? receiverProfile.email : null,
        ...contactRequest.toJSON()
      },
      remainingContacts: subscription.plan.maxContacts === -1 ? 'Unlimited' : subscription.plan.maxContacts - (subscription.contactsUsed + 1)
    });
  } catch (error) {
    console.error("Reveal Contact Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
