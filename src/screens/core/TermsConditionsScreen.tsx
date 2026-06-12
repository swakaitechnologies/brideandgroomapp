import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, UserCheck, ShieldAlert, AlertCircle, CreditCard, Ban, Scale, BookOpen, RefreshCw, Gavel, Shield } from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { fonts } from "@/src/theme";

export default function TermsConditionsScreen() {
  const navigation = useNavigation<any>();
  const isDark = useColorScheme() === 'dark';

  const themeBg = isDark ? '#0F0F0F' : '#FDFBFF';
  const textColor = isDark ? '#F0F0F0' : '#3B1E54';
  const mutedText = isDark ? '#A0A0A0' : '#7E6B8F';
  const accentColor = palette.gold.main;
  const deepPurple = '#3B1E54';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const borderColor = isDark ? '#3D2B4F' : palette.purple.border;

  const sections = [
    {
      title: "1. Acceptance of Terms",
      icon: FileText,
      content: "By downloading, installing, registering, or using the Bride & Groom application, you agree to be bound by these Terms and Conditions. These Terms constitute a legally binding agreement between you and Swakai Technologies and govern all use of the Platform.",
      items: [
        "If you do not agree to these Terms, you must not access or use the Service.",
        "These Terms apply whether you access the Platform through mobile devices, desktops, or any other medium.",
      ]
    },
    {
      title: "2. Eligibility & Registration",
      icon: UserCheck,
      content: "To use the Platform, you must meet all of the following eligibility criteria:",
      items: [
        "Age Requirement: You must be 18 years of age or older. The Platform is strictly prohibited for minors, in accordance with Section 9 of the Digital Personal Data Protection Act, 2023 (DPDP Act).",
        "Legal Capacity: You must be legally competent to enter into a binding contract under the Indian Contract Act, 1872.",
        "Marital Eligibility: You must be legally eligible for marriage under Indian law. Users who are already married and not legally separated/divorced are not permitted to seek a new partner.",
        "Single Account Policy: Each user is permitted only one account. Duplicate registrations may result in permanent suspension.",
        "You agree to provide accurate, truthful, current, and complete information during registration and profile creation.",
      ]
    },
    {
      title: "3. Account Verification",
      icon: Shield,
      content: "We implement multiple layers of verification to maintain a trustworthy platform:",
      items: [
        "Mobile & Email Verification: Your mobile number and email address will be verified using OTP and verification link mechanisms respectively.",
        "KYC Verification (Optional but Encouraged): Users may complete identity verification by uploading a valid government-issued photo ID (Aadhaar Card, PAN Card, Voter ID, Passport, Driving License) along with a live selfie.",
        "KYC-verified profiles receive a Trust Badge and higher visibility in search results.",
        "Profile Moderation: All user profiles, photos, and introduction videos are subject to manual review by our moderation team. We reserve the right to reject, suspend, or remove any content that violates these Terms.",
      ]
    },
    {
      title: "4. User Code of Conduct",
      icon: ShieldAlert,
      content: "By using the Platform, you agree NOT to engage in any of the following prohibited activities:",
      items: [
        "Impersonate any person or entity, or falsely represent your affiliation with any person or entity.",
        "Upload photos or videos of other individuals without their explicit consent.",
        "Use the Platform for casual dating, extramarital affairs, or any purpose other than genuine matrimonial matchmaking.",
        "Harass, stalk, intimidate, threaten, abuse, or discriminate against other users in any form.",
        "Send unsolicited commercial messages, spam, or promotional content to other users.",
        "Share, distribute, or upload content that is obscene, pornographic, defamatory, hateful, or incites violence.",
        "Attempt to reverse-engineer, decompile, hack, or gain unauthorized access to the Platform, its servers, or databases.",
        "Use automated scripts, bots, or crawlers to access the Platform.",
        "Solicit money, gifts, or financial benefits from other users.",
        "Create fake, misleading, or joke profiles.",
      ]
    },
    {
      title: "5. Premium Subscription Services",
      icon: CreditCard,
      content: "The Platform offers a freemium model. Basic profile browsing is free; premium features require a paid subscription:",
      items: [
        "Premium Features include: Viewing contact details (phone number, email), sending and receiving direct messages, audio and video calling with matched profiles, priority profile visibility and enhanced search ranking.",
        "Subscription Plans are offered in various durations (e.g., 30, 90, 180, 365 days) with pricing displayed in applicable currency (INR, USD, AED).",
        "All prices are inclusive of applicable taxes (GST at 18%, or as prescribed).",
        "Subscriptions become active immediately upon successful payment confirmation.",
        "Auto-Renewal: If opted in, your subscription renews automatically at the end of the billing period. You may disable auto-renewal from Account Settings before the renewal date.",
      ]
    },
    {
      title: "6. Fair Usage Policy",
      icon: RefreshCw,
      content: "Some subscription plans include usage limits to ensure fair usage across the platform:",
      items: [
        "Limits may apply to: contacts viewed, messages sent, and calls initiated per billing period.",
        "Usage counters reset at the start of each new billing cycle.",
        "Exceeding fair usage limits may result in temporary restriction of specific features until the next billing cycle.",
      ]
    },
    {
      title: "7. Intellectual Property Rights",
      icon: BookOpen,
      content: "All content, trademarks, logos, designs, text, graphics, software, and other materials on the Platform are the property of Swakai Technologies:",
      items: [
        "Protected under the Indian Copyright Act, 1957, and the Trademarks Act, 1999.",
        "You are granted a limited, revocable, non-exclusive, non-transferable license to use the Platform for personal, non-commercial matrimonial purposes only.",
        "Unauthorized reproduction, distribution, modification, or commercial use is strictly prohibited.",
        "You retain ownership of content you upload (photos, bio, videos). By uploading, you grant us a non-exclusive, royalty-free license to display your content for operating the Platform.",
      ]
    },
    {
      title: "8. Limitation of Liability",
      icon: AlertCircle,
      content: "The Platform acts as an intermediary connecting individuals seeking matrimonial alliances:",
      items: [
        "We do not guarantee the accuracy, authenticity, or truthfulness of information provided by other users.",
        "Swakai Technologies shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.",
        "We do not conduct background checks, criminal record verifications, or financial standing assessments. Users are strongly encouraged to perform independent due diligence.",
        "The Company shall not be liable for delays, interruptions, or errors due to technical issues, server downtime, or force majeure events.",
      ]
    },
    {
      title: "9. Indemnification",
      icon: Scale,
      content: "You agree to indemnify, defend, and hold harmless Swakai Technologies, its directors, employees, agents, and affiliates from claims arising from:",
      items: [
        "Your use or misuse of the Platform.",
        "Your violation of these Terms or applicable law.",
        "Any third-party claim arising from content you uploaded to the Platform.",
        "Any dispute between you and another user of the Platform.",
      ]
    },
    {
      title: "10. Account Termination",
      icon: Ban,
      content: "Either party may terminate the account relationship under these conditions:",
      items: [
        "By the User: You may delete your account at any time from Account Settings. Deletion will permanently erase all your personal data from our active servers.",
        "By the Company: We may suspend or terminate your account without prior notice if you have violated these Terms, engaged in fraudulent behavior, or created risk for the Platform or its users.",
        "Upon termination for cause, any active premium subscription will be forfeited with no refund unless explicitly covered under our Refund Policy.",
      ]
    },
    {
      title: "11. Dispute Resolution & Governing Law",
      icon: Gavel,
      content: "These Terms are governed by and construed in accordance with the laws of India:",
      items: [
        "All disputes shall be subject to the exclusive jurisdiction of the courts of Jalgaon, Maharashtra, India.",
        "Before initiating legal proceedings, parties agree to attempt resolution through good-faith negotiation and/or mediation for a minimum period of 30 days.",
      ]
    },
    {
      title: "12. Amendments",
      icon: FileText,
      content: "We reserve the right to modify these Terms at any time:",
      items: [
        "Updated Terms will be posted on the Platform with the revised 'Last Updated' date.",
        "Continued use of the Platform after amendments constitutes your acceptance of the updated Terms.",
        "For material changes, we will notify you via email or in-app notification.",
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
        <Text style={[styles.headerTitle, { color: textColor }]}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroSub, { color: mutedText }]}>
            Please review the terms and conditions governing your use of the Bride & Groom Matrimonial Platform.
          </Text>
          <Text style={[styles.lastUpdated, { color: mutedText }]}>Last Updated: June 12, 2026</Text>
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
              By using the Bride & Groom application, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
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
    marginBottom: 20,
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
    textAlign: 'center',
    lineHeight: 16,
    paddingRight: 6,
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
    textAlign: 'center',
    lineHeight: 17,
    ...fonts.semibold,
  },
  footerContact: {
    fontSize: 13,
    color: '#D4AF37',
    textAlign: 'center',
    lineHeight: 18,
    ...fonts.bold,
  },
});
