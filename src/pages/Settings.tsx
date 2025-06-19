import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

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
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#121212' : '#ffffff' }]}>
      <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#000' }]}>Paramètres</Text>

      {/* Thème */}
      <View style={styles.settingRow}>
        <Text style={[styles.label, { color: theme === 'dark' ? '#ddd' : '#333' }]}>Thème sombre</Text>
        <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
      </View>

      {/* Heure notification */}
      <TouchableOpacity style={styles.settingRow} onPress={() => setShowPicker(true)}>
        <Text style={[styles.label, { color: theme === 'dark' ? '#ddd' : '#333' }]}>Heure de notification</Text>
        <Text style={[styles.timeText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          {notificationTime.getHours().toString().padStart(2, '0')}h{notificationTime.getMinutes().toString().padStart(2, '0')}
        </Text>
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

