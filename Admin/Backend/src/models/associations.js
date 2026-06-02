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
const SubscriptionPlan = require("./SubscriptionPlan");
const Subscription = require("./Subscription");
const Payment = require("./Payment");
const Coupon = require("./Coupon");
const Banner = require("./Banner");
const OtaUpdate = require("./OtaUpdate");

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

// Subscription & Payment Associations
User.hasMany(Subscription, { foreignKey: "userId", as: "subscriptions", onDelete: "CASCADE" });
Subscription.belongsTo(User, { foreignKey: "userId", as: "user" });

SubscriptionPlan.hasMany(Subscription, { foreignKey: "planId", as: "subscriptions" });
Subscription.belongsTo(SubscriptionPlan, { foreignKey: "planId", as: "plan" });

User.hasMany(Payment, { foreignKey: "userId", as: "payments", onDelete: "CASCADE" });
Payment.belongsTo(User, { foreignKey: "userId", as: "user" });

SubscriptionPlan.hasMany(Payment, { foreignKey: "planId", as: "payments" });
Payment.belongsTo(SubscriptionPlan, { foreignKey: "planId", as: "plan" });

// Coupon <-> Payment
Coupon.hasMany(Payment, { foreignKey: "couponId", as: "payments" });
Payment.belongsTo(Coupon, { foreignKey: "couponId", as: "coupon" });

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
  SubscriptionPlan,
  Subscription,
  Payment,
  Coupon,
  Banner,
  OtaUpdate,
};
