// ⚠️ DOIT être tout en haut
import 'react-native-gesture-handler';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { NotificationProvider } from './src/context/notification/NotificationProvider';
import { ThemeProvider } from './src/context/ThemeContext'; // 👈 ajout du provider
import AppNavigator from './src/Navigation/AppNavigator';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider> {/* 👈 Ajout ici */}
        <NotificationProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
