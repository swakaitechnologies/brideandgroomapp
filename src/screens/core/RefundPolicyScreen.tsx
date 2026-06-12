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
import { ArrowLeft, ShieldCheck, FileText, HelpCircle, XCircle, CreditCard, ArrowUpCircle, Clock, Mail } from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { fonts } from "@/src/theme";

export default function RefundPolicyScreen() {
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
      title: "1. General Refund Policy",
      icon: FileText,
      content: "All premium subscription purchases on the Bride & Groom platform are for digital services and are generally non-refundable once the subscription is activated and the user has accessed premium features. This policy complies with the Consumer Protection Act, 2019, Consumer Protection (E-Commerce) Rules, 2020, and the requirements of Razorpay and Stripe.",
    },
    {
      title: "2. Eligible Refund Scenarios",
      icon: ShieldCheck,
      content: "We will consider refund requests in the following exceptional situations:",
      conditions: [
        "Duplicate Payment: You were charged twice for the same subscription due to a technical error — Full Refund within 5–7 business days.",
        "Payment Deducted but Subscription Not Activated: Amount was debited but the subscription was not activated in the App — Full Refund within 5–7 business days.",
        "Technical Inability to Use Service: A verifiable technical issue on our end prevented you from using any premium features for the entire duration — Full or Prorated Refund within 7–10 business days.",
        "48-Hour Cooling-Off Period: You request a refund within 48 hours of purchase AND have NOT used any premium features (no contacts viewed, no messages sent, no calls made) — Full Refund within 5–7 business days.",
        "Account Banned Due to Moderation Error: Your account was suspended in error and later reinstated — Prorated Refund or Extension for the lost subscription days within 7–10 business days.",
      ]
    },
    {
      title: "3. Non-Refundable Scenarios",
      icon: XCircle,
      content: "Refunds will NOT be issued in the following cases:",
      conditions: [
        "You have already used premium features (viewed contacts, sent messages, or made calls) beyond the 48-hour cooling-off period.",
        "You found a matrimonial partner during the subscription period and no longer wish to use the Platform.",
        "You changed your mind about the subscription after the 48-hour cooling-off period.",
        "Your account was suspended or terminated for violating the Terms and Conditions or Community Guidelines.",
        "You claim dissatisfaction with the quality or quantity of profiles available on the Platform.",
        "You did not use the subscription during its validity period (non-usage does not constitute grounds for a refund).",
        "The subscription was purchased using a promotional discount or coupon code (unless the specific promotion states otherwise).",
        "Auto-renewed subscriptions where you failed to disable auto-renewal before the renewal date.",
      ]
    },
    {
      title: "4. How to Request a Refund",
      icon: HelpCircle,
      content: "You can submit a refund request through any of the following channels:",
      conditions: [
        "In-App: Navigate to Account Settings → Help & Support → Submit a Query and select 'Payment / Refund Issue' as the category.",
        "Email: Send to support@brideandgroom.co.in with subject 'Refund Request — [Your Profile ID]'.",
        "Include: Registered email, mobile number, Profile ID (BG-XXXXXX), date and amount of transaction, payment gateway order/transaction ID, and reason for the request.",
        "Response Time: We will acknowledge your request within 24 hours and provide a resolution within 5 business days.",
      ]
    },
    {
      title: "5. Refund Processing",
      icon: CreditCard,
      content: "Approved refunds will be credited to the original payment method used at the time of purchase:",
      conditions: [
        "Razorpay Refunds: Typically credited within 5–7 business days. All refund transactions are recorded with a unique Refund ID and timestamp.",
        "Stripe Refunds: Typically credited within 5–10 business days. All refund transactions include a charge ID for audit purposes.",
        "Exact timeline may vary depending on your bank or financial institution.",
        "You will receive a confirmation email when the refund is initiated.",
        "We maintain a complete, timestamped record of all transactions and refund decisions for compliance and audit.",
      ]
    },
    {
      title: "6. Subscription Cancellation",
      icon: Clock,
      content: "You may cancel your active subscription at any time from Account Settings → Subscription:",
      conditions: [
        "Upon cancellation, premium features remain active until the end of the current billing period.",
        "After the billing period ends, your account reverts to the free plan.",
        "Cancellation does not entitle you to a refund for the remaining unused days of the current billing period.",
        "If auto-renewal is enabled, cancellation will also disable auto-renewal.",
      ]
    },
    {
      title: "7. Plan Upgrades & Downgrades",
      icon: ArrowUpCircle,
      content: "You may change your subscription plan under the following terms:",
      conditions: [
        "Upgrades: You may upgrade to a higher-tier plan at any time. The prorated remaining value of your current plan will be applied as a discount.",
        "Downgrades: Downgrading to a lower-tier plan is not supported mid-cycle. You may switch to a lower plan when your current plan expires.",
      ]
    },
    {
      title: "8. Contact for Refund Issues",
      icon: Mail,
      content: "For any refund-related concerns or escalations, please contact us:",
      conditions: [
        "Email: support@brideandgroom.co.in",
        "Grievance Officer: grievance@brideandgroom.co.in",
        "Response Time: Within 24 hours for acknowledgment, 5 business days for resolution.",
        "Address: Swakai Technologies, Jalgaon, Maharashtra, India",
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
        <Text style={[styles.headerTitle, { color: textColor }]}>Refund Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: textColor }]}>Refund & Cancellation Policy</Text>
          <Text style={[styles.heroSub, { color: mutedText }]}>
            Our refund policy complies with the Consumer Protection Act, 2019 and payment gateway partner requirements.
          </Text>
          <Text style={[styles.lastUpdated, { color: mutedText }]}>Last Updated: June 12, 2026</Text>
        </View>

        {/* 48-Hour Badge */}
        <View style={styles.coolingBadge}>
          <Clock size={14} color="#1565C0" />
          <Text style={styles.coolingBadgeText}>48-Hour Cooling-Off Period Available</Text>
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
                {section.conditions && (
                  <View style={styles.conditionsList}>
                    {section.conditions.map((cond, cIdx) => (
                      <View key={cIdx} style={styles.conditionItem}>
                        <View style={styles.bullet} />
                        <Text style={[styles.conditionText, { color: mutedText }]}>{cond}</Text>
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
              By purchasing a subscription on Bride & Groom, you acknowledge that you have read, understood, and agree to this Refund & Cancellation Policy.
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
  coolingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  coolingBadgeText: {
    fontSize: 11,
    color: '#1565C0',
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
