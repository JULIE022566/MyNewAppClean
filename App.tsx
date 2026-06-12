import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { NotificationProvider } from './src/context/notification/NotificationProvider';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/Navigation/AppNavigator';
import { navigationRef } from './src/Navigation/RootNavigator';
import { MessageProvider } from './src/context/MessageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      navigationRef.current?.navigate('Accueil' as never);
    });

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        navigationRef.current?.navigate('Accueil' as never);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const checkMessage = async () => {
      const hourStr = await AsyncStorage.getItem('notif_hour');
      const minuteStr = await AsyncStorage.getItem('notif_minute');
      const hour = parseInt(hourStr || '9');
      const minute = parseInt(minuteStr || '0');

      const today = new Date().toISOString().split('T')[0];
      const openedRaw = await AsyncStorage.getItem('discovered_messages');
      const opened = openedRaw ? JSON.parse(openedRaw) : [];
      const todayDiscovered = opened.some((m: any) => m.date === today);

      const now = new Date();
      const target = new Date();
      target.setHours(hour, minute, 0, 0);
      const messageAvailable = !todayDiscovered && target <= now;

      if (messageAvailable) {
        setTimeout(() => {
          navigationRef.current?.navigate('Accueil' as never);
        }, 300);
      }
    };

    const subscription = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        checkMessage();
      }
      appState.current = nextState;
    });

    checkMessage();

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MessageProvider>
          <NotificationProvider>
            <NavigationContainer ref={navigationRef}>
              <AppNavigator />
            </NavigationContainer>
          </NotificationProvider>
        </MessageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}