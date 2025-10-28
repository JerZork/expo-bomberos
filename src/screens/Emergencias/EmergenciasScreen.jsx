import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmergenciasScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 p-5">
        <Text className="text-3xl font-bold text-gray-800 mb-2">Emergencias</Text>
        <Text className="text-base text-gray-600 mb-5">Listado de emergencias activas</Text>
        
        <View className="bg-white p-4 rounded-lg mb-3 shadow-sm">
          <Text className="text-base text-gray-800">🚒 Incendio - Calle Principal #123</Text>
        </View>
        
        <View className="bg-white p-4 rounded-lg mb-3 shadow-sm">
          <Text className="text-base text-gray-800">🚑 Accidente - Av. Libertador #456</Text>
        </View>
        
        <View className="bg-white p-4 rounded-lg mb-3 shadow-sm">
          <Text className="text-base text-gray-800">⚠️ Rescate - Sector Norte</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
