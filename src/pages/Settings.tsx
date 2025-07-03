import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Platform, TouchableOpacity, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const colors = {
    background: theme === 'dark' ? '#121212' : '#ffffff',
    text: theme === 'dark' ? '#ffffff' : '#222222',
    subtle: theme === 'dark' ? '#bbbbbb' : '#666666',
    cardBackground: theme === 'dark' ? '#1e1e1e' : '#f9f9f9',
    cardBorder: theme === 'dark' ? '#333333' : '#e0e0e0',
    iconColor: '#FFD700',
    borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(128, 128, 128, 0.3)',
  };

  useEffect(() => {
    const loadNotificationTime = async () => {
      try {
        const hour = await AsyncStorage.getItem('notif_hour');
        const minute = await AsyncStorage.getItem('notif_minute');
        if (hour && minute) {
          const now = new Date();
          now.setHours(parseInt(hour));
          now.setMinutes(parseInt(minute));
          setNotificationTime(now);
        } else {
          // Valeurs par défaut si aucune heure n'est sauvegardée
          const defaultTime = new Date();
          defaultTime.setHours(9, 0, 0, 0);
          setNotificationTime(defaultTime);
          await AsyncStorage.setItem('notif_hour', '9');
          await AsyncStorage.setItem('notif_minute', '0');
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'heure:', error);
      }
    };
    loadNotificationTime();
    {
      const checkIfNotificationShouldBeSent = async () => {
        const hasMessageBeenSentToday = await hasTodaysMessageBeenSent();
        if (!hasMessageBeenSentToday) {
          // Récupérer l'heure de notification spécifiée par l'utilisateur
          const notificationTime = await loadNotificationTime();
          const now = new Date();
          if (now.getHours() === notificationTime.getHours() && now.getMinutes() === notificationTime.getMinutes()) {
          // Envoyer la notification
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Nouveau message',
              body: 'Un nouveau message est disponible',
            },
            trigger: null, // Envoyer la notification immédiatement
          });
        }
      }
    };

    const intervalId = setInterval(checkIfNotificationShouldBeSent, 60000); // 60000ms = 1 minute

    return () => {
      clearInterval(intervalId);
    };
    }
  }, []);

  // Fonction pour vérifier si le message du jour a déjà été envoyé/affiché
  const hasTodaysMessageBeenSent = async (): Promise<boolean> => {
    try {
      const lastSentDate = await AsyncStorage.getItem('last_message_sent_date');
      const today = new Date().toISOString().split('T')[0];
      return lastSentDate === today; // Changé >= en === pour plus de précision
    } catch (error) {
      console.error('Erreur vérification message du jour:', error);
      return false;
    }
  };

  const onChangeTime = async (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPicker(false);
    
    if (selectedDate) {
      const newHour = selectedDate.getHours();
      const newMinute = selectedDate.getMinutes();
      
      // Vérifier si le message du jour a déjà été envoyé
      const messageSentToday = await hasTodaysMessageBeenSent();
      
      // Vérifier si la nouvelle heure est dans le futur aujourd'hui
      const now = new Date();
      const newTimeToday = new Date();
      newTimeToday.setHours(newHour, newMinute, 0, 0);
      
      const isNewTimeFuture = newTimeToday > now;
      
      let alertTitle = '';
      let alertMessage = '';
      let isForTomorrow = false;
      
      if (messageSentToday && isNewTimeFuture) {
        // Message déjà reçu + heure future = message pour demain
        alertTitle = 'Modification d\'heure';
        alertMessage = 'Le message d\'aujourd\'hui a déjà été envoyé. La nouvelle heure sera effective pour demain.';
        isForTomorrow = true;
      } else if (messageSentToday && !isNewTimeFuture) {
        // Message déjà reçu + heure passée = message pour demain
        alertTitle = 'Heure dans le passé';
        alertMessage = 'Le message d\'aujourd\'hui a déjà été envoyé et l\'heure choisie est déjà passée. Le message sera programmé pour demain à cette heure.';
        isForTomorrow = true;
      } else if (!messageSentToday && isNewTimeFuture) {
        // Message pas encore reçu + heure future = message pour aujourd'hui
        alertTitle = 'Heure modifiée';
        alertMessage = 'La nouvelle heure a été programmée pour aujourd\'hui.';
        isForTomorrow = false;
      } else {
        // Message pas encore reçu + heure passée = message pour demain
        alertTitle = 'Heure dans le passé';
        alertMessage = 'L\'heure choisie est déjà passée. Le message sera programmé pour demain à cette heure.';
        isForTomorrow = true;
      }
      
      Alert.alert(
        alertTitle,
        alertMessage,
        [
          {
            text: 'Annuler',
            style: 'cancel'
          },
          {
            text: 'Confirmer',
            onPress: async () => {
              try {
                setNotificationTime(selectedDate);
                await AsyncStorage.setItem('notif_hour', newHour.toString());
                await AsyncStorage.setItem('notif_minute', newMinute.toString());
                
                if (isForTomorrow) {
                  // Marquer que le prochain message sera pour demain
                  await AsyncStorage.setItem('next_message_for_tomorrow', 'true');
                } else {
                  // Supprimer le flag "pour demain" car le message sera pour aujourd'hui
                  await AsyncStorage.removeItem('next_message_for_tomorrow');
                }
                
                console.log(`Nouvelle heure programmée pour ${isForTomorrow ? 'demain' : 'aujourd\'hui'}:`, `${newHour}:${newMinute}`);
              } catch (error) {
                console.error('Erreur lors de la sauvegarde de l\'heure:', error);
                Alert.alert('Erreur', 'Impossible de sauvegarder la nouvelle heure.');
              }
            }
          }
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Paramètres</Text>

      {/* Thème */}
      <View style={[styles.settingRow, { borderBottomColor: colors.borderColor }]}>
        <Text style={[styles.label, { color: colors.text }]}>Thème sombre</Text>
        <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
      </View>

      {/* Heure notification */}
      <TouchableOpacity 
        style={[styles.settingRow, { borderBottomColor: colors.borderColor }]} 
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.label, { color: colors.text }]}>Heure de notification</Text>
        <Text style={[styles.timeText, { color: colors.text }]}>
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
  },
  label: {
    fontSize: 16,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
  },
});