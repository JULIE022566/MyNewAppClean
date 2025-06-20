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
    buttonPrimary: '#007BFF',
    buttonFavorite: '#ffc107',
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
    navigation.navigate('OpenedMessages');
  };

  if (!todayMessage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.info, { color: colors.subtle }]}>
          Aucun message prévu pour aujourd’hui.
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

      <Text style={[styles.message, { color: colors.text }]}>
        {todayMessage.content}
      </Text>

      <TouchableOpacity
        onPress={toggleFavorite}
        style={[styles.favoriteButton, { backgroundColor: colors.buttonFavorite }]}
      >
        <Text style={styles.favoriteText}>
          {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={openFull}
        style={[styles.openButton, { backgroundColor: colors.buttonPrimary }]}
      >
        <Text style={styles.openButtonText}>Ouvrir en plein écran</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  date: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
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