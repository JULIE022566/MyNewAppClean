import React, { createContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

type NotificationContextType = {
  setNotificationTime: (hour: number, minute: number) => void;
};

export const NotificationContext = createContext<NotificationContextType>({
  setNotificationTime: () => {},
});

export const NotificationProvider = ({ children }) => {
  const [notificationTime, setNotificationTime] = useState({ hour: 9, minute: 0 });

  const handleSetNotificationTime = (hour: number, minute: number) => {
    setNotificationTime({ hour, minute });
  };

  useEffect(() => {
    const registerAndSchedule = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission non accordée pour les notifications');
        return;
      }

      if (Device.isDevice) {
       const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: '9d676568-aa63-436c-b485-38190909add7',
});
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
        type: SchedulableTriggerInputTypes.DAILY,
        hour: notificationTime.hour,
        minute: notificationTime.minute,
      },
    });
    };

    registerAndSchedule();
  }, [notificationTime]); // <- se relance si tu changes l’heure

  return (
    <NotificationContext.Provider value={{ setNotificationTime: handleSetNotificationTime }}>
      {children}
    </NotificationContext.Provider>
  );

};
