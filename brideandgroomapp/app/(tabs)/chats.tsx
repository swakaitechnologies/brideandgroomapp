import React, { useState, useLayoutEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  FlatList,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MessageSquare, Bell, Shield, Phone, Video, 
  Search, CheckCheck, Circle, User, 
  ShieldAlert, Info, Flag, ChevronRight,
  Menu, X
} from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';
import { palette } from '@/src/theme/colors';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { openDrawer } from '@/src/store/uiSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/src/store';

const { width } = Dimensions.get('window');

type ChatTab = 'All' | 'Unread' | 'Calls';

export default function ChatsScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { mode } = useSelector((state: RootState) => state.theme);
  const isDark = mode === 'dark';
  
  const [activeTab, setActiveTab] = useState<ChatTab>('All');
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const themeBg = isDark ? '#0F0F0F' : '#F8F9FA';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? '#F0F0F0' : '#1A1A1A';
  const mutedText = isDark ? '#A0A0A0' : '#6C757D';
  const accentColor = palette.gold.main;
  const deepPurple = '#3B1E54';

  // Override Header to include Shield Icon
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Messages',
      headerLeft: () => (
        <TouchableOpacity 
          style={{ marginLeft: 15 }} 
          onPress={() => dispatch(openDrawer())}
        >
          <Menu size={28} color={textColor} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
          <TouchableOpacity onPress={() => setShowSafetyModal(true)} style={{ marginRight: 15 }}>
            <Shield size={26} color={accentColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/inbox')}>
            <Bell size={26} color={textColor} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, textColor, accentColor, dispatch]);

  const activeUsers = [
    { id: '1', name: 'Priya', photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5' },
    { id: '2', name: 'Ananya', photo: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f' },
    { id: '3', name: 'Sneha', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2' },
    { id: '4', name: 'Ritu', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd8c' },
    { id: '5', name: 'Kavya', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' },
  ];

  const chatList = [
    { id: '1', name: 'Priya Sharma', lastMsg: 'Hey, how are you doing today?', time: '10:45 AM', unread: 2, online: true, photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5' },
    { id: '2', name: 'Ananya Gupta', lastMsg: 'I checked your profile and really liked it.', time: 'Yesterday', unread: 0, online: true, photo: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f' },
    { id: '3', name: 'Rahul V.', lastMsg: 'Can we schedule a call for tomorrow?', time: '2 days ago', unread: 0, online: false, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' },
  ];

  const callHistory = [
    { id: '1', name: 'Priya Sharma', type: 'video', status: 'missed', time: 'Today, 2:30 PM', photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5' },
    { id: '2', name: 'Ananya Gupta', type: 'audio', status: 'incoming', time: 'Yesterday, 8:15 PM', photo: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f' },
  ];

  const renderChatItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.chatCard, { backgroundColor: cardBg }]}
      onPress={() => router.push(`/chat/${item.id}` as any)}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.photo }} style={styles.chatAvatar} />
        {item.online && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: textColor }]}>{item.name}</Text>
          <Text style={[styles.chatTime, { color: mutedText }]}>{item.time}</Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={[styles.lastMsg, { color: mutedText }]} numberOfLines={1}>{item.lastMsg}</Text>
          {item.unread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCallItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.chatCard, { backgroundColor: cardBg }]}
      onPress={() => router.push(`/chat/${item.id}` as any)}
    >
      <Image source={{ uri: item.photo }} style={styles.chatAvatar} />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: textColor }]}>{item.name}</Text>
          <Text style={[styles.chatTime, { color: mutedText }]}>{item.time}</Text>
        </View>
        <View style={styles.chatFooter}>
          <View style={styles.callStatus}>
            {item.type === 'video' ? <Video size={14} color={mutedText} /> : <Phone size={14} color={mutedText} />}
            <Text style={[styles.lastMsg, { color: item.status === 'missed' ? '#FF4D4D' : mutedText }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)} {item.type} call
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.callBtn}>
        {item.type === 'video' ? <Video size={20} color={deepPurple} /> : <Phone size={20} color={deepPurple} />}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeBg }} edges={['left', 'right']}>
      {/* Search Bar Placeholder */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: cardBg }]}>
          <Search size={20} color={mutedText} />
          <Text style={[styles.searchText, { color: mutedText }]}>Search messages or calls...</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['All', 'Unread', 'Calls'] as ChatTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabItem,
              activeTab === tab && { borderBottomColor: accentColor }
            ]}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? deepPurple : mutedText },
              activeTab === tab && { fontWeight: '800' }
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'All' && (
          <View style={styles.activeUsersSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Active Matches</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeUsersScroll}>
              {activeUsers.map((user) => (
                <TouchableOpacity key={user.id} style={styles.activeUserItem}>
                  <View style={styles.activeAvatarContainer}>
                    <Image source={{ uri: user.photo }} style={styles.activeAvatar} />
                    <View style={styles.statusBadge} />
                  </View>
                  <Text style={[styles.activeUserName, { color: textColor }]} numberOfLines={1}>{user.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.listSection}>
          {activeTab === 'Calls' ? (
            callHistory.map((item) => (
              <React.Fragment key={item.id}>
                {renderCallItem({ item })}
              </React.Fragment>
            ))
          ) : (
            chatList
              .filter(c => activeTab === 'Unread' ? c.unread > 0 : true)
              .map((item) => (
                <React.Fragment key={item.id}>
                  {renderChatItem({ item })}
                </React.Fragment>
              ))
          )}
        </View>
      </ScrollView>

      {/* Safety Modal */}
      <Modal
        visible={showSafetyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSafetyModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowSafetyModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <View style={styles.shieldIconContainer}>
                <Shield size={32} color={accentColor} />
              </View>
              <Text style={[styles.modalTitle, { color: textColor }]}>Safety First</Text>
              <Text style={[styles.modalSub, { color: mutedText }]}>Your security is our top priority</Text>
            </View>

            <View style={styles.safetyGrid}>
              <TouchableOpacity style={styles.safetyItem}>
                <View style={styles.safetyIconBox}>
                  <User size={24} color={deepPurple} />
                </View>
                <View style={styles.safetyTextInfo}>
                  <Text style={[styles.safetyItemTitle, { color: textColor }]}>Know Person First</Text>
                  <Text style={[styles.safetyItemDesc, { color: mutedText }]}>Verify through chats and social profiles.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.safetyItem}>
                <View style={styles.safetyIconBox}>
                  <ShieldAlert size={24} color={deepPurple} />
                </View>
                <View style={styles.safetyTextInfo}>
                  <Text style={[styles.safetyItemTitle, { color: textColor }]}>Stay Alert</Text>
                  <Text style={[styles.safetyItemDesc, { color: mutedText }]}>Never share OTPs or financial details.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.safetyItem}>
                <View style={styles.safetyIconBox}>
                  <Flag size={24} color="#FF4D4D" />
                </View>
                <View style={styles.safetyTextInfo}>
                  <Text style={[styles.safetyItemTitle, { color: textColor }]}>Report User</Text>
                  <Text style={[styles.safetyItemDesc, { color: mutedText }]}>Flag suspicious behavior immediately.</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.moreSafetyBtn, { backgroundColor: deepPurple }]}
              onPress={() => {
                setShowSafetyModal(false);
                router.push('/safety');
              }}
            >
              <Text style={[styles.moreSafetyText, { color: accentColor }]}>GET MORE SAFETY TIPS</Text>
              <ChevronRight size={16} color={accentColor} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeModalBtn}
              onPress={() => setShowSafetyModal(false)}
            >
              <X size={20} color={mutedText} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    padding: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchText: {
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 25,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeUsersSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  activeUsersScroll: {
    paddingHorizontal: 15,
    gap: 15,
  },
  activeUserItem: {
    alignItems: 'center',
    width: 60,
  },
  activeAvatarContainer: {
    position: 'relative',
  },
  activeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  activeUserName: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  listSection: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 15,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '800',
  },
  chatTime: {
    fontSize: 11,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMsg: {
    fontSize: 13,
    flex: 1,
  },
  unreadBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    color: '#3B1E54',
    fontSize: 10,
    fontWeight: '900',
  },
  callStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 30, 84, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 25,
    padding: 24,
    position: 'relative',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  shieldIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 14,
    marginTop: 5,
  },
  safetyGrid: {
    gap: 15,
    marginBottom: 25,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(59, 30, 84, 0.03)',
    borderRadius: 16,
    gap: 15,
  },
  safetyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 2 },
    }),
  },
  safetyTextInfo: {
    flex: 1,
  },
  safetyItemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  safetyItemDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  moreSafetyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 15,
    gap: 10,
  },
  moreSafetyText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeModalBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 5,
  },
});
