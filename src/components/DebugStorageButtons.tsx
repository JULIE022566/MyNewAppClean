import React from 'react';
import { Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messages from '../assets/messages.json';

export function DebugForceMessageButton() {
  const forceTodayMessage = async () => {
    const today = new Date().toISOString().split('T')[0];

    const todayMessage = messages.find((msg) => msg.date === today);

    if (!todayMessage) {
      Alert.alert('Erreur', `Aucun message trouvé pour aujourd’hui (${today})`);
      return;
    }

    await AsyncStorage.setItem('last_message', JSON.stringify(todayMessage));
    await AsyncStorage.setItem('last_date', today);
    Alert.alert('Succès', `Message du ${today} forcé !`);
  };

  return <Button title="⚡ Forcer le message du jour" onPress={forceTodayMessage} />;
}
