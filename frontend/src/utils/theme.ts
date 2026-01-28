import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Primary blue color from Figma design (#2F80ED)
const primaryBlue = '#2F80ED';
const lightBackground = '#F5F8FA';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: primaryBlue,
    primaryContainer: '#E3F2FD',
    secondary: primaryBlue,
    background: lightBackground,
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    error: '#D32F2F',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#212121',
    onSurface: '#212121',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: primaryBlue,
    primaryContainer: '#1976D2',
    secondary: primaryBlue,
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    error: '#EF5350',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
  },
};

