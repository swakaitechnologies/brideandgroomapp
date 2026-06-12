const { Admin, AdminLog, User, Profile, Photo, KYC, SuccessStory, Report } = require("../models/associations"); // Use associations to get linked models
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerAdmin = async (req, res) => {
  try {
    const { username, email, password, role, setupToken } = req.body;

    // Security Check: Only allow registration if setup token matches OR if an admin is already logged in (checked via isAdmin middleware in future)
    // For the public setup route, we strictly require ADMIN_SETUP_TOKEN
    const adminCount = await Admin.count();
    const envSetupToken = process.env.ADMIN_SETUP_TOKEN;

    if (adminCount > 0) {
      // SECURITY HARDENING: If admins exist, the setupToken route is permanently DISABLED.
      // New admins MUST be created by an existing Superadmin via the protected route.
      if (!req.admin || req.admin.role !== "superadmin") {
        return res
          .status(403)
          .json({ success: false, message: "Registration restricted to Superadmins via management portal" });
      }
    } else {
      // First admin creation: strictly require the setup token
      if (!envSetupToken || !setupToken || setupToken !== envSetupToken) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid or missing Admin Setup Token" });
      }
    }

    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await Admin.create({
      username,
      email,
      password: hashedPassword,
      role: role || (adminCount === 0 ? "superadmin" : "moderator"),
      isSystemAdmin: adminCount === 0,
    });

    res
      .status(201)
      .json({ message: "Admin created successfully", adminId: newAdmin.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    // Generate Token with simpler payload for easier middleware consumption
    const payload = {
      id: admin.id,
      role: admin.role,
    };

    const token = jwt.sign(payload, process.env.ADMIN_JWT_SECRET, {
      expiresIn: "12h",
    });

    // Set cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
    });

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.admin.id, {
      attributes: { exclude: ["password"] },
    });
    res.json({ success: true, data: admin });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching admin details" });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: logs } = await AdminLog.findAndCountAll({
      include: [
        {
          model: Admin,
          as: "admin",
          attributes: ["username", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Group targetIds by targetType
    const userIds = [];
    const photoIds = [];
    const kycIds = [];
    const storyIds = [];
    const reportIds = [];
    const profileIds = [];

    logs.forEach(log => {
      if (!log.targetId) return;
      if (log.targetType === "User") userIds.push(log.targetId);
      else if (log.targetType === "Photo") photoIds.push(log.targetId);
      else if (log.targetType === "KYC") kycIds.push(log.targetId);
      else if (log.targetType === "SuccessStory") storyIds.push(log.targetId);
      else if (log.targetType === "Report") reportIds.push(log.targetId);
      else if (log.targetType === "Profile" || log.targetType === "ProfileVideo") profileIds.push(log.targetId);
    });

    const userLookup = {};

    // Fetch details for each target type
    if (userIds.length > 0) {
      const users = await User.findAll({
        where: { id: userIds },
        include: [{ model: Profile, as: "profile", attributes: ["customId", "firstName", "lastName"] }],
        attributes: ["id", "firstName", "lastName", "email"]
      });
      users.forEach(u => {
        userLookup[`User:${u.id}`] = {
          name: `${u.firstName || u.profile?.firstName || ''} ${u.lastName || u.profile?.lastName || ''}`.trim(),
          customId: u.profile?.customId || "No ID",
          email: u.email
        };
      });
    }

    if (photoIds.length > 0) {
      const photos = await Photo.findAll({
        where: { id: photoIds },
        include: [
          { model: User, as: "user", attributes: ["firstName", "lastName", "email"] },
          { model: Profile, as: "profile", attributes: ["customId", "firstName", "lastName"] }
        ]
      });
      photos.forEach(p => {
        userLookup[`Photo:${p.id}`] = {
          name: `${p.profile?.firstName || p.user?.firstName || ''} ${p.profile?.lastName || p.user?.lastName || ''}`.trim(),
          customId: p.profile?.customId || "No ID",
          email: p.user?.email
        };
      });
    }

    if (kycIds.length > 0) {
      const kycs = await KYC.findAll({
        where: { id: kycIds },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["firstName", "lastName", "email"],
            include: [{ model: Profile, as: "profile", attributes: ["customId"] }]
          }
        ]
      });
      kycs.forEach(k => {
        const u = k.user;
        if (u) {
          userLookup[`KYC:${k.id}`] = {
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
            customId: u.profile?.customId || "No ID",
            email: u.email
          };
        }
      });
    }

    if (storyIds.length > 0) {
      const stories = await SuccessStory.findAll({
        where: { id: storyIds },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["firstName", "lastName", "email"],
            include: [{ model: Profile, as: "profile", attributes: ["customId"] }]
          }
        ]
      });
      stories.forEach(s => {
        const u = s.user;
        if (u) {
          userLookup[`SuccessStory:${s.id}`] = {
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
            customId: u.profile?.customId || "No ID",
            email: u.email
          };
        }
      });
    }

    if (reportIds.length > 0) {
      const reports = await Report.findAll({
        where: { id: reportIds },
        include: [
          {
            model: User,
            as: "reportedUser",
            attributes: ["firstName", "lastName", "email"],
            include: [{ model: Profile, as: "profile", attributes: ["customId"] }]
          }
        ]
      });
      reports.forEach(r => {
        const u = r.reportedUser;
        if (u) {
          userLookup[`Report:${r.id}`] = {
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
            customId: u.profile?.customId || "No ID",
            email: u.email
          };
        }
      });
    }

    if (profileIds.length > 0) {
      const profiles = await Profile.findAll({
        where: { id: profileIds },
        include: [{ model: User, as: "user", attributes: ["firstName", "lastName", "email"] }],
        attributes: ["id", "customId", "firstName", "lastName"]
      });
      profiles.forEach(p => {
        const u = p.user;
        const details = {
          name: `${p.firstName || u?.firstName || ''} ${p.lastName || u?.lastName || ''}`.trim(),
          customId: p.customId || "No ID",
          email: u?.email || "No Email"
        };
        userLookup[`Profile:${p.id}`] = details;
        userLookup[`ProfileVideo:${p.id}`] = details;
      });
    }

    // Map lookup results to logs
    const enhancedLogs = logs.map(log => {
      const logJSON = log.toJSON();
      const lookupKey = `${log.targetType}:${log.targetId}`;
      logJSON.targetUser = userLookup[lookupKey] || null;
      return logJSON;
    });

    res.json({
      success: true,
      data: enhancedLogs,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    console.error("Get Logs Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching audit logs" });
  }
};
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching admins" });
  }
};

