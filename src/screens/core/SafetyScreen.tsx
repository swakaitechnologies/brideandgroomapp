import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Modal,
  Pressable,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ShieldCheck, ArrowLeft, ShieldAlert, UserCheck, 
  Flag, Heart, Phone, Mail, Globe, 
  Info, ChevronRight, ChevronDown, ChevronUp, Users, X, Smile, Lock
} from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { fonts } from "@/src/theme";

export default function SafetyScreen() {
  const navigation = useNavigation<any>();
  const isDark = false;

  const themeBg = isDark ? '#0F0F0F' : '#FDFBFF';
  const textColor = isDark ? '#F0F0F0' : '#3B1E54';
  const mutedText = isDark ? '#A0A0A0' : '#7E6B8F';
  const accentColor = palette.gold.main;
  const deepPurple = '#3B1E54';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const borderColor = isDark ? '#3D2B4F' : palette.purple.border;

  // Accordion active state
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  // Modals state
  const [showWellBeingModal, setShowWellBeingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const toggleSection = (index: number) => {
    if (expandedSection === index) {
      setExpandedSection(null);
    } else {
      setExpandedSection(index);
    }
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+918698891975').catch(() => {
      Alert.alert("Error", "Helpline call could not be completed. Please dial +91 8698891975.");
    });
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@brideandgroom.co.in').catch(() => {
      Alert.alert("Error", "Could not open mail app. Please email support@brideandgroom.co.in.");
    });
  };

  const safetyGuidelines = [
    {
      title: "Profile & Verification Safety",
      icon: UserCheck,
      details: [
        "Always look for verified profile badges (KYC-Verified) indicating verified identities.",
        "Check matches' profile details carefully. A completed profile with genuine photos is usually safer.",
        "Be cautious with profiles that seem too good to be true, or are completely blank.",
        "Cross-reference profiles when in doubt and take your time before engaging deeply."
      ]
    },
    {
      title: "Secure Online Communication",
      icon: ShieldAlert,
      details: [
        "Keep your initial conversations on the Bride & Groom app's built-in chat and call systems.",
        "Never share sensitive personal info like bank OTPs, social security, or passwords.",
        "Be wary of users who push to move to WhatsApp, Telegram, or personal calls immediately.",
        "Block and report any user who displays inappropriate behavior, threats, or harassment."
      ]
    },
    {
      title: "Strict Financial Safety",
      icon: Lock,
      details: [
        "Never send money or financial help to anyone you met online, under any circumstances.",
        "No official or genuine match will ever ask you for a loan, emergency fund, or investment advice.",
        "Be highly suspicious of sob stories involving medical emergencies, business loss, or travel trouble.",
        "Report matches who ask for money or claim to have sent you valuable gifts that require customs fees."
      ]
    },
    {
      title: "Offline Meeting Guidelines",
      icon: Users,
      details: [
        "Always choose a public, crowded place (like a popular cafe, restaurant, or mall) for your first few meetings.",
        "Arrange your own transport to and from the venue; never allow a match to pick you up from your residence.",
        "Inform a trusted friend or family member about where you are going, when, and who you are meeting.",
        "Ensure your mobile phone is fully charged and keep control of your personal belongings."
      ]
    }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeBg }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Safety Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Premium Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIconBox, { borderColor: accentColor }]}>
            <ShieldCheck size={50} color={accentColor} />
          </View>
          <Text style={[styles.heroTitle, { color: textColor }]}>Be Safe Online</Text>
          <Text style={[styles.heroSub, { color: mutedText }]}>
            Your security is our absolute priority. Follow these curated guidelines to ensure a safe, secure, and happy journey on Bride & Groom.
          </Text>
        </View>

        {/* Expandable Safety tips section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: textColor }]}>Safety Guidelines</Text>
          
          {safetyGuidelines.map((item, index) => {
            const Icon = item.icon;
            const isExpanded = expandedSection === index;
            return (
              <View key={index} style={[styles.accordionCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
                <TouchableOpacity 
                  onPress={() => toggleSection(index)} 
                  style={styles.accordionHeader}
                  activeOpacity={0.7}
                >
                  <View style={styles.accordionTitleRow}>
                    <View style={styles.iconBox}>
                      <Icon size={20} color={deepPurple} />
                    </View>
                    <Text style={[styles.accordionTitle, { color: textColor }]}>{item.title}</Text>
                  </View>
                  {isExpanded ? <ChevronUp size={20} color={deepPurple} /> : <ChevronDown size={20} color={deepPurple} />}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.accordionContent}>
                    {item.details.map((tip, tIdx) => (
                      <View key={tIdx} style={styles.tipRow}>
                        <View style={styles.bulletPoint} />
                        <Text style={[styles.tipText, { color: mutedText }]}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Privacy & Well-being Interactive Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: textColor }]}>Privacy & Well-being</Text>
          
          <TouchableOpacity 
            style={[styles.rowItem, { backgroundColor: cardBg, borderColor: borderColor }]}
            onPress={() => navigation.navigate('ContactFilter')}
          >
            <View style={styles.rowItemLeft}>
              <View style={[styles.circleIconBox, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Lock size={18} color={accentColor} />
              </View>
              <View style={styles.rowItemTexts}>
                <Text style={[styles.rowText, { color: textColor }]}>Privacy Settings</Text>
                <Text style={[styles.rowSubText, { color: mutedText }]}>Adjust who can view your photo and contact info.</Text>
              </View>
            </View>
            <ChevronRight size={18} color={mutedText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.rowItem, { backgroundColor: cardBg, borderColor: borderColor }]}
            onPress={() => setShowWellBeingModal(true)}
          >
            <View style={styles.rowItemLeft}>
              <View style={[styles.circleIconBox, { backgroundColor: 'rgba(255, 77, 77, 0.08)' }]}>
                <Smile size={18} color="#FF4D4D" />
              </View>
              <View style={styles.rowItemTexts}>
                <Text style={[styles.rowText, { color: textColor }]}>Mental Well-being</Text>
                <Text style={[styles.rowSubText, { color: mutedText }]}>Handle matchmaking fatigue and setting boundaries.</Text>
              </View>
            </View>
            <ChevronRight size={18} color={mutedText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.rowItem, { backgroundColor: cardBg, borderColor: borderColor }]}
            onPress={() => setShowReportModal(true)}
          >
            <View style={styles.rowItemLeft}>
              <View style={[styles.circleIconBox, { backgroundColor: 'rgba(59, 30, 84, 0.06)' }]}>
                <Flag size={18} color={deepPurple} />
              </View>
              <View style={styles.rowItemTexts}>
                <Text style={[styles.rowText, { color: textColor }]}>Report a Profile</Text>
                <Text style={[styles.rowSubText, { color: mutedText }]}>Flag fake, scam, or abusive profiles easily.</Text>
              </View>
            </View>
            <ChevronRight size={18} color={mutedText} />
          </TouchableOpacity>
        </View>

        {/* Cyber Crime Reporting Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: textColor }]}>Cyber Crime Reporting</Text>
          <View style={[styles.cyberCard, { borderColor: accentColor }]}>
            <View style={styles.cyberHeader}>
              <Globe size={22} color={accentColor} />
              <Text style={[styles.cyberTitle, { color: textColor }]}>National Cyber Crime Portal</Text>
            </View>
            <Text style={[styles.cyberDesc, { color: mutedText }]}>
              If you have been defrauded, emotionally manipulated, or threatened online, report the cybercrime immediately to government portals.
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://cybercrime.gov.in')} style={styles.cyberLinkBtn}>
              <Text style={styles.cyberLink}>Visit cybercrime.gov.in</Text>
              <ChevronRight size={14} color="#007AFF" />
            </TouchableOpacity>
            <View style={styles.cyberDivider} />
            <View style={styles.cyberHelpline}>
              <TouchableOpacity onPress={() => Linking.openURL('tel:1930')} style={styles.helplineItem}>
                <Phone size={16} color={accentColor} />
                <Text style={[styles.helplineText, { color: textColor }]}>National Helpline: 1930</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('tel:1091')} style={styles.helplineItem}>
                <Phone size={16} color="#FF4D4D" />
                <Text style={[styles.helplineText, { color: textColor }]}>Women Helpline: 1091</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Support Helplines */}
        <View style={styles.contactSection}>
          <Text style={[styles.sectionHeading, { color: textColor }]}>Still Need Help?</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity style={[styles.contactBox, { backgroundColor: cardBg, borderColor: borderColor }]} onPress={handleCallSupport}>
              <View style={[styles.contactIconBg, { backgroundColor: 'rgba(59, 30, 84, 0.05)' }]}>
                <Phone size={20} color={deepPurple} />
              </View>
              <Text style={[styles.contactLabel, { color: textColor }]}>Call Helpline</Text>
              <Text style={[styles.contactValue, { color: mutedText }]}>+91 8698891975</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.contactBox, { backgroundColor: cardBg, borderColor: borderColor }]} onPress={handleEmailSupport}>
              <View style={[styles.contactIconBg, { backgroundColor: 'rgba(59, 30, 84, 0.05)' }]}>
                <Mail size={20} color={deepPurple} />
              </View>
              <Text style={[styles.contactLabel, { color: textColor }]}>Email Support</Text>
              <Text style={[styles.contactValue, { color: mutedText }]} numberOfLines={1}>support@brideandgroom.co.in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Mental Well-being Modal */}
      <Modal
        visible={showWellBeingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWellBeingModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowWellBeingModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeaderRow}>
              <View style={[styles.circleIconBox, { backgroundColor: 'rgba(255, 77, 77, 0.08)' }]}>
                <Smile size={24} color="#FF4D4D" />
              </View>
              <Text style={[styles.modalTitle, { color: textColor }]}>Mental Well-being</Text>
              <TouchableOpacity onPress={() => setShowWellBeingModal(false)} style={styles.closeBtn}>
                <X size={20} color={mutedText} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <Text style={[styles.modalHeadingText, { color: textColor }]}>Matchmaking with Peace of Mind</Text>
              <Text style={[styles.modalBodyText, { color: mutedText }]}>
                Finding a life partner is a beautiful journey, but it can sometimes feel overwhelming. Here are some tips to protect your well-being:
              </Text>
              
              <View style={styles.modalBullet}>
                <Heart size={16} color="#FF4D4D" style={styles.bulletIcon} />
                <View style={styles.bulletTextContainer}>
                  <Text style={[styles.bulletTitle, { color: textColor }]}>Take Breaks</Text>
                  <Text style={[styles.bulletDesc, { color: mutedText }]}>If matchmaking starts feeling like a chore, log off for a few days to recharge your mind.</Text>
                </View>
              </View>

              <View style={styles.modalBullet}>
                <Heart size={16} color="#FF4D4D" style={styles.bulletIcon} />
                <View style={styles.bulletTextContainer}>
                  <Text style={[styles.bulletTitle, { color: textColor }]}>Set Firm Boundaries</Text>
                  <Text style={[styles.bulletDesc, { color: mutedText }]}>You are in control. Never feel pressured to meet offline, share personal handles, or reply instantly.</Text>
                </View>
              </View>

              <View style={styles.modalBullet}>
                <Heart size={16} color="#FF4D4D" style={styles.bulletIcon} />
                <View style={styles.bulletTextContainer}>
                  <Text style={[styles.bulletTitle, { color: textColor }]}>Don't Take Rejections Personally</Text>
                  <Text style={[styles.bulletDesc, { color: mutedText }]}>Matrimony is about mutual compatibility. A profile pass is simply one step closer to finding the right match.</Text>
                </View>
              </View>

              <View style={styles.modalBullet}>
                <Heart size={16} color="#FF4D4D" style={styles.bulletIcon} />
                <View style={styles.bulletTextContainer}>
                  <Text style={[styles.bulletTitle, { color: textColor }]}>Stay Safe & Trust Your Gut</Text>
                  <Text style={[styles.bulletDesc, { color: mutedText }]}>If something feels suspicious or uncomfortable, trust your intuition, block the contact, and walk away.</Text>
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalActionBtn, { backgroundColor: deepPurple }]}
              onPress={() => setShowWellBeingModal(false)}
            >
              <Text style={styles.modalActionBtnText}>Okay, I understand</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Report Profile Guide Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowReportModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeaderRow}>
              <View style={[styles.circleIconBox, { backgroundColor: 'rgba(59, 30, 84, 0.08)' }]}>
                <Flag size={24} color={deepPurple} />
              </View>
              <Text style={[styles.modalTitle, { color: textColor }]}>Report a Profile</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)} style={styles.closeBtn}>
                <X size={20} color={mutedText} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <Text style={[styles.modalHeadingText, { color: textColor }]}>How to Report Suspicious Behavior</Text>
              <Text style={[styles.modalBodyText, { color: mutedText }]}>
                Help us keep the Bride & Groom community safe. If you encounter scam, fake, abusive, or spam accounts, follow these steps to flag them:
              </Text>
              
              <View style={styles.stepBullet}>
                <View style={[styles.stepNumBox, { backgroundColor: accentColor }]}>
                  <Text style={styles.stepNumText}>1</Text>
                </View>
                <View style={styles.bulletTextContainer}>
                  <Text style={[styles.bulletTitle, { color: textColor }]}>From the Chat Details Screen</Text>
                  <Text style={[styles.bulletDesc, { color: mutedText }]}>Tap the safety options on the top right within any active conversation to block and report the user directly.</Text>
                </View>
              </View>

              <View style={styles.stepBullet}>
                <View style={[styles.stepNumBox, { backgroundColor: accentColor }]}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <View style={styles.bulletTextContainer}>
                  <Text style={[styles.bulletTitle, { color: textColor }]}>From Profile Details Screen</Text>
                  <Text style={[styles.bulletDesc, { color: mutedText }]}>Scroll to the bottom of the user's details screen and tap the red "Report/Flag Profile" button.</Text>
                </View>
              </View>

              <View style={styles.stepBullet}>
                <View style={[styles.stepNumBox, { backgroundColor: accentColor }]}>
                  <Text style={styles.stepNumText}>3</Text>
                </View>
                <View style={styles.bulletTextContainer}>
                  <Text style={[styles.bulletTitle, { color: textColor }]}>Submit a Support Ticket</Text>
                  <Text style={[styles.bulletDesc, { color: mutedText }]}>If you need custom help, raise a support query immediately through our Help & Support desk.</Text>
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity 
                style={[styles.modalActionSecondaryBtn, { borderColor: borderColor }]}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={[styles.modalActionSecondaryText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalActionPrimaryBtn, { backgroundColor: deepPurple }]}
                onPress={() => {
                  setShowReportModal(false);
                  navigation.navigate('HelpSupport');
                }}
              >
                <Text style={styles.modalActionPrimaryText}>Raise Query</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
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
    paddingBottom: 60,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 25,
    backgroundColor: 'rgba(59, 30, 84, 0.02)',
    marginBottom: 20,
  },
  heroIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    fontSize: 22,
    ...fonts.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeading: {
    fontSize: 14,
    ...fonts.bold,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  accordionCard: {
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 30, 84, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: {
    fontSize: 14,
    ...fonts.semibold,
    flex: 1,
  },
  accordionContent: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#F7F5FA',
    gap: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
    marginTop: 6,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  circleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowItemTexts: {
    flex: 1,
  },
  rowText: {
    fontSize: 14,
    ...fonts.semibold,
    marginBottom: 2,
  },
  rowSubText: {
    fontSize: 11,
  },
  cyberCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: '#FFFDF9',
  },
  cyberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cyberTitle: {
    fontSize: 15,
    ...fonts.bold,
  },
  cyberDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  cyberLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cyberLink: {
    fontSize: 13,
    color: '#007AFF',
    ...fonts.semibold,
    textDecorationLine: 'underline',
  },
  cyberDivider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    marginBottom: 15,
  },
  cyberHelpline: {
    gap: 12,
  },
  helplineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helplineText: {
    fontSize: 13,
    ...fonts.semibold,
    textDecorationLine: 'underline',
  },
  contactSection: {
    paddingHorizontal: 20,
    marginTop: 5,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBox: {
    flex: 1,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  contactIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 12,
    ...fonts.bold,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 11,
    textAlign: 'center',
    ...fonts.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    ...fonts.bold,
    flex: 1,
  },
  closeBtn: {
    padding: 5,
  },
  modalScroll: {
    marginBottom: 15,
  },
  modalHeadingText: {
    fontSize: 15,
    ...fonts.bold,
    marginBottom: 8,
  },
  modalBodyText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 15,
  },
  modalBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 15,
  },
  bulletIcon: {
    marginTop: 3,
  },
  bulletTextContainer: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 13,
    ...fonts.semibold,
    marginBottom: 3,
  },
  bulletDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  stepBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 15,
  },
  stepNumBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    color: '#3B1E54',
    fontSize: 11,
    ...fonts.bold,
  },
  modalActionBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  modalActionBtnText: {
    color: '#D4AF37',
    ...fonts.bold,
    fontSize: 14,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  modalActionSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalActionSecondaryText: {
    ...fonts.semibold,
    fontSize: 14,
  },
  modalActionPrimaryBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionPrimaryText: {
    color: '#D4AF37',
    ...fonts.bold,
    fontSize: 14,
  },
});
