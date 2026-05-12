import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppDispatch } from './index';

interface ThemeState {
  mode: 'light' | 'dark';
}

const initialState: ThemeState = {
  mode: 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.mode = action.payload;
    },
  },
});

export const { setThemeMode } = themeSlice.actions;

export const loadTheme = () => async (dispatch: AppDispatch) => {
  try {
    const savedTheme = await AsyncStorage.getItem('user-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      dispatch(setThemeMode(savedTheme));
    }
  } catch (error) {
    console.error('Failed to load theme:', error);
  }
};

export default themeSlice.reducer;
