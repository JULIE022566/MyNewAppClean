import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation/AppNavigator';
import messages from '../assets/messages.json';
import { useTheme } from '../context/ThemeContext';


type Message = {
  content: string;
  date: string;
};

export default function Home() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [isLastMessageOpened, setIsLastMessageOpened] = useState(false);
  const [favorites, setFavorites] = useState<Message[]>([]);
  const [countdown, setCountdown] = useState('');
  const [nextHour, setNextHour] = useState(9);
  const [nextMinute, setNextMinute] = useState(0);
  const [missedMessages, setMissedMessages] = useState<Message[]>([]);

  const { theme } = useTheme();
  
  const colors = {
    background: theme === 'dark' ? '#121212' : '#ffffff',
    text: theme === 'dark' ? '#ffffff' : '#222222',
    subtle: theme === 'dark' ? '#bbbbbb' : '#666666',
    cardBackground: theme === 'dark' ? '#1e1e1e' : '#f9f9f9',
    cardBorder: theme === 'dark' ? '#333333' : '#e0e0e0',
    iconColor: '#FFD700',
    borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(128, 128, 128, 0.3)',
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Fonction pour normaliser les dates
  const normalizeDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Fonction pour obtenir le message du jour actue
// Fonction pour obtenir le message du jour actuel
const getCurrentDayMessage = async () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Créer l'heure de notification d'aujourd'hui
  const notificationTime = new Date();
  notificationTime.setHours(nextHour, nextMinute, 0, 0);
  
  console.log('=== DEBUG ULTRA SIMPLE ===');
  console.log('Date du jour:', today);
  
  // Filtrer les messages disponibles (aujourd'hui si heure passée, ou antérieurs)
  const availableMessages = messages.filter(message => {
    if (message.date === today) {
      // Message d'aujourd'hui : disponible seulement si l'heure est passée
      return now >= notificationTime;
    } else {
      // Message d'un autre jour : disponible si c'est avant aujourd'hui
      return message.date < today;
    }
  });
  
  console.log('Messages disponibles:', availableMessages.map(m => `${m.date}: ${m.content.substring(0, 30)}`));
  
  if (availableMessages.length === 0) {
    console.log('Aucun message disponible');
    return null;
  }
  
  // Prendre le plus récent des messages disponibles
  const latestMessage = availableMessages.reduce((latest, current) => {
    return current.date > latest.date ? current : latest;
  });
  
  console.log('Message le plus récent:', latestMessage.date, latestMessage.content.substring(0, 30));
  return latestMessage;
};

  // Fonction pour charger les favoris
  const loadFavorites = async () => {
    try {
      const FAVORITES_KEY = 'app_favorites';
      let favRaw = await AsyncStorage.getItem(FAVORITES_KEY);
      
      // Fallback sur l'ancienne clé si la nouvelle n'existe pas
      if (!favRaw || favRaw === 'null' || favRaw === '') {
        favRaw = await AsyncStorage.getItem('favorites');
      }
      
      let favs: Message[] = [];
      if (favRaw && favRaw !== 'null' && favRaw !== '') {
        try {
          favs = JSON.parse(favRaw);
          if (!Array.isArray(favs)) {
            favs = [];
          }
        } catch (parseError) {
          favs = [];
        }
      }
      
      // Normaliser les dates et trier par ordre chronologique décroissant
      const normalizedFavs = favs.map(fav => ({
        ...fav,
        date: normalizeDate(fav.date)
      }));
      
      normalizedFavs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setFavorites(normalizedFavs);
      
    } catch (error) {
      setFavorites([]);
    }
  };

  // Fonction pour vérifier si le message a été ouvert
  const checkIfMessageOpened = async (message: Message) => {
  try {
    const openedRaw = await AsyncStorage.getItem('discovered_messages');
    const opened: Message[] = openedRaw ? JSON.parse(openedRaw) : [];
    
    // Vérifier si le message est dans la liste des messages ouverts
    // Utiliser normalizeDate pour s'assurer que les formats de date correspondent
    const isOpened = opened.some(msg => normalizeDate(msg.date) === normalizeDate(message.date));
    setIsLastMessageOpened(isOpened);
  } catch (error) {
    console.error('Erreur lors de la vérification du message ouvert:', error);
    setIsLastMessageOpened(false);
  }
};
  // Fonction pour réinitialiser l'application
  const resetApplication = async () => {
    Alert.alert(
      'Réinitialiser l\'application',
      'Cette action va supprimer tous les messages ouverts, favoris et paramètres. Êtes-vous sûr de vouloir continuer ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              // Supprimer tous les messages découverts/ouverts
              await AsyncStorage.removeItem('discovered_messages');
              
              // Supprimer les favoris
              await AsyncStorage.removeItem('app_favorites');
              await AsyncStorage.removeItem('favorites'); // Ancienne clé
              
              // Supprimer les données de notification
              await AsyncStorage.removeItem('last_message_sent_date');
              await AsyncStorage.removeItem('next_message_for_tomorrow');
              
              // Supprimer le dernier message lu
              await AsyncStorage.removeItem('last_message');
              
              // Réinitialiser les états
              setLastMessage(null);
              setIsLastMessageOpened(false);
              setFavorites([]);
              setMissedMessages([]);
              
              Alert.alert(
                'Réinitialisation terminée',
                'L\'application a été réinitialisée avec succès. Tous les messages apparaîtront comme non ouverts.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Recharger les données
                      const reloadData = async () => {
                        const availableMsg = await getCurrentDayMessage();
                        if (availableMsg) {
                          setLastMessage(availableMsg);
                          setIsLastMessageOpened(false);
                        }
                      };
                      reloadData();
                    }
                  }
                ]
              );
              
            } catch (error) {
              console.error('Erreur lors de la réinitialisation:', error);
              Alert.alert(
                'Erreur',
                'Une erreur est survenue lors de la réinitialisation de l\'application.'
              );
            }
          }
        }
      ]
    )
  }

  // Fonction pour ouvrir un message manqué
  const handleOpenMissedMessage = async (message: Message) => {
  await AsyncStorage.setItem('last_message', JSON.stringify(message));
  navigation.navigate('OpenedMessage', { 
    messageData: message,
    fromMissed: true 
  });
  await AsyncStorage.setItem('last_message_sent_date', new Date().toISOString().split('T')[0]);
};

 useFocusEffect(
  useCallback(() => {
    const load = async () => {
      const hour = await AsyncStorage.getItem('notif_hour');
      const minute = await AsyncStorage.getItem('notif_minute');
      if (hour && minute) {
        setNextHour(parseInt(hour));
        setNextMinute(parseInt(minute));
      }

      const openedRaw = await AsyncStorage.getItem('discovered_messages');
      const opened: Message[] = openedRaw ? JSON.parse(openedRaw) : [];
      const openedDates = opened.map((m) => normalizeDate(m.date));

      const missed = messages.filter((msg) => {
        const msgDate = new Date(msg.date);
        const now = new Date();
        
        const isBeforeToday = msgDate.toISOString().split('T')[0] < now.toISOString().split('T')[0];
        const isNotOpened = !openedDates.includes(normalizeDate(msg.date));
        
        return isBeforeToday && isNotOpened;
      });
      setMissedMessages(missed);

      // Utiliser la nouvelle fonction pour obtenir le message du jour actuel
      const currentMsg = await getCurrentDayMessage();
      if (currentMsg) {
        setLastMessage(currentMsg);
        // Vérifier directement ici si ce message a été ouvert
        const isOpened = openedDates.includes(normalizeDate(currentMsg.date));
        setIsLastMessageOpened(isOpened);
      } else {
        setLastMessage(null);
        setIsLastMessageOpened(false);
      }

      // Charger les favoris
      await loadFavorites();
    };

    load();
  }, [])
);

  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Chercher s'il y a un message pour aujourd'hui
      const todayMessage = messages.find(m => m.date === today);
      
      if (todayMessage) {
        // Il y a un message pour aujourd'hui
        const target = new Date();
        target.setHours(nextHour, nextMinute, 0, 0);
        
        if (now >= target) {
            if (now >= target) {
  // L'heure est passée, le message d'aujourd'hui est disponible
  // Vérifier si on a déjà notifié aujourd'hui
  const lastSentDate = await AsyncStorage.getItem('last_message_sent_date');
  
  if (lastSentDate !== today) {
    // Première fois qu'on atteint l'heure aujourd'hui
    await AsyncStorage.setItem('last_message_sent_date', today);
    
    // Mettre à jour le message du jour
    const newCurrentMsg = await getCurrentDayMessage();
    if (newCurrentMsg) {
      setLastMessage(newCurrentMsg);
      
      // Pour un nouveau message qui vient d'arriver, forcer l'état à false
      setIsLastMessageOpened(false);
      
      // Puis vérifier réellement s'il a été ouvert (au cas où)
      setTimeout(async () => {
        const openedRaw = await AsyncStorage.getItem('discovered_messages');
        const opened: Message[] = openedRaw ? JSON.parse(openedRaw) : [];
        const openedDates = opened.map((m) => normalizeDate(m.date));
        const isOpened = openedDates.includes(normalizeDate(newCurrentMsg.date));
        setIsLastMessageOpened(isOpened);
      }, 100);
    }
    
    Alert.alert('Un nouveau message est arrivé !', '', [
      { text: 'Ouvre-le', onPress: () => navigation.navigate('NewMessage') },
    ]);
    
    // Ne pas arrêter le chrono, laisser continuer
    return;
  }
}

        }
        
        // Calculer le temps restant jusqu'à l'heure de notification
        const diff = target.getTime() - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setCountdown('0h 0m 0s');
        }
      } else {
        // Pas de message pour aujourd'hui, chercher le prochain message disponible
        const sortedMessages = [...messages].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        const nextMessage = sortedMessages.find(m => m.date > today);
        
        if (nextMessage) {
          // Calculer le temps jusqu'au prochain message
          const nextDate = new Date(nextMessage.date);
          nextDate.setHours(nextHour, nextMinute, 0, 0);
          
          const diff = nextDate.getTime() - now.getTime();
          
          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            
            if (days > 0) {
              setCountdown(`${days}j ${hours}h ${minutes}m ${seconds}s`);
            } else {
              setCountdown(`${hours}h ${minutes}m ${seconds}s`);
            }
          } else {
            setCountdown('Bientôt...');
          }
        } else {
          setCountdown('Aucun message programmé');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextHour, nextMinute]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleOpenFavorite = async (fav: Message) => {
    await AsyncStorage.setItem('last_message', JSON.stringify(fav));
    navigation.navigate('OpenedMessage', { 
      messageData: fav,
      fromFavorites: true 
    });
  };

  // Fonction pour ouvrir le message du jour
