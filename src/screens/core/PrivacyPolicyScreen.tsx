import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, Eye, Lock, Settings, Database, Share2, UserCheck, Users, Globe, Baby, Bell, Clock, Mail, AlertTriangle } from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { fonts } from "@/src/theme";

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<any>();
  const isDark = false;

  const themeBg = isDark ? '#0F0F0F' : '#FDFBFF';
  const textColor = isDark ? '#F0F0F0' : '#3B1E54';
  const mutedText = isDark ? '#A0A0A0' : '#7E6B8F';
  const accentColor = palette.gold.main;
  const deepPurple = '#3B1E54';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const borderColor = isDark ? '#3D2B4F' : palette.purple.border;

  const sections = [
    {
      title: "1. Information We Collect",
      icon: Eye,
      content: "We collect the following categories of personal data to provide our matrimonial matchmaking services:",
      items: [
        "Account Information: First Name, Last Name, Email Address, Mobile Number, Password (hashed and encrypted using bcrypt).",
        "Profile Information: Date of Birth, Gender, Height, Weight, Marital Status, Religion, Caste, Sub-Caste, Mother Tongue, Family Values, Cultural Preferences.",
        "Location Information: Country, State, City, Area, Relocation Preference.",
        "Education & Career: Highest Degree, College, Profession, Industry, Company, Income Range.",
        "Family Details: Family Type, Family Location, Father's Status, Mother's Status, Number of Siblings, Family Description.",
        "Lifestyle Preferences: Diet, Smoking Habits, Drinking Habits, Hobbies, Activity Level.",
        "Bio & Expectations: Personal Bio, Expectations from Partner, Preferred Age Range, Preferred Location, Deal-Breakers.",
        "Contact Information: Alternate Mobile Number, Alternate Email, Preferred Contact Time.",
        "Horoscope Information: Zodiac Sign, Birth Time, Birth Place.",
        "KYC Documents: Government ID Type, ID Number, ID Document Image, Live Selfie Image, Full Name on Document.",
        "Photos & Media: Profile Photos, Introduction Video.",
        "Nominee Information: Nominee Name, Nominee Contact Number (for data rights under DPDP Act Section 14).",
      ]
    },
    {
      title: "2. Automatically Collected Data",
      icon: Database,
      content: "We automatically collect certain technical and usage data when you access the Platform:",
      items: [
        "Device Information: Device model, OS version, IP Address, device signature.",
        "Session Data: Login/Logout timestamps, session duration, last active timestamp.",
        "Usage Data: Features used, profiles viewed, interests sent/received, messages sent/received.",
        "Transaction Data: Payment amount, currency, payment gateway (Razorpay/Stripe), transaction IDs, payment status.",
        "Push Notification Tokens: Firebase Cloud Messaging (FCM) tokens for notification delivery.",
        "We do NOT receive or store your full credit/debit card numbers. Payment details are handled directly by Razorpay and Stripe.",
      ]
    },
    {
      title: "3. How We Use Your Data",
      icon: Settings,
      content: "Your personal data is processed for the following specific, lawful purposes under the DPDP Act:",
      items: [
        "Creating and managing your account — Legal Basis: Consent (Section 6).",
        "Displaying your profile to other registered users for matchmaking — Core service purpose.",
        "Verifying your identity via KYC, mobile, and email verification — Legitimate Interest / Legal Compliance.",
        "Processing subscription payments and issuing receipts — Contractual necessity.",
        "Sending transactional notifications (interest received, match alerts) — Consent / Legitimate Interest.",
        "Moderating content (photos, videos, profile text) for Platform safety.",
        "Responding to your support tickets and feedback — Contractual necessity.",
        "Detecting and preventing fraud, abuse, and fake profiles — Security.",
        "Generating anonymized, aggregated analytics to improve the Platform.",
        "Compliance with applicable law and court orders — Legal obligation.",
      ]
    },
    {
      title: "4. Consent Management",
      icon: UserCheck,
      content: "We collect your personal data only after obtaining your explicit, informed, and freely given consent, as required by the DPDP Act, 2023:",
      items: [
        "Explicit Consent: You must actively agree to these policies before your account is created.",
        "Consent Record: The exact date, time, and IP address of your consent is recorded and stored in our database.",
        "Granular Control: You may control the visibility of specific data fields (phone number, email, photos, name) via Privacy Settings at any time.",
        "Withdrawal of Consent: You have the right to withdraw consent at any time by deleting your account. Withdrawal does not affect the lawfulness of processing performed before withdrawal.",
      ]
    },
    {
      title: "5. Data Protection & Security",
      icon: Lock,
      content: "We implement industry-standard and advanced security measures to protect your personal information:",
      items: [
        "Encryption: All data is transmitted over HTTPS (TLS 1.2+). Passwords are hashed using the bcrypt algorithm with a salt factor before storage.",
        "Database Security: Data is stored in encrypted PostgreSQL/MySQL databases hosted on secure, access-controlled cloud infrastructure.",
        "Object Storage: Photos, videos, and KYC documents are stored in secure, access-controlled MinIO/S3-compatible object storage with pre-signed, time-limited access URLs.",
        "Authentication: Sessions are protected using JSON Web Tokens (JWT) with short expiration periods and secure HTTP-only cookies. Refresh tokens are stored in Redis with automatic expiry.",
        "Rate Limiting: API endpoints are protected with rate limiting to prevent brute-force attacks.",
        "Security Headers: All responses include industry-standard headers (Content Security Policy, X-Frame-Options, Strict Transport Security).",
        "Access Control: Admin access is restricted to authorized personnel with role-based permissions. All admin actions are logged in an immutable audit trail.",
      ]
    },
    {
      title: "6. Data Sharing & Disclosure",
      icon: Share2,
      content: "We do NOT sell, rent, or trade your personal data to any third party. Your data may be shared in limited circumstances:",
      items: [
        "Other Registered Users: Profile information as per your privacy settings, for matchmaking.",
        "Payment Gateways (Razorpay, Stripe): User ID, email, amount, currency — NOT passwords or full card details.",
        "Cloud Hosting Providers: Encrypted data at rest and in transit for infrastructure hosting.",
        "Email Service Providers: Email address and name for transactional emails (verification, password reset).",
        "Law Enforcement / Courts: In response to valid legal process (court orders, warrants, subpoenas).",
        "Successors / Acquirers: In the event of a merger, acquisition, or sale of assets (with prior user notification).",
      ]
    },
    {
      title: "7. Your Data Rights (DPDP Act)",
      icon: Shield,
      content: "As a Data Principal under the Digital Personal Data Protection Act, 2023, you have the following rights:",
      items: [
        "Right to Access (Section 11): Obtain a summary of your personal data being processed. Use 'Export My Data' in Account Settings or email support@brideandgroom.co.in.",
        "Right to Correction (Section 11): Correct inaccurate or misleading data and update incomplete data directly in the App.",
        "Right to Erasure (Section 12): Have your personal data permanently deleted when you withdraw consent. Use 'Delete Account' in Account Settings.",
        "Right to Grievance Redressal (Section 13): File a complaint with our Grievance Officer at grievance@brideandgroom.co.in.",
        "Right to Nominate (Section 14): Nominate an individual to exercise your data rights in the event of your death or incapacity via Account Settings.",
      ]
    },
    {
      title: "8. Data Retention & Deletion",
      icon: Clock,
      content: "We retain your personal data only as long as necessary for the purposes described in this policy:",
      items: [
        "Active Accounts: Data is retained for as long as your account is active and registered.",
        "Session Data: Login timestamps and IP addresses are retained for a maximum of 12 months for security audits.",
        "Payment Records: Transaction records are retained for 8 years as required by Indian tax and financial regulations (Income Tax Act, GST Act).",
        "Account Deletion: When you delete your account, all profile data, photos, videos, messages, interests, KYC documents, and session records are permanently and irreversibly deleted.",
        "Inactive Accounts: Accounts inactive for more than 24 months may be flagged for deletion with 30-day prior notification.",
      ]
    },
    {
      title: "9. Data Transfers",
      icon: Globe,
      content: "Your data is primarily stored and processed within India:",
      items: [
        "If data is transferred outside India (e.g., for payment processing via Stripe for international transactions), we ensure adequate safeguards are in place as per the DPDP Act.",
        "Cross-border transfers comply with the provisions of the DPDP Act, 2023 and rules notified by the Central Government.",
      ]
    },
    {
      title: "10. Children's Data",
      icon: Baby,
      content: "The Platform is strictly intended for users 18 years of age or older:",
      items: [
        "We do not knowingly collect personal data from individuals under the age of 18.",
        "If we become aware that a minor has created an account, we will immediately delete the account and all associated personal data.",
        "Age verification is enforced during registration, in compliance with Section 9 of the DPDP Act.",
      ]
    },
    {
      title: "11. Cookie & Token Policy",
      icon: Database,
      content: "The Platform uses the following authentication mechanisms:",
      items: [
        "Authentication Token: HTTP-only cookie for maintaining your logged-in session (expires in 24 hours).",
        "Refresh Token: HTTP-only cookie for issuing new access tokens without re-login (expires in 7 days).",
        "Mobile App: Uses encrypted device storage (EncryptedStorage) instead of browser cookies. Tokens are stored locally and are not accessible by third-party applications.",
        "We do NOT use third-party advertising or tracking cookies.",
      ]
    },
    {
      title: "12. Grievance Officer",
      icon: Mail,
      content: "In compliance with Section 13 of the DPDP Act, 2023 and the IT (Intermediary Guidelines) Rules, 2021:",
      items: [
        "Grievance Officer: Swakai Technologies",
        "Email: grievance@brideandgroom.co.in",
        "Address: Swakai Technologies, Jalgaon, Maharashtra, India",
        "Working Hours: Monday to Friday, 10:00 AM – 6:00 PM IST",
        "Acknowledgment within 24 hours. Final resolution within 15 days.",
        "Escalation: Data Protection Board of India or National Consumer Disputes Redressal Commission (NCDRC).",
      ]
    },
    {
      title: "13. Policy Updates",
      icon: Bell,
      content: "We may update this Privacy Policy to reflect changes in our practices, legal requirements, or Platform functionality:",
      items: [
        "Users will be notified of material changes via email or in-app notification at least 7 days before the changes take effect.",
        "Continued use of the Platform after updates constitutes acceptance of the revised Privacy Policy.",
        "The 'Last Updated' date at the top of this policy will always reflect the most recent revision.",
      ]
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeBg }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroSub, { color: mutedText }]}>
            We are committed to protecting your personal information in compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act).
          </Text>
          <Text style={[styles.lastUpdated, { color: mutedText }]}>Last Updated: June 12, 2026</Text>
        </View>

        {/* DPDP Compliance Badge */}
        <View style={styles.complianceBadge}>
          <Shield size={16} color="#2E7D32" />
          <Text style={styles.complianceBadgeText}>DPDP Act 2023 Compliant</Text>
        </View>

        {/* Content Sections */}
        <View style={styles.contentSection}>
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <View key={index} style={[styles.card, { backgroundColor: cardBg, borderColor: borderColor }]}>
                <View style={styles.cardHeader}>
                  <Icon size={20} color={accentColor} />
                  <Text style={[styles.cardTitle, { color: textColor }]}>{section.title}</Text>
                </View>
                <Text style={[styles.cardBodyText, { color: mutedText }]}>
                  {section.content}
                </Text>
                {section.items && (
                  <View style={styles.conditionsList}>
                    {section.items.map((itemText, iIdx) => (
                      <View key={iIdx} style={styles.conditionItem}>
                        <View style={styles.bullet} />
                        <Text style={[styles.conditionText, { color: mutedText }]}>{itemText}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: mutedText }]}>
              By using the Bride & Groom application, you acknowledge that you have read, understood, and agree to this Privacy Policy.
            </Text>
            <Text style={[styles.footerCopyright, { color: textColor }]}>
              © 2026 Swakai Technologies. All rights reserved.
            </Text>
            <Text style={[styles.footerContact, { color: accentColor }]}>
              support@brideandgroom.co.in
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    ...fonts.bold,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 16,
    backgroundColor: 'rgba(59, 30, 84, 0.02)',
    marginBottom: 10,
  },
  heroIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 2,
    ...Platform.select({
      ios: { shadowColor: '#3B1E54', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  heroTitle: {
    fontSize: 20,
    ...fonts.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  lastUpdated: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  complianceBadgeText: {
    fontSize: 11,
    color: '#2E7D32',
    ...fonts.semibold,
  },
  contentSection: {
    paddingHorizontal: 20,
    gap: 15,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    ...fonts.bold,
    flex: 1,
  },
  cardBodyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  conditionsList: {
    marginTop: 12,
    gap: 8,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
    marginTop: 6,
  },
  conditionText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 30, 84, 0.08)',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 12,
    color: '#3B1E54',
  },
  footerCopyright: {
    fontSize: 12,
    marginBottom: 6,
    color: '#3B1E54',
    ...fonts.semibold,
  },
  footerContact: {
    fontSize: 13,
    color: '#D4AF37',
    ...fonts.bold,
  },
});
