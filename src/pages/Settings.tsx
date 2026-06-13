import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

export default function Settings() {
  const { theme, resolvedTheme, setThemeMode } = useTheme();
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const loadNotificationTime = async () => {
      const hour = await AsyncStorage.getItem('notif_hour');
      const minute = await AsyncStorage.getItem('notif_minute');
      if (hour && minute) {
        const now = new Date();
        now.setHours(parseInt(hour));
        now.setMinutes(parseInt(minute));
        setNotificationTime(now);
      } else {
        const defaultTime = new Date();
        defaultTime.setHours(9);
        defaultTime.setMinutes(0);
        setNotificationTime(defaultTime);
        await AsyncStorage.setItem('notif_hour', '9');
        await AsyncStorage.setItem('notif_minute', '0');
      }
    };
    loadNotificationTime();
  }, []);

  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌞 Nouveau message !',
        body: 'Découvre ton message du jour 🥰',
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      },
    });
    Alert.alert('Test', 'Notification dans 5 secondes !');
  };

  const onChangeTime = async (event, selectedDate) => {
    console.log('onChangeTime called', selectedDate);
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) {
      setNotificationTime(selectedDate);
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      await AsyncStorage.setItem('notif_hour', hour.toString());
      await AsyncStorage.setItem('notif_minute', minute.toString());

      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌞 Nouveau message !',
          body: 'Découvre ton message du jour 🥰',
          sound: true,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DAILY,
          hour: hour,
          minute: minute,
        },
      });

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log('Scheduled:', JSON.stringify(scheduled, null, 2));
    }
  };

  const resetData = async () => {
    Alert.alert(
      'Réinitialiser',
      "Effacer l'historique et les favoris ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['discovered_messages', 'favorites', 'last_message']);
            await Notifications.cancelAllScheduledNotificationsAsync();
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '🌞 Nouveau message !',
                body: 'Découvre ton message du jour 🥰',
                sound: true,
              },
              trigger: {
                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 10,
                repeats: false,
              },
            });
            Alert.alert('Fait !', "Données réinitialisées. Notif dans 10 secondes, ferme l'app !");
          },
        },
      ]
    );
  };

  const simulateNewMessage = async () => {
  const raw = await AsyncStorage.getItem('discovered_messages');
  const discovered = raw ? JSON.parse(raw) : [];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const filtered = discovered.filter((m: any) => m.date !== todayStr);
  await AsyncStorage.setItem('discovered_messages', JSON.stringify(filtered));

  const triggerTime = new Date();
  triggerTime.setMinutes(triggerTime.getMinutes() + 1);

  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌞 Nouveau message !',
      body: 'Découvre ton message du jour 🥰',
      sound: true,
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: triggerTime.getHours(),
      minute: triggerTime.getMinutes(),
    },
  });

  Alert.alert('Test', `Notification à ${triggerTime.getHours()}h${String(triggerTime.getMinutes()).padStart(2, '0')} — ferme l'app !`);
  navigation.navigate('Accueil' as never);
};

  return (
    <View style={[styles.container, { backgroundColor: resolvedTheme === 'dark' ? '#121212' : '#ffffff' }]}>
      <Text style={[styles.title, { color: theme === 'dark' ? '#ffffff' : '#880e4f', fontWeight: 'bold' }]}>Paramètres</Text>

      <View style={styles.settingRow}>
        <Text style={[styles.label, { color: resolvedTheme === 'dark' ? '#ddd' : '#333' }]}>Thème</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['light', 'dark', 'system'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setThemeMode(mode)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: theme === mode ? '#880e4f' : '#ccc',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                {mode === 'light' ? 'Clair' : mode === 'dark' ? 'Sombre' : 'Auto'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.settingRow} onPress={() => setShowPicker(true)}>
        <Text style={[styles.label, { color: resolvedTheme === 'dark' ? '#ddd' : '#333' }]}>Heure de notification</Text>
        <Text style={[styles.timeText, { color: resolvedTheme === 'dark' ? '#fff' : '#000' }]}>
          {notificationTime.getHours().toString().padStart(2, '0')}h{notificationTime.getMinutes().toString().padStart(2, '0')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={sendTestNotification}
        style={{ marginTop: 20, padding: 12, backgroundColor: '#880e4f', borderRadius: 10, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Tester la notification</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={simulateNewMessage}
        style={{ marginTop: 10, padding: 12, backgroundColor: '#f57c00', borderRadius: 10, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>🧪 Simuler nouveau message</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={resetData}
        style={{ marginTop: 10, padding: 12, backgroundColor: '#e53935', borderRadius: 10, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Réinitialiser l'app</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={notificationTime}
          mode="time"
          display="default"
          onChange={onChangeTime}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  label: {
    fontSize: 16,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
  },
});