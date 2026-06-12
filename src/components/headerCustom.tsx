import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Platform, StatusBar, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useMessage } from '../context/MessageContext';

export default function HeaderCustom({ hideBanner = false }: { hideBanner?: boolean }) {
  const { hasNewMessage } = useMessage();
  const { resolvedTheme: theme } = useTheme();
  const navigation = useNavigation();

  return (
    <>
      <View style={[styles.header, { backgroundColor: theme === 'dark' ? '#121212' : '#ffffff', borderBottomColor: theme === 'dark' ? '#333' : '#ccc' }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Accueil' as never)}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      {!hideBanner && hasNewMessage && (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Accueil' as never)}
          style={{
            backgroundColor: theme === 'dark' ? '#f79eae' : '#e31e7a8a',
            padding: 10,
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: theme === 'dark' ? '#be2145' : '#d32a55',
          }}
        >
          <Text style={{ color: theme === 'dark' ? '#141413' : '#ffffff', fontWeight: '600' }}>
            ❤️ Ton mot du jour t'attend mon chéri ! ❤️
          </Text>
        </TouchableOpacity>
      )}
    </>
);
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 20 : 30,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  logo: {
    width: 100,
    height: 50,
  },
}); 