import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

interface DashboardStats {
  totalUsers: { value: number; change: number };
  newRegistrations: { value: number; change: number };
  activeNow: { value: number; change: number };
  profileViews: { value: number; change: number };
  moderation: {
    pendingPhotos: number;
    pendingProfiles: number;
    pendingReports: number;
  };
}

interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  isOnline: boolean;
}

interface DashboardState {
  stats: DashboardStats | null;
  recentRegistrations: RecentUser[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  recentRegistrations: [],
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/dashboard/stats");
      return response.data.data;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || (error instanceof Error ? error.message : "Failed to fetch stats");
      return rejectWithValue(message);
    }
  },
);

export const fetchRecentRegistrations = createAsyncThunk(
  "dashboard/fetchRecent",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/dashboard/recent-registrations");
      return response.data.data;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || (error instanceof Error ? error.message : "Failed to fetch recent registrations");
      return rejectWithValue(message);
    }
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRecentRegistrations.fulfilled, (state, action) => {
        state.recentRegistrations = action.payload;
      });
  },
});

export default dashboardSlice.reducer;





