import React, { useState } from 'react';
import {
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  View,
  Text,
  ActivityIndicator,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { MapPin, Bell, FolderOpen, ShieldCheck, Camera } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { fonts, palette } from "@/src/theme";

interface PermissionsModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function PermissionsModal({ visible, onDismiss }: PermissionsModalProps) {
  const [saving, setSaving] = useState(false);

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== 'android') {
      return {
        camera: true,
        location: true,
        storage: true,
        notifications: true,
      };
    }

    try {
      const permissionsToRequest: any[] = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      // Handle Storage permissions based on API level
      if (Number(Platform.Version) < 33) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      } else {
        const readMediaImagesPermission = (PermissionsAndroid.PERMISSIONS as any).READ_MEDIA_IMAGES || 'android.permission.READ_MEDIA_IMAGES';
        permissionsToRequest.push(readMediaImagesPermission);
      }

      // POST_NOTIFICATIONS is required on Android 13+ (API 33+)
      if (Number(Platform.Version) >= 33) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      const grantedResults = await PermissionsAndroid.requestMultiple(permissionsToRequest);

      const readMediaImagesPermission = (PermissionsAndroid.PERMISSIONS as any).READ_MEDIA_IMAGES || 'android.permission.READ_MEDIA_IMAGES';

      return {
        camera: grantedResults[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED,
        location: grantedResults[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED,
        storage: Number(Platform.Version) < 33
          ? grantedResults[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
          : (grantedResults as any)[readMediaImagesPermission] === PermissionsAndroid.RESULTS.GRANTED,
        notifications: Number(Platform.Version) >= 33
          ? grantedResults[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] === PermissionsAndroid.RESULTS.GRANTED
          : true,
      };
    } catch (err) {
      console.warn('Android permissions request error:', err);
      return {
        camera: false,
        location: false,
        storage: false,
        notifications: false,
      };
    }
  };

  const handleAllow = async () => {
    setSaving(true);
    try {
      const results = await requestAndroidPermissions();

      const permissions = {
        camera: results.camera,
        location: results.location,
        storage: results.storage,
        notifications: results.notifications,
      };

      // Save permissions to backend (non-blocking)
      await api.post('/profile/permissions', { permissions }).catch(() => {});
      await AsyncStorage.setItem('permissionsAsked', 'true');

      // Check if any permission was denied
      const deniedList: string[] = [];
      if (!results.camera) deniedList.push("Camera");
      if (!results.location) deniedList.push("Location");
      if (!results.storage) deniedList.push("Storage");
      if (Number(Platform.Version) >= 33 && !results.notifications) deniedList.push("Notifications");

      if (deniedList.length > 0) {
        setTimeout(() => {
          Alert.alert(
            "Permissions Denied",
            `The following permissions were denied: ${deniedList.join(", ")}. Some features may be restricted. Would you like to enable them in Settings?`,
            [
              {
                text: "Deny",
                style: "cancel"
              },
              {
                text: "Allow",
                onPress: () => {
                  const { Linking } = require('react-native');
                  Linking.openSettings();
                }
              }
            ]
          );
        }, 500);
      }
    } catch (err) {
      console.warn('Permission error:', err);
    } finally {
      setSaving(false);
      onDismiss();
    }
  };

  const handleDeny = async () => {
    setSaving(true);
    try {
      const permissions = {
        camera: false,
        location: false,
        storage: false,
        notifications: false,
      };

      // Save denied state to backend
      await api.post('/profile/permissions', { permissions }).catch(() => {});
      await AsyncStorage.setItem('permissionsAsked', 'true');
    } catch (err) {
      console.warn('Deny permission error:', err);
    } finally {
      setSaving(false);
      onDismiss();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ShieldCheck size={22} color={palette.purple.deep} />
              <Text style={styles.title}>Enable Permissions</Text>
            </View>
            <Text style={styles.subtitle}>
              Please enable the following permissions to personalize your experience. We respect your privacy.
            </Text>
          </View>

          {/* Permission items */}
          <View style={styles.permissionsList}>
            <View style={styles.permItem}>
              <Bell size={20} color={palette.purple.deep} style={styles.permIcon} />
              <View style={styles.permInfo}>
                <Text style={styles.permTitle}>Notifications</Text>
                <Text style={styles.permDesc}>Get alerts for new matches and messages</Text>
              </View>
            </View>

            <View style={styles.permItem}>
              <MapPin size={20} color={palette.purple.deep} style={styles.permIcon} />
              <View style={styles.permInfo}>
                <Text style={styles.permTitle}>Location</Text>
                <Text style={styles.permDesc}>Find matches near your current location</Text>
              </View>
            </View>

            <View style={styles.permItem}>
              <FolderOpen size={20} color={palette.purple.deep} style={styles.permIcon} />
              <View style={styles.permInfo}>
                <Text style={styles.permTitle}>Storage Access</Text>
                <Text style={styles.permDesc}>Upload photos directly to your profile</Text>
              </View>
            </View>

            <View style={[styles.permItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Camera size={20} color={palette.purple.deep} style={styles.permIcon} />
              <View style={styles.permInfo}>
                <Text style={styles.permTitle}>Camera Access</Text>
                <Text style={styles.permDesc}>Capture photos for verification checks</Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.denyBtn}
              onPress={handleDeny}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.denyBtnText}>Not Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.allowBtn}
              onPress={handleAllow}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.allowBtnText}>Allow All</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
    borderWidth: 1,
    borderColor: 'rgba(237, 230, 245, 0.6)',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    color: palette.purple.deep,
    fontSize: 18,
    ...fonts.bold,
    letterSpacing: -0.2,
  },
  subtitle: {
    color: '#7A6F8B',
    fontSize: 13,
    lineHeight: 18,
    ...fonts.medium,
  },
  permissionsList: {
    marginBottom: 20,
  },
  permItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#EDE6F5',
  },
  permIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  permInfo: {
    flex: 1,
  },
  permTitle: {
    color: palette.purple.deep,
    fontSize: 14,
    ...fonts.semibold,
  },
  permDesc: {
    color: '#7A6F8B',
    fontSize: 12,
    ...fonts.medium,
    marginTop: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  allowBtn: {
    flex: 1.5,
    backgroundColor: palette.purple.deep,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...fonts.semibold,
  },
  denyBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE6F5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  denyBtnText: {
    color: '#7A6F8B',
    fontSize: 15,
    ...fonts.semibold,
  },
});
