import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Alert } from 'react-native';

import './global.css'

export default function App() {
  const getAlert = ()=>{
    Alert.alert('Hola mundo');
  }
  return (
    <View style={styles.container}>
      <Text className="text-lime-400 text-4xl">Open up App.js to start working on your app!</Text>
      <Text className="text-red-500">Segundo texto de prueba</Text>
      <View className="mt-6 rounded-lg p-8 bg-indigo-500 shadow-lg shadow-indigo-500/50">
        <Text className="text-white">Dale click</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
