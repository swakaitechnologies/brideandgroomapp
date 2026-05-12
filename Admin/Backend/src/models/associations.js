const Admin = require("./Admin");
const AdminLog = require("./AdminLog");
const User = require("./User");
const Profile = require("./Profile");
const ProfileView = require("./ProfileView");
const Photo = require("./Photo");
const Report = require("./Report");
const SystemSetting = require("./SystemSetting");
const Announcement = require("./Announcement");
const Notification = require("./Notification");
const KYC = require("./KYC");
const Feedback = require("./Feedback");
const Request = require("./Request");
const SuccessStory = require("./SuccessStory");

// Define Associations
Admin.hasMany(AdminLog, { foreignKey: "adminId", as: "logs" });
AdminLog.belongsTo(Admin, { foreignKey: "adminId", as: "admin" });

User.hasOne(Profile, { foreignKey: "userId", as: "profile" });
Profile.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(SuccessStory, { foreignKey: "userId", as: "successStories" });
SuccessStory.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasOne(KYC, { foreignKey: "userId", as: "kyc" });
KYC.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Feedback, { foreignKey: "userId", as: "feedbacks" });
Feedback.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Request, { foreignKey: "userId", as: "requests" });
Request.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Photo, { foreignKey: "userId", as: "photos" });
Photo.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

Profile.hasMany(Photo, {
  foreignKey: "userId",
  sourceKey: "userId",
  as: "photos",
});
Photo.belongsTo(Profile, {
  foreignKey: "userId",
  targetKey: "userId",
  as: "profile",
});

// Admin resolving Requests
Admin.hasMany(Request, { foreignKey: "adminId", as: "resolvedRequests" });
Request.belongsTo(Admin, { foreignKey: "adminId", as: "admin" });

// Report Associations
User.hasMany(Report, { foreignKey: "reporterId", as: "reportsMade" });
User.hasMany(Report, { foreignKey: "reportedId", as: "reportsAgainst" });
Report.belongsTo(User, { foreignKey: "reporterId", as: "reporter" });
Report.belongsTo(User, { foreignKey: "reportedId", as: "reportedUser" });

module.exports = {
  Admin,
  AdminLog,
  User,
  Profile,
  ProfileView,
  Photo,
  Report,
  SystemSetting,
  Announcement,
  Notification,
  KYC,
  Feedback,
  Request,
  SuccessStory,
};
