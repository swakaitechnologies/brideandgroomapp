import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, Phone, Video, Send, 
  MoreVertical, Smile, Paperclip, 
  CheckCheck, ShieldCheck, Image as ImageIcon,
  Camera, FileText, X
} from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';
import { palette } from '@/src/theme/colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useSelector((state: RootState) => state.theme);
  const isDark = mode === 'dark';

  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! I really liked your profile.', sender: 'them', time: '10:40 AM', status: 'read' },
    { id: '2', text: 'Thank you! I found your interests quite similar to mine.', sender: 'me', time: '10:42 AM', status: 'read' },
    { id: '3', text: 'That is great to hear. Are you free for a quick call tomorrow?', sender: 'them', time: '10:45 AM', status: 'read' },
    { id: '4', text: 'Yes, absolutely. What time works for you?', sender: 'me', time: '10:46 AM', status: 'delivered' },
  ]);

  const handleSendMessage = () => {
    if (message.trim().length === 0) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const handleAttachment = () => {
    setShowAttachModal(true);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photo library to share images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      const attachment: Message = {
        id: Date.now().toString(),
        text: `📷 Photo attached`,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      };
      setMessages(prev => [...prev, attachment]);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your camera to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const attachment: Message = {
        id: Date.now().toString(),
        text: `📸 Camera photo attached`,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      };
      setMessages(prev => [...prev, attachment]);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const doc = result.assets[0];
        const attachment: Message = {
          id: Date.now().toString(),
          text: `📎 ${doc.name || 'Document attached'}`,
          sender: 'me',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
        };
        setMessages(prev => [...prev, attachment]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick a document. Please try again.');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        {!isMe && (
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5' }} 
            style={styles.messageAvatar} 
          />
        )}
        <View style={[
          styles.messageBubble, 
          isMe ? { backgroundColor: deepPurple } : { backgroundColor: cardBg }
        ]}>
          <Text style={[styles.messageText, { color: isMe ? '#FFF' : textColor }]}>
            {item.text}
          </Text>
          <View style={styles.messageMeta}>
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
      <View style={[styles.header, { borderBottomColor: isDark ? '#222' : '#EEE' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={textColor} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.profileSection}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5' }} 
            style={styles.headerAvatar} 
          />
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: textColor }]}>Priya Sharma</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionIcon} onPress={() => {/* Trigger Audio Call */}}>
            <Phone size={22} color={deepPurple} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => {/* Trigger Video Call */}}>
            <Video size={22} color={deepPurple} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.safetyBanner}>
        <ShieldCheck size={14} color={accentColor} />
        <Text style={styles.safetyText}>End-to-end encrypted. Follow Safety Guidelines.</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
            onPress={handleSendMessage}
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
    fontWeight: '800',
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
    fontWeight: '600',
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
    fontWeight: '500',
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
    fontWeight: '700',
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
    fontWeight: '800',
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
    fontWeight: '700',
  },
});
