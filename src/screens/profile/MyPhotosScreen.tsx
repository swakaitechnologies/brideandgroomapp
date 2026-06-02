import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
  View,
  Text,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Plus, Trash2, Star,
  Shield, Check, X, Camera,
  Image as ImageIcon,
  ChevronRight, AlertCircle, UserCheck,
  FileDigit, Info, EyeOff
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { palette } from '../../theme/colors';
import { getPhotos, uploadPhotos, deletePhoto, setPrimaryPhoto, getPrivacySettings, updatePrivacySettings, resolvePhotoUrl } from '../../services/api';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { showToast } from '../../utils/toast';
import { fonts } from "@/src/theme";

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = (width - 60) / COLUMN_COUNT;

// Gorgeous mock presets to choose from in simulator mode
const PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
];

export default function MyPhotosScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [privacy, setPrivacy] = useState<any>(null);

  // Custom Preset Picker Modal
  const [presetModalVisible, setPresetModalVisible] = useState(false);

  // Privacy Modal
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [selectedPrivacy, setSelectedPrivacy] = useState("All");
  const [photoSourceModalVisible, setPhotoSourceModalVisible] = useState(false);

  const privacyOptions = [
    { label: "Visible to All Members", value: "All" },
    { label: "Visible to Members I Liked", value: "Selected" },
    { label: "Visible to All Premium Members", value: "Verified" },
  ];

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );


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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleUploadFile = async (asset: any) => {
    setUploading(true);
    try {
      const formData = new FormData();

      const fileData = {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `photo_${Date.now()}.jpg`,
      };

      formData.append('photos', fileData as any);

      const response = await uploadPhotos(formData);
      if (response.data.success) {
        await fetchData();
        showToast("Photo uploaded successfully.");
      } else {
        showToast(response.data.message || "Failed to upload photo.");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      showToast("Failed to upload photo. Make sure size is under 5MB.");
    } finally {
      setUploading(false);
    }
  };

  const handleLaunchCamera = async () => {
    if (Platform.OS === 'android') {
      try {
        const hasCameraPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (!hasCameraPermission) {
          const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
          if (status !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert("Permission Denied", "Camera permission is required to take photos. Please enable it in App Settings.");
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
        maxWidth: 1200,
        maxHeight: 1200,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert("Error", result.errorMessage || "Camera error occurred.");
        return;
      }

      const asset = result.assets?.[0];
      if (asset) {
        await handleUploadFile(asset);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not access camera.");
    }
  };

  const handleLaunchLibrary = async () => {
    if (Platform.OS === 'android') {
      try {
        let hasStoragePermission = false;
        let storagePermissionString = '';
        if (Number(Platform.Version) < 33) {
          storagePermissionString = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        } else {
          storagePermissionString = (PermissionsAndroid.PERMISSIONS as any).READ_MEDIA_IMAGES || 'android.permission.READ_MEDIA_IMAGES';
        }

        hasStoragePermission = await PermissionsAndroid.check(storagePermissionString as any);
        if (!hasStoragePermission) {
          const status = await PermissionsAndroid.request(storagePermissionString as any);
          if (status !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert("Permission Denied", "Storage permission is required to select photos. Please enable it in App Settings.");
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
        maxWidth: 1200,
        maxHeight: 1200,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert("Error", result.errorMessage || "Gallery error occurred.");
        return;
      }

      const asset = result.assets?.[0];
      if (asset) {
        await handleUploadFile(asset);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not open system gallery.");
    }
  };

  const handlePickImage = () => {
    if (photos.length >= 5) {
      showToast("You can upload up to 5 photos only.");
      return;
    }
    setPhotoSourceModalVisible(true);
  };

  const handleSelectPreset = async (url: string) => {
    setPresetModalVisible(false);
    setUploading(true);
    try {
      // Photo upload
      const formData = new FormData();
      formData.append('photoUrl', url);
      await uploadPhotos(formData);
      await fetchData();
      showToast("Photo added successfully.");
    } catch (error) {
      showToast("Failed to add photo.");
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
              await fetchData();
            } catch (error) {
              showToast("Failed to delete photo.");
            }
          }
        }
      ]
    );
  };

  const handleSetPrimary = async (id: string) => {
    try {
      // Optimistic Update: Update UI immediately
      setPhotos(prev => prev.map(p => ({
        ...p,
        isMain: p.id === id
      })));

      await setPrimaryPhoto(id);
      showToast("Primary photo updated.");
    } catch (error) {
      fetchData(); // Revert on error
      showToast("Failed to update primary photo.");
    }
  };

  const handleUpdatePrivacy = async () => {
    try {
      await updatePrivacySettings({ photoVisibility: selectedPrivacy });
      setPrivacyModalVisible(false);
      setPrivacy((prev: any) => ({ ...prev, photoVisibility: selectedPrivacy }));
      showToast("Privacy settings updated.");
    } catch (error) {
      showToast("Failed to update privacy settings.");
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[palette.gold.main]}
              tintColor={palette.gold.main}
            />
          }
        >
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
                <Image source={{ uri: resolvePhotoUrl(item.url) }} style={styles.photo} />
                {item.isMain && (
                  <View style={styles.primaryBadge}>
                    <Star size={12} color={palette.purple.deep} fill={palette.purple.deep} />
                    <Text style={styles.primaryText}>Main</Text>
                  </View>
                )}
                <View style={styles.actionOverlay}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleSetPrimary(item.id)}
                    disabled={item.isMain}
                  >
                    <Star
                      size={18}
                      color={item.isMain ? palette.gold.main : "#FFFFFF"}
                      fill={item.isMain ? palette.gold.main : "transparent"}
                    />
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

          {/* Photo Guidelines */}
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

          {/* Visual Privacy Section */}
          <View style={styles.privacyDemoCard}>
            <Text style={styles.demoTitle}>Visual Privacy</Text>
            <Text style={styles.demoSubtitle}>
              If you choose to hide your face in Privacy Settings, this is how your photos will appear to others:
            </Text>

            <View style={styles.demoContainer}>
              <View style={styles.demoBox}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: resolvePhotoUrl(photos[0]?.url) || 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=400' }}
                    style={styles.demoImage}
                  />
                </View>
                <Text style={styles.demoLabel}>Normal View</Text>
              </View>

              <View style={styles.demoBox}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: resolvePhotoUrl(photos[0]?.url) || 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=400' }}
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

        {/* Preset Picker Modal */}
        <Modal
          visible={presetModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPresetModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: 30 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose a Premium Photo</Text>
                <TouchableOpacity onPress={() => setPresetModalVisible(false)}>
                  <X size={24} color={palette.purple.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.presetGrid}>
                {PHOTO_PRESETS.map((url, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.presetItem}
                    onPress={() => handleSelectPreset(url)}
                  >
                    <Image source={{ uri: url }} style={styles.presetImage} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Privacy Modal */}
        <Modal
          visible={privacyModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPrivacyModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: 20 }]}>
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

        {/* Custom Photo Source Choice Modal */}
        <Modal
          visible={photoSourceModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPhotoSourceModalVisible(false)}
        >
          <View style={styles.sourceModalOverlay}>
            <View style={styles.sourceModalContent}>
              <View style={styles.sourceIconWrapper}>
                <Camera size={24} color={palette.gold.main} />
              </View>
              <Text style={styles.sourceModalTitle}>Add Photo</Text>
              <Text style={styles.sourceModalMessage}>Choose a source for your photo:</Text>

              <View style={styles.sourceActions}>
                <TouchableOpacity
                  style={styles.sourceBtn}
                  onPress={() => {
                    setPhotoSourceModalVisible(false);
                    handleLaunchCamera();
                  }}
                >
                  <Camera size={20} color={palette.purple.deep} />
                  <Text style={styles.sourceBtnText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sourceBtn}
                  onPress={() => {
                    setPhotoSourceModalVisible(false);
                    handleLaunchLibrary();
                  }}
                >
                  <ImageIcon size={20} color={palette.purple.deep} />
                  <Text style={styles.sourceBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.sourceCancelBtn}
                onPress={() => setPhotoSourceModalVisible(false)}
              >
                <Text style={styles.sourceCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
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
    ...fonts.semibold,
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
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
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
    ...fonts.semibold,
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
    ...fonts.semibold,
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
    ...fonts.semibold,
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
    ...fonts.semibold,
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
    ...fonts.semibold,
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
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  optionsList: {
    paddingVertical: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionLabel: {
    fontSize: 15,
    color: palette.purple.deep,
    ...fonts.medium,
  },
  optionLabelActive: {
    color: palette.gold.main,
    ...fonts.semibold,
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
    padding: 20,
    paddingTop: 5,
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
    ...fonts.semibold,
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
    ...fonts.semibold,
  },
  // Guidelines & Demo
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
    ...fonts.semibold,
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
    ...fonts.medium,
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
    ...fonts.semibold,
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
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoLabel: {
    fontSize: 12,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginTop: 10,
  },
  // Preset Grid
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
    justifyContent: 'center',
  },
  presetItem: {
    width: (width - 80) / 3,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  sourceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceModalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  sourceIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sourceModalTitle: {
    fontSize: 18,
    ...fonts.semibold,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sourceModalMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  sourceActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  sourceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  sourceBtnText: {
    fontSize: 14,
    ...fonts.semibold,
    color: '#1A1A1A',
  },
  sourceCancelBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceCancelBtnText: {
    fontSize: 14,
    ...fonts.semibold,
    color: '#666666',
  },
});
