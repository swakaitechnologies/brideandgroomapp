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
import { ArrowLeft, Shield, Eye, Lock, Settings } from 'lucide-react-native';
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
      content: "We collect information necessary to provide and secure our matchmaking services:",
      items: [
        "Profile Details: Name, age, gender, occupation, religion, family background, and interests.",
        "Photos & Media: Profile photos uploaded by you to make your profile visible to other members.",
        "Verification Documents: Govt ID documents uploaded for KYC Verification (stored securely).",
        "Activity Data: Search filters, profiles viewed, matches shortlisted, and connection requests."
      ]
    },
    {
      title: "2. How We Use Your Data",
      icon: Settings,
      content: "Your data is used to deliver a personalized and safe matchmaking experience:",
      items: [
        "Displaying your profile details and photos to compatible matchmaking partners.",
        "Verifying identity via KYC checking to maintain a safe platform of genuine members.",
        "Processing transactions and verifying eligibility for premium plan features.",
        "Sending system notifications, matches of the day, and security updates."
      ]
    },
    {
      title: "3. Data Protection & Security",
      icon: Lock,
      content: "We implement industry-standard security measures to protect your personal information:",
      items: [
        "Storage Security: All documents and photos are stored securely in dedicated, isolated MinIO object storage buckets.",
        "Encryption: Sensitive data and transactions are transmitted via secure HTTPS protocols.",
        "Restricted Access: Access to KYC and billing records is restricted strictly to authorized admin moderators."
      ]
    },
    {
      title: "4. Your Privacy Controls",
      icon: Shield,
      content: "You retain full control over your privacy through settings configured directly inside the app:",
      items: [
        "Contact Filters: Choose which categories of members can view your phone number and email.",
        "Photo Visibility: Restrict photo viewing permission or submit additional photos selectively.",
        "Account Controls: Block, report, or delete your account history at any time."
      ]
    },
    {
      title: "5. Grievance Officer & Cross-Border Disclosures",
      icon: Shield,
      content: "In accordance with Section 11 of the DPDP Act 2023, you may address any personal data processing complaints or query resolutions to our designated Grievance Officer:",
      items: [
        "Grievance Officer Name: Mr. Rajesh Kumar (CTO & Legal Head)",
        "Direct Email: grievance@brideandgroom.co.in",
        "Registered Office: Swakai Technologies, 4th Floor, Tech Hub Building, Bangalore, Karnataka - 560001, India",
        "Cross-Border Transfer: We securely host profile files and process Razorpay/Stripe billing records on standard cloud infrastructure located in compliant jurisdictions (India/USA)."
      ]
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
        <Text style={[styles.headerTitle, { color: textColor }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIconBox, { borderColor: accentColor }]}>
            <Shield size={40} color={accentColor} />
          </View>
          <Text style={[styles.heroTitle, { color: textColor }]}>Privacy Policy</Text>
          <Text style={[styles.heroSub, { color: mutedText }]}>
            We are committed to protecting your personal information and matchmaking privacy.
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
