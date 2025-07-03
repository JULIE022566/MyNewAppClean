import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messagesData from '../assets/messages.json';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';

interface Message {
  content: string;
  date: string;
}

export default function NewMessage() {
  const [todayMessage, setTodayMessage] = useState<Message | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

  useEffect(() => {
    const loadMessage = async () => {
      const today = new Date();
      const formattedToday = today.toISOString().split('T')[0];

      const found = messagesData.find((msg) => msg.date === formattedToday);
      if (!found) {
        setTodayMessage(null);
        return;
      }

      setTodayMessage(found);

      // Favoris
      const favRaw = await AsyncStorage.getItem('favorites');
      const favs: Message[] = favRaw ? JSON.parse(favRaw) : [];
      const fav = favs.find((m) => m.date === found.date);
      setIsFavorite(!!fav);

      // Découvert
      const discRaw = await AsyncStorage.getItem('discovered_messages');
      const discoveredList: Message[] = discRaw ? JSON.parse(discRaw) : [];
      const alreadyDiscovered = discoveredList.some((m) => m.date === found.date);
      if (!alreadyDiscovered) {
        const updated = [...discoveredList, found];
        await AsyncStorage.setItem('discovered_messages', JSON.stringify(updated));
      }

      // Dernier message
      await AsyncStorage.setItem('last_message', JSON.stringify(found));
    };

    loadMessage();
  }, []);

  const toggleFavorite = async () => {
    if (!todayMessage) return;

    const favRaw = await AsyncStorage.getItem('favorites');
    const favs: Message[] = favRaw ? JSON.parse(favRaw) : [];

    if (isFavorite) {
      const updated = favs.filter((m) => m.date !== todayMessage.date);
      await AsyncStorage.setItem('favorites', JSON.stringify(updated));
      setIsFavorite(false);
    } else {
      const updated = [...favs, todayMessage];
      await AsyncStorage.setItem('favorites', JSON.stringify(updated));
      setIsFavorite(true);
    }
  };

  const openFull = () => {
    navigation.navigate('OpenedMessage');
  };

  if (!todayMessage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.info, { color: colors.subtle }]}>
          Tu as déjà ouvert ton message aujourd’hui.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.date, { color: colors.subtle }]}>
        {new Date(todayMessage.date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </Text>

      {/* <Text style={[styles.message, { color: colors.text }]}>
        {todayMessage.content}
      </Text> */}

      <TouchableOpacity 
        onPress={openFull}
      >
        <Text style={[styles.message, { color: colors.text }]}>Voir le Message Du Jour</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity
        onPress={toggleFavorite}
        style={[styles.favoriteButton, { backgroundColor: colors.buttonFavorite }]}
      >
        <Text style={styles.favoriteText}>
          {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        </Text>
      </TouchableOpacity> */}

      {/*
      <TouchableOpacity
        onPress={openFull}
        style={[styles.openButton, { backgroundColor: colors.buttonPrimary }]}
      >
        <Text style={styles.openButtonText}>Voir le Message Du Jour</Text>
      </TouchableOpacity>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  messageBox: {
    borderWidth: 1,
    borderColor: '#4caf50',
    padding: 24,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
  },
  message: {
    fontSize: 24,
    color: '#000',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#4caf50',
    padding: 20,
    borderRadius: 12
    
  },
  icon: {
    marginTop: 10,
  },
  
  favoriteButton: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  favoriteText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  openButton: {
    padding: 12,
    borderRadius: 8,
  },
  openButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  info: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
});