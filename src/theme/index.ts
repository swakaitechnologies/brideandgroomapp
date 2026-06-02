import { palette } from './colors';

// Quicksand font family — use these spreads in StyleSheet definitions
// fontWeight is set to 'normal' to prevent Android from applying synthetic
// bolding on top of an already-bold font file (which causes Roboto fallback).
export const fonts = {
  light: { fontFamily: 'Quicksand-Light', fontWeight: 'normal' as const },
  regular: { fontFamily: 'Quicksand-Regular', fontWeight: 'normal' as const },
  medium: { fontFamily: 'Quicksand-Medium', fontWeight: 'normal' as const },
  semibold: { fontFamily: 'Quicksand-SemiBold', fontWeight: 'normal' as const },
  bold: { fontFamily: 'Quicksand-Bold', fontWeight: 'normal' as const },
};

export const theme = {
  colors: palette,
  fonts,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  radii: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },
  typography: {
    sizes: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    weights: {
      light: '300' as const,
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    lineHeights: {
      xs: 14,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 28,
      xxl: 32,
    }
  }
};

export type Theme = typeof theme;
export { palette } from './colors';

