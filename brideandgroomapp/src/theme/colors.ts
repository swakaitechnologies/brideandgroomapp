export const palette = {
  purple: {
    deep: '#3B1E54',
    light: '#FFFFFF',
    dark: '#121212',
    muted: '#7E6B8F',
    border: '#EBE0FF',
  },
  gold: {
    main: '#D4AF37',
    light: '#F0E6FF',
  },
  status: {
    error: '#D32F2F',
    success: '#4CAF50',
    info: '#2196F3',
  },
  neutral: {
    white: '#FFFFFF',
    grey: '#A0A0A0',
  }
};

export const Colors = {
  light: {
    text: palette.purple.deep,
    background: '#FFFFFF',
    tint: palette.gold.main,
    tabIconDefault: palette.neutral.grey,
    tabIconSelected: palette.gold.main,
    border: palette.purple.border,
  },
  dark: {
    text: '#FFFFFF',
    background: '#121212',
    tint: palette.gold.main,
    tabIconDefault: palette.purple.muted,
    tabIconSelected: palette.gold.main,
    border: '#2D1642',
  },
};

export default Colors;
