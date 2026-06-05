import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
  Clipboard,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import {
  ArrowLeft, Save, ChevronDown,
  Lock, User, Shield, Bell, AlertTriangle,
  CheckCircle, XCircle, AlertCircle, HelpCircle,
  Copy, Check, Mail, Phone, Calendar, Trash2,
  Eye, EyeOff, Ban
} from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { API_BASE_URL, getBlockedUsers, unblockUser } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../../services/secureStorage';
import { logout } from '../../store/authSlice';
import { fonts } from "@/src/theme";

// Options definitions for Privacy settings
const VISIBILITY_OPTIONS = ['Everyone', 'Members', 'Interacted'];
const PHOTO_VISIBILITY_OPTIONS = ['All', 'Verified', 'Selected', 'None'];
const PHONE_VISIBILITY_OPTIONS = ['Hidden', 'Matches', 'Paid'];
const EMAIL_VISIBILITY_OPTIONS = ['Hidden', 'Matches'];

export default function AccountSettingScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  // Blocked Profiles States
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedExpanded, setBlockedExpanded] = useState(false);

  const fetchBlockedUsers = async () => {
    setBlockedLoading(true);
    try {
      const res = await getBlockedUsers();
      if (res.data && res.data.success) {
        setBlockedUsers(res.data.data || []);
      } else {
        showAlert('Error', 'Failed to retrieve blocked users list.', 'error');
      }
    } catch (error) {
      console.error('fetchBlockedUsers error:', error);
      showAlert('Error', 'Failed to retrieve blocked users list.', 'error');
    } finally {
      setBlockedLoading(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    showAlert(
      'Unblock User',
      'Are you sure you want to unblock this member?',
      'confirm',
      async () => {
        try {
          const res = await unblockUser(userId);
          if (res.data && res.data.success) {
            showAlert('Success', 'User unblocked successfully.', 'success');
            fetchBlockedUsers();
          } else {
            showAlert('Error', 'Failed to unblock user.', 'error');
          }
        } catch (error) {
          console.error('handleUnblockUser error:', error);
          showAlert('Error', 'Failed to unblock user.', 'error');
        }
      }
    );
  };

  const toggleBlockedSection = () => {
    const nextState = !blockedExpanded;
    setBlockedExpanded(nextState);
    if (nextState) {
      fetchBlockedUsers();
    }
  };

  // Loading States
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [updatingSetting, setUpdatingSetting] = useState(false);

  // User States
  const [customId, setCustomId] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Info Update & Password Change Form States
  const [infoPassword, setInfoPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Privacy & Settings States
  const [profileVisibility, setProfileVisibility] = useState('Everyone');
  const [photoVisibility, setPhotoVisibility] = useState('All');
  const [photoLock, setPhotoLock] = useState(false);
  const [phoneVisibility, setPhoneVisibility] = useState('Matches');
  const [emailVisibility, setEmailVisibility] = useState('Hidden');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);

  // Notification Preference States
  const [notifyInterests, setNotifyInterests] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyContactRequests, setNotifyContactRequests] = useState(true);
  const [notifyShortlists, setNotifyShortlists] = useState(true);

  // Modal Picker States
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTitle, setPickerTitle] = useState('');
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerSelectedVal, setPickerSelectedVal] = useState('');
  const [pickerSaveTarget, setPickerSaveTarget] = useState('');

  // Delete Password Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState(false);
  const [confirmPasswordText, setConfirmPasswordText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm' | 'info';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'confirm' | 'info' = 'info',
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText = 'OK',
    cancelText = 'Cancel'
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
    });
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      const token = await secureStorage.getItem('token');
      if (!token) return;

      // 1. Fetch User details
      const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Mobile-App': 'true'
        }
      });
      const userResult = await userRes.json() as any;
      if (userRes.ok && userResult) {
        setEmail(userResult.email || '');
        setMobile(userResult.mobile || '');
        setIsEmailVerified(!!userResult.isEmailVerified);
        if (userResult.createdAt) {
          const date = new Date(userResult.createdAt);
          const formatted = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          });
          setMemberSince(formatted);
        }
      }

      // 2. Fetch Profile details (customId)
      const profileRes = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Mobile-App': 'true'
        }
      });
      const profileResult = await profileRes.json() as any;
      if (profileRes.ok && profileResult.success && profileResult.data) {
        setCustomId(profileResult.data.customId || '');
      }

      // 3. Fetch Privacy Settings
      const privacyRes = await fetch(`${API_BASE_URL}/privacy`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Mobile-App': 'true'
        }
      });
      const privacyResult = await privacyRes.json() as any;
      if (privacyRes.ok && privacyResult.success && privacyResult.data) {
        const p = privacyResult.data;
        setProfileVisibility(p.profileVisibility || 'Everyone');
        setPhotoVisibility(p.photoVisibility || 'All');
        setPhotoLock(!!p.photoLock);
        setPhoneVisibility(p.phoneVisibility || 'Matches');
        setEmailVisibility(p.emailVisibility || 'Hidden');
        setTwoFactorEnabled(!!p.twoFactorEnabled);
        setIsDeactivated(!!p.isDeactivated);
        
        // Notifications settings (unified in PrivacySetting model)
        if (p.notifyInterests !== undefined) setNotifyInterests(!!p.notifyInterests);
        if (p.notifyMessages !== undefined) setNotifyMessages(!!p.notifyMessages);
        if (p.notifyContactRequests !== undefined) setNotifyContactRequests(!!p.notifyContactRequests);
        if (p.notifyShortlists !== undefined) setNotifyShortlists(!!p.notifyShortlists);
      }
    } catch (error) {
      console.error('Fetch Account Settings Error:', error);
      showAlert('Error', 'Failed to load account settings details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Copy ID
  const copyToClipboard = () => {
    if (customId) {
      Clipboard.setString(customId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Resend Email Verification
  const handleResendEmail = async () => {
    if (resendingEmail) return;
    setResendingEmail(true);
    try {
      const token = await secureStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/auth/resend-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Mobile-App': 'true'
        }
      });
      const result = await res.json() as any;
      if (res.ok) {
        showAlert(
          'Verification Sent',
          'A verification email has been resent to your address. Please check your Inbox and Spam/Junk folder.',
          'success'
        );
      } else {
        showAlert('Error', result.message || 'Failed to resend verification email.', 'error');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Network connection failed.', 'error');
    } finally {
      setResendingEmail(false);
    }
  };

  // Update Email/Mobile info
  const handleUpdateInfo = async () => {
    if (!email || !mobile) {
      showAlert('Validation Error', 'Email and mobile number cannot be empty.', 'error');
      return;
    }
    if (!infoPassword) {
      showAlert('Password Required', 'Please enter your current password to save details.', 'error');
      return;
    }

    setSavingInfo(true);
    try {
      const token = await secureStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/auth/update-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Mobile-App': 'true'
        },
        body: JSON.stringify({
          email,
          mobile,
          currentPassword: infoPassword,
        })
      });
      const result = await res.json() as any;
      if (res.ok) {
        setInfoPassword('');
        setIsEmailVerified(!!result.user?.isEmailVerified);
        showAlert('Success', 'Account information updated successfully.', 'success');
      } else {
        showAlert('Update Failed', result.message || 'Failed to update info.', 'error');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Network request failed.', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  // Update Password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Validation Error', 'Please fill in all password fields.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Validation Error', 'New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Validation Error', 'Password must be at least 6 characters.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      const token = await secureStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Mobile-App': 'true'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        })
      });
      const result = await res.json() as any;
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showAlert('Success', 'Password updated successfully.', 'success');
      } else {
        showAlert('Password Change Failed', result.message || 'Incorrect current password.', 'error');
      }
    } catch (error) {
      showAlert('Error', 'Network connection error.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // Toggle/Update Privacy Settings & Notification Settings
  const updateSetting = async (updatedFields: any) => {
    setUpdatingSetting(true);
    try {
      const token = await secureStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/privacy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Mobile-App': 'true'
        },
        body: JSON.stringify(updatedFields)
      });
      const result = await res.json() as any;
      if (!res.ok) {
        showAlert('Error', result.message || 'Failed to update setting.', 'error');
        // Re-fetch to sync settings to server state on failure
        fetchData();
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Network request failed. Could not save setting.', 'error');
      fetchData();
    } finally {
      setUpdatingSetting(false);
    }
  };

  // Handle Visibility Dropdown selections
  const openSinglePicker = (title: string, options: string[], currentVal: string, target: string) => {
    setPickerTitle(title);
    setPickerOptions(options);
    setPickerSelectedVal(currentVal);
    setPickerSaveTarget(target);
    setPickerVisible(true);
  };

  const handleSingleSelect = (item: string) => {
    setPickerVisible(false);
    switch (pickerSaveTarget) {
      case 'profileVisibility':
        setProfileVisibility(item);
        updateSetting({ profileVisibility: item });
        break;
      case 'photoVisibility':
        setPhotoVisibility(item);
        updateSetting({ photoVisibility: item });
        break;
      case 'phoneVisibility':
        setPhoneVisibility(item);
        updateSetting({ phoneVisibility: item });
        break;
      case 'emailVisibility':
        setEmailVisibility(item);
        updateSetting({ emailVisibility: item });
        break;
    }
  };

  // Deactivate Toggle Handler
  const handleDeactivateToggle = (val: boolean) => {
    if (val) {
      showAlert(
        'Deactivate Profile',
        'Are you sure you want to deactivate your profile? You will be hidden from matches, search results, and recommendations until you reactivate it.',
        'confirm',
        () => {
          setIsDeactivated(true);
          updateSetting({ isDeactivated: true });
        }
      );
    } else {
      setIsDeactivated(false);
      updateSetting({ isDeactivated: false });
    }
  };

  // Delete Account Handler
  const handleDeleteAccountSubmit = async () => {
    if (!confirmPasswordText) {
      showAlert('Password Required', 'Please enter your password to confirm.', 'error');
      return;
    }

    setDeletingAccount(true);
    try {
      const token = await secureStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Mobile-App': 'true'
        },
        body: JSON.stringify({
          password: confirmPasswordText,
        })
      });
      const result = await res.json() as any;
      if (res.ok) {
        setDeleteModalVisible(false);
        setConfirmPasswordText('');
        showAlert('Account Deleted', 'Your account has been deleted. You will now be redirected to the welcome screen.', 'success', () => {
          // Perform Logout Navigation Reset
          dispatch(logout() as any);
          navigation.reset({
            index: 0,
            routes: [{ name: "Welcome" }],
          });
        });
      } else {
        showAlert('Deletion Failed', result.message || 'Incorrect password.', 'error');
      }
    } catch (error) {
      showAlert('Error', 'Network connection error.', 'error');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.gold.main} />
        <Text style={styles.loaderText}>Loading Account settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#FFFFFF' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={palette.purple.deep} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Section 1: Account Information display & update */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <User size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Account Details</Text>
          </View>

          {/* Read-Only Stats */}
          {customId && (
            <View style={styles.readOnlyRow}>
              <View>
                <Text style={styles.label}>Profile ID</Text>
                <Text style={styles.readOnlyText}>{customId}</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
                {copied ? (
                  <Check size={18} color="#4CAF50" />
                ) : (
                  <Copy size={18} color={palette.purple.muted} />
                )}
              </TouchableOpacity>
            </View>
          )}

          {memberSince && (
            <View style={[styles.readOnlyRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View>
                <Text style={styles.label}>Member Since</Text>
                <Text style={styles.readOnlyText}>{memberSince}</Text>
              </View>
              <Calendar size={18} color={palette.purple.muted} />
            </View>
          )}

          <View style={styles.divider} />

          {/* Editable Fields */}
          <View style={styles.inputWrapper}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Email Address</Text>
              {isEmailVerified ? (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              ) : resendingEmail ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={palette.gold.main} style={{ marginRight: 4 }} />
                  <Text style={[styles.verifyLink, { color: palette.gold.main }]}>Sending...</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={handleResendEmail}>
                  <Text style={styles.verifyLink}>Verify Email</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.textInput}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Confirm Current Password</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              placeholder="Required to save email/mobile"
              placeholderTextColor="rgba(126, 107, 143, 0.4)"
              value={infoPassword}
              onChangeText={setInfoPassword}
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateInfo} disabled={savingInfo}>
            {savingInfo ? (
              <ActivityIndicator size="small" color={palette.purple.deep} />
            ) : (
              <>
                <Save size={18} color={palette.purple.deep} style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Update Info</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Section 2: Change Password */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Lock size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Change Password</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordTextInput}
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity
                style={styles.eyeIconBtn}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff size={20} color={palette.purple.muted} />
                ) : (
                  <Eye size={20} color={palette.purple.muted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordTextInput}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeIconBtn}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff size={20} color={palette.purple.muted} />
                ) : (
                  <Eye size={20} color={palette.purple.muted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordTextInput}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIconBtn}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={palette.purple.muted} />
                ) : (
                  <Eye size={20} color={palette.purple.muted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={savingPassword}>
            {savingPassword ? (
              <ActivityIndicator size="small" color={palette.purple.deep} />
            ) : (
              <>
                <Lock size={18} color={palette.purple.deep} style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Update Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Section 3: Privacy & Visibility Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Shield size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Privacy Settings</Text>
          </View>

          {/* Visibility Dropdown Fields */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Profile Visibility</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openSinglePicker('Profile Visibility', VISIBILITY_OPTIONS, profileVisibility, 'profileVisibility')}
            >
              <Text style={styles.dropdownText}>{profileVisibility}</Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Photo Visibility</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openSinglePicker('Photo Visibility', PHOTO_VISIBILITY_OPTIONS, photoVisibility, 'photoVisibility')}
            >
              <Text style={styles.dropdownText}>{photoVisibility}</Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Lock My Photos</Text>
              <Text style={styles.toggleHint}>Require approval requests from viewers to unlock photos.</Text>
            </View>
            <Switch
              value={photoLock}
              onValueChange={(val) => {
                setPhotoLock(val);
                updateSetting({ photoLock: val });
              }}
              thumbColor={photoLock ? palette.gold.main : '#E8E0F0'}
              trackColor={{ false: '#E8E0F0', true: 'rgba(212, 175, 55, 0.4)' }}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Phone Number Visibility</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openSinglePicker('Phone Visibility', PHONE_VISIBILITY_OPTIONS, phoneVisibility, 'phoneVisibility')}
            >
              <Text style={styles.dropdownText}>{phoneVisibility}</Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email ID Visibility</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openSinglePicker('Email Visibility', EMAIL_VISIBILITY_OPTIONS, emailVisibility, 'emailVisibility')}
            >
              <Text style={styles.dropdownText}>{emailVisibility}</Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Two-Factor Authentication</Text>
              <Text style={styles.toggleHint}>Secure your account updates with verification codes.</Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={(val) => {
                setTwoFactorEnabled(val);
                updateSetting({ twoFactorEnabled: val });
              }}
              thumbColor={twoFactorEnabled ? palette.gold.main : '#E8E0F0'}
              trackColor={{ false: '#E8E0F0', true: 'rgba(212, 175, 55, 0.4)' }}
            />
          </View>
        </View>

        {/* Section 4: Notifications Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Bell size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Notification Preferences</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Interests Sent & Received</Text>
              <Text style={styles.toggleHint}>Notify when another member shows interest in your profile.</Text>
            </View>
            <Switch
              value={notifyInterests}
              onValueChange={(val) => {
                setNotifyInterests(val);
                updateSetting({ notifyInterests: val });
              }}
              thumbColor={notifyInterests ? palette.gold.main : '#E8E0F0'}
              trackColor={{ false: '#E8E0F0', true: 'rgba(212, 175, 55, 0.4)' }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Direct Messages</Text>
              <Text style={styles.toggleHint}>Notify when you receive text chat messages.</Text>
            </View>
            <Switch
              value={notifyMessages}
              onValueChange={(val) => {
                setNotifyMessages(val);
                updateSetting({ notifyMessages: val });
              }}
              thumbColor={notifyMessages ? palette.gold.main : '#E8E0F0'}
              trackColor={{ false: '#E8E0F0', true: 'rgba(212, 175, 55, 0.4)' }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Contact Requests</Text>
              <Text style={styles.toggleHint}>Notify when contact details are requested or shared.</Text>
            </View>
            <Switch
              value={notifyContactRequests}
              onValueChange={(val) => {
                setNotifyContactRequests(val);
                updateSetting({ notifyContactRequests: val });
              }}
              thumbColor={notifyContactRequests ? palette.gold.main : '#E8E0F0'}
              trackColor={{ false: '#E8E0F0', true: 'rgba(212, 175, 55, 0.4)' }}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Shortlists Alerts</Text>
              <Text style={styles.toggleHint}>Notify when you are added to a member's shortlist.</Text>
            </View>
            <Switch
              value={notifyShortlists}
              onValueChange={(val) => {
                setNotifyShortlists(val);
                updateSetting({ notifyShortlists: val });
              }}
              thumbColor={notifyShortlists ? palette.gold.main : '#E8E0F0'}
              trackColor={{ false: '#E8E0F0', true: 'rgba(212, 175, 55, 0.4)' }}
            />
          </View>
        </View>

        {/* Section 4.5: Blocked Profiles */}
        <View style={styles.card}>
          <TouchableOpacity 
            style={[styles.cardHeader, { marginBottom: blockedExpanded ? 15 : 0 }]} 
            onPress={toggleBlockedSection}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ban size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Blocked Profiles</Text>
            </View>
            <ChevronDown 
              size={20} 
              color={palette.purple.muted} 
              style={{ transform: [{ rotate: blockedExpanded ? '180deg' : '0deg' }] }} 
            />
          </TouchableOpacity>

          {blockedExpanded && (
            <View style={{ marginTop: 10 }}>
              {blockedLoading ? (
                <ActivityIndicator size="small" color={palette.gold.main} style={{ marginVertical: 20 }} />
              ) : blockedUsers.length === 0 ? (
                <Text style={styles.noBlockedText}>No blocked profiles found.</Text>
              ) : (
                blockedUsers.map((item) => {
                  const name = item.profile 
                    ? `${item.profile.firstName || ''} ${item.profile.lastName || ''}`.trim() 
                    : 'Blocked User';
                  const customId = item.profile?.customId || `ID: ${item.userId}`;
                  
                  return (
                    <View key={item.userId} style={styles.blockedRow}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.blockedName}>{name}</Text>
                        <Text style={styles.blockedIdText}>{customId}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.unblockBtn} 
                        onPress={() => handleUnblockUser(item.userId)}
                      >
                        <Text style={styles.unblockBtnText}>Unblock</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* Section 5: Danger Zone */}
        <View style={[styles.card, styles.dangerCard]}>
          <View style={styles.cardHeader}>
            <AlertTriangle size={20} color={palette.status.error} style={{ marginRight: 8 }} />
            <Text style={[styles.cardTitle, { color: palette.status.error }]}>Danger Zone</Text>
          </View>

          {/* Account Deactivation */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Deactivate Profile</Text>
              <Text style={styles.toggleHint}>Temporarily hide profile from match feeds, search results, and details pages.</Text>
            </View>
            <Switch
              value={isDeactivated}
              onValueChange={handleDeactivateToggle}
              thumbColor={isDeactivated ? palette.status.error : '#E8E0F0'}
              trackColor={{ false: '#E8E0F0', true: 'rgba(255, 77, 77, 0.4)' }}
            />
          </View>

          {/* Account Deletion */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.toggleLabel}>Permanently Delete Account</Text>
            <Text style={[styles.toggleHint, { marginBottom: 12 }]}>All your profile details, chat records, photos, and match list history will be permanently erased. This operation cannot be undone.</Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteModalVisible(true)}>
              <Trash2 size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.deleteBtnText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Visibility Options Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickerTitle}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={pickerOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = pickerSelectedVal === item;
                return (
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    onPress={() => handleSingleSelect(item)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {item}
                    </Text>
                    {isSelected && <Text style={styles.optionCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Delete Account Password Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: 300 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.status.error }]}>Confirm Deletion</Text>
              <TouchableOpacity onPress={() => { setDeleteModalVisible(false); setConfirmPasswordText(''); }}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={styles.deleteWarningText}>
                Please type your password to permanently delete your account:
              </Text>
              <TextInput
                style={[styles.textInput, { marginTop: 15, borderColor: palette.status.error }]}
                secureTextEntry
                placeholder="Enter password"
                placeholderTextColor="rgba(255, 77, 77, 0.4)"
                value={confirmPasswordText}
                onChangeText={setConfirmPasswordText}
              />
              <TouchableOpacity 
                style={[styles.deleteBtn, { marginTop: 20 }]} 
                onPress={handleDeleteAccountSubmit}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteBtnText}>Confirm Permanent Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal visible={alertConfig.visible} transparent={true} animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={styles.alertIconWrapper}>
              {alertConfig.type === 'success' && <CheckCircle size={40} color="#4CAF50" />}
              {alertConfig.type === 'error' && <XCircle size={40} color={palette.status.error} />}
              {alertConfig.type === 'confirm' && <HelpCircle size={40} color={palette.gold.main} />}
              {alertConfig.type === 'info' && <AlertCircle size={40} color={palette.purple.muted} />}
            </View>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>

            <View style={styles.alertBtnContainer}>
              {alertConfig.type === 'confirm' ? (
                <>
                  <TouchableOpacity
                    style={[styles.alertBtn, styles.alertBtnSecondary]}
                    onPress={() => {
                      setAlertConfig(prev => ({ ...prev, visible: false }));
                      if (alertConfig.onCancel) alertConfig.onCancel();
                    }}
                  >
                    <Text style={styles.alertBtnTextSecondary}>{alertConfig.cancelText || 'Cancel'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.alertBtn, styles.alertBtnPrimary]}
                    onPress={() => {
                      setAlertConfig(prev => ({ ...prev, visible: false }));
                      if (alertConfig.onConfirm) alertConfig.onConfirm();
                    }}
                  >
                    <Text style={styles.alertBtnTextPrimary}>{alertConfig.confirmText || 'OK'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.alertBtn, styles.alertBtnSingle]}
                  onPress={() => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                  }}
                >
                  <Text style={styles.alertBtnTextPrimary}>{alertConfig.confirmText || 'OK'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: palette.purple.border,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: palette.purple.deep,
    marginTop: 15,
    fontSize: 16,
    ...fonts.semibold,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.purple.border,
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  divider: {
    height: 1,
    backgroundColor: palette.purple.border,
    marginVertical: 18,
  },
  // Read Only styles
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2F7',
  },
  readOnlyText: {
    fontSize: 15,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginTop: 4,
  },
  copyBtn: {
    padding: 8,
    backgroundColor: '#F7F5FA',
    borderRadius: 8,
  },
  // Editable fields
  inputWrapper: {
    marginBottom: 15,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    ...fonts.semibold,
    color: palette.purple.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    color: '#4CAF50',
    fontSize: 11,
    ...fonts.semibold,
  },
  verifyLink: {
    color: palette.gold.main,
    fontSize: 12,
    ...fonts.semibold,
  },
  textInput: {
    backgroundColor: '#FAF9FC',
    borderColor: palette.purple.border,
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    color: palette.purple.deep,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9FC',
    borderColor: palette.purple.border,
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    paddingRight: 15,
  },
  passwordTextInput: {
    flex: 1,
    height: 50,
    color: palette.purple.deep,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  eyeIconBtn: {
    padding: 5,
  },
  dropdownTrigger: {
    backgroundColor: '#FAF9FC',
    borderColor: palette.purple.border,
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    color: palette.purple.deep,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: palette.gold.main,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  saveBtnText: {
    color: palette.purple.deep,
    fontSize: 15,
    ...fonts.semibold,
  },
  // Toggle Row settings
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2F7',
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 14,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  toggleHint: {
    fontSize: 11,
    color: palette.purple.muted,
    marginTop: 2,
    paddingRight: 10,
    lineHeight: 15,
  },
  // Danger Zone
  dangerCard: {
    borderColor: 'rgba(255, 77, 77, 0.4)',
    borderWidth: 1.5,
    backgroundColor: '#FFFDFD',
  },
  deleteBtn: {
    backgroundColor: palette.status.error,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...fonts.semibold,
  },
  deleteWarningText: {
    fontSize: 14,
    color: palette.purple.deep,
    lineHeight: 20,
    textAlign: 'center',
  },
  // Options Picker Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.purple.border,
  },
  modalTitle: {
    fontSize: 18,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  modalCloseText: {
    color: palette.purple.muted,
    fontSize: 15,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F5FA',
  },
  optionItemSelected: {
    backgroundColor: '#FAF7FC',
  },
  optionText: {
    fontSize: 15,
    color: palette.purple.deep,
  },
  optionTextSelected: {
    ...fonts.semibold,
    color: palette.gold.main,
  },
  optionCheck: {
    fontSize: 16,
    color: palette.gold.main,
    ...fonts.semibold,
  },
  // Custom Alert Modals
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  alertIconWrapper: {
    marginBottom: 15,
  },
  alertTitle: {
    fontSize: 18,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginBottom: 10,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: palette.purple.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  alertBtnContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  alertBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  alertBtnPrimary: {
    backgroundColor: palette.gold.main,
  },
  alertBtnSecondary: {
    backgroundColor: '#FAF9FC',
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  alertBtnSingle: {
    backgroundColor: palette.gold.main,
    width: '100%',
  },
  alertBtnTextPrimary: {
    color: palette.purple.deep,
    ...fonts.semibold,
    fontSize: 14,
  },
  alertBtnTextSecondary: {
    color: palette.purple.deep,
    fontSize: 14,
  },
  noBlockedText: {
    fontSize: 14,
    color: palette.purple.muted,
    textAlign: 'center',
    marginVertical: 15,
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2F7',
  },
  blockedName: {
    fontSize: 14,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  blockedIdText: {
    fontSize: 12,
    color: palette.purple.muted,
    marginTop: 2,
  },
  unblockBtn: {
    backgroundColor: '#FAF9FC',
    borderColor: palette.purple.border,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockBtnText: {
    fontSize: 13,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
});
