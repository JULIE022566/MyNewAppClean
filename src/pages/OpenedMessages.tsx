import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
// Importez votre fichier de messages
import messagesData from '../assets/messages.json';
import { useTheme } from '../context/ThemeContext';

interface Message {
  content: string;
  date: string;
}

// CORRECTION: Constante pour la clé des favoris - utilisée partout
const FAVORITES_KEY = 'app_favorites';

export default function OpenedMessage() {
  const [message, setMessage] = useState<Message | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const route = useRoute();

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

  // Fonction pour normaliser les dates au format YYYY-MM-DD
  const normalizeDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Fonction de débogage pour voir le contenu d'AsyncStorage
  const debugAsyncStorage = async () => {
    try {
      const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
      const lastMessage = await AsyncStorage.getItem('last_message');
      
      console.log('=== DEBUG ASYNCSTORAGE ===');
      console.log('Favorites raw:', favorites);
      console.log('Favorites parsed:', favorites ? JSON.parse(favorites) : 'aucun');
      console.log('Last message:', lastMessage ? JSON.parse(lastMessage) : 'aucun');
      console.log('========================');
      
      // Affichage d'une alerte pour voir dans l'interface
      const favCount = favorites ? JSON.parse(favorites).length : 0;
      Alert.alert('Debug', `Favoris: ${favCount} messages\nMessage actuel: ${message?.date || 'aucun'}`);
    } catch (error) {
      console.error('Erreur debug:', error);
    }
  };

  // Fonction pour obtenir le message du jour
  const getTodayMessage = (): Message | null => {
    const today = new Date();
    const todayString = normalizeDate(today.toISOString());
    
    console.log('Getting today message for:', todayString);
    
    // Chercher d'abord un message avec la date exacte d'aujourd'hui
    const exactMatch = messagesData.find(msg => normalizeDate(msg.date) === todayString);
    if (exactMatch) {
      console.log('Found exact match:', exactMatch);
      return {
        ...exactMatch,
        date: todayString
      };
    }
    
    // Si pas de message pour aujourd'hui, prendre un message basé sur le jour de l'année
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const messageIndex = dayOfYear % messagesData.length;
    const selectedMessage = messagesData[messageIndex];
    
    console.log('Using day-based message:', selectedMessage, 'for day:', dayOfYear);
    
    return {
      ...selectedMessage,
      date: todayString
    };
  };

  // Fonction pour vérifier si c'est un nouveau jour
  const isNewDay = async (): Promise<boolean> => {
    const lastDate = await AsyncStorage.getItem('last_message_sent_date');
    const today = new Date().toDateString();
    
    console.log('Checking new day - Last:', lastDate, 'Today:', today);
    return lastDate !== today;
  };

  // CORRECTION: Fonction pour vérifier si un message est en favoris avec clé unique
  const checkIfFavorite = async (msg: Message): Promise<boolean> => {
    try {
      const favRaw = await AsyncStorage.getItem(FAVORITES_KEY);
      
      if (!favRaw || favRaw === 'null' || favRaw === '') {
        console.log('🔍 Aucun favori trouvé dans le storage');
        return false;
      }

      const favs: Message[] = JSON.parse(favRaw);
      const messageDate = normalizeDate(msg.date);
      
      console.log('🔍 === CHECKING FAVORITE - VERSION CORRIGÉE ===');
      console.log('🔍 Message date à vérifier:', messageDate);
      console.log('🔍 Type de messageDate:', typeof messageDate);
      console.log('🔍 Favoris dans storage:', favs);
      console.log('🔍 Nombre de favoris:', favs.length);
      
      // Vérifier que favs est bien un array
      if (!Array.isArray(favs)) {
        console.log('🔍 ❌ Les favoris ne sont pas un array valide');
        return false;
      }
      
      // Vérifier chaque favori individuellement
      for (let i = 0; i < favs.length; i++) {
        const fav = favs[i];
        if (!fav || !fav.date) {
          console.log(`🔍 Favori ${i} invalide:`, fav);
          continue;
        }
        
        const favDate = normalizeDate(fav.date);
        console.log(`🔍 Favori ${i} - Date: "${favDate}" (type: ${typeof favDate})`);
        console.log(`🔍 Comparaison: "${messageDate}" === "${favDate}" = ${messageDate === favDate}`);
        
        if (messageDate === favDate) {
          console.log('🔍 ✅ MATCH TROUVÉ!');
          return true;
        }
      }
      
      console.log('🔍 ❌ Aucun match trouvé');
      console.log('🔍 ===============================================');
      
      return false;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des favoris:', error);
      return false;
    }
  };

  // Fonction pour recharger le statut favori
  const reloadFavoriteStatus = useCallback(async () => {
    if (message) {
      console.log('🔄 Rechargement du statut favori...');
      const isFav = await checkIfFavorite(message);
      console.log('🔄 Nouveau statut favori:', isFav);
      setIsFavorite(isFav);
    }
  }, [message]);

  // Utilisez useFocusEffect pour recharger le statut favori à chaque focus
  useFocusEffect(
    useCallback(() => {
      if (message) {
        console.log('📱 Page focalisée, rechargement du statut favori...');
        reloadFavoriteStatus();
      }
    }, [message, reloadFavoriteStatus])
  );

  useEffect(() => {
    const loadMessage = async () => {
      console.log('=== LOADING MESSAGE ===');
      setLoading(true);
      let loadedMessage: Message | null = null;
      
      try {
        // Vérifier d'abord s'il y a des données de navigation
        const params = route.params as any;
        console.log('Route params:', params);
        
        if (params?.messageData) {
          // Utiliser les données passées en paramètre
          loadedMessage = {
            content: params.messageData.content,
            date: normalizeDate(params.messageData.date)
          };
          console.log('Using params message:', loadedMessage);
          
          // Ne pas sauvegarder si c'est depuis les favoris
          if (!params.fromFavorites) {
            await AsyncStorage.setItem('last_message', JSON.stringify(loadedMessage));
            await AsyncStorage.setItem('last_message_date', new Date().toDateString());
            console.log('Saved params message to storage');
          }
        } else {
          // Vérifier si c'est un nouveau jour ou si aucun message n'existe
          const shouldGetNewMessage = await isNewDay();
          const existingMessage = await AsyncStorage.getItem('last_message');
          
          if (shouldGetNewMessage || !existingMessage) {
            // Obtenir le message du jour
            const todayMessage = getTodayMessage();
            loadedMessage = todayMessage;
            console.log('Using today message:', loadedMessage);
            
            // Sauvegarder le nouveau message
            if (todayMessage) {
              await AsyncStorage.setItem('last_message', JSON.stringify(todayMessage));
              await AsyncStorage.setItem('last_message_date', new Date().toDateString());
              console.log('Saved today message to storage');
            }
          } else {
            // Charger le message existant
            const parsed = JSON.parse(existingMessage);
            loadedMessage = {
              ...parsed,
              date: normalizeDate(parsed.date)
            };
            console.log('Using existing message:', loadedMessage);
          }
        }

        // Mettre à jour le state avec le message chargé
        if (loadedMessage) {
          setMessage(loadedMessage);
          console.log('✅ Message set in state:', loadedMessage);
          
          // Attendre un petit délai pour s'assurer que AsyncStorage est prêt
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Vérifier si c'est un favori
          const isFav = await checkIfFavorite(loadedMessage);
          console.log('✅ Résultat checkIfFavorite:', isFav);
          setIsFavorite(isFav);
          console.log('✅ isFavorite state mis à jour:', isFav);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du message:', error);
        // En cas d'erreur, charger quand même le message du jour
        const todayMessage = getTodayMessage();
        if (todayMessage) {
          setMessage(todayMessage);
          const isFav = await checkIfFavorite(todayMessage);
          setIsFavorite(isFav);
        }
      } finally {
        setLoading(false);
        console.log('=== LOADING MESSAGE COMPLETE ===');
      }
    };

    loadMessage();
  }, [route.params]);

  const toggleFavorite = async () => {
    if (!message) {
      console.log('No message to toggle favorite');
      return;
    }

    console.log('⭐ === TOGGLE FAVORITE START ===');
    console.log('⭐ Current isFavorite state:', isFavorite);
    console.log('⭐ Message:', message);

    try {
      // CORRECTION: Utiliser uniquement la clé principale
      let favRaw = await AsyncStorage.getItem(FAVORITES_KEY);
      
      let favs: Message[] = [];
      if (favRaw && favRaw !== 'null' && favRaw !== '') {
        try {
          favs = JSON.parse(favRaw);
          if (!Array.isArray(favs)) {
            console.log('⭐ ⚠️ Les favoris ne sont pas un array, réinitialisation');
            favs = [];
          }
        } catch (parseError) {
          console.error('⭐ Erreur de parsing des favoris:', parseError);
          favs = [];
        }
      }
      
      console.log('⭐ Current favorites from storage:', favs);

      const messageDate = normalizeDate(message.date);
      console.log('⭐ Message date normalized:', messageDate);
      
      if (isFavorite) {
        // Retirer des favoris
        const initialLength = favs.length;
        favs = favs.filter((m) => normalizeDate(m.date) !== messageDate);
        console.log('⭐ Removing favorite - before:', initialLength, 'after:', favs.length);
      } else {
        // Vérifier si déjà présent (sécurité)
        const alreadyExists = favs.some(m => normalizeDate(m.date) === messageDate);
        if (!alreadyExists) {
          // Ajouter aux favoris avec la date normalisée
          const favoriteMessage: Message = {
            content: message.content,
            date: messageDate
          };
          favs.push(favoriteMessage);
          console.log('⭐ Adding to favorites:', favoriteMessage);
        } else {
          console.log('⭐ Message already exists in favorites!');
        }
      }

      // CORRECTION: Sauvegarder uniquement avec la clé principale
      const favoritesJson = JSON.stringify(favs);
      await AsyncStorage.setItem(FAVORITES_KEY, favoritesJson);
      
      console.log('⭐ Favorites saved to storage:', favs);
      
      // Vérification immédiate
      const verification = await AsyncStorage.getItem(FAVORITES_KEY);
      console.log('⭐ Verification - stored favorites:', verification ? JSON.parse(verification) : 'ERREUR');
      
      // Mettre à jour l'état
      const newIsFavorite = !isFavorite;
      setIsFavorite(newIsFavorite);
      console.log('⭐ New isFavorite state:', newIsFavorite);
      
      // Double vérification
      setTimeout(async () => {
        console.log('⭐ Double vérification après 200ms...');
        const doubleCheck = await checkIfFavorite(message);
        console.log('⭐ Double vérification résultat:', doubleCheck);
        if (doubleCheck !== newIsFavorite) {
          console.log('⭐ ⚠️ INCOHÉRENCE DÉTECTÉE! Correction...');
          setIsFavorite(doubleCheck);
        }
      }, 200);
      
    } catch (error) {
      console.error('❌ Erreur lors de la gestion des favoris:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le favori');
    }
    
    console.log('⭐ === TOGGLE FAVORITE END ===');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Chargement...</Text>
      </View>
    );
  }

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
        <FontAwesome 
          name={isFavorite ? 'star' : 'star-o'} 
          size={28} 
          color={isFavorite ? '#FFD700' : '#999'} 
        />
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
  },
  icon: {
    marginTop: 10,
  },
  debugButton: {
    marginTop: 30,
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontWeight: 'bold',
  },
});