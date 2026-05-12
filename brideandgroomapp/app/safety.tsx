import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ShieldCheck, ArrowLeft, ShieldAlert, UserCheck, 
  Flag, Heart, Phone, Mail, Globe, 
  HelpCircle, Shield, Info, Smartphone,
  Users, ChevronRight
} from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';
import { palette } from '@/src/theme/colors';
import { router } from 'expo-router';

export default function SafetyScreen() {
  const { mode } = useSelector((state: RootState) => state.theme);
  const isDark = mode === 'dark';

  const themeBg = isDark ? '#0F0F0F' : '#FFFFFF';
  const textColor = isDark ? '#F0F0F0' : '#1A1A1A';
  const mutedText = isDark ? '#A0A0A0' : '#6C757D';
  const accentColor = palette.gold.main;
  const deepPurple = '#3B1E54';

  const SafetyItem = ({ icon: Icon, title, desc, color }: any) => (
    <View style={[styles.safetyCard, { backgroundColor: isDark ? '#1E1E1E' : '#F9F7FF' }]}>
      <View style={[styles.iconBox, { backgroundColor: color || 'rgba(59, 30, 84, 0.05)' }]}>
        <Icon size={24} color={color ? '#FFF' : deepPurple} />
      </View>
      <View style={styles.safetyContent}>
        <Text style={[styles.safetyTitle, { color: textColor }]}>{title}</Text>
        <Text style={[styles.safetyDesc, { color: mutedText }]}>{desc}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeBg }} edges={['top', 'left', 'right']}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Safety Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={styles.heroIconBox}>
            <ShieldCheck size={48} color={accentColor} />
          </View>
          <Text style={[styles.heroTitle, { color: textColor }]}>Your Safety is Our Priority</Text>
          <Text style={[styles.heroSub, { color: mutedText }]}>Follow these guidelines to have a safe and pleasant experience on Punarmilan.</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: textColor }]}>Detailed Safety Tips</Text>
          <SafetyItem 
            icon={UserCheck} 
            title="Know Person First" 
            desc="Communicate only through the app until you are comfortable. Don't share your residential address or workplace early."
          />
          <SafetyItem 
            icon={ShieldAlert} 
            title="Stay Alert" 
            desc="Never send money or share bank details. No genuine member will ask for financial help."
          />
          <SafetyItem 
            icon={Users} 
            title="Meeting in Person" 
            desc="Always meet in a public place. Inform a family member or friend about your whereabouts."
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: textColor }]}>Privacy & Well-being</Text>
          <TouchableOpacity style={[styles.rowItem, { backgroundColor: isDark ? '#1E1E1E' : '#F8F9FA' }]}>
            <Info size={20} color={deepPurple} />
            <Text style={[styles.rowText, { color: textColor }]}>Privacy Settings</Text>
            <ChevronRight size={18} color={mutedText} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rowItem, { backgroundColor: isDark ? '#1E1E1E' : '#F8F9FA' }]}>
            <Heart size={20} color="#FF4D4D" />
            <Text style={[styles.rowText, { color: textColor }]}>Mental Well-being</Text>
            <ChevronRight size={18} color={mutedText} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rowItem, { backgroundColor: isDark ? '#1E1E1E' : '#F8F9FA' }]}>
            <Flag size={20} color="#FF4D4D" />
            <Text style={[styles.rowText, { color: textColor }]}>Report a Profile</Text>
            <ChevronRight size={18} color={mutedText} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: textColor }]}>Cyber Crime Reporting</Text>
          <View style={[styles.cyberCard, { borderColor: accentColor }]}>
            <View style={styles.cyberHeader}>
              <Globe size={20} color={accentColor} />
              <Text style={[styles.cyberTitle, { color: accentColor }]}>National Cyber Crime Portal</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('https://cybercrime.gov.in')}>
              <Text style={styles.cyberLink}>www.cybercrime.gov.in</Text>
            </TouchableOpacity>
            <View style={styles.cyberHelpline}>
              <View style={styles.helplineItem}>
                <Phone size={16} color={mutedText} />
                <Text style={[styles.helplineText, { color: textColor }]}>Helpline: 1930</Text>
              </View>
              <View style={styles.helplineItem}>
                <Phone size={16} color="#FF4D4D" />
                <Text style={[styles.helplineText, { color: textColor }]}>Women Helpline: 1091</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.contactSection}>
          <Text style={[styles.sectionHeading, { color: textColor }]}>Contact Us</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBox}>
              <Phone size={20} color={deepPurple} />
              <Text style={[styles.contactLabel, { color: textColor }]}>Call Support</Text>
              <Text style={[styles.contactValue, { color: mutedText }]}>+91 1800-123-456</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactBox}>
              <Mail size={20} color={deepPurple} />
              <Text style={[styles.contactLabel, { color: textColor }]}>Email Us</Text>
              <Text style={[styles.contactValue, { color: mutedText }]}>support@punarmilan.com</Text>
            </TouchableOpacity>
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
    paddingVertical: 10,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(59, 30, 84, 0.03)',
    marginBottom: 20,
  },
  heroIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  safetyCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyContent: {
    flex: 1,
    marginLeft: 15,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  safetyDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  cyberCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  cyberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cyberTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cyberLink: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
    marginBottom: 15,
  },
  cyberHelpline: {
    gap: 8,
  },
  helplineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helplineText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactSection: {
    paddingHorizontal: 20,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBox: {
    flex: 1,
    padding: 15,
    backgroundColor: 'rgba(59, 30, 84, 0.03)',
    borderRadius: 15,
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  contactValue: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});
