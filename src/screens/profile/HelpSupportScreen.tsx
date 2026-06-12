import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
  Linking,
  Platform,
  RefreshControl,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  BookOpen,
  Send,
  History,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Clock,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  Trash2,
  Paperclip,
  FileText,
  X,
  MessageCircle,
  Image as ImageIcon,
  ExternalLink,
  Shield,
} from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { resolvePhotoUrl, getMyReports, getUserFeedback, submitFeedback, deleteFeedbackQuery } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../../services/secureStorage';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker';
import { fonts } from "@/src/theme";

// Predefined FAQ Data
const FAQ_DATA = [
  {
    id: 1,
    question: 'How do I verify my profile (KYC)?',
    answer: 'To verify your profile, open the Side Drawer, select "KYC Verification", and upload a scanned image of your Aadhaar card or PAN card. Our moderation team reviews all submissions within 24 hours. Verified profiles receive a gold trust badge and enjoy higher visibility.',
    category: 'verification'
  },
  {
    id: 2,
    question: 'Can I hide my phone number or photos?',
    answer: 'Yes, you have full control over your privacy. Go to "Account Settings" from the Side Drawer. Under "Privacy Settings", you can set visibility for your profile, photos, email, and phone number to "Everyone", "Members", "Only Matches", or "Paid Members".',
    category: 'privacy'
  },
  {
    id: 3,
    question: 'What benefits do premium plans provide?',
    answer: 'Our premium plans allow you to reveal contact details (phone and email) of match profiles, watch match video introductions, display VIP badges, and increase your overall profile visibility by up to 3x.',
    category: 'subscription'
  },
  {
    id: 4,
    question: 'What is the 100% Money-Back Guarantee?',
    answer: 'If you upgrade to premium and do not receive any match interests or response messages within 30 days, we will issue a full refund. Terms and conditions apply.',
    category: 'subscription'
  },
  {
    id: 5,
    question: 'How long is my subscription valid?',
    answer: 'Depending on your selected tier, subscriptions are valid for 90 Days (3 Months), 180 Days (6 Months), or 365 Days (1 Year). You can check your active plan validity directly in your Dashboard.',
    category: 'subscription'
  },
  {
    id: 6,
    question: 'Are payment transactions secure?',
    answer: 'Absolutely. All payment transactions are securely processed and fully encrypted via industry-standard protocols, supporting UPI, credit/debit cards, net banking, and wallets.',
    category: 'subscription'
  },
  {
    id: 7,
    question: 'How do I deactivate or delete my account?',
    answer: 'If you want a temporary break, navigate to "Account Settings" and toggle "Deactivate Profile". This hides you from recommendations and search lists. To delete your account permanently, tap "Delete Account" in the Danger Zone and confirm your password.',
    category: 'account'
  },
  {
    id: 8,
    question: 'Is my personal data safe on the app?',
    answer: 'Absolutely. We use industry-standard encryption protocols to secure your private chat messages, database records, and authentication details. We do not sell your personal data or profile logs to third-party ad networks.',
    category: 'security'
  }
];

// Ticket categories matching backend feedback ENUM: 'issue' | 'suggestion' | 'other' | 'billing'
const CATEGORY_OPTIONS = [
  { label: 'Technical Issue', value: 'issue' },
  { label: 'Suggestion / Feedback', value: 'suggestion' },
  { label: 'Billing & Payments', value: 'billing' },
  { label: 'General / Other Query', value: 'other' }
];

