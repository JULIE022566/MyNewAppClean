import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

interface Message {
  content: string;
  date: string;
}

type RootStackParamList = {
  Home: undefined;
  Favorites: undefined;
  OpenedMessage: {
    messageData?: Message;
    fromFavorites?: boolean;
  };
};

export default function Favorites() {
  const [favorites, setFavorites] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
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

  const normalizeDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const loadFavorites = async () => {
    try {
      setLoading(true);
      
      const FAVORITES_KEY = 'app_favorites';
      let favRaw = await AsyncStorage.getItem(FAVORITES_KEY);
      
      if (!favRaw || favRaw === 'null' || favRaw === '') {
        favRaw = await AsyncStorage.getItem('favorites');
        if (favRaw && favRaw !== 'null' && favRaw !== '') {
          await AsyncStorage.setItem(FAVORITES_KEY, favRaw);
        }
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
      
      const normalizedFavs = favs.map(fav => ({
        ...fav,
        date: normalizeDate(fav.date)
      }));
      
      normalizedFavs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setFavorites(normalizedFavs);
      
    } catch (error) {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const openMessage = async (msg: Message) => {
    try {
      await AsyncStorage.setItem('last_message', JSON.stringify(msg));
      navigation.navigate('OpenedMessage', { 
        messageData: msg,
        fromFavorites: true 
      });
    } catch (error) {
      // Erreur silencieuse
    }
  };

  const removeFavorite = async (messageToRemove: Message) => {
    try {
      const messageDate = normalizeDate(messageToRemove.date);
      const updatedFavorites = favorites.filter(
        (msg) => normalizeDate(msg.date) !== messageDate
      );
      
      const favoritesJson = JSON.stringify(updatedFavorites);
      const FAVORITES_KEY = 'app_favorites';
      await AsyncStorage.setItem(FAVORITES_KEY, favoritesJson);
      await AsyncStorage.setItem('favorites', favoritesJson);
      
      setFavorites(updatedFavorites);
      
      Alert.alert('Supprimé', 'Le message a été retiré de vos favoris');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer le message des favoris');
    }
  };

  const handleLongPress = (message: Message) => {
    Alert.alert(
      'Retirer des favoris',
      'Voulez-vous retirer ce message de vos favoris ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => removeFavorite(message),
        },
      ]
    );
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Fonction pour organiser les favoris en paires
  const renderFavoritesGrid = () => {
    const rows = [];
    for (let i = 0; i < favorites.length; i += 2) {
      const pair = favorites.slice(i, i + 2);
      rows.push(
        <View key={i} style={styles.gridRow}>
          {pair.map((msg, index) => (
            <TouchableOpacity
              key={`${msg.date}-${i + index}`}
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                }
              ]}
              onPress={() => openMessage(msg)}
              onLongPress={() => handleLongPress(msg)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.content, { color: colors.text }]} numberOfLines={4}>
                  {msg.content}
                </Text>
                <View style={[styles.dateContainer, { borderTopColor: colors.borderColor }]}>
                  <Text style={[styles.dateText, { color: colors.subtle }]}>
                    {formatDate(msg.date)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.starIcon}
                onPress={() => handleLongPress(msg)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome
                  name="star"
                  size={18}
                  color={colors.iconColor}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return rows;
  };

  if (loading) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.subtle }]}>
          Chargement des favoris...
        </Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <FontAwesome name="star-o" size={64} color={colors.subtle} style={styles.emptyIcon} />
        <Text style={[styles.title, { color: colors.text }]}>
          Aucun message en favori !
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.subtle }]}>
          Je savais que tu ne m'aimais pas 😢
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Tes Messages Favoris
      </Text>
      <Text style={[styles.subtitle, { color: colors.subtle }]}>
        Tu as {favorites.length} message{favorites.length > 1 ? 's' : ''} préféré{favorites.length > 1 ? 's' : ''}
      </Text>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderFavoritesGrid()}
        
        <Text style={[styles.helpText, { color: colors.subtle }]}>
          💡 Appui long sur un message ou sur ⭐ pour le retirer des favoris
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    marginHorizontal: 6,
    minHeight: 160,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
  dateContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    
  },
  dateText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    marginRight: 30,
  },
  starIcon: {
    position: 'absolute',
    top: 118,
    right: 20,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.6,
  },
});