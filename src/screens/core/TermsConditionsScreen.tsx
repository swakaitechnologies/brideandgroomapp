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
import { ArrowLeft, FileText, UserCheck, ShieldAlert, AlertCircle } from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { fonts } from "@/src/theme";

export default function TermsConditionsScreen() {
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
      title: "1. Eligibility & Registration",
      icon: UserCheck,
      content: "By registering an account on Bride & Groom, you represent and warrant that:",
      items: [
        "You are of legal marriageable age (minimum 18 years for females, 21 years for males).",
        "Your registration intent is strictly for seeking a life partner / matrimonial purposes.",
        "You will provide complete, accurate, and genuine personal details on your profile."
      ]
    },
    {
      title: "2. User Code of Conduct",
      icon: ShieldAlert,
      content: "To maintain a safe and respectful community, all members agree to follow these guidelines:",
      items: [
        "Communication: Be polite, respectful, and genuine when messaging other members.",
        "Content Policy: Do not upload obscene, offensive, commercial, or copyrighted photos.",
        "Authenticity: Do not create fake profiles, impersonate others, or misrepresent family details.",
        "No Solicitation: Matrimonial profiles must not be used for financial aid requests, marketing, or business promotion."
      ]
    },
    {
      title: "3. Account Suspension & Termination",
      icon: AlertCircle,
      content: "Bride & Groom reserves the right to review, suspend, or terminate accounts immediately if:",
      items: [
        "A profile fails the mandatory KYC Verification process or provides fake IDs.",
        "A member accumulates multiple reports or blocks from other verified users.",
        "There is a breach of these Terms of Service or our Safety Guidelines."
      ]
    },
    {
      title: "4. Disclaimers & Limitation of Liability",
      icon: FileText,
      content: "While we verify users using KYC, members must exercise caution and carry out independent background checks:",
      items: [
        "We do not guarantee matches or the marriage compatibility of members.",
        "We are not liable for any personal, emotional, or financial disputes arising between members after connecting."
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
        <Text style={[styles.headerTitle, { color: textColor }]}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIconBox, { borderColor: accentColor }]}>
            <FileText size={40} color={accentColor} />
          </View>
          <Text style={[styles.heroTitle, { color: textColor }]}>Terms of Service</Text>
          <Text style={[styles.heroSub, { color: mutedText }]}>
            Please review the platform rules and member terms of service for Bride & Groom Matrimony.
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
