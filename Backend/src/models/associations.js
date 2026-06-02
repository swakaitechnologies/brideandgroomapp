const User = require("./User");
const Profile = require("./Profile");
const Photo = require("./Photo");
const Interest = require("./Interest");
const ContactRequest = require("./ContactRequest");
const Message = require("./Message");
const Notification = require("./Notification");
const PartnerPreference = require("./PartnerPreference");
const PrivacySetting = require("./PrivacySetting");
const ProfileView = require("./ProfileView");
const Block = require("./Block");
const Report = require("./Report");
const SystemSetting = require("./SystemSetting");
const Announcement = require("./Announcement");
const KYC = require("./KYC");
const Feedback = require("./Feedback");
const Request = require("./Request");
const SuccessStory = require("./SuccessStory");
const Shortlist = require("./Shortlist");
const SubscriptionPlan = require("./SubscriptionPlan");
const Subscription = require("./Subscription");
const Payment = require("./Payment");
const Banner = require("./Banner");
const CallHistory = require("./CallHistory");
const ContactFilter = require("./ContactFilter");
const Coupon = require("./Coupon");
const Like = require("./Like");
const OtaUpdate = require("./OtaUpdate");

// User <-> Profile
User.hasOne(Profile, {
  foreignKey: "userId",
  as: "profile",
  onDelete: "CASCADE",
});
Profile.belongsTo(User, { foreignKey: "userId", as: "user" });

// CallHistory associations
User.hasMany(CallHistory, { foreignKey: "callerId", as: "outgoingCalls" });
User.hasMany(CallHistory, { foreignKey: "receiverId", as: "incomingCalls" });
CallHistory.belongsTo(User, { foreignKey: "callerId", as: "caller" });
CallHistory.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });
CallHistory.belongsTo(Profile, { foreignKey: "callerId", targetKey: "userId", as: "callerProfile" });
CallHistory.belongsTo(Profile, { foreignKey: "receiverId", targetKey: "userId", as: "receiverProfile" });

// User <-> KYC
User.hasOne(KYC, { foreignKey: "userId", as: "kyc", onDelete: "CASCADE" });
KYC.belongsTo(User, { foreignKey: "userId", as: "user" });

// Feedback Associations
User.hasMany(Feedback, {
  foreignKey: "userId",
  as: "feedbacks",
  onDelete: "CASCADE",
});
Feedback.belongsTo(User, { foreignKey: "userId", as: "user" });

// Profile <-> Photo (linked by userId)
Profile.hasMany(Photo, {
  foreignKey: "userId",
  sourceKey: "userId",
  as: "photos",
  onDelete: "CASCADE",
});
Photo.belongsTo(Profile, { foreignKey: "userId", targetKey: "userId" });

// User <-> Photo
User.hasMany(Photo, {
  foreignKey: "userId",
  as: "photos",
  onDelete: "CASCADE",
});
Photo.belongsTo(User, { foreignKey: "userId" });

// Interest Associations
User.hasMany(Interest, {
  foreignKey: "senderId",
  as: "sentInterests",
  onDelete: "CASCADE",
});
User.hasMany(Interest, {
  foreignKey: "receiverId",
  as: "receivedInterests",
  onDelete: "CASCADE",
});
Interest.belongsTo(User, { foreignKey: "senderId", as: "sender" });
Interest.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });

// Message Associations
User.hasMany(Message, {
  foreignKey: "senderId",
  as: "sentMessages",
  onDelete: "CASCADE",
});
User.hasMany(Message, {
  foreignKey: "receiverId",
  as: "receivedMessages",
  onDelete: "CASCADE",
});
Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });
Message.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });

// Privacy Settings Associations
User.hasOne(PrivacySetting, {
  foreignKey: "userId",
  as: "privacySettings",
  onDelete: "CASCADE",
});
PrivacySetting.belongsTo(User, { foreignKey: "userId" });

Profile.hasOne(PrivacySetting, {
  foreignKey: "userId",
  sourceKey: "userId",
  as: "privacySettings",
  onDelete: "CASCADE",
});
PrivacySetting.belongsTo(Profile, {
  foreignKey: "userId",
  targetKey: "userId",
});

