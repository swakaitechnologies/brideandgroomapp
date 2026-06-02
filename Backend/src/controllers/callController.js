const { CallHistory, Profile, Photo } = require("../models/associations");
const { Op } = require("sequelize");

exports.getCallHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const calls = await CallHistory.findAll({
      where: {
        [Op.or]: [{ callerId: userId }, { receiverId: userId }],
      },
      order: [["startedAt", "DESC"]],
      include: [
        {
          model: Profile,
          as: "callerProfile",
          attributes: ["firstName", "lastName", "userId"],
          include: [{ model: Photo, as: "photos" }],
        },
        {
          model: Profile,
          as: "receiverProfile",
          attributes: ["firstName", "lastName", "userId"],
          include: [{ model: Photo, as: "photos" }],
        },
      ],
    });

    const mappedCalls = calls.map((call) => {
      const isCaller = call.callerId === userId;
      const otherProfile = isCaller ? call.receiverProfile : call.callerProfile;
      
      // If it's incoming and not answered, it's 'missed' if it was for me
      // In a real system, we'd have a 'duration' or 'endedAt' to check if answered.
      // For now, use the status from DB.
      
      let finalStatus = call.status;
      if (!isCaller && call.status === "missed") {
        finalStatus = "missed";
      } else if (!isCaller && call.status === "outgoing") {
        finalStatus = "incoming";
      }

      return {
        id: call.id,
        name: otherProfile ? `${otherProfile.firstName} ${otherProfile.lastName}` : "User",
        photo: otherProfile?.photos?.find(p => p.isMain)?.url || otherProfile?.photos?.[0]?.url || "",
        type: call.type,
        status: finalStatus,
        time: call.startedAt,
        duration: call.duration,
        otherUserId: otherProfile?.userId,
      };
    });

    res.status(200).json({ success: true, data: mappedCalls });
  } catch (error) {
    console.error("Get Call History Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const crypto = require("crypto");
const activeCalls = new Map(); // key: callId, value: { id, callerId, receiverId, type, status, createdAt, connectedAt }

// Clean up expired calls from memory periodically (5 mins threshold safety cleanup)
setInterval(() => {
  const now = Date.now();
  for (const [id, call] of activeCalls.entries()) {
    if (now - call.createdAt > 5 * 60 * 1000) {
      activeCalls.delete(id);
    }
  }
}, 60000);

exports.addCallRecord = async (req, res) => {
  try {
    const callerId = req.userId;
    const { receiverId, type, status, duration } = req.body;

    // --- SUBSCRIPTION LIMIT CHECK ---
    const { checkFeatureLimit, incrementUsage } = require("../utils/subscriptionHelper");
    const { allowed, subscription, error: subError } = await checkFeatureLimit(callerId, 'calls');

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: subError
      });
    }
    // --------------------------------

    const call = await CallHistory.create({
      callerId,
      receiverId,
      type,
      status,
      duration,
    });

    // Increment Usage
    await incrementUsage(subscription.id, 'calls');

    res.status(201).json({ success: true, data: call });
  } catch (error) {
    console.error("Add Call Record Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.initiateCall = async (req, res) => {
  try {
    const callerId = req.userId;
    const { receiverId, type } = req.body; // "audio" or "video"
    
    // Check feature limits
    const { checkFeatureLimit } = require("../utils/subscriptionHelper");
    const { allowed, error: subError } = await checkFeatureLimit(callerId, 'calls');
    
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: subError
      });
    }

    const callId = crypto.randomUUID();

    activeCalls.set(callId, {
      id: callId,
      callerId,
      receiverId,
      type: type === "video" ? "video" : "audio",
      status: "ringing",
      createdAt: Date.now(),
      connectedAt: null,
    });

    res.status(201).json({ success: true, callId, status: "ringing" });
  } catch (error) {
    console.error("Initiate Call Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getActiveIncomingCall = async (req, res) => {
  try {
    const userId = req.userId;
    const now = Date.now();
    
    let foundCall = null;
    for (const call of activeCalls.values()) {
      // If ringing for B, and ringing is not expired (less than 45 seconds)
      if (call.receiverId === userId && call.status === "ringing" && (now - call.createdAt < 45000)) {
        foundCall = call;
        break;
      }
    }
    
    if (foundCall) {
      // Fetch caller profile information
      const { Profile, Photo } = require("../models/associations");
      const callerProfile = await Profile.findOne({
        where: { userId: foundCall.callerId },
        include: [{ model: Photo, as: "photos" }],
      });
      
      return res.status(200).json({
        success: true,
        activeCall: {
          id: foundCall.id,
          callerId: foundCall.callerId,
          type: foundCall.type,
          name: callerProfile ? `${callerProfile.firstName} ${callerProfile.lastName}` : "User",
          photo: callerProfile?.photos?.find(p => p.isMain)?.url || callerProfile?.photos?.[0]?.url || "",
        }
      });
    }
    
    res.status(200).json({ success: true, activeCall: null });
  } catch (error) {
    console.error("Get Active Incoming Call Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.acceptCall = async (req, res) => {
  try {
    const { callId } = req.body;
    const call = activeCalls.get(callId);
    if (!call) {
      return res.status(404).json({ success: false, message: "Call not found or expired" });
    }
    
    call.status = "connected";
    call.connectedAt = Date.now();
    activeCalls.set(callId, call);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Accept Call Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.rejectCall = async (req, res) => {
  try {
    const { callId } = req.body;
    const call = activeCalls.get(callId);
    if (!call) {
      return res.status(200).json({ success: true });
    }
    
    call.status = "rejected";
    activeCalls.set(callId, call);
    
    // Log as rejected in DB
    try {
      await CallHistory.create({
        callerId: call.callerId,
        receiverId: call.receiverId,
        type: call.type,
        status: "rejected",
        duration: 0,
      });
    } catch (dbErr) {
      console.error("Failed to log rejected call:", dbErr);
    }
    
    setTimeout(() => {
      activeCalls.delete(callId);
    }, 5000);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Reject Call Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.cancelCall = async (req, res) => {
  try {
    const { callId } = req.body;
    const call = activeCalls.get(callId);
    if (!call) {
      return res.status(200).json({ success: true });
    }
    
    call.status = "cancelled";
    activeCalls.set(callId, call);
    
    // Log as missed in DB
    try {
      await CallHistory.create({
        callerId: call.callerId,
        receiverId: call.receiverId,
        type: call.type,
        status: "missed",
        duration: 0,
      });
    } catch (dbErr) {
      console.error("Failed to log cancelled call:", dbErr);
    }
    
    setTimeout(() => {
      activeCalls.delete(callId);
    }, 5000);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Cancel Call Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.endCall = async (req, res) => {
  try {
    const { callId } = req.body;
    const call = activeCalls.get(callId);
    if (!call) {
      return res.status(200).json({ success: true });
    }
    
    let duration = 0;
    if (call.connectedAt) {
      duration = Math.round((Date.now() - call.connectedAt) / 1000);
    }
    
    call.status = "ended";
    activeCalls.set(callId, call);
    
    // Save call to database
    try {
      await CallHistory.create({
        callerId: call.callerId,
        receiverId: call.receiverId,
        type: call.type,
        status: "outgoing",
        duration,
      });
      
      // Increment subscription usage
      const { checkFeatureLimit, incrementUsage } = require("../utils/subscriptionHelper");
      const { subscription } = await checkFeatureLimit(call.callerId, 'calls');
      if (subscription) {
        await incrementUsage(subscription.id, 'calls');
      }
    } catch (dbErr) {
      console.error("Failed to log end call record:", dbErr);
    }
    
    activeCalls.delete(callId);
    res.status(200).json({ success: true, duration });
  } catch (error) {
    console.error("End Call Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;
    const call = activeCalls.get(callId);
    if (!call) {
      return res.status(200).json({ success: true, status: "ended" });
    }
    res.status(200).json({ success: true, status: call.status });
  } catch (error) {
    console.error("Get Call Status Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
