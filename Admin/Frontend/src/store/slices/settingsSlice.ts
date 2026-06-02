import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

export interface Setting {
    key: string;
    value: string;
    group: string;
    description: string;
}

interface SettingsState {
    settings: Setting[];
    loading: boolean;
    error: string | null;
    saving: string | null;
}

const initialState: SettingsState = {
    settings: [],
    loading: false,
    error: null,
    saving: null,
};

export const fetchSettings = createAsyncThunk(
    'settings/fetchSettings',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/system/settings');
            return response.data.data;
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
                || (error instanceof Error ? error.message : 'Failed to fetch settings');
            return rejectWithValue(message);
        }
    }
);

export const updateSetting = createAsyncThunk(
    'settings/updateSetting',
    async ({ key, value }: { key: string; value: string }, { rejectWithValue }) => {
        try {
            await api.patch('/system/settings', { key, value });
            return { key, value };
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
                || (error instanceof Error ? error.message : 'Failed to update setting');
            return rejectWithValue(message);
        }
    }
);

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSettings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSettings.fulfilled, (state, action) => {
                state.loading = false;
                state.settings = action.payload;
            })
            .addCase(fetchSettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateSetting.pending, (state, action) => {
                state.saving = action.meta.arg.key;
            })
            .addCase(updateSetting.fulfilled, (state, action) => {
                state.saving = null;
                const index = state.settings.findIndex(s => s.key === action.payload.key);
                if (index !== -1) {
                    state.settings[index].value = action.payload.value;
                }
            })
            .addCase(updateSetting.rejected, (state) => {
                state.saving = null;
            });
    },
});

export default settingsSlice.reducer;





