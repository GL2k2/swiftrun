import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import RunnerScreen from './src/screens/RunnerScreen';
import SpectatorScreen from './src/screens/SpectatorScreen';
import { COLORS } from './src/constants/theme';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack.Navigator 
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.background,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: COLORS.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            cardStyle: { backgroundColor: COLORS.background }
          }}
        >
          <Stack.Screen 
            name="Runner" 
            component={RunnerScreen} 
            options={{ title: 'SwiftRun - Modo Corredor' }}
          />
          <Stack.Screen 
            name="Spectator" 
            component={SpectatorScreen} 
            options={{ title: 'Seguimiento en Vivo' }}
          />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