const handleOpenTodayMessage = async () => {
  if (lastMessage) {
    await AsyncStorage.setItem('last_message', JSON.stringify(lastMessage));
    navigation.navigate('OpenedMessage', { 
      messageData: lastMessage,
      fromToday: true 
    });
    await AsyncStorage.setItem('last_message_sent_date', new Date().toISOString().split('T')[0]);
  }
};

const handleRevealMessage = async () => {
  if (lastMessage && !isLastMessageOpened) {
    // Naviguer vers la page du message sans le marquer comme ouvert maintenant
    await AsyncStorage.setItem('last_message', JSON.stringify(lastMessage));
    navigation.navigate('OpenedMessage', { 
      messageData: lastMessage,
      fromToday: true 
    });
    await AsyncStorage.setItem('last_message_sent_date', new Date().toISOString().split('T')[0]);
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.countdownContainer}>
        <Text style={styles.title}>Prochain Message dans...</Text>
        <View style={styles.countdownBox}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      </View>
      
      
      {missedMessages.length > 0 && (
        <View style={styles.missedButton}>
          <Text style={styles.missedText}>
            {missedMessages.length} message{missedMessages.length > 1 ? 's' : ''} non ouvert, j'te quitte !
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MissedMessages')}
            style={styles.missedActionButton}
          >
            <Text style={styles.buttonMissedText}>Voir cette trahison</Text>
          </TouchableOpacity>
        </View>
      )}
      

      <TouchableOpacity
  style={styles.lastMessageBox}
  onPress={isLastMessageOpened ? handleOpenTodayMessage : handleRevealMessage}
>
  <Text style={styles.title}>Le Message du Jour</Text>
  {(() => {
    if (!lastMessage) {
      return <Text style={styles.text}>Aucun message disponible pour le moment.</Text>;
    } else if (isLastMessageOpened) {
      return (
        <View style={styles.lastMessageContent}>
          <Text style={styles.lastMessageText}>{lastMessage.content}</Text>
          <Text style={styles.lastMessageDate}>{formatDate(lastMessage.date)}</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.lastMessageContent}>
          <Text style={styles.lastMessageText}>{lastMessage.content}</Text>
          <Text style={styles.lastMessageDate}>{formatDate(lastMessage.date)}</Text>
        </View>
      );
    }
        
    
  })()}
</TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
        <Text style={styles.title}>Tes Messages Favoris</Text>
      </TouchableOpacity>

      <View style={styles.favGrid}>
        {favorites.length > 0 ? (
          favorites
            .slice(0, 4) // Limite à 4 messages maximum
            .map((msg, index) => (
              <TouchableOpacity
                key={`${msg.date}-${index}`} // Clé plus unique utilisant la date
                onPress={() => handleOpenFavorite(msg)}
                style={styles.favItemBox}
              >
                <View style={styles.favContent}>
                  <Text style={styles.favItem} numberOfLines={3}>
                    {msg.content}
                  </Text>
                </View>
                <Text style={styles.favDate}>{formatDate(msg.date)}</Text>
              </TouchableOpacity>
            ))
        ) : (
          <Text style={styles.text}>Aucun favori pour l'instant.</Text>
        )}
      </View>

      {favorites.length > 0 && (
        <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
          <Text style={styles.viewMore}>Voir plus</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.allMessagesButton}
        onPress={() => navigation.navigate('DiscoveredMessages')}
      >
        <Text style={styles.allMessagesText}>Tous les Messages</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity 
        style={styles.resetButton} 
        onPress={resetApplication}
      >
        <Text style={styles.resetButtonText}>🔄 Réinitialiser l'app</Text>
      </TouchableOpacity> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownBox: {
    backgroundColor: '#cde2d0',
    padding: 8,
    borderRadius: 8,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e593f',
  },
  lastMessageBox: {
    borderWidth: 1,
    borderColor: '#94c197',
    borderRadius: 12,
    paddingRight: 16,
    paddingLeft: 16,
    paddingTop: 10,
    paddingBottom: 3,
    marginBottom: 12,
  },
  lastMessageContent: {
    marginTop: 10,
    alignItems: 'center',
  },
  lastMessageDate: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-start',
    marginBottom: 1,
  },
  lastMessageText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 6,
    
  },
  text: {
    fontSize: 16,
    color: '#444',
  },
  favGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  favItemBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#94c197',
    borderRadius: 12,
    padding: 12,
    width: '48%',
    height: 140,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  favContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favItem: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  favDate: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-start',
  },
  viewMore: {
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    marginTop: 10,
  },
  allMessagesButton: {
    backgroundColor: '#e1eade',
    padding: 14,
    borderRadius: 10,
    marginTop: 30,
    alignItems: 'center',
  },
  allMessagesText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
  },
  missedButton: {
    marginTop: 12,
    backgroundColor: '#ffecec',
    borderRadius: 8,
    padding: 12,
  },
  missedText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  missedActionButton: {
    backgroundColor: '#ff5c5c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  buttonMissedText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dd3333',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});