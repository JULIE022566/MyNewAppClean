import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { HomeStackParamList, RootTabParamList } from '../Navigation/AppNavigator';
import messages from '../assets/messages.json';
import { useTheme } from '../context/ThemeContext';
import { useMessage } from '../context/MessageContext';
import { FontAwesome } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { useRef } from 'react';

type Message = {
  content: string;
  date: string;
};

type HomeNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;

export default function Home() {
  const { setHasNewMessage } = useMessage();
  const navigation = useNavigation<HomeNavProp>();
  const { resolvedTheme: theme } = useTheme();
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const colors = {
    background: theme === 'dark' ? '#121212' : '#ffffff',
    text: theme === 'dark' ? '#ffffff' : '#222222',
    subtle: theme === 'dark' ? '#bbbbbb' : '#666666',
    iconColor: '#ea4b4b',
  };
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [favorites, setFavorites] = useState<Message[]>([]);
  const [countdown, setCountdown] = useState('');
  const [nextHour, setNextHour] = useState(9);
  const [nextMinute, setNextMinute] = useState(0);
  const [missedMessages, setMissedMessages] = useState<Message[]>([]);
  const [todayAlreadyDiscovered, setTodayAlreadyDiscovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [isOpeningMessage, setIsOpeningMessage] = useState(false);

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useFocusEffect(
    useCallback(() => {
      // RESET DES ANIMATIONS
          setIsOpeningMessage(false);

          scaleAnim.setValue(1);
          shakeAnim.setValue(0);
          opacityAnim.setValue(1);

      const load = async () => {
        const hourStr = await AsyncStorage.getItem('notif_hour');
        const minuteStr = await AsyncStorage.getItem('notif_minute');
        const hour = parseInt(hourStr || '9');
        const minute = parseInt(minuteStr || '0');
        setNextHour(hour);
        setNextMinute(minute);

        const openedRaw = await AsyncStorage.getItem('discovered_messages');
        const opened: Message[] = openedRaw ? JSON.parse(openedRaw) : [];
        const openedDates = opened.map((m) => m.date);

        const missed = messages.filter((msg) => {
            if (msg.date === getTodayString()) return false;
            const msgDate = new Date(msg.date);
            const today = new Date();
            return msgDate < today && !openedDates.includes(msg.date);
          });

        setMissedMessages(missed);

        const todayMsg = messages.find(m => m.date === getTodayString());
        if (todayMsg) {
          setLastMessage(todayMsg);
          const favRaw2 = await AsyncStorage.getItem('favorites');
          const favs: Message[] = favRaw2 ? JSON.parse(favRaw2) : [];
          setIsFavorite(favs.some((m) => m.date === todayMsg.date));
        } else {
          setLastMessage(null);
        }

        const todayDiscovered = openedDates.includes(getTodayString());
        setTodayAlreadyDiscovered(todayDiscovered);

        const now = new Date();
        const target = new Date();
        target.setHours(hour, minute, 0, 0);
        const messageAvailable = !todayDiscovered && target <= now;
        setHasNewMessage(messageAvailable);
        if (messageAvailable) {
          setTimeout(() => {
            setShowModal(true);
          }, 500);
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

    Animated.parallel([
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }),
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }),
  ]).start();

    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(nextHour, nextMinute, 0, 0);
      if (target <= now || todayAlreadyDiscovered) target.setDate(target.getDate() + 1);

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (hours === 0 && minutes === 0 && seconds === 0) {
          clearInterval(interval);
          setShowModal(true);
        } else {
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        }
        }, 1000);

    return () => clearInterval(interval);
  }, [nextHour, nextMinute, todayAlreadyDiscovered]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleOpenTodayMessage = async () => {
  if (!lastMessage) return;

  const discRaw = await AsyncStorage.getItem('discovered_messages');
  const discovered: Message[] = discRaw ? JSON.parse(discRaw) : [];

  const alreadyDiscovered = discovered.some((m) => m.date === lastMessage.date);

  if (!alreadyDiscovered) {
    await AsyncStorage.setItem(
      'discovered_messages',
      JSON.stringify([...discovered, lastMessage])
    );
  }

  await AsyncStorage.setItem('last_message', JSON.stringify(lastMessage));
setHasNewMessage(false);
if (!alreadyDiscovered) {
  Animated.timing(overlayOpacity, {
    toValue: 0,
    duration: 1500,
    useNativeDriver: true,
  }).start(() => {
    setTodayAlreadyDiscovered(true);
    navigation.navigate('OpenedMessages');
  });
} else {
  setTodayAlreadyDiscovered(true);
  navigation.navigate('OpenedMessages');
}
}; 
const toggleFavorite = async () => {
  if (!lastMessage) return;
  const favRaw = await AsyncStorage.getItem('favorites');
  let favs: Message[] = favRaw ? JSON.parse(favRaw) : [];
  if (isFavorite) {
    favs = favs.filter((m) => m.date !== lastMessage.date);
  } else {
    favs.push(lastMessage);
  }
  await AsyncStorage.setItem('favorites', JSON.stringify(favs));
  setIsFavorite(!isFavorite);
};

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Text style={[styles.titleH1, { color: theme === 'dark' ? '#ffffff' : '#880e4f', }]}>Tous les jours, une nouvelle raison d'être amoureuse de toi 💌</Text>
      
      {/* Messages manqués */}
      {missedMessages.length > 0 && (
        <View style={[styles.missedButton, {   backgroundColor: theme === 'dark' ? '#dc1e1e28' : '#dc1e1e28',  marginTop: 20,  borderColor: theme === 'dark' ? '#e611119c' : '#e61111', borderWidth: 1.5,  }]}>
          <Text style={[styles.missedText, { color: theme === 'dark' ? '#fffefe' : '#dd2727'}]}>
            💔 {missedMessages.length} petit{missedMessages.length > 1 ? 's' : ''} mot{missedMessages.length > 1 ? 's' : ''} tristement oublié{missedMessages.length > 1 ? 's' : ''}...
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MissedMessages' as never)}
            style={styles.missedActionButton}
          >
            <Text style={styles.buttonMissedText}>Rattrappe toi !</Text>
          </TouchableOpacity>
        </View>
      )}

     
      {/* Message du jour */}
