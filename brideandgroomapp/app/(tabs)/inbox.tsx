import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Bell, Mail, CheckCircle, Send, MoreHorizontal, 
  UserCheck, Users, Eye, Trash2, Camera,
  ChevronRight, Clock, Star, ShieldCheck
} from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';
import { palette } from '@/src/theme/colors';

const { width } = Dimensions.get('window');

type MainTab = 'Received' | 'Accepted' | 'Contacts' | 'Sent' | 'More';

export default function InboxScreen() {
  const { mode } = useSelector((state: RootState) => state.theme);
  const isDark = mode === 'dark';
  
  const [activeTab, setActiveTab] = useState<MainTab>('Received');
  const [subTab, setSubTab] = useState<string>('');

  const themeBg = isDark ? '#0F0F0F' : '#F8F9FA';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? '#F0F0F0' : '#1A1A1A';
  const mutedText = isDark ? '#A0A0A0' : '#6C757D';
  const accentColor = palette.gold.main;
  const deepPurple = '#3B1E54';

  const mainTabs: MainTab[] = ['Received', 'Accepted', 'Contacts', 'Sent', 'More'];

  // Dummy data generators
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.notificationCard, { backgroundColor: cardBg }]}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.photo }} style={styles.avatar} />
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: textColor }]}>{item.name}</Text>
            {item.isPremium && <Star size={12} color={accentColor} fill={accentColor} />}
          </View>
          <Text style={[styles.userMeta, { color: mutedText }]}>{item.age} yrs • {item.city}</Text>
        </View>
        <Text style={[styles.timeText, { color: mutedText }]}>{item.time}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={[styles.messageText, { color: textColor }]}>{item.message}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.primaryAction, { backgroundColor: deepPurple }]}>
          <Text style={[styles.primaryActionText, { color: accentColor }]}>
            {activeTab === 'Received' ? 'Accept' : 'View Profile'}
          </Text>
        </TouchableOpacity>
        {activeTab === 'Received' && (
          <TouchableOpacity style={styles.secondaryAction}>
            <Text style={[styles.secondaryActionText, { color: '#FF4D4D' }]}>Decline</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const getSubTabs = () => {
    switch (activeTab) {
      case 'Accepted':
        return ['Accepted by Her', 'Accepted By Me'];
      case 'Contacts':
        return ['Contact Viewed', 'Viewed You'];
      case 'More':
        return ['Requests', 'Deleted'];
      default:
        return [];
    }
  };

  const subTabs = getSubTabs();

  // Set default subTab when activeTab changes
  React.useEffect(() => {
    if (subTabs.length > 0) {
      setSubTab(subTabs[0]);
    } else {
      setSubTab('');
    }
  }, [activeTab]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeBg }} edges={['left', 'right']}>
      {/* Header Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: cardBg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {mainTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabItem,
                activeTab === tab && styles.activeTabItem,
                { borderBottomColor: activeTab === tab ? accentColor : 'transparent' }
              ]}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab ? deepPurple : mutedText },
                activeTab === tab && styles.activeTabText
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sub Tabs / Filters */}
      {subTabs.length > 0 && (
        <View style={styles.subTabsContainer}>
          {subTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSubTab(tab)}
              style={[
                styles.subTabItem,
                subTab === tab ? { backgroundColor: deepPurple } : { backgroundColor: cardBg }
              ]}
            >
              <Text style={[
                styles.subTabText,
                { color: subTab === tab ? accentColor : textColor }
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content Area */}
      <FlatList
        data={dummyData[activeTab] || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Primary Admin Alert */}
            <View style={[styles.adminCard, { backgroundColor: deepPurple }]}>
              <View style={styles.adminHeader}>
                <View style={[styles.adminBadge, { backgroundColor: accentColor }]}>
                  <ShieldCheck size={12} color={deepPurple} />
                  <Text style={styles.adminBadgeText}>OFFICIAL</Text>
                </View>
                <Text style={styles.adminTime}>Just now</Text>
              </View>
              <Text style={styles.adminTitle}>Complete Your KYC Verification</Text>
              <Text style={styles.adminMessage}>
                Verified profiles get 3x more interests. Upload your ID proof to get the 'Trust Badge' today.
              </Text>
              <TouchableOpacity style={[styles.adminAction, { borderColor: accentColor }]}>
                <Text style={[styles.adminActionText, { color: accentColor }]}>Verify Now</Text>
                <ChevronRight size={14} color={accentColor} />
              </TouchableOpacity>
            </View>

            {/* Secondary Admin Note */}
            <View style={[styles.adminMiniCard, { backgroundColor: isDark ? '#252525' : '#F0F7FF' }]}>
              <Bell size={16} color={isDark ? accentColor : deepPurple} />
              <Text style={[styles.adminMiniText, { color: textColor }]}>
                Success Story: Rahul & Sneha found their match! <Text style={{ fontWeight: 'bold', color: accentColor }}>Read More</Text>
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Mail size={64} color={mutedText} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Notifications Yet</Text>
            <Text style={[styles.emptySub, { color: mutedText }]}>
              When you interact with others, you'll see your requests and updates here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const dummyData: any = {
  Received: [
    { id: '1', name: 'Sonia Sharma', age: 24, city: 'Delhi', time: '2h ago', message: 'Sent you an interest request', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', isPremium: true },
    { id: '2', name: 'Ritu Verma', age: 26, city: 'Mumbai', time: '5h ago', message: 'Sent you an interest request', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', isPremium: false },
  ],
  Accepted: [
    { id: '3', name: 'Kavya Singh', age: 25, city: 'Bangalore', time: '1d ago', message: 'You accepted her interest request', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd8c', isPremium: true },
  ],
  Sent: [
    { id: '4', name: 'Ishita Gupta', age: 23, city: 'Pune', time: '3h ago', message: 'Interest request sent', photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1', isPremium: false },
  ],
};

const styles = StyleSheet.create({
  tabsContainer: {
    paddingTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tabsScroll: {
    paddingHorizontal: 15,
    gap: 15,
  },
  tabItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 3,
  },
  activeTabItem: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '800',
  },
  subTabsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  subTabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: 20,
    gap: 12,
  },
  adminCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  adminTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  adminMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    marginBottom: 15,
  },
  adminAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  adminActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  adminMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  adminMiniText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  notificationCard: {
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
  },
  userMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    alignSelf: 'flex-start',
  },
  cardContent: {
    marginTop: 10,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryAction: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.2)',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
});
