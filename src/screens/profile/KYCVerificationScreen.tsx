import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Image,
  PermissionsAndroid,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ShieldCheck, 
  ChevronLeft, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Info,
  Clock,
  ShieldAlert,
  X,
  Camera
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { palette } from '../../theme/colors';
import { getKYCStatus, submitKYC, getTrustBreakdown, resolvePhotoUrl } from '../../services/api';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker';
import { fonts } from "@/src/theme";

const { width } = Dimensions.get('window');

const DOCUMENT_TYPES = [
  { label: 'Aadhar Card', value: 'aadhar' },
  { label: 'PAN Card', value: 'pan' },
  { label: 'Passport', value: 'passport' },
  { label: 'Driving License', value: 'dl' },
];

export default function KYCVerificationScreen() {
  const navigation = useNavigation<any>();
  const isDark = false;
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [trustData, setTrustData] = useState<any>(null);
  
  // Form State
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [docNumber, setDocNumber] = useState<string>('');
  const [fullNameOnDoc, setFullNameOnDoc] = useState<string>('');
  const [dobOnDoc, setDobOnDoc] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedSelfie, setSelectedSelfie] = useState<any>(null);

  // File Picker Selection Modal
  const [fileModalVisible, setFileModalVisible] = useState(false);

  const accentColor = palette.purple.deep;
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const mutedText = isDark ? '#A0A0A0' : '#666666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const borderColor = isDark ? '#333333' : '#EEEEEE';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, trustRes] = await Promise.all([
        getKYCStatus(),
        getTrustBreakdown()
      ]);
      
      if (statusRes.data.success && statusRes.data.data) {
        const kycData = statusRes.data.data;
        setStatus(kycData);
        if (kycData.documentType) {
          setSelectedDocType(kycData.documentType);
        }
        if (kycData.documentNumber) {
          setDocNumber(kycData.documentNumber);
        }
        if (kycData.fullName) {
          setFullNameOnDoc(kycData.fullName);
        }
        if (kycData.dob) {
          setDobOnDoc(kycData.dob);
        }
        if (kycData.documentUrl) {
          setSelectedFile({
            uri: resolvePhotoUrl(kycData.documentUrl),
            name: `Uploaded Document (${kycData.documentType})`,
            type: 'image/jpeg',
            isUploaded: true
          });
        }
        if (kycData.selfieUrl) {
          setSelectedSelfie({
            uri: resolvePhotoUrl(kycData.selfieUrl),
            name: 'Captured Live Selfie',
            type: 'image/jpeg',
            isUploaded: true
          });
        }
      } else {
        setStatus({ status: 'not_submitted', selfieStatus: 'not_submitted' });
      }
      if (trustRes.data.success) setTrustData(trustRes.data.data);
    } catch (error) {
      console.error("Fetch KYC Error:", error);
      Alert.alert("Error", "Failed to load verification status.");
    } finally {
      setLoading(false);
    }
  };

  const handlePickFile = () => {
    if (status?.status === 'approved') {
      Alert.alert("Verified", "Your ID Document has already been verified.");
      return;
    }
    setFileModalVisible(true);
  };

  const handleDocFilePicker = async () => {
    setFileModalVisible(false);
    try {
      const results = await pick({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
      });
      if (results && results.length > 0) {
        const file = results[0];
        setSelectedFile({
          uri: file.uri,
          name: file.name || 'document.pdf',
          type: file.type || 'application/pdf',
        });
      }
    } catch (err: any) {
      if (err.message && err.message.includes('cancel')) {
        return;
      }
      console.warn("Document picker error:", err);
      Alert.alert("Error", "Failed to select document.");
    }
  };

  const handleDocGalleryPicker = async () => {
    setFileModalVisible(false);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert("Error", result.errorMessage || "Gallery error occurred.");
        return;
      }
      const asset = result.assets?.[0];
      if (asset) {
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || 'document.jpg',
          type: asset.type || 'image/jpeg',
        });
      }
    } catch (err) {
      console.error("Gallery picker error:", err);
      Alert.alert("Error", "Could not open gallery.");
    }
  };

  const handleOpenSelfieCamera = async () => {
    if (status?.selfieStatus === 'approved') {
      Alert.alert("Verified", "Your selfie has already been verified.");
      return;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission Required",
            message: "Bride & Groom App needs access to your camera to take a verification selfie.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            "Permission Denied",
            "Camera permission is required to capture a verification selfie."
          );
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    try {
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'front',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert("Error", result.errorMessage || "Camera error occurred.");
        return;
      }

      const asset = result.assets?.[0];
      if (asset) {
        setSelectedSelfie({
          uri: asset.uri,
          name: asset.fileName || 'live_selfie.jpg',
          type: asset.type || 'image/jpeg',
        });
      }
    } catch (err) {
      console.error("Camera capture error:", err);
      Alert.alert("Error", "Could not access camera.");
    }
  };

  const renderItemStatusBadge = (itemStatus: string) => {
    switch (itemStatus) {
      case 'approved':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9', paddingVertical: 2, paddingHorizontal: 6 }]}>
            <CheckCircle size={10} color="#2E7D32" />
            <Text style={[styles.statusBadgeText, { color: '#2E7D32', fontSize: 9 }]}>Approved</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FFF3E0', paddingVertical: 2, paddingHorizontal: 6 }]}>
            <Clock size={10} color="#EF6C00" />
            <Text style={[styles.statusBadgeText, { color: '#EF6C00', fontSize: 9 }]}>Pending</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FFEBEE', paddingVertical: 2, paddingHorizontal: 6 }]}>
            <XCircle size={10} color="#C62828" />
            <Text style={[styles.statusBadgeText, { color: '#C62828', fontSize: 9 }]}>Rejected</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#F5F5F5', paddingVertical: 2, paddingHorizontal: 6 }]}>
            <AlertCircle size={10} color="#757575" />
            <Text style={[styles.statusBadgeText, { color: '#757575', fontSize: 9 }]}>Not Sent</Text>
          </View>
        );
    }
  };

  const handleSubmit = async () => {
    const isDocApproved = status?.status === 'approved';
    const isSelfieApproved = status?.selfieStatus === 'approved';

    if (!isDocApproved) {
      if (!selectedDocType) {
        Alert.alert("Error", "Please select a document type.");
        return;
      }
      if (!docNumber.trim()) {
        Alert.alert("Error", "Please enter your Document Number.");
        return;
      }
      if (!fullNameOnDoc.trim()) {
        Alert.alert("Error", "Please enter the Name on the Document.");
        return;
      }
      if (!dobOnDoc.trim()) {
        Alert.alert("Error", "Please enter the Date of Birth on the Document.");
        return;
      }
      // Simple date validation: YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dobOnDoc.trim())) {
        Alert.alert("Error", "Please enter the Date of Birth in YYYY-MM-DD format.");
        return;
      }
    }

    if (!isDocApproved && !selectedFile) {
      Alert.alert("Error", "Please upload your ID proof document.");
      return;
    }

    if (!isSelfieApproved && !selectedSelfie) {
      Alert.alert("Error", "Please capture a live selfie for verification.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();

      if (!isDocApproved) {
        formData.append('documentType', selectedDocType || 'aadhar');
        formData.append('documentNumber', docNumber.trim());
        formData.append('fullName', fullNameOnDoc.trim());
        formData.append('dob', dobOnDoc.trim());
        
        if (selectedFile && !selectedFile.isUploaded) {
          formData.append('document', {
            uri: selectedFile.uri,
            name: selectedFile.name,
            type: selectedFile.type,
          } as any);
        }
      }

      if (!isSelfieApproved) {
        if (selectedSelfie && !selectedSelfie.isUploaded) {
          formData.append('selfie', {
            uri: selectedSelfie.uri,
            name: selectedSelfie.name,
            type: selectedSelfie.type,
          } as any);
        }
      }

      const res = await submitKYC(formData);
      if (res.data.success) {
        Alert.alert("Success", "KYC submission received successfully. Admin will verify details shortly.");
        fetchData();
      }
    } catch (error: any) {
      console.error("Submit KYC Error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to submit KYC.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = () => {
    const currentStatus = status?.status || 'not_submitted';
    
    switch (currentStatus) {
      case 'approved':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
            <CheckCircle size={14} color="#2E7D32" />
            <Text style={[styles.statusBadgeText, { color: '#2E7D32' }]}>Verified</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FFF3E0' }]}>
            <Clock size={14} color="#EF6C00" />
            <Text style={[styles.statusBadgeText, { color: '#EF6C00' }]}>Pending Review</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FFEBEE' }]}>
            <XCircle size={14} color="#C62828" />
            <Text style={[styles.statusBadgeText, { color: '#C62828' }]}>Rejected</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#F5F5F5' }]}>
            <AlertCircle size={14} color="#757575" />
            <Text style={[styles.statusBadgeText, { color: '#757575' }]}>Not Verified</Text>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#F8F9FA' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Trust Score Card */}
        <LinearGradient
          colors={[accentColor, '#7B1FA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.trustCard}
        >
          <View style={styles.trustHeader}>
            <View>
              <Text style={styles.trustTitle}>Trust Score</Text>
              <Text style={styles.trustSub}>Increase your score to get more matches</Text>
            </View>
            <ShieldCheck size={32} color="#FFF" />
          </View>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreNumber}>{trustData?.score || 0}</Text>
            <Text style={styles.scoreTotal}>/100</Text>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${trustData?.score || 0}%` }]} />
          </View>
        </LinearGradient>

        {/* Verification Status List */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Verification Checklist</Text>
          {trustData?.details?.map((item: any, index: number) => (
            <View key={index} style={[styles.checkItem, index !== trustData.details.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
              <View style={styles.checkInfo}>
                <View style={[styles.checkIcon, { backgroundColor: item.status === 'verified' ? '#E8F5E9' : '#F5F5F5' }]}>
                  <CheckCircle size={16} color={item.status === 'verified' ? '#2E7D32' : '#BDBDBD'} />
                </View>
                <View>
                  <Text style={[styles.checkLabel, { color: textColor }]}>{item.label}</Text>
                  <Text style={styles.checkPoints}>+{item.points} Points</Text>
                </View>
              </View>
              {item.status === 'verified' ? (
                <Text style={styles.verifiedText}>Verified</Text>
              ) : (
                <TouchableOpacity style={styles.pendingAction} onPress={() => Alert.alert("Action required", "Please submit your Identity Verification details below.")}>
                  <Text style={{ color: accentColor, fontSize: 12, ...fonts.semibold}}>Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* KYC Upload Section */}
        {status?.status === 'approved' ? (
          <View style={[styles.successCard, { backgroundColor: isDark ? '#1B5E20' : '#E8F5E9' }]}>
            <ShieldCheck size={48} color="#2E7D32" />
            <Text style={[styles.successTitle, { color: '#1B5E20' }]}>Identity Verified</Text>
            <Text style={[styles.successText, { color: '#2E7D32' }]}>
              Your ID proof has been successfully verified. You now have the exclusive "Trust Badge" on your profile.
            </Text>
          </View>
        ) : (
          <View style={[styles.uploadSection, { backgroundColor: cardBg }]}>
            <View style={styles.uploadHeader}>
              <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Identity Verification</Text>
              {renderStatusBadge()}
            </View>
            
            <Text style={[styles.uploadSub, { color: mutedText }]}>
              Upload a clear photo of your ID document to verify your identity.
            </Text>

            {status?.status === 'rejected' && (
              <View style={styles.rejectionCard}>
                <ShieldAlert size={16} color="#C62828" />
                <Text style={styles.rejectionText}>
                  Rejected: {status.rejectionReason || "Documents are not clear."}
                </Text>
              </View>
            )}

             <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.label, { color: textColor, marginBottom: 0 }]}>Document Type</Text>
                {renderItemStatusBadge(status?.status || 'not_submitted')}
              </View>
              <View style={styles.docTypeGrid}>
                {DOCUMENT_TYPES.map((doc) => {
                  const isBlocked = status?.status === 'approved' || status?.status === 'pending';
                  return (
                    <TouchableOpacity
                      key={doc.value}
                      style={[
                        styles.docTypeItem,
                        { borderColor: borderColor },
                        selectedDocType === doc.value && { borderColor: accentColor, backgroundColor: isDark ? '#2D2D2D' : '#F3E5F5' },
                        isBlocked && { opacity: 0.6 }
                      ]}
                      disabled={isBlocked}
                      onPress={() => setSelectedDocType(doc.value)}
                    >
                      <Text style={[
                        styles.docTypeText,
                        { color: mutedText },
                        selectedDocType === doc.value && { color: accentColor, ...fonts.semibold}
                      ]}>
                        {doc.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Document Details Fields */}
            {(!status?.status || (status.status !== 'approved' && status.status !== 'pending')) ? (
              <View style={{ gap: 16, marginBottom: 20 }}>
                <View style={styles.textInputGroup}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Document Number</Text>
                  <TextInput
                    style={[styles.textInput, { color: textColor, backgroundColor: isDark ? '#2D2D2D' : '#F9F7FF', borderColor: borderColor }]}
                    placeholder="Enter Document Number"
                    placeholderTextColor="#A0A0A0"
                    value={docNumber}
                    onChangeText={setDocNumber}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.textInputGroup}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Name on Document</Text>
                  <TextInput
                    style={[styles.textInput, { color: textColor, backgroundColor: isDark ? '#2D2D2D' : '#F9F7FF', borderColor: borderColor }]}
                    placeholder="Enter Name exactly as on document"
                    placeholderTextColor="#A0A0A0"
                    value={fullNameOnDoc}
                    onChangeText={setFullNameOnDoc}
                  />
                </View>

                <View style={styles.textInputGroup}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Date of Birth on Document</Text>
                  <TextInput
                    style={[styles.textInput, { color: textColor, backgroundColor: isDark ? '#2D2D2D' : '#F9F7FF', borderColor: borderColor }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#A0A0A0"
                    value={dobOnDoc}
                    onChangeText={setDobOnDoc}
                  />
                </View>
              </View>
            ) : (
              <View style={[styles.readOnlyContainer, { borderColor: borderColor, backgroundColor: isDark ? '#1C1A24' : '#F6F5FA' }]}>
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Document Number:</Text>
                  <Text style={[styles.readOnlyValue, { color: textColor }]}>{docNumber || '—'}</Text>
                </View>
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Name on Document:</Text>
                  <Text style={[styles.readOnlyValue, { color: textColor }]}>{fullNameOnDoc || '—'}</Text>
                </View>
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>DOB on Document:</Text>
                  <Text style={[styles.readOnlyValue, { color: textColor }]}>{dobOnDoc || '—'}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[
                styles.uploadBox, 
                { borderColor: borderColor, borderStyle: 'dashed' },
                (status?.status === 'approved' || status?.status === 'pending') && { opacity: 0.8 }
              ]}
              disabled={status?.status === 'approved' || status?.status === 'pending'}
              onPress={handlePickFile}
            >
              {selectedFile ? (
                <View style={styles.selectedFileView}>
                  <FileText size={32} color={status?.status === 'approved' ? '#2E7D32' : status?.status === 'rejected' ? '#C62828' : accentColor} />
                  <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  
                  {status?.status === 'approved' && (
                    <Text style={{ color: '#2E7D32', fontSize: 12, ...fonts.semibold, marginTop: 8 }}>ID Document Verified</Text>
                  )}
                  {status?.status === 'pending' && (
                    <Text style={{ color: '#EF6C00', fontSize: 12, ...fonts.semibold, marginTop: 8 }}>Pending Review</Text>
                  )}
                  {status?.status === 'rejected' && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#C62828', fontSize: 12, ...fonts.semibold, marginTop: 8 }}>ID Rejected: {status.rejectionReason || "Please upload a clear copy."}</Text>
                      <TouchableOpacity onPress={() => setSelectedFile(null)} style={{ marginTop: 8 }}>
                        <Text style={{ color: accentColor, fontSize: 12, ...fonts.semibold}}>Tap to re-upload</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {!status?.status || status?.status === 'not_submitted' ? (
                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                      <Text style={{ color: '#C62828', fontSize: 12, ...fonts.semibold, marginTop: 8 }}>Remove</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Upload size={32} color={mutedText} />
                  <Text style={[styles.uploadPlaceholderText, { color: textColor }]}>Tap to upload ID Proof</Text>
                  <Text style={styles.uploadLimit}>Max 5MB (PDF, JPG, PNG)</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Step 2: Live Selfie Verification */}
            <View style={[styles.inputGroup, { marginTop: 10 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.label, { color: textColor, marginBottom: 0 }]}>Step 2: Live Selfie Verification</Text>
                {renderItemStatusBadge(status?.selfieStatus || 'not_submitted')}
              </View>
              <Text style={[styles.uploadSub, { color: mutedText, marginBottom: 8 }]}>
                Capture a real-time selfie to verify that your face matches the image in the uploaded document.
              </Text>
            </View>

            <TouchableOpacity 
              style={[
                styles.uploadBox, 
                { borderColor: borderColor, borderStyle: 'dashed', height: 180 },
                (status?.selfieStatus === 'approved' || status?.selfieStatus === 'pending') && { opacity: 0.8 }
              ]}
              disabled={status?.selfieStatus === 'approved' || status?.selfieStatus === 'pending'}
              onPress={handleOpenSelfieCamera}
            >
              {selectedSelfie ? (
                <View style={styles.selectedFileView}>
                  <Image source={{ uri: selectedSelfie.uri }} style={styles.selfiePreviewImage} />
                  <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                    {selectedSelfie.name}
                  </Text>

                  {status?.selfieStatus === 'approved' && (
                    <Text style={{ color: '#2E7D32', fontSize: 12, ...fonts.semibold, marginTop: 4 }}>Selfie Approved</Text>
                  )}
                  {status?.selfieStatus === 'pending' && (
                    <Text style={{ color: '#EF6C00', fontSize: 12, ...fonts.semibold, marginTop: 4 }}>Selfie Pending Review</Text>
                  )}
                  {status?.selfieStatus === 'rejected' && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#C62828', fontSize: 12, ...fonts.semibold, marginTop: 4 }}>Selfie Rejected: Retake Required</Text>
                      <TouchableOpacity onPress={() => setSelectedSelfie(null)} style={{ marginTop: 6 }}>
                        <Text style={{ color: accentColor, fontSize: 12, ...fonts.semibold}}>Retake Selfie</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {!status?.selfieStatus || status?.selfieStatus === 'not_submitted' ? (
                    <TouchableOpacity onPress={() => setSelectedSelfie(null)}>
                      <Text style={{ color: '#C62828', fontSize: 12, ...fonts.semibold, marginTop: 4 }}>Retake Selfie</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Camera size={32} color={mutedText} />
                  <Text style={[styles.uploadPlaceholderText, { color: textColor }]}>Capture Live Selfie</Text>
                  <Text style={styles.uploadLimit}>Requires front camera alignment</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Info size={14} color="#0288D1" />
              <Text style={styles.infoText}>
                Your data is encrypted and stored securely. It will only be used for verification purposes.
              </Text>
            </View>

            <TouchableOpacity 
              style={[
                styles.submitButton, 
                { backgroundColor: accentColor },
                (submitting || (status?.status === 'pending' && status?.selfieStatus === 'pending')) && { opacity: 0.6 }
              ]}
              onPress={handleSubmit}
              disabled={submitting || (status?.status === 'pending' && status?.selfieStatus === 'pending')}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#FFF" />
                  <Text style={styles.submitButtonText}>
                    {status?.status === 'pending' ? 'Verification in Progress' : 'Submit for Verification'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Document Selection Modal */}
      <Modal
        visible={fileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 30 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Verification Document</Text>
              <TouchableOpacity onPress={() => setFileModalVisible(false)}>
                <X size={24} color={palette.purple.deep} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, gap: 12 }}>
              <TouchableOpacity 
                style={styles.mockFileBtn} 
                onPress={handleDocFilePicker}
              >
                <FileText size={20} color={accentColor} />
                <Text style={styles.mockFileText}>Upload PDF or Document File</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.mockFileBtn} 
                onPress={handleDocGalleryPicker}
              >
                <Camera size={20} color={accentColor} />
                <Text style={styles.mockFileText}>Select Image from Photo Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    ...fonts.semibold,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  trustCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  trustHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  trustTitle: {
    color: '#FFF',
    fontSize: 14,
    ...fonts.semibold,
    opacity: 0.8,
  },
  trustSub: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreNumber: {
    color: '#FFF',
    fontSize: 48,
    ...fonts.bold,
  },
  scoreTotal: {
    color: '#FFF',
    fontSize: 20,
    ...fonts.medium,
    opacity: 0.6,
    marginLeft: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  section: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    ...fonts.semibold,
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  checkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkLabel: {
    fontSize: 14,
    ...fonts.semibold,
  },
  checkPoints: {
    fontSize: 11,
    color: '#2E7D32',
    ...fonts.semibold,
    marginTop: 2,
  },
  verifiedText: {
    color: '#2E7D32',
    fontSize: 12,
    ...fonts.semibold,
  },
  pendingAction: {
    backgroundColor: 'rgba(106, 27, 154, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  uploadSection: {
    borderRadius: 24,
    padding: 20,
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    ...fonts.semibold,
  },
  uploadSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  rejectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  rejectionText: {
    fontSize: 12,
    color: '#C62828',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    ...fonts.semibold,
    marginBottom: 12,
  },
  docTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  docTypeItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  docTypeText: {
    fontSize: 13,
  },
  uploadBox: {
    height: 140,
    borderWidth: 2,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadPlaceholderText: {
    fontSize: 14,
    ...fonts.semibold,
    marginTop: 12,
  },
  uploadLimit: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  selectedFileView: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fileName: {
    fontSize: 14,
    ...fonts.semibold,
    marginTop: 10,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(2, 136, 209, 0.08)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 12,
    color: '#0288D1',
    flex: 1,
    lineHeight: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    ...fonts.semibold,
  },
  successCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    ...fonts.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 18,
    ...fonts.semibold,
    color: '#000000',
  },
  mockFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F7FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0F0',
    gap: 12,
  },
  mockFileText: {
    fontSize: 14,
    ...fonts.semibold,
    color: '#3B1E54',
  },
  cameraModalContent: {
    width: '100%',
    height: '80%',
    backgroundColor: '#121212',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    position: 'absolute',
    bottom: 0,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraTitle: {
    color: '#FFF',
    fontSize: 18,
    ...fonts.bold,
  },
  viewfinderContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  ovalOverlay: {
    width: 200,
    height: 270,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderStyle: 'dashed',
  },
  scanIndicator: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    right: '10%',
    height: 2,
    backgroundColor: '#00E676',
  },
  viewfinderText: {
    color: '#AAA',
    fontSize: 13,
    marginTop: 20,
    ...fonts.semibold,
  },
  cameraControls: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  captureBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FF3B30',
  },
  livenessWarning: {
    color: '#666',
    fontSize: 11,
    ...fonts.semibold,
  },
  selfiePreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  textInputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    ...fonts.semibold,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  readOnlyContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readOnlyLabel: {
    fontSize: 13,
    ...fonts.semibold,
    color: '#7D6B8F',
  },
  readOnlyValue: {
    fontSize: 13,
    ...fonts.semibold,
  },
});
