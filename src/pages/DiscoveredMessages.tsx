import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../Navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';

type SortMode = 'asc' | 'desc';

interface Message {
  content: string;
  date: string;
}

export default function DiscoveredMessages() {
  const [discoveredMessages, setDiscoveredMessages] = useState<Message[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('desc');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { resolvedTheme: theme } = useTheme();
  const [visibleMonth, setVisibleMonth] = useState<string>('');
  const [showMonthIndicator, setShowMonthIndicator] = useState(false);
  const monthTimerRef = useRef<any>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const colors = {
    background: theme === 'dark' ? '#121212' : '#ffffff',
    text: theme === 'dark' ? '#ffffff' : '#222222',
    subtle: theme === 'dark' ? '#bbbbbb' : '#666666',
    iconColor: '#ea4b4b',
  };

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  const loadData = async () => {
    const raw = await AsyncStorage.getItem('discovered_messages');
    const parsed: Message[] = raw ? JSON.parse(raw) : [];
    setDiscoveredMessages(parsed);

    const favRaw = await AsyncStorage.getItem('favorites');
    const favs: Message[] = favRaw ? JSON.parse(favRaw) : [];
    setFavorites(favs.map((f) => f.date));
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

  const getSortedMessages = () => {
    const copy = [...discoveredMessages];
    const sorted = copy.sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortMode === 'desc' ? diff : -diff;
    });
    if (!searchQuery.trim()) return sorted;
    return sorted.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const openMessage = async (msg: Message, index: number) => {
    await AsyncStorage.setItem('last_message', JSON.stringify(msg));
    navigation.navigate('OpenedMessages', { messages: getSortedMessages(), currentIndex: index });
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
    setFavorites(favs.map((f) => f.date));
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isFav = favorites.includes(item.date);
    return (
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
          <FontAwesome name={isFav ? 'heart' : 'heart-o'} size={20} color={colors.iconColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {discoveredMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.empty, { color: colors.subtle }]}>Tu attends quoi pour ouvrir mes mots ?</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
  <FlatList
    data={getSortedMessages()}
    renderItem={renderItem}
    keyExtractor={(item, index) => index.toString()}
    numColumns={2}
    columnWrapperStyle={styles.gridRow}
    contentContainerStyle={styles.gridContainer}
    showsVerticalScrollIndicator={true}
    onViewableItemsChanged={onViewableItemsChanged}
    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
    ListHeaderComponent={
      <View>
        <Text style={[styles.title, { color: theme === 'dark' ? '#ffffff' : '#880e4f' }]}>
          Bientôt 365 raisons de t'aimer
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between", marginBottom: 10 }}>
          <TouchableOpacity
            onPress={() => setFilterOpen(!filterOpen)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              backgroundColor: theme === 'dark' ? '#b52d71eb' : '#c82d60',
            }}
          >
            <Ionicons name="options-outline" size={18} color="#ffffff" />
            <Text style={{ marginLeft: 6, color: '#ffffff' }}>Filtre</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}>
            <Ionicons name="search" size={22} color={theme === 'dark' ? '#ffffff' : '#880e4f'} />
          </TouchableOpacity>

          {searchOpen && (
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '70%', marginLeft: 10 }}>
              <TextInput
                autoFocus
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher..."
                placeholderTextColor={colors.subtle}
                style={{
                  flex: 1,
                  borderBottomWidth: 1,
                  borderBottomColor: theme === 'dark' ? '#ffffff' : '#880e4f',
                  color: theme === 'dark' ? '#ffffff' : '#880e4f',
                  fontSize: 15,
                  paddingVertical: 2,
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  if (searchQuery.length > 0) {
                    setSearchQuery('');
                  } else {
                    setSearchOpen(false);
                  }
                }}
                style={{ marginRight: 20, padding: 5, borderColor: theme === 'dark' ? '#b52d71eb' : '#c82d60', borderWidth: 1.5, borderRadius: 10, marginLeft: 5 }}
              >
                <Ionicons name="close" size={20} color={theme === 'dark' ? '#ffffff' : '#880e4f'} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    }
  />

  {filterOpen && (
    <View
      style={{
        position: 'absolute',
        top: 90,
        left: 16,
        backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
        borderRadius: 10,
        padding: 10,
        elevation: 8,
        zIndex: 999,
        minWidth: 140,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <TouchableOpacity
        onPress={() => { setSortMode('desc'); setFilterOpen(false); }}
        style={{ paddingVertical: 5 }}
      >
        <Text style={{ color: theme === 'dark' ? '#fff' : '#000' }}>📅 Croissant</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => { setSortMode('asc'); setFilterOpen(false); }}
        style={{ paddingVertical: 5 }}
      >
        <Text style={{ color: theme === 'dark' ? '#fff' : '#000' }}>🥐 Des Croissants</Text>
      </TouchableOpacity>
    </View>
  )}

  {showMonthIndicator && (
    <View style={[styles.monthIndicator, { backgroundColor: theme === 'dark' ? '#cd0f5bcc' : '#880e4fcc' }]}>
      <Text style={styles.monthIndicatorText}>{visibleMonth}</Text>
    </View>
  )}
</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  gridContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 10,
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
  },
  empty: {
    fontSize: 16,
    textAlign: 'center',
  },
});