<View style={{ flex: 1 }}>
  <TouchableOpacity
    style={[
      styles.lastMessageBox,
      {
        flex: 1,
        backgroundColor: theme === 'dark' ? '#b52d7133' : '#f7639428',
        borderColor: theme === 'dark' ? '#b52d71eb' : '#c82d60',
        borderWidth: 1.5,
        marginTop: 20,
      },
    ]}
    onPress={handleOpenTodayMessage}
  >
    {lastMessage ? (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    {todayAlreadyDiscovered && (
      <>
        <Text style={[styles.lastMessageText, { color: theme === 'dark' ? '#ffffff' : '#880e4f', fontWeight: 'bold', fontSize: 25 }]}>
          {lastMessage.content}
        </Text>
        <Text style={[styles.lastMessageDate, { color: theme === 'dark' ? '#ffffff' : '#880e4f' }]}>
          {formatDate(lastMessage.date)}
        </Text>
        <TouchableOpacity
          onPress={toggleFavorite}
          style={[styles.icon, { zIndex: 10 }]}
        >
          <FontAwesome name={isFavorite ? 'heart' : 'heart-o'} size={28} color='#ea4b4b' />
        </TouchableOpacity>
      </>
    )}
    {!todayAlreadyDiscovered && (
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, opacity: overlayOpacity,   backgroundColor: theme === 'dark' ? '#b52d7133' : '#f7639428', justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}>
          <Text style={{ fontSize: 100 }}>💌</Text>
        </Animated.View>
      )}
  </View>
) : null}
  </TouchableOpacity>
</View>

       {/* Countdown */}
      <View style={[ { alignItems: 'center', marginTop: 20 }]}> 
        <Text style={[styles.titleH2, { color: theme === 'dark' ? '#ffffff' : '#880e4f', }]}>Patience mon amour, la suite arrive bientôt...</Text>
        <View style={[styles.countdownBox,]}>
          <Text style={[styles.countdownText, { color: theme === 'dark' ? '#ffffff' : '#880e4f' }]}>{countdown}</Text>
        </View>
      </View>


      {/* Bouton favoris et tous les messages */}
      <View style={styles.bouton}>
          <TouchableOpacity
            style={[styles.MessagesBouton, { backgroundColor: theme === 'dark' ? '#b52d71eb' : '#c82d60', }]}
            onPress={() => navigation.navigate('Favoris' as never)}
          >
            <Text style={[styles.allMessagesText, { color: theme === 'dark' ? '#ffffff' : '#fff8fc' }]}>Favoris</Text>
          </TouchableOpacity>
              <TouchableOpacity
            style={[styles.MessagesBouton, { borderColor: theme === 'dark' ? '#b52d71eb' : '#c82d60', borderWidth: 1.5 }]}
            onPress={() => navigation.navigate('Messages' as never)}
          >
            <Text style={[styles.allMessagesText, { color: theme === 'dark' ? '#ffffff' : '#c82d60' }]}>Voir tout</Text>
          </TouchableOpacity>
      </View>

      {/* pop up message */}
      <Modal transparent visible={showModal} animationType="fade">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000066' }}>
            <View style={{ backgroundColor: '#fff0f5', borderRadius: 20, padding: 30, alignItems: 'center', width: '80%' }}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>❤️</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#880e4f', textAlign: 'center', marginBottom: 20 }}>
                Un Petit Mot d'Amour t'attend
              </Text>
              <TouchableOpacity
                onPress={() => { setShowModal(false); handleOpenTodayMessage(); }}
                style={{ backgroundColor: '#c40d71', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20, marginBottom: 10 }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Ouvre-le</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ color: '#999', marginTop: 6 }}>Plus tard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  bouton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20
  },
  MessagesBouton: {
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    width: '45%',
  },
  icon: {
    alignSelf: 'center',
    top: 20,
  },
  countdownBox: {
    alignItems: 'center',
    borderRadius: 20,
  },
  countdownText: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  lastMessageBox: {
    borderWidth: 1.5,
    borderRadius: 20,
    overflow: 'hidden',
  },
  lastMessageDate: {
    fontSize: 13,
    alignSelf: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  lastMessageText: {
    textAlign: 'center',
    lineHeight: 32,
    fontStyle: 'italic',
  },
  titleH1: {
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleH2: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  text: {
    fontSize: 16,
  },
  allMessagesButton: {
    borderRadius: 25,
    alignItems: 'center',
  },
  allMessagesText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  missedButton: {
    borderRadius: 12,
    padding: 12,
  },
  missedText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'center',
    textAlign: 'center',
  },
  missedActionButton: {
    backgroundColor: '#e53935',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  buttonMissedText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});