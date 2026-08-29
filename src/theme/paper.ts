import { MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { colors } from './tokens';

/** Tema do react-native-paper amarrado aos tokens de marca do Ranking+. */
export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.accent,
    background: colors.bg,
    surface: colors.surface,
    surfaceVariant: colors.bgMuted,
    outline: colors.border,
    onPrimary: colors.textOnPrimary,
    onSurface: colors.text,
    error: colors.danger,
  },
};