interface AttachmentFile {
  uri: string;
  name: string;
  type: string;
}

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Active Tab: 'faqs' | 'contact' | 'history'
  const [activeTab, setActiveTab] = useState<'faqs' | 'contact' | 'history'>(
    route.params?.activeTab || 'faqs'
  );

  // Sync tab selection with route params changes
  useEffect(() => {
    if (route.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route.params?.activeTab]);

  // FAQ Accordion State
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Ticket Form States
  const [categoryLabel, setCategoryLabel] = useState('Select Category');
  const [categoryValue, setCategoryValue] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<AttachmentFile | null>(null);
  const [filePickerModalVisible, setFilePickerModalVisible] = useState(false);

  // Ticket History States
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Report History States
  const [historySubTab, setHistorySubTab] = useState<'tickets' | 'reports'>('tickets');
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Report details popup modal state
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const handleOpenReportDetails = (report: any) => {
    setSelectedReport(report);
    setReportModalVisible(true);
  };

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'confirm' | 'info' = 'info',
    onConfirm?: () => void
  ) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'OK', onPress: onConfirm }
      ]
    );
  };

  // Fetch Ticket History from backend
  const fetchTicketHistory = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setHistoryLoading(true);
    }
    try {
      const token = await secureStorage.getItem('token');
      if (!token) return;

      const response = await getUserFeedback();
      const data = response.data;
      if (Array.isArray(data)) {
        setTickets(data);
      } else if (data && data.success) {
        setTickets(Array.isArray(data.feedbacks) ? data.feedbacks : []);
      } else {
        showAlert('Error', 'Failed to retrieve ticket history.', 'error');
      }
    } catch (err) {
      console.error('Fetch history error:', err);
      showAlert('Network Error', 'Could not load your ticket history.', 'error');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setHistoryLoading(false);
      }
    }
  };

  // Pull-to-refresh handler for FAQs
  const handleRefreshFaqs = async () => {
    setRefreshing(true);
    // Add a small delay for premium visual effect
    await new Promise<void>(resolve => setTimeout(() => resolve(), 800));
    setRefreshing(false);
  };

  const fetchReportsHistory = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setReportsLoading(true);
    }
    try {
      const res = await getMyReports();
      if (res.data && res.data.success) {
        setReports(res.data.data || []);
      } else {
        showAlert('Error', 'Failed to retrieve report history.', 'error');
      }
    } catch (err) {
      console.error('Fetch report history error:', err);
      showAlert('Network Error', 'Could not load your report history.', 'error');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setReportsLoading(false);
      }
    }
  };

  // Fetch history when tab changes or sub-tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      if (historySubTab === 'tickets') {
        fetchTicketHistory();
      } else {
        fetchReportsHistory();
      }
    }
  }, [activeTab, historySubTab]);

  // ---- FILE PICKER HANDLERS ----

  const handlePickImage = async () => {
    setFilePickerModalVisible(false);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Gallery error occurred.');
        return;
      }
      const asset = result.assets?.[0];
      if (asset) {
        setAttachmentFile({
          uri: asset.uri || '',
          name: asset.fileName || 'photo.jpg',
          type: asset.type || 'image/jpeg',
        });
      }
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Could not open gallery.');
    }
  };

  const handlePickDocument = async () => {
    setFilePickerModalVisible(false);
    try {
      const results = await pick({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
      });
      if (results && results.length > 0) {
        const file = results[0];
        setAttachmentFile({
          uri: file.uri,
          name: file.name || 'document.pdf',
          type: file.type || 'application/pdf',
        });
      }
    } catch (err: any) {
      if (err.message && err.message.includes('cancel')) {
        return;
      }
      console.warn('Document picker error:', err);
      Alert.alert('Error', 'Failed to select document.');
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
  };

  // Handle Form Submission (with multipart/form-data for file attachments)
  const handleSubmitTicket = async () => {
    if (!categoryValue) {
      showAlert('Category Required', 'Please select a ticket category.', 'error');
      return;
    }
    if (!subject.trim()) {
      showAlert('Subject Required', 'Please enter a ticket subject.', 'error');
      return;
    }
    if (!message.trim()) {
      showAlert('Message Required', 'Please describe your query in detail.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = await secureStorage.getItem('token');
      if (!token) return;

      const formData = new FormData();
      formData.append('type', categoryValue);
      formData.append('subject', subject.trim());
      formData.append('message', message.trim());

      // Append file attachment if selected
      if (attachmentFile) {
        formData.append('attachment', {
          uri: attachmentFile.uri,
          name: attachmentFile.name,
          type: attachmentFile.type,
        } as any);
      }

      const response = await submitFeedback(formData);
      const result = response.data;
      if (result.success) {
        showAlert('Ticket Submitted', 'Thank you for reaching out! Our support agents will review your request shortly.', 'success', () => {
          // Reset form fields
          setCategoryLabel('Select Category');
          setCategoryValue('');
          setSubject('');
          setMessage('');
          setAttachmentFile(null);
          // Redirect to History
          setActiveTab('history');
        });
      } else {
        showAlert('Failed to Submit', result.message || 'Could not submit support ticket.', 'error');
      }
    } catch (err) {
      console.error('Submit ticket error:', err);
      showAlert('Network Error', 'Connection failed. Please check your internet connection.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete query history item
  const handleDeleteQuery = async (queryId: string) => {
    Alert.alert(
      "Delete Query History",
      "Are you sure you want to remove this support ticket from your history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await secureStorage.getItem('token');
              if (!token) return;

              const response = await deleteFeedbackQuery(queryId);
              const result = response.data;

              if (result.success) {
                // Filter out of local state
                setTickets(prev => prev.filter(ticket => ticket.id !== queryId));
                showAlert('Success', 'Query deleted from your history.', 'success');
              } else {
                showAlert('Error', 'Could not delete query. Please try again.', 'error');
              }
            } catch (err) {
              console.error('Delete feedback error:', err);
              showAlert('Error', 'Connection failed.', 'error');
            }
          }
        }
      ]
    );
  };

  // Call helpline number
  const handleCallSupport = () => {
    Linking.openURL('tel:+918698891975').catch(() => {
      showAlert('Error', 'Helpline call could not be completed on this device.', 'error');
    });
  };

  // Email support desk
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@brideandgroom.co.in').catch(() => {
      showAlert('Error', 'Mail client could not be opened.', 'error');
    });
  };

  // Open attachment URL in browser
  const handleViewAttachment = (url: string) => {
    const resolvedUrl = resolvePhotoUrl(url);
    Linking.openURL(resolvedUrl).catch(() => {
      showAlert('Error', 'Could not open attachment.', 'error');
    });
  };

  // Filter FAQs based on search query
  const filteredFAQs = FAQ_DATA.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format Dates
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Select Category handler
  const handleSelectCategory = (label: string, value: string) => {
    setCategoryLabel(label);
    setCategoryValue(value);
    setCategoryModalVisible(false);
  };

  // Get file extension icon helper
  const isImageFile = (name: string) => {
    const ext = name.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#FFFFFF' }]} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={palette.purple.deep} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'faqs' && styles.activeTabButton]}
          onPress={() => setActiveTab('faqs')}
        >
          <BookOpen size={18} color={activeTab === 'faqs' ? palette.gold.main : palette.purple.muted} style={styles.tabIcon} />
          <Text style={[styles.tabLabel, activeTab === 'faqs' && styles.activeTabLabel]}>FAQs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'contact' && styles.activeTabButton]}
          onPress={() => setActiveTab('contact')}
        >
          <Send size={18} color={activeTab === 'contact' ? palette.gold.main : palette.purple.muted} style={styles.tabIcon} />
          <Text style={[styles.tabLabel, activeTab === 'contact' && styles.activeTabLabel]}>Contact Us</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.activeTabButton]}
          onPress={() => setActiveTab('history')}
        >
          <History size={18} color={activeTab === 'history' ? palette.gold.main : palette.purple.muted} style={styles.tabIcon} />
          <Text style={[styles.tabLabel, activeTab === 'history' && styles.activeTabLabel]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* TAB CONTENT: FAQs */}
      {activeTab === 'faqs' && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefreshFaqs}
              colors={[palette.gold.main]}
              tintColor={palette.gold.main}
            />
          }
        >
          {/* FAQ Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={18} color={palette.purple.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search frequently asked questions..."
              placeholderTextColor="rgba(126, 107, 143, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Accordion FAQ List */}
          <View style={styles.faqList}>
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, index) => {
                const isExpanded = expandedIndex === index;
                return (
                  <View key={faq.id} style={styles.faqItem}>
                    <TouchableOpacity
                      style={styles.faqQuestionRow}
                      onPress={() => setExpandedIndex(isExpanded ? null : index)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                      {isExpanded ? (
                        <ChevronUp size={18} color={palette.purple.deep} />
                      ) : (
                        <ChevronDown size={18} color={palette.purple.deep} />
                      )}
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={styles.faqAnswerContainer}>
                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyFaqsContainer}>
                <AlertCircle size={36} color={palette.purple.muted} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyText}>No matching questions found.</Text>
              </View>
            )}
          </View>

          {/* Support Channels Card */}
          <View style={styles.contactCard}>
            <Text style={styles.contactCardTitle}>Still Need Assistance?</Text>
            <Text style={styles.contactCardSubtitle}>Reach out to our customer support desk via the details below:</Text>

            <TouchableOpacity style={styles.channelRow} onPress={handleCallSupport}>
              <View style={styles.channelIconWrapper}>
                <Phone size={18} color={palette.gold.main} />
              </View>
              <View style={styles.channelDetails}>
                <Text style={styles.channelLabel}>Phone Helpline</Text>
                <Text style={styles.channelValue}>+91 8698891975</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.channelRow} onPress={handleEmailSupport}>
              <View style={styles.channelIconWrapper}>
                <Mail size={18} color={palette.gold.main} />
              </View>
              <View style={styles.channelDetails}>
                <Text style={styles.channelLabel}>Email Support Desk</Text>
                <Text style={styles.channelValue}>support@brideandgroom.co.in</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.timingRow}>
              <Clock size={14} color={palette.purple.muted} style={{ marginRight: 6 }} />
              <Text style={styles.timingText}>Helpline Hours: Mon-Sat, 9:00 AM - 6:00 PM IST</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* TAB CONTENT: CONTACT US FORM */}
      {activeTab === 'contact' && (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <Text style={styles.formInfoText}>
              Submit a support ticket regarding any app issues or questions. Our moderators will review and respond to your query.
            </Text>

            {/* Category Dropdown Field */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Support Category</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Text style={[styles.dropdownText, categoryValue ? { color: palette.purple.deep } : { color: 'rgba(126, 107, 143, 0.4)' }]}>
                  {categoryLabel}
                </Text>
                <ChevronDown size={18} color={palette.purple.deep} />
              </TouchableOpacity>
            </View>

            {/* Subject Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Ticket Subject</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Brief summary of your query"
                placeholderTextColor="rgba(126, 107, 143, 0.4)"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* Message Description Textarea */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Detailed Message</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your issue or feedback in detail..."
                placeholderTextColor="rgba(126, 107, 143, 0.4)"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
            </View>

            {/* File Attachment Section */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Attach File (Optional)</Text>
              {attachmentFile ? (
                <View style={styles.attachmentPreview}>
                  <View style={styles.attachmentInfo}>
                    {isImageFile(attachmentFile.name) ? (
                      <ImageIcon size={18} color={palette.gold.main} />
                    ) : (
                      <FileText size={18} color={palette.gold.main} />
                    )}
                    <Text style={styles.attachmentName} numberOfLines={1}>{attachmentFile.name}</Text>
                  </View>
                  <TouchableOpacity onPress={handleRemoveAttachment} style={styles.removeAttachmentBtn}>
                    <X size={16} color={palette.purple.muted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={() => setFilePickerModalVisible(true)}
                >
                  <Paperclip size={18} color={palette.purple.muted} style={{ marginRight: 8 }} />
                  <Text style={styles.attachBtnText}>Tap to attach PDF, JPG, or PNG</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.attachHint}>Max file size: 10 MB. Accepted: PDF, JPG, JPEG, PNG</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabledBtn]}
              onPress={handleSubmitTicket}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Support Ticket</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* TAB CONTENT: TICKET HISTORY */}
      {activeTab === 'history' && (
        <View style={{ flex: 1 }}>
          {/* Sub-segmented filter */}
          <View style={styles.subTabContainer}>
            <TouchableOpacity
              style={[styles.subTabButton, historySubTab === 'tickets' && styles.activeSubTabButton]}
              onPress={() => setHistorySubTab('tickets')}
            >
              <Text style={[styles.subTabLabel, historySubTab === 'tickets' && styles.activeSubTabLabel]}>
                Support Tickets
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subTabButton, historySubTab === 'reports' && styles.activeSubTabButton]}
              onPress={() => setHistorySubTab('reports')}
            >
              <Text style={[styles.subTabLabel, historySubTab === 'reports' && styles.activeSubTabLabel]}>
                Report History
              </Text>
            </TouchableOpacity>
          </View>

          {historySubTab === 'tickets' ? (
            historyLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={palette.gold.main} />
                <Text style={styles.loaderText}>Loading tickets...</Text>
              </View>
            ) : (
              <FlatList
                data={tickets}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: 40 }]}
                alwaysBounceVertical={true}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => fetchTicketHistory(true)}
                    colors={[palette.gold.main]}
                    tintColor={palette.gold.main}
                  />
                }
                renderItem={({ item }) => {
                  // Color badges matching ticket status: 'pending' | 'reviewed' | 'resolved'
                  let badgeStyle = styles.badgePending;
                  let badgeLabel = 'Pending';
                  if (item.status === 'reviewed') {
                    badgeStyle = styles.badgeReviewed;
                    badgeLabel = 'Reviewed';
                  } else if (item.status === 'resolved') {
                    badgeStyle = styles.badgeResolved;
                    badgeLabel = 'Resolved';
                  }

                  // Map database ENUM value for categories to friendly labels
                  const matchedCategory = CATEGORY_OPTIONS.find(opt => opt.value === item.type);
                  const categoryName = matchedCategory ? matchedCategory.label : 'Query';

                  const isTicketExpanded = expandedTicketId === item.id;

                  return (
                    <TouchableOpacity
                      style={styles.ticketCard}
                      activeOpacity={0.8}
                      onPress={() => setExpandedTicketId(isTicketExpanded ? null : item.id)}
                    >
                      <View style={styles.ticketHeader}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.ticketCategory}>{categoryName}</Text>
                            {item.attachmentUrl && (
                              <View style={styles.attachBadge}>
                                <Paperclip size={10} color={palette.gold.main} />
                              </View>
                            )}
                            {item.adminResponse && (
                              <View style={styles.responseBadge}>
                                <MessageCircle size={10} color="#4CAF50" />
                              </View>
                            )}
                          </View>
                          <Text style={styles.ticketDate}>{formatDate(item.createdAt)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={[styles.statusBadge, badgeStyle, { marginRight: 8 }]}>
                            <Text style={styles.statusBadgeText}>{badgeLabel}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteQuery(item.id)}
                            style={styles.deleteTicketBtn}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={16} color={palette.purple.muted} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.ticketSubject}>{item.subject}</Text>
                      <Text style={styles.ticketMessage}>{item.message}</Text>

                      {/* Attachment Link */}
                      {item.attachmentUrl && (
                        <TouchableOpacity
                          style={styles.attachmentLinkRow}
                          onPress={() => handleViewAttachment(item.attachmentUrl)}
                        >
                          {isImageFile(item.attachmentUrl) ? (
                            <ImageIcon size={14} color={palette.gold.main} />
                          ) : (
                            <FileText size={14} color={palette.gold.main} />
                          )}
                          <Text style={styles.attachmentLinkText} numberOfLines={1}>
                            {item.attachmentUrl.split('/').pop() || 'View Attachment'}
                          </Text>
                          <ExternalLink size={12} color={palette.purple.muted} />
                        </TouchableOpacity>
                      )}

                      {/* Admin Response Section */}
                      {item.adminResponse && isTicketExpanded && (
                        <View style={styles.adminResponseCard}>
                          <View style={styles.adminResponseHeader}>
                            <MessageCircle size={14} color="#4CAF50" />
                            <Text style={styles.adminResponseLabel}>Admin Response</Text>
                          </View>
                          <Text style={styles.adminResponseText}>{item.adminResponse}</Text>
                        </View>
                      )}

                      {/* Expand hint */}
                      {(item.adminResponse || item.attachmentUrl) && (
                        <View style={styles.expandHintRow}>
                          {isTicketExpanded ? (
                            <ChevronUp size={14} color={palette.purple.muted} />
                          ) : (
                            <ChevronDown size={14} color={palette.purple.muted} />
                          )}
                          <Text style={styles.expandHintText}>
                            {isTicketExpanded ? 'Tap to collapse' : 'Tap for details'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyHistoryContainer}>
                    <HelpCircle size={44} color={palette.purple.border} style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyTitle}>No Support Tickets Found</Text>
                    <Text style={styles.emptySubtitle}>
                      If you submit a help request or feedback using the Contact Us form, it will appear here with its status.
                    </Text>
                  </View>
                }
              />
            )
          ) : (
            reportsLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={palette.gold.main} />
                <Text style={styles.loaderText}>Loading reports...</Text>
              </View>
            ) : (
              <FlatList
                data={reports}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: 40 }]}
                alwaysBounceVertical={true}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => fetchReportsHistory(true)}
                    colors={[palette.gold.main]}
                    tintColor={palette.gold.main}
                  />
                }
                renderItem={({ item }) => {
                  // status badge styling: 'pending' | 'reviewed' | 'resolved' | 'dismissed' | 'urgent_review'
                  let badgeStyle = styles.badgePending;
                  let badgeLabel = 'Pending';
                  if (item.status === 'reviewed') {
                    badgeStyle = styles.badgeReviewed;
                    badgeLabel = 'Reviewed';
                  } else if (item.status === 'resolved') {
                    badgeStyle = styles.badgeResolved;
                    badgeLabel = 'Resolved';
                  } else if (item.status === 'dismissed') {
                    badgeStyle = styles.badgeDismissed;
                    badgeLabel = 'Dismissed';
                  } else if (item.status === 'urgent_review') {
                    badgeStyle = styles.badgeUrgent;
                    badgeLabel = 'Urgent Review';
                  }

                  const name = item.reportedUser?.profile
                    ? `${item.reportedUser.profile.firstName || ''} ${item.reportedUser.profile.lastName || ''}`.trim()
                    : (item.reportedUser ? `${item.reportedUser.firstName || ''} ${item.reportedUser.lastName || ''}`.trim() : 'Unknown Member');
                  const customId = item.reportedUser?.profile?.customId || `ID: ${item.reportedId}`;
                  
                  const isReportExpanded = expandedReportId === item.id.toString();

                  return (
                    <TouchableOpacity
                      style={styles.ticketCard}
                      activeOpacity={0.8}
                      onPress={() => handleOpenReportDetails(item)}
                    >
                      <View style={styles.ticketHeader}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={[styles.ticketCategory, { color: '#FF3B30' }]}>Reported Member</Text>
                          <Text style={styles.reportedNameText}>{name}</Text>
                          <Text style={styles.ticketDate}>{formatDate(item.createdAt)}</Text>
                        </View>
                        <View style={[styles.statusBadge, badgeStyle]}>
                          <Text style={styles.statusBadgeText}>{badgeLabel}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.reportDetailRow}>
                        <Text style={styles.reportDetailLabel}>Reason:</Text>
                        <Text style={styles.reportDetailValue}>{item.reason}</Text>
                      </View>

                      {item.description ? (
                        <View style={styles.reportDescWrapper}>
                          <Text style={styles.reportDescText}>{item.description}</Text>
                        </View>
                      ) : null}

                      {/* Display proofs/attachments if available */}
                      {item.proofUrls && item.proofUrls.length > 0 && (
                        <View style={{ marginTop: 10 }}>
                          <Text style={styles.proofLabel}>Proof Attachments ({item.proofUrls.length}):</Text>
                          {item.proofUrls.map((url: string, pIdx: number) => {
                            const isImg = isImageFile(url) || url.includes('.webp') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png');
                            const fileName = url.split('/').pop()?.split('?')[0] || `proof_${pIdx + 1}`;
                            return (
                              <TouchableOpacity
                                key={pIdx}
                                style={[styles.attachmentLinkRow, { marginTop: 6 }]}
                                onPress={() => handleViewAttachment(url)}
                              >
                                {isImg ? (
                                  <ImageIcon size={14} color={palette.gold.main} />
                                ) : (
                                  <FileText size={14} color={palette.gold.main} />
                                )}
                                <Text style={styles.attachmentLinkText} numberOfLines={1}>
                                  {fileName}
                                </Text>
                                <ExternalLink size={12} color={palette.purple.muted} />
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {/* Admin action/comments Section */}
                      {item.actionTaken && isReportExpanded && (
                        <View style={[styles.adminResponseCard, { borderColor: 'rgba(212, 175, 55, 0.2)', backgroundColor: '#FAF8FC' }]}>
                          <View style={styles.adminResponseHeader}>
                            <AlertCircle size={14} color={palette.gold.main} />
                            <Text style={[styles.adminResponseLabel, { color: palette.gold.main }]}>Resolution Comment</Text>
                          </View>
                          <Text style={[styles.adminResponseText, { color: palette.purple.deep }]}>{item.actionTaken}</Text>
                        </View>
                      )}

                      {/* Expand hint */}
                      {item.actionTaken && (
                        <View style={styles.expandHintRow}>
                          {isReportExpanded ? (
                            <ChevronUp size={14} color={palette.purple.muted} />
                          ) : (
                            <ChevronDown size={14} color={palette.purple.muted} />
                          )}
                          <Text style={styles.expandHintText}>
                            {isReportExpanded ? 'Tap to collapse' : 'Tap for details'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyHistoryContainer}>
                    <Shield size={44} color={palette.purple.border} style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyTitle}>No Reports Submitted</Text>
                    <Text style={styles.emptySubtitle}>
                      Profiles you have flagged or reported to the administration for review will be listed here.
                    </Text>
                  </View>
                }
              />
            )
          )}
        </View>
      )}

      {/* Category Selection Modal */}
      <Modal visible={categoryModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalOptionsContainer}>
              {CATEGORY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOptionBtn}
                  onPress={() => handleSelectCategory(option.label, option.value)}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* File Picker Modal (Image or Document) */}
      <Modal visible={filePickerModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attach a File</Text>
              <TouchableOpacity onPress={() => setFilePickerModalVisible(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalOptionsContainer}>
              <TouchableOpacity style={styles.filePickerOption} onPress={handlePickImage}>
                <View style={styles.filePickerIconWrap}>
                  <ImageIcon size={20} color={palette.gold.main} />
                </View>
                <View>
                  <Text style={styles.modalOptionText}>Choose from Gallery</Text>
                  <Text style={styles.filePickerHint}>JPG, JPEG, PNG images</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filePickerOption} onPress={handlePickDocument}>
                <View style={styles.filePickerIconWrap}>
                  <FileText size={20} color={palette.gold.main} />
                </View>
                <View>
                  <Text style={styles.modalOptionText}>Choose a Document</Text>
                  <Text style={styles.filePickerHint}>PDF, JPG, PNG files</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Report Details Modal Popup */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { setReportModalVisible(false); setSelectedReport(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Details</Text>
              <TouchableOpacity onPress={() => { setReportModalVisible(false); setSelectedReport(null); }}>
                <X size={20} color={palette.purple.deep} />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Reported Member info */}
                <View style={styles.modalReportedSection}>
                  <Text style={styles.modalSectionLabel}>Reported User</Text>
                  <Text style={styles.modalReportedName}>
                    {selectedReport.reportedUser?.profile
                      ? `${selectedReport.reportedUser.profile.firstName || ''} ${selectedReport.reportedUser.profile.lastName || ''}`.trim()
                      : (selectedReport.reportedUser ? `${selectedReport.reportedUser.firstName || ''} ${selectedReport.reportedUser.lastName || ''}`.trim() : 'Unknown Member')}
                  </Text>
                  <Text style={styles.modalReportedId}>
                    {selectedReport.reportedUser?.profile?.customId || `ID: ${selectedReport.reportedId}`}
                  </Text>
                  <Text style={styles.modalReportedDate}>
                    Submitted on: {formatDate(selectedReport.createdAt)}
                  </Text>
                </View>

                {/* Status Badge & Reason */}
                <View style={styles.modalRowContainer}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalSectionLabel}>Status</Text>
                    <View style={[
                      styles.statusBadge,
                      selectedReport.status === 'reviewed' && styles.badgeReviewed,
                      selectedReport.status === 'resolved' && styles.badgeResolved,
                      selectedReport.status === 'dismissed' && styles.badgeDismissed,
                      selectedReport.status === 'urgent_review' && styles.badgeUrgent,
                      selectedReport.status === 'pending' && styles.badgePending,
                      { alignSelf: 'flex-start', marginTop: 4 }
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        {selectedReport.status === 'urgent_review' ? 'Urgent Review' : selectedReport.status}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.modalSectionLabel}>Violation Reason</Text>
                    <Text style={styles.modalReasonText}>{selectedReport.reason}</Text>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.modalDetailSection}>
                  <Text style={styles.modalSectionLabel}>Description Notes</Text>
                  <View style={styles.modalDescCard}>
                    <Text style={styles.modalDescContent}>
                      {selectedReport.description || "No additional description details provided."}
                    </Text>
                  </View>
                </View>

                {/* Proof Attachments */}
                {selectedReport.proofUrls && selectedReport.proofUrls.length > 0 && (
                  <View style={styles.modalDetailSection}>
                    <Text style={styles.modalSectionLabel}>Submitted Proofs ({selectedReport.proofUrls.length})</Text>
                    {selectedReport.proofUrls.map((url: string, pIdx: number) => {
                      const isImg = isImageFile(url) || url.toLowerCase().includes('.webp') || url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg') || url.toLowerCase().includes('.png');
                      const fileName = url.split('/').pop()?.split('?')[0] || `proof_${pIdx + 1}`;
                      const resolvedUrl = resolvePhotoUrl(url);
                      return (
                        <View key={pIdx} style={{ marginBottom: 12 }}>
                          {isImg ? (
                            <TouchableOpacity 
                              onPress={() => handleViewAttachment(url)}
                              activeOpacity={0.8}
                              style={{ width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: palette.purple.border }}
                            >
                              <Image 
                                source={{ uri: resolvedUrl }} 
                                style={{ width: '100%', height: '100%', resizeMode: 'cover' }} 
                              />
                              <View style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                paddingVertical: 4,
                                paddingHorizontal: 10,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <Text style={{ color: '#FFF', fontSize: 11, ...fonts.medium, flex: 1 }} numberOfLines={1}>{fileName}</Text>
                                <ExternalLink size={11} color="#FFF" />
                              </View>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={[styles.attachmentLinkRow, { marginTop: 0 }]}
                              onPress={() => handleViewAttachment(url)}
                            >
                              <FileText size={14} color={palette.gold.main} />
                              <Text style={styles.attachmentLinkText} numberOfLines={1}>
                                {fileName}
                              </Text>
                              <ExternalLink size={12} color={palette.purple.muted} />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Admin Feedback */}
                <View style={styles.modalDetailSection}>
                  <Text style={styles.modalSectionLabel}>Admin Action & Feedback</Text>
                  <View style={[
                    styles.adminResponseCard, 
                    { 
                      borderColor: selectedReport.actionTaken ? 'rgba(76, 175, 80, 0.2)' : palette.purple.border,
                      backgroundColor: selectedReport.actionTaken ? '#F0F8F0' : '#FAF9FC',
                      marginTop: 8
                    }
                  ]}>
                    <View style={styles.adminResponseHeader}>
                      {selectedReport.actionTaken ? (
                        <CheckCircle size={14} color="#4CAF50" />
                      ) : (
                        <AlertCircle size={14} color={palette.purple.muted} />
                      )}
                      <Text style={[styles.adminResponseLabel, { color: selectedReport.actionTaken ? '#4CAF50' : palette.purple.muted }]}>
                        {selectedReport.actionTaken ? 'Resolution Comment' : 'Under Review'}
                      </Text>
                    </View>
                    <Text style={[styles.adminResponseText, { color: selectedReport.actionTaken ? '#2E7D32' : palette.purple.muted }]}>
                      {selectedReport.actionTaken || "This report is currently pending review by our administration safety team."}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitBtn, { marginTop: 0, width: '100%' }]}
                onPress={() => { setReportModalVisible(false); setSelectedReport(null); }}
              >
                <Text style={styles.submitBtnText}>Close Details</Text>
              </TouchableOpacity>
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: palette.purple.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: palette.gold.main,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 13,
    ...fonts.semibold,
    color: palette.purple.muted,
  },
  activeTabLabel: {
    color: palette.purple.deep,
    ...fonts.semibold,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  // FAQ styling
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F5FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: palette.purple.deep,
  },
  faqList: {
    marginBottom: 20,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.purple.border,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 14,
    ...fonts.semibold,
    color: palette.purple.deep,
    flex: 0.95,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F7F5FA',
  },
  faqAnswer: {
    fontSize: 13,
    color: palette.purple.muted,
    lineHeight: 21,
    marginTop: 10,
  },
  emptyFaqsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: palette.purple.muted,
    fontSize: 14,
  },
  // Contact Card
  contactCard: {
    backgroundColor: '#FAF8FC',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  contactCardTitle: {
    fontSize: 15,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginBottom: 6,
  },
  contactCardSubtitle: {
    fontSize: 13,
    color: palette.purple.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  channelIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  channelDetails: {
    flex: 1,
  },
  channelLabel: {
    fontSize: 11,
    color: palette.purple.muted,
    textTransform: 'uppercase',
    ...fonts.semibold,
    letterSpacing: 0.5,
  },
  channelValue: {
    fontSize: 14,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginTop: 2,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  timingText: {
    fontSize: 11,
    color: palette.purple.muted,
    ...fonts.medium,
  },
  // Form Styling
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  formInfoText: {
    fontSize: 13,
    color: palette.purple.muted,
    lineHeight: 21,
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    ...fonts.semibold,
    color: palette.purple.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: palette.purple.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderColor: palette.purple.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: palette.purple.deep,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 120,
  },
  // Attachment Styles
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: palette.purple.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 15,
    backgroundColor: '#FAF8FC',
  },
  attachBtnText: {
    fontSize: 13,
    color: palette.purple.muted,
    ...fonts.medium,
  },
  attachHint: {
    fontSize: 11,
    color: 'rgba(126, 107, 143, 0.5)',
    marginTop: 6,
    textAlign: 'center',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8FC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: palette.gold.main,
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  attachmentName: {
    fontSize: 13,
    color: palette.purple.deep,
    ...fonts.semibold,
    marginLeft: 8,
    flex: 1,
  },
  removeAttachmentBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  submitBtn: {
    backgroundColor: palette.purple.deep,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledBtn: {
    backgroundColor: 'rgba(59, 30, 84, 0.5)',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...fonts.semibold,
    letterSpacing: 0.5,
  },
  // Ticket list styling
  deleteTicketBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F9F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: palette.purple.border,
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketCategory: {
    fontSize: 12,
    ...fonts.semibold,
    color: palette.gold.main,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketDate: {
    fontSize: 11,
    color: palette.purple.muted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: '#FFF3E0', // Light Orange
  },
  badgeReviewed: {
    backgroundColor: '#E8EAF6', // Light Indigo
  },
  badgeResolved: {
    backgroundColor: '#E8F5E9', // Light Green
  },
  statusBadgeText: {
    fontSize: 11,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketSubject: {
    fontSize: 15,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginBottom: 6,
  },
  ticketMessage: {
    fontSize: 13,
    color: palette.purple.muted,
    lineHeight: 21,
  },
  // Attachment Badge in History
  attachBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Attachment Link in History
  attachmentLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF8E7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    gap: 6,
  },
  attachmentLinkText: {
    fontSize: 12,
    color: palette.purple.deep,
    ...fonts.medium,
    flex: 1,
  },
  // Admin Response Card in History
  adminResponseCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  adminResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  adminResponseLabel: {
    fontSize: 11,
    ...fonts.semibold,
    color: '#4CAF50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminResponseText: {
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 20,
  },
  // Expand Hint
  expandHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F7F5FA',
  },
  expandHintText: {
    fontSize: 11,
    color: palette.purple.muted,
    ...fonts.medium,
  },
  // File Picker Modal Option
  filePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F7FB',
    gap: 12,
  },
  filePickerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePickerHint: {
    fontSize: 11,
    color: palette.purple.muted,
    marginTop: 2,
  },
  // Empty states
  emptyHistoryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: palette.purple.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: palette.purple.deep,
    marginTop: 15,
    fontSize: 14,
    ...fonts.semibold,
  },
  // Modal Selector Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: palette.purple.border,
    paddingBottom: 15,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 16,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  modalCloseText: {
    color: palette.gold.main,
    ...fonts.semibold,
  },
  modalOptionsContainer: {
    marginBottom: 10,
  },
  modalOptionBtn: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F7FB',
  },
  modalOptionText: {
    fontSize: 15,
    color: palette.purple.deep,
    ...fonts.medium,
  },

  subTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAF9FC',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeSubTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  subTabLabel: {
    fontSize: 12,
    ...fonts.medium,
    color: palette.purple.muted,
  },
  activeSubTabLabel: {
    color: palette.purple.deep,
    ...fonts.semibold,
  },
  badgeDismissed: {
    backgroundColor: '#ECEFF1',
  },
  badgeUrgent: {
    backgroundColor: '#FFEBEE',
  },
  reportedNameText: {
    fontSize: 14,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginTop: 2,
  },
  reportDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  reportDetailLabel: {
    fontSize: 12,
    color: palette.purple.muted,
    ...fonts.semibold,
    marginRight: 6,
  },
  reportDetailValue: {
    fontSize: 13,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  reportDescWrapper: {
    backgroundColor: '#FAF9FC',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  reportDescText: {
    fontSize: 12,
    color: palette.purple.deep,
    lineHeight: 18,
  },
  proofLabel: {
    fontSize: 12,
    ...fonts.semibold,
    color: palette.purple.muted,
    marginBottom: 4,
    marginTop: 8,
  },
  modalReportedSection: {
    backgroundColor: '#FAF9FC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.purple.border,
  },
  modalSectionLabel: {
    fontSize: 11,
    color: palette.purple.muted,
    ...fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalReportedName: {
    fontSize: 16,
    ...fonts.bold,
    color: palette.purple.deep,
  },
  modalReportedId: {
    fontSize: 13,
    ...fonts.semibold,
    color: palette.gold.main,
    marginTop: 2,
  },
  modalReportedDate: {
    fontSize: 11,
    color: palette.purple.muted,
    marginTop: 6,
  },
  modalRowContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  modalReasonText: {
    fontSize: 14,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginTop: 4,
  },
  modalDetailSection: {
    marginBottom: 20,
  },
  modalDescCard: {
    backgroundColor: '#FAF9FC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.purple.border,
    marginTop: 6,
  },
  modalDescContent: {
    fontSize: 13,
    color: palette.purple.deep,
    lineHeight: 19,
  },
  modalScroll: {
    paddingBottom: 20,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: palette.purple.border,
    paddingTop: 15,
    marginTop: 10,
    width: '100%',
  },
});
