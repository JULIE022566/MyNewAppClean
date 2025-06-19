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

type Message = {
  content: string;
  date: string;
};

export default function Home() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [favorites, setFavorites] = useState<Message[]>([]);
  const [countdown, setCountdown] = useState('');
  const [nextHour, setNextHour] = useState(9);
  const [nextMinute, setNextMinute] = useState(0);
  const [missedMessages, setMissedMessages] = useState<Message[]>([]);

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
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
        await AsyncStorage.removeItem('discovered_messages');
await AsyncStorage.removeItem('favorites');
await AsyncStorage.removeItem('last_message');
        const opened: Message[] = openedRaw ? JSON.parse(openedRaw) : [];
        const openedDates = opened.map((m) => m.date);

        const missed = messages.filter((msg) => {
          const msgDate = new Date(msg.date);
          const today = new Date();
          return msgDate < today && !openedDates.includes(msg.date);
        });
        setMissedMessages(missed);

        const todayMsg = messages.find(m => m.date === getTodayString());
        if (todayMsg) {
          setLastMessage(todayMsg);
        } else {
          setLastMessage(null);
        }

        const favRaw = await AsyncStorage.getItem('favorites');
        if (favRaw) {
          const parsedFavs = JSON.parse(favRaw);
          setFavorites(parsedFavs.slice().reverse().slice(0, 4));
        }
      };

      load();
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(nextHour, nextMinute, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (hours === 0 && minutes === 0 && seconds === 0) {
        clearInterval(interval);
        Alert.alert('Un nouveau message est arrivé !', '', [
          { text: 'Ouvre-le', onPress: () => navigation.navigate('NewMessage') },
        ]);
      } else {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
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
    navigation.navigate('OpenedMessage');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.countdownContainer}>
        <Text style={styles.title}>Prochain Message dans...</Text>
        <View style={styles.countdownBox}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      </View>
      
      {/*
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
      */}

      <TouchableOpacity
        style={styles.lastMessageBox}
        onPress={() => navigation.navigate('OpenedMessage')}
      >
        <Text style={styles.title}>Le Message du Jour</Text>
        {lastMessage ? (
          <View style={styles.lastMessageContent}>
            <Text style={styles.lastMessageText}>{lastMessage.content}</Text>
            <Text style={styles.lastMessageDate}>{formatDate(lastMessage.date)}</Text>
          </View>
        ) : (
          <Text style={styles.text}>Aucun message pour aujourd’hui.</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
        <Text style={styles.title}>Tes Messages Favoris</Text>
      </TouchableOpacity>

      <View style={styles.favGrid}>
        {favorites.length > 0 ? (
          favorites.map((msg, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleOpenFavorite(msg)}
              style={styles.favItemBox}
            >
              <View style={styles.favContent}>
                <Text style={styles.favItem}>{msg.content}</Text>
              </View>
              <Text style={styles.favDate}>{formatDate(msg.date)}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.text}>Aucun favori pour l’instant.</Text>
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
    padding: 16,
    marginBottom: 12,
  },
  lastMessageContent: {
    marginTop: 10,
    alignItems: 'center',
  },
  lastMessageDate: {
    fontSize: 14,
    color: '#666',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  lastMessageText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
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
    fontSize: 13,
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
});
