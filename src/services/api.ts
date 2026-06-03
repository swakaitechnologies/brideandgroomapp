import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import { secureStorage } from './secureStorage';

const LOCAL_IP = '127.0.0.1';

const getDevHost = () => {
  return LOCAL_IP;
};

export const DEV_HOST = getDevHost();

// Production AWS Lambda Endpoints
export const API_BASE_URL = 'https://uocgjbzgm9.execute-api.us-east-1.amazonaws.com/api';
export const MAIN_SOCKET_URL = 'wss://pqoxy2xqz8.execute-api.us-east-1.amazonaws.com/prod';

// Development Local URL
// export const API_BASE_URL = `http://${DEV_HOST}:5000/api`;
// export const MAIN_SOCKET_URL = `http://${DEV_HOST}:5000`;

export const resolvePhotoUrl = (url: string) => {
  if (!url) return url;
  return url.replace(
    /(?:192\.168\.\d+\.\d+|127\.0\.0\.1|localhost|storage\.brideandgroom\.co\.in):9000/g,
    `${DEV_HOST}:9000`
  );
};

const getHeaders = async () => {
  const token = await secureStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'X-Mobile-App': 'true',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Generic fetch wrapper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const headers = await getHeaders();
    const isMultipart = options.body && typeof options.body === 'object' && (
      options.body instanceof FormData ||
      options.body.constructor?.name === 'FormData' ||
      typeof (options.body as any).append === 'function'
    );
    if (isMultipart) {
      delete (headers as any)['Content-Type'];
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    const data = await response.json() as any;
    return { data: { success: response.ok, ...data } };
  } catch (error: any) {
    console.warn(`API Error for ${endpoint}:`, error.message);
    throw error;
  }
};

// Subscription Plans
export const getSubscriptionPlans = async () => {
  try {
    return await apiRequest('/payments/plans');
  } catch {
    // Fallback Mock Data
    return {
      data: {
        success: true,
        plans: [
          {
            id: '1',
            name: 'Gold',
            durationDays: 90,
            price: { INR: 2499, oldPrice: 4999, discount: '50% OFF' },
            features: [
              'Contact 15 Members',
              'Unlimited Interests',
              'Priority Support',
              'Profile Highlighting',
            ],
            badge: '',
          },
          {
            id: '2',
            name: 'Diamond',
            durationDays: 180,
            price: { INR: 4499, oldPrice: 8999, discount: '50% OFF' },
            features: [
              'Contact 50 Members',
              'Unlimited Interests',
              'Priority Support',
              'Top Search Result',
            ],
            badge: 'Most Popular',
          },
          {
            id: '3',
            name: 'Platinum',
            durationDays: 365,
            price: { INR: 7999, oldPrice: 15999, discount: '50% OFF' },
            features: [
              'Contact 100 Members',
              'Unlimited Interests',
              'VIP Badging',
              'Top Search Result',
            ],
            badge: '',
          },
        ]
      }
    };
  }
};

// Current Subscription
export const getMySubscription = async () => {
  try {
    return await apiRequest('/payments/my-subscription');
  } catch {
    return {
      data: {
        success: true,
        subscription: {
          plan: {
            name: 'Diamond',
            maxContacts: 50,
            maxMessages: -1,
          },
          contactsUsed: 12,
          messagesUsed: 0,
          endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        }
      }
    };
  }
};

// Create Payment Order
export const createPaymentOrder = async (planId: string, currency: string = 'INR', couponCode?: string) => {
  try {
    return await apiRequest('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ planId, currency, couponCode }),
    });
  } catch (error) {
    console.error("createPaymentOrder error:", error);
    throw error;
  }
};

// Verify Razorpay payment and activate subscription
export const verifyPayment = async (payload: {
  paymentId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  try {
    return await apiRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    throw error;
  }
};

// Get active promo banner coupon
export const getActivePromoBanner = async () => {
  try {
    return await apiRequest('/coupons/promo-banner');
  } catch (error) {
    console.error("getActivePromoBanner error:", error);
    return { data: { success: true, coupon: null } };
  }
};

// Validate coupon code against a plan
export const validateCoupon = async (code: string, planId: string, currency: string = 'INR') => {
  try {
    return await apiRequest('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, planId, currency }),
    });
  } catch (error) {
    console.error("validateCoupon error:", error);
    throw error;
  }
};

// Banners
export const getBanners = async () => {
  try {
    return await apiRequest('/banners');
  } catch {
    return {
      data: {
        success: true,
        data: [
          {
            id: 'b1',
            imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=600',
            title: 'Divine Union',
            subtitle: 'Find your perfect companion today',
            link: 'https://localhost:5000',
          }
        ]
      }
    };
  }
};

