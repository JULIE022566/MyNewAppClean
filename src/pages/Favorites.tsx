import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';

interface Message {
  content: string;
  date: string;
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<Message[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  const colors = {
    background: theme === 'dark' ? '#121212' : '#ffffff',
    text: theme === 'dark' ? '#ffffff' : '#222222',
    subtle: theme === 'dark' ? '#bbbbbb' : '#666666',
    cardBackground: theme === 'dark' ? '#1e1e1e' : '#f3f3f3',
    iconColor: '#FFD700',
  };

  useEffect(() => {
    const loadFavorites = async () => {
      const favRaw = await AsyncStorage.getItem('favorites');
      const favs: Message[] = favRaw ? JSON.parse(favRaw) : [];
      favs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setFavorites(favs);
    };

    loadFavorites();
  }, []);

  const openMessage = async (msg: Message) => {
    await AsyncStorage.setItem('last_message', JSON.stringify(msg));
    navigation.navigate('OpenedMessages');
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (favorites.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.subtle }]}>
          Aucun message en favori.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Tes messages favoris</Text>
      <View style={styles.grid}>
        {favorites.map((msg, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.item, { backgroundColor: colors.cardBackground }]}
            onPress={() => openMessage(msg)}
          >
            <Text style={[styles.date, { color: colors.subtle }]}>
              {formatDate(msg.date)}
            </Text>
            <Text style={[styles.content, { color: colors.text }]} numberOfLines={4}>
              {msg.content}
            </Text>
            <FontAwesome
              name="star"
              size={20}
              color={colors.iconColor}
              style={styles.icon}
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    borderRadius: 12,
    padding: 12,
    width: '48%',
    marginBottom: 16,
    minHeight: 140,
  },
  date: {
    fontSize: 13,
    marginBottom: 6,
  },
  content: {
    fontSize: 15,
    flexGrow: 1,
  },
  icon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
