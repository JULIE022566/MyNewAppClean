import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';

interface Message {
  content: string;
  date: string;
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<Message[]>([]);
  const [visibleMonth, setVisibleMonth] = useState('');
  const [showMonthIndicator, setShowMonthIndicator] = useState(false);
  const monthTimerRef = useRef<any>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { resolvedTheme: theme } = useTheme();

  const colors = {
    background: theme === 'dark' ? '#121212' : '#ffffff',
    text: theme === 'dark' ? '#ffffff' : '#222222',
    subtle: theme === 'dark' ? '#bbbbbb' : '#666666',
    iconColor: '#ea4b4b',
  };

  useFocusEffect(useCallback(() => {
    loadFavorites();
  }, []));

  const loadFavorites = async () => {
    const favRaw = await AsyncStorage.getItem('favorites');
    const favs: Message[] = favRaw ? JSON.parse(favRaw) : [];
    favs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFavorites(favs);
  };

  const openMessage = async (msg: Message, index: number) => {
  await AsyncStorage.setItem('last_message', JSON.stringify(msg));
  navigation.navigate('OpenedMessages', { messages: favorites, currentIndex: index });
};

  const toggleFavorite = async (msg: Message) => {
    const favRaw = await AsyncStorage.getItem('favorites');
    let favs: Message[] = favRaw ? JSON.parse(favRaw) : [];
    const isFav = favs.some((m) => m.date === msg.date);
    if (isFav) {
      favs = favs.filter((m) => m.date !== msg.date);
    } else {
      favs.push(msg);
    }
    await AsyncStorage.setItem('favorites', JSON.stringify(favs));
    loadFavorites();
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

  if (favorites.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}> 
      <Text style={[styles.emptyText, { color: colors.subtle }]}>
      Tu aimes pas mes petits mots espèce d'ingrat ?
        </Text>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: Message; index: number }) => (
    <TouchableOpacity
      style={[styles.item, {
        backgroundColor: theme === 'dark' ? '#b52d7133' : '#f7639428',
        borderColor: theme === 'dark' ? '#b52d71eb' : '#c82d60',
        borderWidth: 1.5,
      }]}
      onPress={() => openMessage(item, index)}
    >
      <Text style={[styles.content, { color: theme === 'dark' ? '#ffffff' : '#880e4f', fontWeight: 'bold' }]} numberOfLines={3}>
        {item.content}
      </Text>
      <Text style={[styles.date, { color: theme === 'dark' ? '#ffffff' : '#880e4f', fontSize: 10 }]}>
        {formatDate(item.date)}
      </Text>
      <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.icon}>
        <FontAwesome name="heart" size={20} color={colors.iconColor} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        ListHeaderComponent={
          <Text style={[styles.titleH1, { color: theme === 'dark' ? '#ffffff' : '#880e4f' }]}>
            Monsieur fait du favoritisme ?
          </Text>
        }
      />
      {showMonthIndicator && (
        <View style={[styles.monthIndicator, { backgroundColor: theme === 'dark' ? '#cd0f5bcc' : '#880e4fcc' }]}>
          <Text style={styles.monthIndicatorText}>{visibleMonth}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  titleH1: {
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  item: {
    borderRadius: 12,
    padding: 12,
    width: '48%',
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    fontSize: 15,
    textAlign: 'center',
  },
  date: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  icon: {
    marginTop: 8,
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