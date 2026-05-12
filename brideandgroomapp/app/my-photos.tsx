import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { 
  ArrowLeft, Plus, Trash2, Star, 
  Shield, Check, X, Camera,
  Image as ImageIcon, MoreVertical,
  ChevronRight, AlertCircle, UserCheck, 
  FileDigit, Info, EyeOff
} from 'lucide-react-native';
import { router } from 'expo-router';
import { palette } from '@/src/theme/colors';
import { getPhotos, uploadPhotos, deletePhoto, setPrimaryPhoto, getPrivacySettings, updatePrivacySettings } from '@/src/services/api';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = (width - 60) / COLUMN_COUNT;

export default function MyPhotosScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [privacy, setPrivacy] = useState<any>(null);
  
  // Privacy Modal
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [selectedPrivacy, setSelectedPrivacy] = useState("All");

  const privacyOptions = [
    { label: "Visible to All Members", value: "All" },
    { label: "Visible to Members I Liked", value: "Selected" },
    { label: "Visible to All Premium Members", value: "Verified" },
    { label: "Only Visible to Members I Liked", value: "None" }, // Mapping None to stricter liked logic as requested
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [photoRes, privacyRes] = await Promise.all([
        getPhotos(),
        getPrivacySettings()
      ]);
      setPhotos(photoRes.data.data || []);
      setPrivacy(privacyRes.data.data);
      setSelectedPrivacy(privacyRes.data.data?.photoVisibility || "All");
    } catch (error) {
      console.error("Fetch Data Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      handleUpload(result.assets);
    }
  };

  const handleUpload = async (assets: any[]) => {
    setUploading(true);
    const formData = new FormData();
    
    assets.forEach((asset, index) => {
      const filename = asset.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;
      
      formData.append('photos', {
        uri: asset.uri,
        name: filename || `photo_${index}.jpg`,
        type,
      } as any);
    });

    try {
      await uploadPhotos(formData);
      Alert.alert("Success", "Photos uploaded successfully.");
      fetchData();
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert("Error", "Failed to upload photos.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deletePhoto(id);
              fetchData();
            } catch (error) {
              Alert.alert("Error", "Failed to delete photo.");
            }
          }
        }
      ]
    );
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimaryPhoto(id);
      fetchData();
      Alert.alert("Success", "Primary photo updated.");
    } catch (error) {
      Alert.alert("Error", "Failed to update primary photo.");
    }
  };

  const handleUpdatePrivacy = async () => {
    try {
      await updatePrivacySettings({ photoVisibility: selectedPrivacy });
      setPrivacyModalVisible(false);
      fetchData();
      Alert.alert("Success", "Privacy settings updated.");
    } catch (error) {
      Alert.alert("Error", "Failed to update privacy settings.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={palette.gold.main} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={palette.purple.deep} />
        </TouchableOpacity>
        <Text style={styles.title}>My Photos</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={handlePickImage}
          disabled={uploading}
        >
          {uploading ? <ActivityIndicator size="small" color={palette.gold.main} /> : <Plus size={24} color={palette.gold.main} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <ImageIcon size={20} color={palette.gold.main} />
          <Text style={styles.infoText}>
            You can add up to 5 photos. High-quality photos get 10x more responses.
          </Text>
        </View>

        {/* Gallery Grid */}
        <View style={styles.grid}>
          {photos.map((item) => (
            <View key={item.id} style={styles.photoWrapper}>
              <Image source={{ uri: item.url }} style={styles.photo} />
              {item.isPrimary && (
                <View style={styles.primaryBadge}>
                  <Star size={12} color={palette.purple.deep} fill={palette.purple.deep} />
                  <Text style={styles.primaryText}>Main</Text>
                </View>
              )}
              <View style={styles.actionOverlay}>
                <TouchableOpacity 
                  style={styles.iconBtn} 
                  onPress={() => handleSetPrimary(item.id)}
                  disabled={item.isPrimary}
                >
                  <Star size={18} color={item.isPrimary ? palette.gold.main : "#FFFFFF"} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.iconBtn, styles.deleteBtn]} 
                  onPress={() => handleDelete(item.id)}
                >
                  <Trash2 size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {item.status === 'pending' && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending Approval</Text>
                </View>
              )}
            </View>
          ))}
          
          {photos.length < 5 && (
            <TouchableOpacity style={styles.placeholder} onPress={handlePickImage}>
              <Camera size={30} color={palette.purple.muted} />
              <Text style={styles.placeholderText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Privacy Section */}
        <View style={styles.sectionHeader}>
          <Shield size={20} color={palette.purple.deep} />
          <Text style={styles.sectionTitle}>Photo Privacy</Text>
        </View>

        <TouchableOpacity 
          style={styles.privacyCard}
          onPress={() => setPrivacyModalVisible(true)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.privacyLabel}>Who can see your photos?</Text>
            <Text style={styles.privacyValue}>
              {privacyOptions.find(o => o.value === privacy?.photoVisibility)?.label || "All Members"}
            </Text>
          </View>
          <ChevronRight size={20} color={palette.neutral.grey} />
        </TouchableOpacity>

        {/* 10. Photo Guidelines */}
        <View style={styles.guidelinesCard}>
          <View style={styles.guidelineHeader}>
            <AlertCircle size={20} color={palette.gold.main} />
            <Text style={styles.guidelineTitle}>Photo Guidelines</Text>
          </View>
          
          <View style={styles.guidelineList}>
            <View style={styles.guidelineItem}>
              <UserCheck size={16} color={palette.purple.deep} />
              <Text style={styles.guidelineText}>Clear, individual portrait photos work best</Text>
            </View>
            <View style={styles.guidelineItem}>
              <ImageIcon size={16} color={palette.purple.deep} />
              <Text style={styles.guidelineText}>Face should be clearly visible</Text>
            </View>
            <View style={styles.guidelineItem}>
              <X size={16} color="#FF4D4D" />
              <Text style={styles.guidelineText}>No group shots, children or landscapes</Text>
            </View>
            <View style={styles.guidelineItem}>
              <FileDigit size={16} color={palette.purple.deep} />
              <Text style={styles.guidelineText}>Max file size: 5MB (JPG, PNG)</Text>
            </View>
          </View>

          <View style={styles.noteBox}>
            <Info size={14} color={palette.purple.muted} />
            <Text style={styles.noteText}>
              Note: All uploaded photos are reviewed by our team to ensure safety and community standards.
            </Text>
          </View>
        </View>

        {/* 11. Visual Privacy Section */}
        <View style={styles.privacyDemoCard}>
          <Text style={styles.demoTitle}>Visual Privacy</Text>
          <Text style={styles.demoSubtitle}>
            If you choose to hide your face in Privacy Settings, this is how your photos will appear to others:
          </Text>

          <View style={styles.demoContainer}>
            <View style={styles.demoBox}>
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: photos[0]?.url || 'https://api.dicebear.com/7.x/avataaars/png?seed=sample' }} 
                  style={styles.demoImage} 
                />
              </View>
              <Text style={styles.demoLabel}>Normal View</Text>
            </View>

            <View style={styles.demoBox}>
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: photos[0]?.url || 'https://api.dicebear.com/7.x/avataaars/png?seed=sample' }} 
                  style={[styles.demoImage, styles.blurredImage]} 
                  blurRadius={Platform.OS === 'ios' ? 20 : 10}
                />
                <View style={styles.blurOverlay}>
                  <EyeOff size={24} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.demoLabel}>Blurred View</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Privacy Modal */}
      <Modal
        visible={privacyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Photo Privacy Settings</Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <X size={24} color={palette.purple.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsList}>
              {privacyOptions.map((opt) => (
                <TouchableOpacity 
                  key={opt.value} 
                  style={styles.optionItem}
                  onPress={() => setSelectedPrivacy(opt.value)}
                >
                  <Text style={[
                    styles.optionLabel,
                    selectedPrivacy === opt.value && styles.optionLabelActive
                  ]}>
                    {opt.label}
                  </Text>
                  <View style={[
                    styles.radio,
                    selectedPrivacy === opt.value && styles.radioActive
                  ]}>
                    {selectedPrivacy === opt.value && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setPrivacyModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.okBtn} 
                onPress={handleUpdatePrivacy}
              >
                <Text style={styles.okBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.purple.light,
  },
  container: {
    flex: 1,
    backgroundColor: palette.purple.light,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: palette.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.purple.border,
  },
  backBtn: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: palette.purple.deep,
  },
  addBtn: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: palette.gold.light,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: palette.purple.deep,
    marginLeft: 12,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  photoWrapper: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 1.2,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: palette.neutral.white,
    position: 'relative',
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 1.2,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: palette.purple.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 30, 84, 0.05)',
  },
  placeholderText: {
    fontSize: 12,
    color: palette.purple.muted,
    marginTop: 8,
    fontWeight: 'bold',
  },
  primaryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: palette.gold.main,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  primaryText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: palette.purple.deep,
    marginLeft: 3,
  },
  actionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iconBtn: {
    padding: 5,
  },
  deleteBtn: {
    // optional specific style
  },
  pendingBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: palette.purple.deep,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: palette.purple.deep,
    marginLeft: 10,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.neutral.white,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  privacyLabel: {
    fontSize: 14,
    color: palette.purple.muted,
    marginBottom: 4,
  },
  privacyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: palette.purple.deep,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: palette.neutral.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.purple.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: palette.purple.deep,
  },
  optionsList: {
    paddingVertical: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionLabel: {
    fontSize: 15,
    color: palette.purple.deep,
    fontWeight: '500',
  },
  optionLabelActive: {
    color: palette.gold.main,
    fontWeight: 'bold',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: palette.purple.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: palette.gold.main,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.gold.main,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
    padding: 25,
    paddingTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: palette.purple.light,
  },
  cancelBtnText: {
    color: palette.purple.deep,
    fontWeight: 'bold',
  },
  okBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: palette.gold.main,
  },
  okBtnText: {
    color: palette.purple.deep,
    fontWeight: 'bold',
  },
  // New Styles for Guidelines & Demo
  guidelinesCard: {
    backgroundColor: palette.neutral.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 25,
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  guidelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: palette.purple.deep,
    marginLeft: 10,
  },
  guidelineList: {
    backgroundColor: 'transparent',
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  guidelineText: {
    fontSize: 13,
    color: palette.purple.muted,
    marginLeft: 10,
    fontWeight: '500',
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 12,
    marginTop: 5,
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 11,
    color: palette.purple.muted,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  privacyDemoCard: {
    backgroundColor: palette.neutral.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: palette.purple.deep,
    marginBottom: 8,
  },
  demoSubtitle: {
    fontSize: 12,
    color: palette.purple.muted,
    lineHeight: 18,
    marginBottom: 20,
  },
  demoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  demoBox: {
    width: '47%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#EEEEEE',
    position: 'relative',
  },
  demoImage: {
    width: '100%',
    height: '100%',
  },
  blurredImage: {
    opacity: 0.8,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: palette.purple.deep,
    marginTop: 10,
  },
});