// Daily Picks / Matches
export const getDailyPicks = async () => {
  try {
    return await apiRequest('/matches/daily-picks');
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};

// All Profiles
export const getAllProfiles = async () => {
  try {
    return await apiRequest('/profile/all');
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};

// Profile Viewers
export const getProfileViewers = async () => {
  try {
    return await apiRequest('/profile/viewers');
  } catch {
    return {
      data: {
        success: true,
        data: [
          {
            userId: 'v1',
            firstName: 'Aarav',
            lastName: 'Joshi',
            photos: [{ url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Aarav', isMain: true }],
          },
          {
            userId: 'v2',
            firstName: 'Ishani',
            lastName: 'Gupta',
            photos: [{ url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Ishani', isMain: true }],
          },
          {
            userId: 'v3',
            firstName: 'Kabir',
            lastName: 'Sen',
            photos: [{ url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Kabir', isMain: true }],
          }
        ]
      }
    };
  }
};

// Get My Profile
export const getProfile = async () => {
  try {
    return await apiRequest('/profile');
  } catch {
    return {
      data: {
        success: true,
        data: {
          userId: 'me',
          firstName: 'User',
          lastName: 'Name',
          customId: 'BG-99231',
          viewsCount: 24,
          interestsCount: 8,
          profileCompletion: 85,
          verificationStatus: 'pending', // approved / pending / unverified
          photos: [],
        }
      }
    };
  }
};

// Get Profile By ID
export const getProfileById = async (id: string) => {
  try {
    return await apiRequest(`/profile/${id}`);
  } catch {
    return {
      data: {
        success: false,
        message: 'Could not fetch profile'
      }
    };
  }
};

// Interests
export const getInterests = async (type: 'sent' | 'received', status?: string) => {
  try {
    const url = `/interests?type=${type}${status ? `&status=${status}` : ''}`;
    return await apiRequest(url);
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};

export const sendInterest = async (receiverId: string) => {
  try {
    return await apiRequest('/interests', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
  } catch (error) {
    throw error;
  }
};

export const toggleShortlist = async (shortlistedId: string) => {
  try {
    return await apiRequest('/shortlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ shortlistedId }),
    });
  } catch (error) {
    throw error;
  }
};

export const getShortlisted = async () => {
  try {
    return await apiRequest('/shortlist');
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};

export const toggleLike = async (likedId: string) => {
  try {
    return await apiRequest('/likes/toggle', {
      method: 'POST',
      body: JSON.stringify({ likedId }),
    });
  } catch (error) {
    throw error;
  }
};

export const getLikes = async (type?: 'sent' | 'received') => {
  try {
    const url = `/likes${type ? `?type=${type}` : ''}`;
    return await apiRequest(url);
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};



// Contact Requests
export const getContactRequests = async (type: 'sent' | 'received', status?: string) => {
  try {
    const url = `/contact-requests?type=${type}${status ? `&status=${status}` : ''}`;
    return await apiRequest(url);
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};

// Photo Requests
export const getPhotoRequests = async (type: 'sent' | 'received') => {
  try {
    return await apiRequest(`/photos/requests?type=${type}`);
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};

// Chats
export const getChatList = async () => {
  try {
    return await apiRequest('/messages/list');
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};

// Get Messages
export const getMessages = async (otherUserId: string) => {
  try {
    return await apiRequest(`/messages/${otherUserId}`);
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};

// Send Message
export const sendMessage = async (payload: { receiverId: string; content: string }) => {
  try {
    return await apiRequest('/messages/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      data: {
        success: true,
        data: {
          id: Date.now(),
          content: payload.content,
          senderId: 'me',
          createdAt: new Date().toISOString(),
        }
      }
    };
  }
};

// Upload Message Attachment
export const uploadMessageAttachment = async (formData: FormData) => {
  try {
    return await apiRequest('/messages/upload', {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error("uploadMessageAttachment error:", error);
    throw error;
  }
};

// Initiate Call
export const initiateCall = async (payload: { receiverId: string; type: 'audio' | 'video' }) => {
  return await apiRequest('/calls/initiate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Check Active Incoming Call
export const checkActiveIncomingCall = async () => {
  return await apiRequest('/calls/active-incoming');
};

// Accept Call
export const acceptCall = async (payload: { callId: string }) => {
  return await apiRequest('/calls/accept', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Reject Call
export const rejectCall = async (payload: { callId: string }) => {
  return await apiRequest('/calls/reject', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Cancel Call
export const cancelCall = async (payload: { callId: string }) => {
  return await apiRequest('/calls/cancel', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// End Call
export const endCall = async (payload: { callId: string }) => {
  return await apiRequest('/calls/end', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Get Call Status
export const getCallStatus = async (callId: string) => {
  return await apiRequest(`/calls/status/${callId}`);
};

// Handle Interest Response
export const handleInterestResponse = async (interestId: string, status: 'accepted' | 'declined') => {
  try {
    return await apiRequest('/interests/response', {
      method: 'POST',
      body: JSON.stringify({ interestId, status }),
    });
  } catch {
    return { data: { success: true } };
  }
};

// Handle Contact Response
export const handleContactResponse = async (requestId: string, status: 'accepted' | 'declined') => {
  try {
    return await apiRequest('/contact-requests/response', {
      method: 'POST',
      body: JSON.stringify({ requestId, status }),
    });
  } catch {
    return { data: { success: true } };
  }
};

// Handle Photo Request Response
export const handlePhotoRequestResponse = async (requestId: string, status: 'accepted' | 'declined') => {
  try {
    return await apiRequest('/photos/requests/response', {
      method: 'POST',
      body: JSON.stringify({ requestId, status }),
    });
  } catch {
    return { data: { success: true } };
  }
};

// Announcement
export const getLatestAnnouncement = async () => {
  try {
    return await apiRequest('/profile/announcements/latest');
  } catch {
    return {
      data: {
        success: true,
        data: {
          title: 'System Maintenance',
          content: 'We will be undergoing scheduled maintenance tonight from 2 AM to 4 AM IST.',
          createdAt: new Date().toISOString(),
        }
      }
    };
  }
};

// Call History
export const getCallHistory = async () => {
  try {
    return await apiRequest('/calls/history');
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};

// Reveal Contact details
export const revealContact = async (userId: string) => {
  try {
    return await apiRequest('/contact-requests/reveal', {
      method: 'POST',
      body: JSON.stringify({ receiverId: userId }),
    });
  } catch (error) {
    console.error("revealContact api error:", error);
    throw error;
  }
};

// Get User Photos
export const getPhotos = async () => {
  try {
    return await apiRequest('/photos');
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};

// Upload User Photos
export const uploadPhotos = async (formData: FormData) => {
  try {
    return await apiRequest('/photos/upload', {
      method: 'POST',
      body: formData as any,
    });
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};

// Delete Photo
export const deletePhoto = async (photoId: string) => {
  try {
    return await apiRequest(`/photos/${photoId}`, {
      method: 'DELETE',
    });
  } catch {
    return {
      data: {
        success: true,
      }
    };
  }
};

// Set Primary Photo
export const setPrimaryPhoto = async (photoId: string) => {
  try {
    return await apiRequest(`/photos/${photoId}/primary`, {
      method: 'PUT',
    });
  } catch {
    return {
      data: {
        success: true,
      }
    };
  }
};

// Get Photo Privacy Settings
export const getPrivacySettings = async () => {
  try {
    return await apiRequest('/privacy');
  } catch {
    return {
      data: {
        success: true,
        data: {
          photoVisibility: 'All', // 'All', 'Selected', 'Verified', 'None'
        }
      }
    };
  }
};

// Update Photo Privacy Settings
export const updatePrivacySettings = async (settings: any) => {
  try {
    return await apiRequest('/privacy', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  } catch {
    return {
      data: {
        success: true,
      }
    };
  }
};

// Get KYC Status
export const getKYCStatus = async () => {
  try {
    return await apiRequest('/kyc/status');
  } catch {
    return {
      data: {
        success: true,
        data: {
          status: 'not_submitted', // approved, pending, rejected, not_submitted
          rejectionReason: '',
        }
      }
    };
  }
};

// Submit KYC Document
export const submitKYC = async (formData: FormData) => {
  try {
    return await apiRequest('/kyc/submit', {
      method: 'POST',
      body: formData as any,
    });
  } catch {
    return {
      data: {
        success: false,
        message: 'Network error submitting KYC'
      }
    };
  }
};

// Get Trust Breakdown Score
export const getTrustBreakdown = async () => {
  try {
    return await apiRequest('/kyc/trust-breakdown');
  } catch {
    return {
      data: {
        success: false,
        data: {
          score: 0,
          details: []
        }
      }
    };
  }
};

// Update Profile
export const updateProfile = async (profileData: any) => {
  try {
    return await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  } catch {
    return {
      data: {
        success: true,
        data: profileData,
      }
    };
  }
};

// Get all notifications
export const getNotifications = async () => {
  try {
    return await apiRequest('/notifications');
  } catch {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }
};

// Mark a single notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    return await apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  } catch (error) {
    console.error("markNotificationAsRead error:", error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    return await apiRequest('/notifications/read-all', {
      method: 'PUT',
    });
  } catch (error) {
    console.error("markAllNotificationsAsRead error:", error);
    throw error;
  }
};

// Delete a single notification
export const deleteNotification = async (notificationId: string) => {
  try {
    return await apiRequest(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error("deleteNotification error:", error);
    throw error;
  }
};

// Delete all notifications
export const deleteAllNotifications = async () => {
  try {
    return await apiRequest('/notifications', {
      method: 'DELETE',
    });
  } catch (error) {
    console.error("deleteAllNotifications error:", error);
    throw error;
  }
};

// Save FCM Token
export const saveFcmToken = async (token: string) => {
  try {
    return await apiRequest('/notifications/fcm-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  } catch (error) {
    console.error("saveFcmToken error:", error);
    throw error;
  }
};

// Delete query/feedback history item
export const deleteFeedbackQuery = async (feedbackId: string) => {
  try {
    return await apiRequest(`/feedback/${feedbackId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error("deleteFeedbackQuery error:", error);
    throw error;
  }
};

const api = {
  get: (endpoint: string, options?: RequestInit) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint: string, body: any, options?: RequestInit) => apiRequest(endpoint, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), 
    ...options 
  }),
  put: (endpoint: string, body: any, options?: RequestInit) => apiRequest(endpoint, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), 
    ...options 
  }),
  delete: (endpoint: string, options?: RequestInit) => apiRequest(endpoint, { method: 'DELETE', ...options }),
};

export default api;
