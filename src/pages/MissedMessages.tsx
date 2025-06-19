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
    cardBackground: theme === 'dark' ? '#1f1f1f' : '#f0f0f0',
    text: theme === 'dark' ? '#ffffff' : '#222222',
    subtle: theme === 'dark' ? '#bbbbbb' : '#666666',
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
    await AsyncStorage.setItem('last_message', JSON.stringify(message));
    navigation.navigate('OpenedMessage');
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
      style={[styles.card, { backgroundColor: colors.cardBackground }]}
      onPress={() => openMessage(item)}
    >
      <Text style={[styles.content, { color: colors.text }]}>{item.content}</Text>
      <Text style={[styles.date, { color: colors.subtle }]}>{formatDate(item.date)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Messages manqués</Text>
      {missedMessages.length === 0 ? (
        <Text style={[styles.empty, { color: colors.subtle }]}>
          Tu n’as rien manqué pour l’instant 🥳
        </Text>
      ) : (
        <FlatList
          data={missedMessages}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 4,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  content: {
    fontSize: 16,
    textAlign: 'center',
  },
  date: {
    fontSize: 13,
    marginTop: 10,
  },
  empty: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
});
