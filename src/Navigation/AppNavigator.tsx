import React, { useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Home from '../pages/Home';
import Favorites from '../pages/Favorites';
import { OpenedMessages } from '../pages/OpenedMessages';
import DiscoveredMessages from '../pages/DiscoveredMessages';
import MissedMessages from '../pages/MissedMessages';
import Settings from '../pages/Settings';
import HeaderCustom from '../components/headerCustom';
import { useTheme } from '../context/ThemeContext';

export type HomeStackParamList = {
  Home: undefined;
  OpenedMessages: undefined;
  MissedMessages: undefined;
};

export type FavoritesStackParamList = {
  Favorites: undefined;
  MissedMessages: undefined;
  OpenedMessages: { messages: { content: string; date: string }[]; currentIndex: number };
};

export type DiscoveredStackParamList = {
  DiscoveredMessages: undefined;
  OpenedMessages: { messages: { content: string; date: string }[]; currentIndex: number };
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type RootTabParamList = {
  Accueil: undefined;
  Favoris: undefined;
  Messages: undefined;
  Paramètres: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const FavoritesStack = createNativeStackNavigator<FavoritesStackParamList>();
const DiscoveredStack = createNativeStackNavigator<DiscoveredStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator id={undefined} screenOptions={{ header: () => <HeaderCustom hideBanner={true} />, animation: 'fade' }}>
      <HomeStack.Screen name="Home" component={Home} />
      <HomeStack.Screen name="OpenedMessages" component={OpenedMessages} options={{ header: () => <HeaderCustom /> }} />
      <HomeStack.Screen name="MissedMessages" component={MissedMessages} options={{ header: () => <HeaderCustom /> }} />
    </HomeStack.Navigator>
  );
}

function FavoritesStackNavigator() {
  return (
    <FavoritesStack.Navigator id={undefined} screenOptions={{ header: () => <HeaderCustom />, animation: 'fade' }}>
      <FavoritesStack.Screen name="Favorites" component={Favorites} />
      <FavoritesStack.Screen name="MissedMessages" component={MissedMessages} />
      <FavoritesStack.Screen name="OpenedMessages" component={OpenedMessages} />
    </FavoritesStack.Navigator>
  );
}

function DiscoveredStackNavigator() {
  return (
    <DiscoveredStack.Navigator id={undefined} screenOptions={{ header: () => <HeaderCustom />, animation: 'fade' }}>
      <DiscoveredStack.Screen name="DiscoveredMessages" component={DiscoveredMessages} />
      <DiscoveredStack.Screen name="OpenedMessages" component={OpenedMessages} options={{ header: () => <HeaderCustom hideBanner={true} /> }} />
    </DiscoveredStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator id={undefined} screenOptions={{ header: () => <HeaderCustom />, animation: 'fade' }}>
      <SettingsStack.Screen name="Settings" component={Settings} />
    </SettingsStack.Navigator>
  );
}

export default function AppNavigator() {
  const { resolvedTheme: theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
  headerShown: false,
  unmountOnBlur: true,
  tabBarStyle: {
    backgroundColor: theme === 'dark' ? '#121212' : '#ffffff',
    borderTopColor: theme === 'dark' ? '#333' : '#ccc',
  },
        tabBarActiveTintColor: theme === 'dark' ? '#ca2e7ceb' : '#ca2e7ceb',
        tabBarInactiveTintColor: theme === 'dark' ? '#de7fad8e' : '#dc1a786b',
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Accueil: 'home-outline',
            Favoris: 'heart-outline',
            Messages: 'mail-outline',
            Paramètres: 'settings-outline',
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeStackNavigator} />
      <Tab.Screen name="Favoris" component={FavoritesStackNavigator} />
      <Tab.Screen name="Messages" component={DiscoveredStackNavigator} />
      <Tab.Screen name="Paramètres" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}