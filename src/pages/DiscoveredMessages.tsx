import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';

interface Message {
  content: string;
  date: string;
}

export default function DiscoveredMessages() {
  const [discoveredMessages, setDiscoveredMessages] = useState<Message[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  const colors = {
    background: theme === 'dark' ? '#121212' : '#ffffff',
    text: theme === 'dark' ? '#ffffff' : '#222222',
    subtle: theme === 'dark' ? '#bbbbbb' : '#666666',
    cardBackground: theme === 'dark' ? '#1e1e1e' : '#f2f2f2',
  };

  useEffect(() => {
    const loadDiscoveredMessages = async () => {
      const raw = await AsyncStorage.getItem('discovered_messages');
      const parsed: Message[] = raw ? JSON.parse(raw) : [];
      setDiscoveredMessages(parsed.reverse());
    };

    loadDiscoveredMessages();
  }, []);

  const openMessage = async (message: Message) => {
    await AsyncStorage.setItem('last_message', JSON.stringify(message));
    navigation.navigate('OpenedMessages');
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
      <Text style={[styles.title, { color: colors.text }]}>Tous les messages découverts</Text>
      {discoveredMessages.length === 0 ? (
        <Text style={[styles.empty, { color: colors.subtle }]}>Tu n’as encore rien découvert 🫣</Text>
      ) : (
        <FlatList
          data={discoveredMessages}
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
