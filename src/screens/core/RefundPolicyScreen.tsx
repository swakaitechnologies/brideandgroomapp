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
import { ArrowLeft, ShieldCheck, FileText, HelpCircle } from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { fonts } from "@/src/theme";

export default function RefundPolicyScreen() {
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
      title: "1. 100% Money Back Guarantee Policy",
      icon: ShieldCheck,
      content: "We stand behind our services. If you do not find a response to your initiated interests or messages within 30 days of purchasing any of our Premium plans, you are eligible for a 100% refund of your subscription price.",
      conditions: [
        "Your profile completion must be at 100% during the subscription period.",
        "You must have uploaded at least 3 genuine and approved profile photos.",
        "Your KYC Verification must be completed and approved.",
        "You must have actively initiated contacts/interests/messages to at least 15 verified members.",
        "Refund request must be submitted within 7 days after the 30-day subscription period ends."
      ]
    },
    {
      title: "2. Premium Membership Terms",
      icon: FileText,
      content: "Premium memberships are for personal use only and cannot be shared or transferred. All premium features (contacts, messaging limits) are bound by the specific limits of the purchased plan.",
    },
    {
      title: "3. Refund Request Process",
      icon: HelpCircle,
      content: "To request a refund under the Money Back Guarantee, please go to the Help & Support screen and submit a request under 'Billing & Payments', or email our support desk at support@brideandgroom.co.in with your transaction details. Verification of eligibility takes 3 to 5 business days.",
    }
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
          <View style={[styles.heroIconBox, { borderColor: accentColor }]}>
            <ShieldCheck size={40} color={accentColor} />
          </View>
          <Text style={[styles.heroTitle, { color: textColor }]}>Money Back Guarantee</Text>
          <Text style={[styles.heroSub, { color: mutedText }]}>
            Please review the policy requirements for the subscription refund guarantee.
          </Text>
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
    paddingBottom: 80,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
    backgroundColor: 'rgba(59, 30, 84, 0.02)',
    marginBottom: 20,
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
});
