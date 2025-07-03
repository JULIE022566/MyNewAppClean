// ⚠️ DOIT être tout en haut
import 'react-native-gesture-handler';

import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { NotificationProvider } from './src/context/notification/NotificationProvider';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/Navigation/AppNavigator';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
        shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false, 
  }),
});

export default function App() {
  const navigationRef = useRef<any>();

  useEffect(() => {
    // Listener pour les notifications reçues quand l'app est ouverte
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
    });

    // Listener pour quand l'utilisateur tape sur une notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tappée:', response);
      
      // Naviguer vers la page des messages
      if (navigationRef.current) {
        navigationRef.current.navigate('DiscoveredMessages');
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NotificationProvider>
          <NavigationContainer ref={navigationRef}>
            <AppNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}