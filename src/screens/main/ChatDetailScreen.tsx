import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
  Modal,
  Pressable,
  PermissionsAndroid,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { 
  ArrowLeft, Phone, Video, Send, 
  Paperclip, CheckCheck, ShieldCheck, 
  Image as ImageIcon, Camera, FileText, X, Smile,
  PhoneOff, Mic, MicOff, Volume2, VolumeX, VideoOff,
  Crown, Zap, Lock
} from 'lucide-react-native';
import { useSelector as useAppSelector } from 'react-redux';
import { RootState } from '../../store';


import { palette } from '../../theme/colors';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { 
  getMessages, sendMessage, getProfileById, resolvePhotoUrl,
  initiateCall, checkActiveIncomingCall,
  getMySubscription, getProfile, uploadMessageAttachment
} from '../../services/api';
import { showToast } from '../../utils/toast';
import { fonts } from "@/src/theme";

interface Message {
  id: string;
  text: string;
  senderId: string;
  sender: 'me' | 'them';
  time: string;
  status: 'sent' | 'delivered' | 'read';
}


export default function ChatDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  // ChatsScreen sends userId, but we also support id just in case
  const id = route.params?.userId || route.params?.id;
  
  const insets = useSafeAreaInsets();
  const auth = useAppSelector((state: RootState) => state.auth) as any;
  const user = auth.user;
  const isDark = false;

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [otherProfile, setOtherProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Subscription and custom toast states
  const [subscription, setSubscription] = useState<any>(null);
  const [subFetched, setSubFetched] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [initialScrolled, setInitialScrolled] = useState(false);
  const prevMessagesLength = useRef(0);

  const showCustomToast = (msg: string) => {
    showToast(msg);
  };



  const emojiCategories = [
    { title: '😊 Smileys', emojis: ['😊', '😂', '🥰', '😍', '🤗', '😇', '🥺', '😘', '😎', '🤩', '😋', '🙂', '😉', '🤭', '😏', '😌', '🥳', '💯', '🫶', '✨'] },
    { title: '❤️ Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🩷', '💕', '💖', '💗', '💓', '💘', '💝', '🫀', '💑', '💏'] },
    { title: '👋 Gestures', emojis: ['👋', '🤝', '👍', '👏', '🙏', '🤞', '✌️', '🤟', '💪', '👌', '🫡', '🙌', '🫶', '✋', '👐', '🤙'] },
    { title: '🌸 Nature', emojis: ['🌸', '🌺', '🌹', '🌷', '🌻', '🌼', '🌿', '🍀', '🌙', '⭐', '🌈', '☀️', '🦋', '🐦', '🌊', '🔥'] },
    { title: '🍕 Food', emojis: ['☕', '🍕', '🍔', '🎂', '🍫', '🍰', '🧁', '🍩', '🍿', '🥂', '🍷', '🫖', '🍜', '🍣', '🥗', '🍎'] },
  ];

  const handleEmojiPress = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const themeBg = isDark ? '#0F0F0F' : '#F8F9FA';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? '#F0F0F0' : '#1A1A1A';
  const mutedText = isDark ? '#A0A0A0' : '#6C757D';
  const accentColor = palette.gold.main;
  const deepPurple = '#3B1E54';

  const formatLastSeen = (lastSeenTime: string | null) => {
    if (!lastSeenTime) return "Offline";
    try {
      const date = new Date(lastSeenTime);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) {
        return "Active just now";
      }
      if (diffMins < 60) {
        return `Active ${diffMins}m ago`;
      }
      if (diffHours < 24) {
        return `Active ${diffHours}h ago`;
      }
      return `Active ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    } catch {
      return "Offline";
    }
  };

  const fetchOtherProfile = useCallback(async () => {
    if (!id) return;
    try {
      const res = await getProfileById(id as string);
      if (res.data.success) {
        const p = res.data.data;
        setOtherProfile({
          name: `${p.firstName || 'User'} ${p.lastName || ''}`,
          online: p.user?.isOnline || false,
          lastSeen: p.user?.lastSeen || null,
          photosLocked: p.photosLocked || false,
          photoVisibility: p.privacySettings?.photoVisibility || "All",
          photo: resolvePhotoUrl(
                   p.photos?.find((ph: any) => ph.isMain === true || ph.isMain === 1)?.url || 
                   p.photos?.[0]?.url ||
                   'https://api.dicebear.com/7.x/avataaars/png?seed=' + id
                 )
        });
      }
    } catch (error) {
      console.error("Fetch Profile Error:", error);
    }
  }, [id]);

  const fetchChatMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await getMessages(id as string);
      if (res.data.success) {
        const currentMyUserId = myUserId || user?.id;
        const mapped = res.data.data.map((msg: any) => ({
          id: String(msg.id),
          text: msg.content,
          senderId: msg.senderId,
          sender: msg.senderId === currentMyUserId ? 'me' : 'them',
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: msg.isRead ? 'read' : 'delivered'
        }));
        setMessages(mapped);
      }
    } catch (error) {
      console.error("Fetch Messages Error:", error);
    } finally {
      setLoading(false);
    }
  }, [id, myUserId, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchOtherProfile(), fetchChatMessages()]);
    } catch (error) {
      console.error("Refresh Error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOtherProfile, fetchChatMessages]);

  // Call Permissions Helper
  const requestCallPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn("Permissions request error:", err);
        return false;
      }
    }
    return true;
  };

  // Poll for incoming calls (focused screen only)
  useEffect(() => {
    if (!isFocused) return;
    const checkIncoming = async () => {
      try {
        const res = await checkActiveIncomingCall();
        if (res.data?.success && res.data.activeCall) {
          const call = res.data.activeCall;
          navigation.navigate("IncomingCall", {
            roomId: call.id,
            callerId: call.callerId,
            callerName: call.name,
            callerPhoto: call.photo,
            callType: call.type === 'video' ? 'video' : 'audio',
          });
        }
      } catch (err) {
        console.error("Check Incoming Call Error:", err);
      }
    };

    const incomingPoll = setInterval(checkIncoming, 4000);
    return () => clearInterval(incomingPoll);
  }, [isFocused, navigation]);

  const handlePlaceCall = async (type: 'audio' | 'video') => {
    if (!id) return;
    const hasPermissions = await requestCallPermissions();
    if (!hasPermissions) {
      Alert.alert("Permissions Required", "Camera and microphone permissions are required to make calls.");
      return;
    }
    try {
      const res = await initiateCall({ receiverId: id as string, type });
      if (res.data?.success) {
        navigation.navigate("VideoCall", {
          roomId: res.data.callId,
          userId: myUserId,
          callerName: otherProfile?.name,
          callerPhoto: otherProfile?.photo,
          callType: type,
        });
      } else {
        Alert.alert("Call Limit Reached", res.data?.message || "Failed to initiate call");
      }
    } catch (err: any) {
      console.error("Place Call Error:", err);
      Alert.alert("Error", err.response?.data?.message || "Calling limit reached. Upgrade your plan.");
    }
  };

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await getMySubscription();
        if (res.data && res.data.success) {
          setSubscription(res.data.subscription);
        }
      } catch (err) {
        console.error("Failed to fetch subscription in ChatDetailScreen:", err);
      } finally {
        setSubFetched(true);
      }
    };
    fetchSub();
  }, []);

  useEffect(() => {
    const init = async () => {
      let activeUserId = myUserId || user?.id;

      // 1. Fetch current user's profile to obtain correct myUserId if not loaded
      if (!activeUserId) {
        try {
          const res = await getProfile();
          if (res.data && res.data.success) {
            activeUserId = res.data.data.userId;
            setMyUserId(activeUserId);
          }
        } catch (err) {
          console.error("Failed to fetch my profile:", err);
        }
      }

      // 2. Fetch other user's profile
      await fetchOtherProfile();

      // 3. Fetch messages using the resolved activeUserId
      if (id) {
        try {
          const res = await getMessages(id as string);
          if (res.data.success) {
            const mapped = res.data.data.map((msg: any) => ({
              id: String(msg.id),
              text: msg.content,
              senderId: msg.senderId,
              sender: msg.senderId === activeUserId ? 'me' : 'them',
              time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: msg.isRead ? 'read' : 'delivered'
            }));
            setMessages(mapped);
          }
        } catch (error) {
          console.error("Fetch Messages Error:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    init();

    const interval = setInterval(() => {
      fetchOtherProfile();
      fetchChatMessages();
    }, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, [id, myUserId, user?.id, fetchOtherProfile, fetchChatMessages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && !initialScrolled) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        setInitialScrolled(true);
      }, 100);
    }
  }, [messages.length, initialScrolled]);

  // Scroll to bottom when a new message is sent or received
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  const handleSendMessage = async (textToSend: string = message) => {
    const trimmed = textToSend.trim();
    if (trimmed.length === 0 || !id) return;
    
    if (subFetched && !subscription) {
      showCustomToast('Premium is required to send messages.');
      return;
    }
    
    if (textToSend === message) {
      setMessage(''); // Clear input if it is the state message
    }

    try {
      const res = await sendMessage({ receiverId: id as string, content: trimmed });
      if (res.data.success) {
        await fetchChatMessages();
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error: any) {
      console.error("Send Message Error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to send message");
    }
  };

  const handleAttachment = () => {
    setShowAttachModal(true);
  };

  const pickFromGallery = async () => {
    if (subFetched && !subscription) {
      showCustomToast('Premium is required to send messages.');
      return;
    }
    if (Platform.OS === 'android') {
      try {
        let storagePermissionString = '';
        if (Number(Platform.Version) < 33) {
          storagePermissionString = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        } else {
          storagePermissionString = (PermissionsAndroid.PERMISSIONS as any).READ_MEDIA_IMAGES || 'android.permission.READ_MEDIA_IMAGES';
        }
        const hasStoragePermission = await PermissionsAndroid.check(storagePermissionString as any);
        if (!hasStoragePermission) {
          const status = await PermissionsAndroid.request(storagePermissionString as any);
          if (status !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert("Permission Denied", "Storage permission is required to select photos. Please enable it in Settings.");
            return;
          }
        }
      } catch (err) {
        console.warn("Storage permission check error:", err);
      }
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (!asset.uri) {
        Alert.alert("Error", "Invalid image URI selected.");
        return;
      }
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `photo_${Date.now()}.jpg`,
      } as any);

      setLoading(true);
      const res = await uploadMessageAttachment(formData);
      if (res.data?.success && res.data.url) {
        await handleSendMessage(`[IMAGE]:${res.data.url}`);
      } else {
        Alert.alert("Error", `Failed to upload image: ${res.data?.message || JSON.stringify(res.data) || 'Unknown error'}`);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      Alert.alert("Error", "Could not open system gallery.");
    }
  };

  const openCamera = async () => {
    if (subFetched && !subscription) {
      showCustomToast('Premium is required to send messages.');
      return;
    }
    if (Platform.OS === 'android') {
      try {
        const hasCameraPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (!hasCameraPermission) {
          const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
          if (status !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert("Permission Denied", "Camera permission is required to capture photos. Please enable it in Settings.");
            return;
          }
        }
      } catch (err) {
        console.warn("Camera permission check error:", err);
      }
    }

    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (!asset.uri) {
        Alert.alert("Error", "Invalid photo URI captured.");
        return;
      }
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `camera_${Date.now()}.jpg`,
      } as any);

      setLoading(true);
      const res = await uploadMessageAttachment(formData);
      if (res.data?.success && res.data.url) {
        await handleSendMessage(`[IMAGE]:${res.data.url}`);
      } else {
        Alert.alert("Error", `Failed to upload image: ${res.data?.message || JSON.stringify(res.data) || 'Unknown error'}`);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      Alert.alert("Error", "Could not open camera.");
    }
  };

  const pickDocument = async () => {
    if (subFetched && !subscription) {
      showCustomToast('Premium is required to send messages.');
      return;
    }
    try {
      const [doc] = await pick({
        type: [types.allFiles],
        allowMultiSelection: false,
      });
      if (doc) {
        if (!doc.uri) {
          Alert.alert("Error", "Invalid document URI selected.");
          return;
        }
        const formData = new FormData();
        formData.append('file', {
          uri: Platform.OS === 'android' ? doc.uri : doc.uri.replace('file://', ''),
          type: doc.type || 'application/octet-stream',
          name: doc.name || `document_${Date.now()}`,
        } as any);

        setLoading(true);
        const res = await uploadMessageAttachment(formData);
        if (res.data?.success && res.data.url) {
          await handleSendMessage(`[DOCUMENT]:${res.data.url}|${doc.name || 'Document'}`);
        } else {
          Alert.alert("Error", `Failed to upload document: ${res.data?.message || JSON.stringify(res.data) || 'Unknown error'}`);
          setLoading(false);
        }
      }
    } catch (err) {
      setLoading(false);
      if (!(isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED)) {
        Alert.alert('Error', 'Failed to pick a document. Please try again.');
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'me';
    const isImage = item.text.startsWith('[IMAGE]:');
    const imageUrl = isImage ? item.text.substring(8) : '';
    const isDoc = item.text.startsWith('[DOCUMENT]:');
    let docUrl = '';
    let docName = 'Document';
    if (isDoc) {
      const parts = item.text.substring(11).split('|');
      docUrl = parts[0];
      docName = parts[1] || 'Document';
    }

    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        {!isMe && (
          <Image 
            source={{ uri: otherProfile?.photo || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + id }} 
            style={styles.messageAvatar} 
          />
        )}
        <View style={[
          styles.messageBubble, 
          isMe ? { backgroundColor: deepPurple } : { backgroundColor: cardBg },
          isImage && { padding: 4, borderRadius: 12, overflow: 'hidden', maxWidth: '70%' },
          isDoc && { padding: 4, borderRadius: 12, overflow: 'hidden', maxWidth: '75%' }
        ]}>
          {isImage ? (
            <Image 
              source={{ uri: resolvePhotoUrl(imageUrl) }} 
              style={styles.chatImageMessage} 
              resizeMode="cover"
            />
          ) : isDoc ? (
            <TouchableOpacity 
              style={[
                styles.docMessageContainer, 
                { backgroundColor: isMe ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
              ]}
              onPress={() => {
                import('react-native').then(({ Linking }) => {
                  Linking.openURL(resolvePhotoUrl(docUrl)).catch(err => {
                    console.error("Failed to open link:", err);
                    Alert.alert("Error", "Could not open document link.");
                  });
                });
              }}
            >
              <View style={styles.docIconBox}>
                <FileText size={24} color={isMe ? accentColor : '#3B1E54'} />
              </View>
              <View style={styles.docInfoBox}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.docNameText, { color: isMe ? '#FFF' : textColor }]}>
                  {docName}
                </Text>
                <Text style={[styles.docActionText, { color: isMe ? 'rgba(255,255,255,0.7)' : mutedText }]}>
                  Tap to view / download
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.messageText, { color: isMe ? '#FFF' : textColor }]}>
              {item.text}
            </Text>
          )}
          <View style={[
            styles.messageMeta, 
            isImage && { paddingHorizontal: 8, paddingBottom: 4, paddingTop: 2 },
            isDoc && { paddingHorizontal: 8, paddingBottom: 4, paddingTop: 2 }
          ]}>
            <Text style={[styles.messageTime, { color: isMe ? 'rgba(255,255,255,0.6)' : mutedText }]}>
              {item.time}
            </Text>
            {isMe && (
              <CheckCheck size={14} color={item.status === 'read' ? accentColor : 'rgba(255,255,255,0.4)'} />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeBg }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#222' : '#EEE', backgroundColor: cardBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={textColor} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.profileSection}
          onPress={() => navigation.navigate("ProfileDetail", { id })}
        >
          <View style={{ position: 'relative' }}>
            <Image 
              source={{ uri: otherProfile?.photo || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + id }} 
              style={styles.headerAvatar} 
              blurRadius={otherProfile?.photosLocked && (otherProfile?.photoVisibility === 'Verified' || otherProfile?.photoVisibility === 'Selected') ? (Platform.OS === 'ios' ? 10 : 5) : undefined}
            />
            {otherProfile?.photosLocked && (otherProfile?.photoVisibility === 'Verified' || otherProfile?.photoVisibility === 'Selected') && (
              <View style={styles.avatarLockOverlay}>
                <Lock size={12} color={palette.gold.main} />
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: textColor }]}>
              {otherProfile?.name || 'User'}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.onlineDot, { backgroundColor: otherProfile?.online ? '#4CAF50' : '#9E9E9E' }]} />
              <Text style={[styles.onlineText, { color: otherProfile?.online ? '#4CAF50' : '#7E6B8F' }]}>
                {otherProfile?.online ? 'Active now' : formatLastSeen(otherProfile?.lastSeen)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionIcon} onPress={() => handlePlaceCall('audio')}>
            <Phone size={22} color={deepPurple} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => handlePlaceCall('video')}>
            <Video size={22} color={deepPurple} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.safetyBanner}>
        <ShieldCheck size={14} color={accentColor} />
        <Text style={styles.safetyText}>End-to-end encrypted. Follow Safety Guidelines.</Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[deepPurple]}
              tintColor={deepPurple}
            />
          }
        />

        {/* Emoji Picker Panel */}
        {showEmojiPicker && (
          <View style={[styles.emojiPanel, { backgroundColor: cardBg }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {emojiCategories.map((category) => (
                <View key={category.title} style={styles.emojiCategory}>
                  <Text style={[styles.emojiCategoryTitle, { color: mutedText }]}>{category.title}</Text>
                  <View style={styles.emojiGrid}>
                    {category.emojis.map((emoji, index) => (
                      <TouchableOpacity
                        key={`${category.title}-${index}`}
                        style={styles.emojiItem}
                        onPress={() => handleEmojiPress(emoji)}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: cardBg,
            paddingBottom: Math.max(insets.bottom, 20) 
          }
        ]}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttachment}>
            <Paperclip size={22} color={mutedText} />
          </TouchableOpacity>
          <View style={[styles.textInputWrapper, { backgroundColor: isDark ? '#252525' : '#F5F5F5' }]}>
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Type a message..."
              placeholderTextColor={mutedText}
              value={message}
              onChangeText={setMessage}
              multiline
              onFocus={() => setShowEmojiPicker(false)}
            />
            <TouchableOpacity 
              style={styles.emojiBtn} 
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={22} color={showEmojiPicker ? accentColor : mutedText} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: deepPurple }]} 
            onPress={() => handleSendMessage()}
          >
            <Send size={20} color={accentColor} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Attachment Modal */}
      <Modal
        visible={showAttachModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAttachModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowAttachModal(false)}
        >
          <View style={[styles.attachModalContent, { backgroundColor: cardBg }]}>
            <View style={styles.attachModalHeader}>
              <Text style={[styles.attachModalTitle, { color: textColor }]}>Attach File</Text>
              <TouchableOpacity onPress={() => setShowAttachModal(false)}>
                <X size={24} color={mutedText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.attachOptionsRow}>
              <TouchableOpacity 
                style={styles.attachOption}
                onPress={() => {
                  setShowAttachModal(false);
                  pickFromGallery();
                }}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: '#E3F2FD' }]}>
                  <ImageIcon size={24} color="#1976D2" />
                </View>
                <Text style={[styles.attachOptionLabel, { color: textColor }]}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.attachOption}
                onPress={() => {
                  setShowAttachModal(false);
                  openCamera();
                }}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: '#F3E5F5' }]}>
                  <Camera size={24} color="#7B1FA2" />
                </View>
                <Text style={[styles.attachOptionLabel, { color: textColor }]}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.attachOption}
                onPress={() => {
                  setShowAttachModal(false);
                  pickDocument();
                }}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: '#FFF3E0' }]}>
                  <FileText size={24} color="#F57C00" />
                </View>
                <Text style={[styles.attachOptionLabel, { color: textColor }]}>Document</Text>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 5,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerInfo: {
    marginLeft: 10,
  },
  headerName: {
    fontSize: 16,
    ...fonts.bold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  onlineText: {
    fontSize: 11,
    color: '#4CAF50',
    marginLeft: 5,
    ...fonts.semibold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionIcon: {
    padding: 5,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 30, 84, 0.05)',
    paddingVertical: 6,
    gap: 6,
  },
  safetyText: {
    fontSize: 11,
    color: '#3B1E54',
    ...fonts.medium,
  },
  messageList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 15,
    maxWidth: '85%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
  },
  theirMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  attachBtn: {
    padding: 10,
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginHorizontal: 5,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  emojiBtn: {
    padding: 5,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiPanel: {
    maxHeight: 250,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 10,
  },
  emojiCategory: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  emojiCategoryTitle: {
    fontSize: 12,
    ...fonts.semibold,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  emojiItem: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  emojiText: {
    fontSize: 26,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  attachModalContent: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  attachModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  attachModalTitle: {
    fontSize: 18,
    ...fonts.bold,
  },
  attachOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  attachOption: {
    alignItems: 'center',
    gap: 10,
  },
  attachIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachOptionLabel: {
    fontSize: 13,
    ...fonts.semibold,
  },
  callContainer: {
    flex: 1,
    backgroundColor: '#150824',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  callInfoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  avatarPulseWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    backgroundColor: '#231238',
  },
  largeCallAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  callNameText: {
    fontSize: 24,
    ...fonts.bold,
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  callStatusText: {
    fontSize: 16,
    color: '#D4AF37',
    ...fonts.semibold,
    letterSpacing: 1,
  },
  callSubText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
  },
  callControlsRow: {
    width: '100%',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  activeCallControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 15,
    borderRadius: 30,
  },
  callBtnCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  declineBtn: {
    backgroundColor: '#FF3B30',
  },
  acceptBtn: {
    backgroundColor: '#34C759',
  },
  hangupBtn: {
    backgroundColor: '#FF3B30',
  },
  controlOptionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlOptionBtnActive: {
    backgroundColor: '#3B1E54',
    borderColor: '#D4AF37',
    borderWidth: 1,
  },
  videoStreamContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  fullScreenVideoPlaceholder: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  videoOverlayDarkener: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoTopInfo: {
    position: 'absolute',
    top: 40,
    width: '100%',
    alignItems: 'center',
  },
  callDurationText: {
    fontSize: 16,
    color: '#FFF',
    ...fonts.semibold,
    marginTop: 5,
  },
  localPipBox: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D4AF37',
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
    elevation: 10,
  },
  localPipPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  localPipText: {
    color: '#FFF',
    fontSize: 11,
    ...fonts.semibold,
  },
  chatImageMessage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  docMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    maxWidth: 240,
    gap: 12,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfoBox: {
    flex: 1,
    justifyContent: 'center',
  },
  docNameText: {
    fontSize: 14,
    ...fonts.semibold,
  },
  docActionText: {
    fontSize: 11,
    marginTop: 2,
  },
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(59, 30, 84, 0.96)',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#3B1E54',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    ...fonts.semibold,
    letterSpacing: 0.3,
  },
  livekitRoom: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  callInnerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullScreenVideo: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  localPipVideo: {
    width: '100%',
    height: '100%',
  },
  avatarLockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 30, 84, 0.45)',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});
