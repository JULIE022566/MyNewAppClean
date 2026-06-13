import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
// bouton pour simuler un nouveau message
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';



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
      }
    };
    loadNotificationTime();
  }, []);

  const onChangeTime = async (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) {
      setNotificationTime(selectedDate);
      await AsyncStorage.setItem('notif_hour', selectedDate.getHours().toString());
      await AsyncStorage.setItem('notif_minute', selectedDate.getMinutes().toString());

      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌞 Nouveau message !',
          body: 'Découvre ton message du jour 🥰',
          sound: true,
        },
        trigger: {
          hour: selectedDate.getHours(),
          minute: selectedDate.getMinutes(),
          repeats: true,
        },
      });
    }
  };

  const resetData = async () => {
  Alert.alert(
    'Réinitialiser',
    'Effacer l\'historique et les favoris ?',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['discovered_messages', 'favorites', 'last_message']);
          Alert.alert('Fait !', 'Les données ont été réinitialisées.');
        },
      },
    ]
  );
};

return (
  <View style={[styles.container, { backgroundColor: resolvedTheme === 'dark' ? '#121212' : '#ffffff' }]}>
    <Text style={[styles.title, { color: theme === 'dark' ? '#ffffff' : '#880e4f', fontWeight: 'bold'  }]}>Paramètres</Text>

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

    <TouchableOpacity onPress={resetData} style={{ marginTop: 20, padding: 12, backgroundColor: '#e53935', borderRadius: 10, alignItems: 'center' }}>
  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Réinitialiser l'app</Text>
</TouchableOpacity>

{/* Bouton pour remettre à zéro les notifications */}
    <TouchableOpacity style={styles.settingRow} onPress={() => setShowPicker(true)}>
      <Text style={[styles.label, { color: resolvedTheme === 'dark' ? '#ddd' : '#333' }]}>Heure de notification</Text>
      <Text style={[styles.timeText, { color: resolvedTheme === 'dark' ? '#fff' : '#000' }]}>
        {notificationTime.getHours().toString().padStart(2, '0')}h{notificationTime.getMinutes().toString().padStart(2, '0')}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
  style={[styles.settingRow, { justifyContent: 'center' }]}
  onPress={async () => {
    const raw = await AsyncStorage.getItem('discovered_messages');
    const discovered = raw ? JSON.parse(raw) : [];
    const today = new Date().toISOString().split('T')[0];
    const filtered = discovered.filter((m: any) => m.date !== today);
    await AsyncStorage.setItem('discovered_messages', JSON.stringify(filtered));

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌞 Nouveau message !',
        body: 'Découvre ton message du jour 🥰',
        sound: true,
      },
      trigger: {
        hour: new Date().getHours(),
        minute: new Date().getMinutes() + 1,
        repeats: false,
      },
    });

    Alert.alert('Test', 'Notification dans 1 minute, ferme l\'app !');
    navigation.navigate('Accueil' as never);
  }}>
  <Text style={[styles.label, { color: '#ff5c5c' }]}>🧪 Simuler nouveau message</Text>
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

