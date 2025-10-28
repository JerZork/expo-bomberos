import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/authService';

export default function ProfileScreen({ onLogout }) {
  const handleLogout = async () => {
    await authService.logout();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 p-5">
        <Text className="text-3xl font-bold text-gray-800 mb-2">Perfil</Text>
        <Text className="text-base text-gray-600 mb-5">Información del bombero</Text>
        
        <View className="bg-white p-4 rounded-lg mb-3 shadow-sm">
          <Text className="text-sm text-gray-500 mb-1">Nombre:</Text>
          <Text className="text-lg text-gray-800 font-semibold">Usuario Bombero</Text>
        </View>

        <View className="bg-white p-4 rounded-lg mb-3 shadow-sm">
          <Text className="text-sm text-gray-500 mb-1">Compañía:</Text>
          <Text className="text-lg text-gray-800 font-semibold">Compañía #1</Text>
        </View>

        <View className="bg-white p-4 rounded-lg mb-3 shadow-sm">
          <Text className="text-sm text-gray-500 mb-1">Cargo:</Text>
          <Text className="text-lg text-gray-800 font-semibold">Bombero Activo</Text>
        </View>

        <TouchableOpacity 
          className="bg-red-600 p-4 rounded-lg mt-5 items-center"
          onPress={handleLogout}
        >
          <Text className="text-white text-base font-semibold">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
