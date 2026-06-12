import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem('app_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setTheme(saved);
        setResolvedTheme(
          saved === 'system'
            ? Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
            : saved
        );
      }
    };
    loadTheme();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(current => {
        if (current === 'system') {
          setResolvedTheme(colorScheme === 'dark' ? 'dark' : 'light');
        }
        return current;
      });
    });

    return () => subscription.remove();
  }, []);

  const setThemeMode = async (mode: Theme) => {
    setTheme(mode);
    setResolvedTheme(
      mode === 'system'
        ? Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
        : mode
    );
    await AsyncStorage.setItem('app_theme', mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};