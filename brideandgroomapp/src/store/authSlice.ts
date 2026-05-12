import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";
import * as SecureStore from "expo-secure-store";

interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isInitialized: false,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: any, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { token, refreshToken, user } = response.data;

      // Store tokens securely
      await SecureStore.setItemAsync("accessToken", token);
      await SecureStore.setItemAsync("refreshToken", refreshToken);

      return user;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Login failed";
      return rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (formData: any, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/register", formData);
      const { token, refreshToken, user } = response.data;

      // Store tokens securely
      await SecureStore.setItemAsync("accessToken", token);
      await SecureStore.setItemAsync("refreshToken", refreshToken);

      return user;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Registration failed";
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await api.post("/auth/logout");
  } catch (e) {
    // Ignore logout errors
  } finally {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
  }
});

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return null;

      // Call profile endpoint to verify token and get user data
      const response = await api.get("/auth/me");
      return response.data.user;
    } catch (err: any) {
      return rejectWithValue(null);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isInitialized = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isInitialized = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isInitialized = true;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
