import React, { createContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';


export const NotificationContext = createContext({
  setNotificationTime: (hour: number, minute: number) => {},
});

export const NotificationProvider = ({ children }) => {
  const [notificationTime, setNotificationTime] = useState({ hour: 9, minute: 0 });

  useEffect(() => {
    const registerAndSchedule = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission non accordée pour les notifications');
        return;
      }

      if (Device.isDevice) {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        console.log('Expo Push Token:', tokenData.data);
      }

      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌞 Nouveau message !',
          body: 'Découvre ton message du jour 🥰',
          sound: true,
        },
        trigger: {
          hour: notificationTime.hour,
          minute: notificationTime.minute,
          repeats: true,
        },
      });
    };

    registerAndSchedule();
  }, [notificationTime]); // <- se relance si tu changes l’heure

  return (
    <NotificationContext.Provider value={{ setNotificationTime }}>
      {children}
    </NotificationContext.Provider>
  );
};
