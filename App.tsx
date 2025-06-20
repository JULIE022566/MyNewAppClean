// ⚠️ DOIT être tout en haut
import 'react-native-gesture-handler';

import React from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { NotificationProvider } from './src/context/notification/NotificationProvider';
import { ThemeProvider } from './src/context/ThemeContext'; // 
import AppNavigator from './src/Navigation/AppNavigator';
import { OpenedMessages } from './src/pages/OpenedMessages';
import { navigationRef } from './src/Navigation/RootNavigator';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Définissez la fonction handleAction à l'intérieur de l'objet retourné par handleNotification
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    handleAction: async (notification, action) => {
      const navigation = navigationRef.current as NavigationContainerRef<any>;
      if (action === 'tap') {
        (navigationRef.current as NavigationContainerRef<any>)?.navigate("OpenedMessages");
      }
    },
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
          <OpenedMessages />
        </NotificationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

