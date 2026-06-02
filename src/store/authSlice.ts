import { createSlice, createAsyncThunk, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../services/api';
import { secureStorage } from '../services/secureStorage';

export const login = createAsyncThunk('auth/login', async (credentials: any, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mobile-App': 'true',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(data.message || 'Login failed');
    }

    if (data.token) {
      await secureStorage.setItem('token', data.token);
    }

    return data.user;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Server connection error');
  }
});

export const register = createAsyncThunk('auth/register', async (userData: any, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mobile-App': 'true',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(data.message || 'Registration failed');
    }

    if (data.token) {
      await secureStorage.setItem('token', data.token);
    }

    return data.user;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Server connection error');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    loading: false,
    error: null as string | null,
    user: null,
  },
  reducers: {
    verifyEmailSuccess: (state: any) => {
      if (state.user) {
        state.user.isEmailVerified = true;
      }
    },
    logout: (state: any) => {
      state.user = null;
      state.error = null;
      secureStorage.removeItem('token');
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<any>) => {
    builder.addCase(login.pending, (state: any) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state: any, action: any) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(login.rejected, (state: any, action: any) => {
      state.loading = false;
      state.error = action.payload || action.error.message || 'Login failed';
    });
    builder.addCase(register.pending, (state: any) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state: any, action: any) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(register.rejected, (state: any, action: any) => {
      state.loading = false;
      state.error = action.payload || action.error.message || 'Registration failed';
    });
  },
});

export const { verifyEmailSuccess, logout } = authSlice.actions;

export default authSlice.reducer;
