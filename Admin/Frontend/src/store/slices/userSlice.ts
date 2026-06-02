import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  dateOfBirth?: string;
  isEmailVerified?: boolean;
  isOnline: boolean;
  lastSeen?: string;
  isBlocked: boolean;
  isDeleted?: boolean;
  createdAt: string;
  profile?: {
    id: string;
    customId: string;
    gender: string;
    isGenderLocked?: boolean;
    dob?: string;
    maritalStatus?: string;
    religion?: string;
    caste?: string;
    subCaste?: string;
    motherTongue?: string;
    country?: string;
    state?: string;
    city?: string;
    highestDegree?: string;
    profession?: string;
    income?: string;
    bio?: string;
    verificationStatus?: string;
    height?: string;
    weight?: string;
    createdBy?: string;
    area?: string;
    relocate?: string;
    culture?: string;
    college?: string;
    industry?: string;
    company?: string;
    familyType?: string;
    familyLocation?: string;
    fatherStatus?: string;
    motherStatus?: string;
    brothers?: string;
    sisters?: string;
    siblings?: string;
    familyAbout?: string;
    diet?: string;
    smoking?: string;
    drinking?: string;
    activity?: string;
    hobby?: string;
    hobbies?: string;
    expectations?: string;
    lookingFor?: string;
    preferredAge?: string;
    preferredLocation?: string;
    dealBreakers?: string;
    mobile?: string;
    email?: string;
    contactTime?: string;
    zodiacSign?: string;
    horoscopeDob?: string;
    horoscopeTime?: string;
    horoscopePlace?: string;
    rejectionReason?: string;
    isKycVerified?: boolean;
    socialLinks?: any;
    shareToken?: string;
  };
  role?: string;
  isMobileVerified?: boolean;
  registrationIp?: string;
  autoSuspended?: boolean;
  agreedToTerms?: boolean;
  is18Plus?: boolean;
  consentIp?: string;
  consentAt?: string;
  isSocialVerified?: boolean;
  isIdentityVerified?: boolean;
  mobileOTP?: string;
  otpExpiry?: string;
  emailVerificationToken?: string;
  emailTokenExpiry?: string;
  passwordResetToken?: string;
  passwordResetExpiry?: string;
  subscriptions?: Array<{
    id: string;
    status: "active" | "expired" | "cancelled" | "pending" | "trialing";
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    contactsUsed: number;
    messagesUsed: number;
    callsUsed: number;
    createdAt: string;
    plan?: {
      id: string;
      name: string;
      slug: string;
      durationDays: number;
      price: any;
      features: string[];
      maxContacts: number;
      maxMessages: number;
      maxCalls: number;
    };
  }>;
  photos?: Array<{
    id: string;
    url: string;
    isMain: boolean;
    status: "pending" | "approved" | "rejected";
    isBlurred: boolean;
    createdAt: string;
  }>;
  kyc?: {
    id: string;
    documentType: string;
    documentNumber: string;
    fullName?: string;
    dob?: string;
    documentUrl: string;
    status: "pending" | "approved" | "rejected";
    rejectionReason?: string;
    selfieUrl?: string;
    selfieStatus: "pending" | "approved" | "rejected";
    createdAt: string;
  };
  connectionStats?: {
    sentAcceptedCount: number;
    receivedAcceptedCount: number;
    totalAcceptedCount: number;
  };
  messagingPartners?: Array<{
    peerId: string;
    customId: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
    lastMessageAt: string;
    messageCount: number;
  }>;
  callingPartners?: Array<{
    peerId: string;
    customId: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
    lastCallAt: string;
    callCount: number;
    totalDuration: number;
  }>;
}

interface UserState {
  users: User[];
  selectedUser: User | null;
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  selectedUser: null,
  pagination: {
    total: 0,
    pages: 0,
    currentPage: 1,
  },
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (params: { page?: number; search?: string }, { rejectWithValue }) => {
    try {
      const response = await api.get("/users", { params });
      return response.data;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || (error instanceof Error ? error.message : "Failed to fetch users");
      return rejectWithValue(message);
    }
  },
);

export const fetchUserDetails = createAsyncThunk(
  "users/fetchUserDetails",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data.data;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || (error instanceof Error ? error.message : "Failed to fetch user details");
      return rejectWithValue(message);
    }
  },
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/users/${id}`);
      return id;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || (error instanceof Error ? error.message : "Failed to delete user");
      return rejectWithValue(message);
    }
  },
);

export const toggleUserStatus = createAsyncThunk(
  "users/toggleStatus",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/users/${id}/status`);
      return { id, isBlocked: response.data.data.isBlocked };
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || (error instanceof Error ? error.message : "Failed to update user status");
      return rejectWithValue(message);
    }
  },
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserDetails.pending, (state) => {
        state.loading = true;
        state.selectedUser = null;
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const user = state.users.find((u) => u.id === action.payload.id);
        if (user) {
          user.isBlocked = action.payload.isBlocked;
        }
        if (state.selectedUser && state.selectedUser.id === action.payload.id) {
          state.selectedUser.isBlocked = action.payload.isBlocked;
        }
      });
  },
});

export const { clearSelectedUser } = userSlice.actions;
export default userSlice.reducer;