exports.updateAdminRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;
    const adminId = req.admin.id;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    // Prevent self-demotion or self-deactivation if only one superadmin
    if (id === req.admin.id && role && role !== "superadmin") {
      const superadminCount = await Admin.count({
        where: { role: "superadmin", isActive: true },
      });
      if (superadminCount <= 1) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Cannot change role of the only active superadmin",
          });
      }
    }

    // SYSTEM PROTECTION: Prevent changing role/status of the system superadmin
    if (admin.isSystemAdmin) {
      return res.status(403).json({ success: false, message: "System superadmin cannot be modified" });
    }

    await admin.update({
      role: role !== undefined ? role : admin.role,
      isActive: isActive !== undefined ? isActive : admin.isActive,
    });

    await AdminLog.create({
      adminId,
      action: `Update Admin Role/Status (${id})`,
      targetType: "Admin",
      targetId: id,
      details: JSON.stringify({ role, isActive }),
      ipAddress: req.ip,
    });

    res.json({ success: true, message: "Admin updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating admin" });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;

    if (id === req.admin.id) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete yourself" });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    // SYSTEM PROTECTION: Prevent deletion of the system superadmin
    if (admin.isSystemAdmin) {
      return res.status(403).json({ success: false, message: "System superadmin cannot be deleted" });
    }

    await admin.destroy();

    await AdminLog.create({
      adminId,
      action: `Delete Admin (${id})`,
      targetType: "Admin",
      targetId: id,
      details: JSON.stringify({ username: admin.username, email: admin.email }),
      ipAddress: req.ip,
    });

    res.json({ success: true, message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting admin" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const adminId = req.admin.id;

    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    if (email && email !== admin.email) {
      // SYSTEM PROTECTION: Prevent changing the email of the system superadmin
      if (admin.isSystemAdmin) {
        return res.status(403).json({ success: false, message: "System superadmin email cannot be changed" });
      }

      const existingEmail = await Admin.findOne({ where: { email } });
      if (existingEmail) {
        return res
          .status(400)
          .json({ success: false, message: "Email already in use" });
      }
      admin.email = email;
    }

    if (username) admin.username = username;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    await admin.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
};

exports.logoutAdmin = async (req, res) => {
  res.clearCookie("adminToken");
  res.json({ success: true, message: "Logout successful" });
};
