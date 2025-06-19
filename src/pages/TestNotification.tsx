import React from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import * as Notifications from 'expo-notifications';

export default function TestNotification() {
  const triggerNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📬 Message du jour',
        body: 'Un nouveau message t’attend !',
        sound: true,
      },
      trigger: {
        seconds: 2,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Notification</Text>
      <Button title="Envoyer une notification" onPress={triggerNotification} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 20,
    fontSize: 20,
  },
});
