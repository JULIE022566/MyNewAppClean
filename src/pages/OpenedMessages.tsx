import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useRef } from 'react';

interface Message {
  content: string;
  date: string;
}

export function OpenedMessages() {
  const [message, setMessage] = useState<Message | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { resolvedTheme: theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();

  const colors = {
    background: theme === 'dark' ? '#121212' : '#ffffff',
    text: theme === 'dark' ? '#ffffff' : '#000000',
    subtle: theme === 'dark' ? '#bbbbbb' : '#555555',
  };

  useEffect(() => {
    const params = route.params;
    if (params?.messages && params?.currentIndex !== undefined) {
      setMessages(params.messages);
      setCurrentIndex(params.currentIndex);
      loadMessage(params.messages[params.currentIndex]);
    } else {
      const loadFromStorage = async () => {
        const raw = await AsyncStorage.getItem('last_message');
        if (raw) loadMessage(JSON.parse(raw));
      };
      loadFromStorage();
    }
  }, []);

  const loadMessage = async (msg: Message) => {
    setMessage(msg);
    const favRaw = await AsyncStorage.getItem('favorites');
    const favs: Message[] = favRaw ? JSON.parse(favRaw) : [];
    setIsFavorite(favs.some((m) => m.date === msg.date));
  };

  const lastTap = useRef<number | null>(null);

const handleDoubleTap = () => {
  const now = Date.now();
  if (lastTap.current && now - lastTap.current < 300) {
    toggleFavorite();
  }
  lastTap.current = now;
};

  const navigateToIndex = (index: number) => {
    const msg = messages[index];
    setCurrentIndex(index);
    loadMessage(msg);
  };

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

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  if (!message) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>Aucun message à afficher.</Text>
      </View>
    );
  }

  const hasPrev = currentIndex !== null && currentIndex > 0;
  const hasNext = currentIndex !== null && currentIndex < messages.length - 1;

return (
  <View style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}>
    
      <TouchableOpacity 
  activeOpacity={1}
  onPress={handleDoubleTap}
  style={[styles.messageBox, { 
    backgroundColor: theme === 'dark' ? '#b52d7133' : '#f7639428',
    borderColor: theme === 'dark' ? '#b52d71eb' : '#c82d60',
    borderWidth: 1.5 
  }]}
>
  <Text style={[styles.message, { color: theme === 'dark' ? '#ffffff' : '#880e4f', fontWeight: 'bold', fontSize: 25 }]}>
    {message.content}
  </Text>
</TouchableOpacity>

    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between", paddingHorizontal:20, marginTop: 20, marginBottom : 20}}>
        <Text style={[styles.date, { color: theme === 'dark' ? '#ffffff' : '#880e4f', }]}>
            {formatDate(message.date)}
          </Text>
          <TouchableOpacity onPress={toggleFavorite} style={[styles.icon, { zIndex: 10 }]}>
          <FontAwesome name={isFavorite ? 'heart' : 'heart-o'} size={28} color='#ea4b4b' />
        </TouchableOpacity>
  </View>

    
    {(hasPrev || hasNext) && (
      <View style={styles.navigation}>
        {hasPrev ? (
          <TouchableOpacity onPress={() => navigateToIndex(currentIndex! - 1)} style={styles.navButton}>
            <Ionicons name="chevron-back" size={32} color={theme === 'dark' ? '#b52d71eb' : '#c82d60'} />
          </TouchableOpacity>
        ) : <View style={styles.navButton} />}

        {hasNext ? (
          <TouchableOpacity onPress={() => navigateToIndex(currentIndex! + 1)} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={32} color={theme === 'dark' ? '#b52d71eb' : '#c82d60'} />
          </TouchableOpacity>
        ) : <View style={styles.navButton} />}
      </View>
    )}
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  messageBox: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 32,
    fontStyle: 'italic',
  },
  date: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30
  },
  navButton: {
    width: 50,
    alignItems: 'center',
  },
});