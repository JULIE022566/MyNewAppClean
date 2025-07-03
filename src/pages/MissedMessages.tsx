import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation/AppNavigator';
import messagesData from '../assets/messages.json';
import { useTheme } from '../context/ThemeContext';

interface Message {
  content: string;
  date: string;
}

export default function MissedMessages() {
  const [missedMessages, setMissedMessages] = useState<Message[]>([]);
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
    const loadMissedMessages = async () => {
      const openedRaw = await AsyncStorage.getItem('discovered_messages');
      const opened: Message[] = openedRaw ? JSON.parse(openedRaw) : [];
      const openedDates = opened.map(m => m.date);

      const today = new Date().toISOString().split('T')[0];
      const missed = messagesData.filter(m => m.date < today && !openedDates.includes(m.date));

      setMissedMessages(missed.reverse());
    };

    loadMissedMessages();
  }, []);

  const openMessage = async (message: Message) => {
    const discoveredRaw = await AsyncStorage.getItem('discovered_messages');
    const discovered: Message[] = discoveredRaw ? JSON.parse(discoveredRaw) : [];
    const updated = [...discovered, message];
    await AsyncStorage.setItem('discovered_messages', JSON.stringify(updated));
    await AsyncStorage.setItem('last_message_sent_date', JSON.stringify(message));
    
    // Passer le message via les paramètres de navigation (comme dans DiscoveredMessages)
    navigation.navigate('OpenedMessage', { 
      messageData: message,
      fromMissed: true 
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={[styles.card, { 
        backgroundColor: colors.cardBackground,
        borderColor: colors.cardBorder 
      }]}
      onPress={() => openMessage(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text 
          style={[styles.content, { color: colors.text }]}
          numberOfLines={4}
          ellipsizeMode="tail"
        >
          {item.content}
        </Text>
        <View style={styles.dateContainer}>
          <Text style={[styles.date, { color: colors.subtle }]}>
            {formatDate(item.date)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.title}>
                  C'est Honteux !
                </Text>
                <Text style={[styles.subtitle, { color: colors.subtle }]}>
                        Déjà {missedMessages.length} raison{missedMessages.length > 1 ? 's' : ''} de te quitter 😱
                      </Text>
      {missedMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.empty, { color: colors.subtle }]}>
            Tu n'as rien manqué pour l'instant 🥳
          </Text>
        </View>
      ) : (
        <FlatList
          data={missedMessages}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.date}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  gridContainer: {
    paddingBottom: 20,
  },
  gridRow: {
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
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  dateContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128, 128, 128, 0.3)',
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  empty: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});