// src/navigation/AppNavigator.tsx

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import Home from '../pages/Home';
import Favorites from '../pages/Favorites';
import NewMessage from '../pages/NewMessage';
import OpenedMessage from '../pages/OpenedMessages';
import DiscoveredMessages from '../pages/DiscoveredMessages';
import Settings from '../pages/Settings';
import HeaderCustom from '../components/headerCustom';
import MissedMessages from '../pages/MissedMessages';

export type RootStackParamList = {
  Home: undefined;
  Favorites: undefined;
  NewMessage: undefined;
  OpenedMessage: {
    messageData?: undefined;
    fromFavorites?: boolean;
  };
  DiscoveredMessages: undefined;
  Settings: undefined;
  MissedMessages: undefined;
};

export type DrawerParamList = {
  MainStack: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// Mapping des routes Stack vers les labels du drawer
const ROUTE_TO_DRAWER_LABEL: { [key: string]: string } = {
  'Home': 'Accueil',
  'OpenedMessage': 'Message du Jour',
  'Favorites': 'Favoris',
  'DiscoveredMessages': 'Tous les Messages',
  'Settings': 'Paramètres',
};

// Composant pour synchroniser le drawer avec la navigation
function DrawerContent({ navigation, state }: any) {
  const navigationState = useNavigationState(navState => navState);
  
  // Fonction pour trouver la route active dans le stack
  const getActiveRoute = (navState: any): string => {
    if (!navState) return 'Home';
    
    let currentState = navState;
    while (currentState.routes && currentState.routes[currentState.index]) {
      const activeRoute = currentState.routes[currentState.index];
      if (activeRoute.state) {
        currentState = activeRoute.state;
      } else {
        return activeRoute.name;
      }
    }
    return 'Home';
  };

  const activeRouteName = getActiveRoute(navigationState);
  const activeLabel = ROUTE_TO_DRAWER_LABEL[activeRouteName] || 'Accueil';

  const menuItems = [
    { label: 'Accueil', route: 'Home' },
    { label: 'Favoris', route: 'Favorites' },
    { label: 'Tous les Messages', route: 'DiscoveredMessages' },
    { label: 'Paramètres', route: 'Settings' },
  ];

  return (
    <View style={styles.drawerContainer}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={[
            styles.drawerItem,
            activeLabel === item.label && styles.activeDrawerItem
          ]}
          onPress={() => {
            navigation.navigate('MainStack', { screen: item.route });
            navigation.closeDrawer();
          }}
        >
          <Text style={[
            styles.drawerLabel,
            activeLabel === item.label && styles.activeDrawerLabel
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MainStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        header: () => <HeaderCustom />,
      }}
    >
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Favorites" component={Favorites} />
      <Stack.Screen name="OpenedMessage" component={OpenedMessage} />
      <Stack.Screen name="DiscoveredMessages" component={DiscoveredMessages} />
      <Stack.Screen name="Settings" component={Settings} />
      
      <Stack.Screen
        name="NewMessage"
        component={NewMessage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MissedMessages"
        component={MissedMessages}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{ 
        headerShown: false,
        drawerType: 'slide',
      }}
    >
      <Drawer.Screen 
        name="MainStack" 
        component={MainStackNavigator}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  drawerItem: {
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
  },
  activeDrawerItem: {
    backgroundColor: '#e3f2fd',
  },
  drawerLabel: {
    fontSize: 16,
    color: '#333',
  },
  activeDrawerLabel: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
});