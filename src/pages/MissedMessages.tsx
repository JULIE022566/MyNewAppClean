import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { FavoritesStackParamList, RootTabParamList } from '../Navigation/AppNavigator';
import messagesData from '../assets/messages.json';
import { useTheme } from '../context/ThemeContext';

interface Message {
  content: string;
  date: string;
}

type NavProp = CompositeNavigationProp<
  NativeStackNavigationProp<FavoritesStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;

export default function MissedMessages() {
  const [missedMessages, setMissedMessages] = useState<Message[]>([]);
  const [visibleMonth, setVisibleMonth] = useState('');
  const [showMonthIndicator, setShowMonthIndicator] = useState(false);
  const monthTimerRef = useRef<any>(null);
  const navigation = useNavigation<NavProp>();
  const { resolvedTheme: theme } = useTheme();

  const colors = {
    background: theme === 'dark' ? '#121212' : '#ffffff',
    subtle: theme === 'dark' ? '#bbbbbb' : '#666666',
  };

  useFocusEffect(useCallback(() => {
    loadMissedMessages();
  }, []));

  const loadMissedMessages = async () => {
    const openedRaw = await AsyncStorage.getItem('discovered_messages');
    const opened: Message[] = openedRaw ? JSON.parse(openedRaw) : [];
    const openedDates = opened.map(m => m.date);
    const today = new Date().toISOString().split('T')[0];
    const missed = messagesData.filter(m => m.date < today && !openedDates.includes(m.date));
    setMissedMessages(missed.reverse());
  };

  const openMessage = async (message: Message) => {
    const discoveredRaw = await AsyncStorage.getItem('discovered_messages');
    const discovered: Message[] = discoveredRaw ? JSON.parse(discoveredRaw) : [];
    const updated = [...discovered, message];
    await AsyncStorage.setItem('discovered_messages', JSON.stringify(updated));
    await AsyncStorage.setItem('last_message', JSON.stringify(message));
    // Supprime de la liste immédiatement
    setMissedMessages(prev => prev.filter(m => m.date !== message.date));
    navigation.navigate('OpenedMessages');
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const firstItem = viewableItems[0].item as Message;
      const date = new Date(firstItem.date);
      const month = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      setVisibleMonth(month.charAt(0).toUpperCase() + month.slice(1));
      setShowMonthIndicator(true);
      if (monthTimerRef.current) clearTimeout(monthTimerRef.current);
      monthTimerRef.current = setTimeout(() => setShowMonthIndicator(false), 1500);
    }
  }).current;

  const renderItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={[styles.card, {
        backgroundColor: theme === 'dark' ? '#b52d7133' : '#f7639428',
        borderColor: theme === 'dark' ? '#b52d71eb' : '#c82d60',
        borderWidth: 1.5,
      }]}
      onPress={() => openMessage(item)}
    >
      <Text style={{ fontSize: 40, marginBottom: 10 }}>💌</Text>
      <Text style={[styles.date, { color: colors.subtle, textAlign: 'center' }]}>{formatDate(item.date)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {missedMessages.length === 0 ? (
        <Text style={[styles.empty, { color: colors.subtle }]}>
          Tu n'as rien manqué pour l'instant 🥳
        </Text>
      ) : (
        <FlatList
          data={missedMessages}
          renderItem={renderItem}
          keyExtractor={(item) => item.date}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          ListHeaderComponent={
            <Text style={[styles.title, { color: theme === 'dark' ? '#ffffff' : '#880e4f' }]}>
              Tu m'aimes plus ? 🥺
            </Text>
          }
        />
      )}
      {showMonthIndicator && (
        <View style={[styles.monthIndicator, { backgroundColor: theme === 'dark' ? '#cd0f5bcc' : '#880e4fcc' }]}>
          <Text style={styles.monthIndicatorText}>{visibleMonth}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  gridContainer: {
    padding: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
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
  monthIndicator: {
    position: 'absolute',
    right: 16,
    top: '50%',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  monthIndicatorText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});