// Block Associations
User.hasMany(Block, {
  foreignKey: "blockerId",
  as: "blockedUsers",
  onDelete: "CASCADE",
});
User.hasMany(Block, {
  foreignKey: "blockedId",
  as: "blockedBy",
  onDelete: "CASCADE",
});
Block.belongsTo(User, { foreignKey: "blockerId", as: "blocker" });
Block.belongsTo(User, { foreignKey: "blockedId", as: "blockedUser" });

// Report Associations
User.hasMany(Report, {
  foreignKey: "reporterId",
  as: "reportsMade",
  onDelete: "CASCADE",
});
User.hasMany(Report, {
  foreignKey: "reportedId",
  as: "reportsAgainst",
  onDelete: "CASCADE",
});
Report.belongsTo(User, { foreignKey: "reporterId", as: "reporter" });
Report.belongsTo(User, { foreignKey: "reportedId", as: "reportedUser" });

// Request Associations
User.hasMany(Request, { foreignKey: "userId", as: "requests", onDelete: "CASCADE" });
Request.belongsTo(User, { foreignKey: "userId", as: "user" });

// SuccessStory <-> User
User.hasMany(SuccessStory, { foreignKey: "userId", as: "successStories", onDelete: "SET NULL" });
SuccessStory.belongsTo(User, { foreignKey: "userId", as: "user" });

// Shortlist Associations
User.hasMany(Shortlist, { foreignKey: "userId", as: "shortlists", onDelete: "CASCADE" });
User.hasMany(Shortlist, { foreignKey: "shortlistedId", as: "shortlistedBy", onDelete: "CASCADE" });
Shortlist.belongsTo(User, { foreignKey: "userId", as: "owner" });
Shortlist.belongsTo(User, { foreignKey: "shortlistedId", as: "shortlistedUser" });

// Like Associations
User.hasMany(Like, { foreignKey: "userId", as: "likes", onDelete: "CASCADE" });
User.hasMany(Like, { foreignKey: "likedId", as: "likedBy", onDelete: "CASCADE" });
Like.belongsTo(User, { foreignKey: "userId", as: "owner" });
Like.belongsTo(User, { foreignKey: "likedId", as: "likedUser" });

// Partner Preference Associations
User.hasOne(PartnerPreference, { foreignKey: "userId", as: "partnerPreference", onDelete: "CASCADE" });
PartnerPreference.belongsTo(User, { foreignKey: "userId" });

Profile.hasOne(PartnerPreference, { 
  foreignKey: "userId", 
  sourceKey: "userId", 
  as: "partnerPreference", 
  onDelete: "CASCADE" 
});
PartnerPreference.belongsTo(Profile, { 
  foreignKey: "userId", 
  targetKey: "userId" 
});

// Contact Filter Associations
User.hasOne(ContactFilter, { foreignKey: "userId", as: "contactFilter", onDelete: "CASCADE" });
ContactFilter.belongsTo(User, { foreignKey: "userId" });

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

const PhotoRequest = require("./PhotoRequest");

// Photo Request Associations
User.hasMany(PhotoRequest, { foreignKey: "senderId", as: "sentPhotoRequests", onDelete: "CASCADE" });
User.hasMany(PhotoRequest, { foreignKey: "receiverId", as: "receivedPhotoRequests", onDelete: "CASCADE" });
PhotoRequest.belongsTo(User, { foreignKey: "senderId", as: "sender" });
PhotoRequest.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });

module.exports = {
  User,
  Profile,
  Photo,
  Interest,
  ContactRequest,
  Message,
  Notification,
  PartnerPreference,
  PrivacySetting,
  ProfileView,
  Block,
  Report,
  SystemSetting,
  Announcement,
  KYC,
  Feedback,
  Request,
  SuccessStory,
  Shortlist,
  Like,
  SubscriptionPlan,
  Subscription,
  Payment,
  Banner,
  PhotoRequest,
  CallHistory,
  ContactFilter,
  Coupon,
  OtaUpdate,
};
