// src/navigation/AppNavigator.tsx

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../pages/Home';
import Favorites from '../pages/Favorites';
import NewMessage from '../pages/NewMessage';
import {OpenedMessages} from '../pages/OpenedMessages';
import DiscoveredMessages from '../pages/DiscoveredMessages';
import Settings from '../pages/Settings';
import HeaderCustom from '../components/headerCustom';

export type RootStackParamList = {
  Home: undefined;
  Favorites: undefined;
  NewMessage: undefined;
  OpenedMessages: undefined;
  DiscoveredMessages: undefined;

  Settings: undefined;
  MissedMessages: undefined;
};

export type DrawerParamList = {
  Accueil: undefined;
  'Message du Jour': undefined;
  Favoris: undefined;
  'Tous les Messages': undefined;
  Paramètres: undefined;
  MissedMessages: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

function MainStackNavigator(initialRoute: keyof RootStackParamList) {
  return () => (
    <Stack.Navigator
      id={undefined}
      initialRouteName={initialRoute}
      screenOptions={{
        header: () => <HeaderCustom />,
      }}
    >
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Favorites" component={Favorites} />
      <Stack.Screen name="OpenedMessages" component={OpenedMessages} />
      <Stack.Screen name="DiscoveredMessages" component={DiscoveredMessages} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen
        name="NewMessage"
        component={NewMessage}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Drawer.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Accueil" component={MainStackNavigator('Home')} />
      <Drawer.Screen name="Message du Jour" component={MainStackNavigator('OpenedMessages')} />
      <Drawer.Screen name="Favoris" component={MainStackNavigator('Favorites')} />
      <Drawer.Screen name="Tous les Messages" component={MainStackNavigator('DiscoveredMessages')} />
      <Drawer.Screen name="Paramètres" component={MainStackNavigator('Settings')} />
    </Drawer.Navigator>
  );
}
