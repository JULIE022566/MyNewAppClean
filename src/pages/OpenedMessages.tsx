import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

interface Message {
  content: string;
  date: string;
}

export default function OpenedMessage() {
  const [message, setMessage] = useState<Message | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const loadMessage = async () => {
      const raw = await AsyncStorage.getItem('last_message');
      if (raw) {
        const msg: Message = JSON.parse(raw);
        setMessage(msg);

        const favRaw = await AsyncStorage.getItem('favorites');
        const favs: Message[] = favRaw ? JSON.parse(favRaw) : [];
        setIsFavorite(favs.some((m) => m.date === msg.date));
      }
    };

    loadMessage();
  }, []);

  const toggleFavorite = async () => {
    if (!message) return;

    const favRaw = await AsyncStorage.getItem('favorites');
    let favs: Message[] = favRaw ? JSON.parse(favRaw) : [];

    if (isFavorite) {
      favs = favs.filter((m) => m.date !== message.date);
    } else {
      favs.push(message);
    }

    await AsyncStorage.setItem('favorites', JSON.stringify(favs));
    setIsFavorite(!isFavorite);
  };

  if (!message) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Aucun message à afficher.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.date}>
        {new Date(message.date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </Text>

      <View style={styles.messageBox}>
        <Text style={styles.message}>{message.content}</Text>
      </View>

      <TouchableOpacity onPress={toggleFavorite} style={styles.icon}>
        <FontAwesome name={isFavorite ? 'star' : 'star-o'} size={28} color={isFavorite ? '#FFD700' : '#999'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flex: 1,
    alignItems: 'center',
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
  },
  icon: {
    marginTop: 10,
  },
});
