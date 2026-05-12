const { AdminLog } = require("../models/associations");

/**
 * Logs an admin action
 * @param {string} adminId - The ID of the admin performing the action
 * @param {string} action - Description of the action (e.g., 'Delete User')
 * @param {string} targetType - Type of target (e.g., 'User')
 * @param {string} targetId - ID of the target object
 * @param {object} details - Additional details to be stored as JSON
 * @param {string} ipAddress - IP address of the admin
 */
exports.logAdminAction = async (
  adminId,
  action,
  targetType = null,
  targetId = null,
  details = null,
  ipAddress = null,
) => {
  try {
    await AdminLog.create({
      adminId,
      action,
      targetType,
      targetId,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
    });
  } catch (error) {
    console.error("FAILED TO LOG ADMIN ACTION:", error);
    // We don't throw error to avoid crashing the main request
  }
};
