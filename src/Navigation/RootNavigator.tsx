import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AppNavigator from './AppNavigator';
import Home from '../pages/Home';
import Favorites from '../pages/Favorites';
import NewMessage from '../pages/NewMessage';
import OpenedMessage from '../pages/OpenedMessages';
import DiscoveredMessages from '../pages/DiscoveredMessages';
import Settings from '../pages/Settings';

const Drawer = createDrawerNavigator();

export default function RootNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false, // le header custom est géré dans AppNavigator
      }}
    >
      <Drawer.Screen name="App" component={AppNavigator} options={{ title: 'Accueil' }} />
      <Drawer.Screen name="Favorites" component={Favorites} options={{ title: 'Mes Favoris' }} />
      <Drawer.Screen name="DiscoveredMessages" component={DiscoveredMessages} options={{ title: 'Messages découverts' }} />
      <Drawer.Screen name="Settings" component={Settings} options={{ title: 'Paramètres' }} />
    </Drawer.Navigator>
  );
}
