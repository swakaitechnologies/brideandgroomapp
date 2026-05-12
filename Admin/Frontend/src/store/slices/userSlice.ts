import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  isEmailVerified?: boolean;
  isOnline: boolean;
  isBlocked: boolean;
  createdAt: string;
  profile?: {
    id: string;
    customId: string;
    gender: string;
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
  };
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





