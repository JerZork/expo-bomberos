import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, Pressable, StatusBar, Modal } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// Solo UI: sin lógica de submit ni autenticación.
// Inspirado en el Login.jsx web y la imagen referencial, adaptado a móvil con NativeWind.

const baseUsers = [
  {
    name: 'Admin Principal',
    email: 'admin@example.com',
    run: '1.234.567-4',
    password: 'user1234',
    role: 'Administrador',
    description: 'Usuario administrador con acceso total al sistema',
  },
  {
    name: 'Juan Andrés Pérez',
    email: 'editor.juan@example.com',
    run: '12.345.678-5',
    password: 'user1234',
    role: 'Supervisor',
    description: 'Usuario supervisor con permisos limitados',
  },
  {
    name: 'Ana Lucia López',
    email: 'ana.lopez@example.com',
    run: '18.765.432-7',
    password: 'user1234',
    role: 'Usuario',
    description: 'Usuario básico (Nota: Este usuario está inactivo)',
  },
];

export default function LoginScreen() {
  const [showBaseUsers, setShowBaseUsers] = useState(false);
  const [run, setRun] = useState('');
  const [password, setPassword] = useState('');

  const selectBaseUser = (user) => {
    setRun(user.run);
    setPassword(user.password);
    setShowBaseUsers(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 pt-16 pb-10 ">
          {/* Contenedor principal */}
          <View className="w-full max-w-lg self-center">
            {/* Encabezado */}
              {/* Icono superior */}
              <View className="items-center mb-6">
                <View className="h-20 w-20 rounded-full bg-orange-500 items-center justify-center">
                  <MaterialCommunityIcons name="fire" size={40} color="#fff" />
                </View>
              </View>

              {/* Títulos */}
              <View className="items-center">
                <Text className="text-4xl sm:text-5xl font-extrabold text-orange-600 mb-2 tracking-tight text-center">Sistema Bomberos</Text>
                <Text className="text-gray-600 text-base text-center">
                  Accede al sistema de gestión de emergencias
                </Text>
              </View>

              {/* RUN */}
              <View className="mt-8">
                <Text className="text-sm font-semibold text-gray-700">
                  RUT <Text className="text-rose-500">*</Text>
                </Text>
                <View className="mt-3 flex-row items-center rounded-2xl border border-blue-100 bg-blue-50">
                  <View className="h-16 w-16 items-center justify-center">
                    <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#64748B" />
                  </View>
                  <TextInput
                    className="flex-1 h-16 pr-4 text-gray-900 text-lg"
                    placeholder="12.345.678-9"
                    placeholderTextColor="#94A3B8"
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={run}
                    onChangeText={setRun}
                  />
                </View>
              </View>

              {/* Contraseña */}
              <View className="mt-4">
                <Text className="text-sm font-semibold text-gray-700">
                  Contraseña <Text className="text-rose-500">*</Text>
                </Text>
                <View className="mt-3 flex-row items-center rounded-2xl border border-blue-100 bg-blue-50">
                  <View className="h-16 w-16 items-center justify-center">
                    <MaterialCommunityIcons name="lock" size={24} color="#64748B" />
                  </View>
                  <TextInput
                    className="flex-1 h-16 pr-4 text-gray-900 text-lg"
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable className="h-16 w-16 items-center justify-center">
                    <Ionicons name="eye-outline" size={22} color="#94A3B8" />
                  </Pressable>
                </View>
              </View>

              {/* Botón ingresar deshabilitado visualmente (sin acción) */}
              <Pressable
                accessibilityRole="button"
                className="mt-8 h-16 rounded-2xl items-center justify-center bg-gray-200"
                // onPress={undefined} // sin lógica
              >
                <Text className="text-gray-500 font-bold text-base">Iniciar sesión</Text>
              </Pressable>

              {/* Ayuda */}
              <View className="mt-5 items-center">
                <Text className="text-[13px] text-gray-500 text-center">
                  ¿No tienes cuenta o se te olvidaron tus credenciales?{"\n"}
                  Contacta al administrador: <Text className="text-rose-600 underline">admin@bomberos.cl</Text>
                </Text>
              </View>

            {/* Botón "Usar usuario base" */}
            <Pressable
              accessibilityRole="button"
              className="mt-7 h-14 rounded-2xl items-center justify-center bg-white border border-indigo-200 shadow-sm flex-row"
              onPress={() => setShowBaseUsers(true)}
            >
              <MaterialCommunityIcons name="account" size={18} color="#4338CA" />
              <Text className="ml-2 text-indigo-700 font-semibold text-base">Usar usuario base para pruebas</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Modal de usuarios base */}
      <Modal
        visible={showBaseUsers}
        animationType="fade"
        transparent
        onRequestClose={() => setShowBaseUsers(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 items-center justify-center px-4"
          onPress={() => setShowBaseUsers(false)}
        >
          <Pressable
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <View className="flex-row items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-slate-50">
              <View className="flex-row items-center flex-1">
                <View className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="account" size={22} color="#fff" />
                </View>
                <Text className="text-xl font-bold text-slate-800 flex-1">Usuarios Base para Pruebas</Text>
              </View>
              <Pressable
                onPress={() => setShowBaseUsers(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Contenido */}
            <ScrollView className="p-6 max-h-[60vh]">
              <Text className="text-gray-600 mb-6">
                Selecciona uno de los usuarios predefinidos para iniciar sesión rápidamente:
              </Text>

              <View className="space-y-4">
                {baseUsers.map((user, index) => (
                  <Pressable
                    key={index}
                    className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-5 active:border-blue-300"
                    onPress={() => selectBaseUser(user)}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        {/* Header del usuario */}
                        <View className="flex-row items-center mb-3">
                          <View
                            className={`h-10 w-10 rounded-xl items-center justify-center mr-3 ${
                              user.role === 'Administrador'
                                ? 'bg-red-500'
                                : user.role === 'Supervisor'
                                ? 'bg-orange-500'
                                : 'bg-green-500'
                            }`}
                          >
                            <MaterialCommunityIcons name="account" size={20} color="#fff" />
                          </View>
                          <View className="flex-1">
                            <Text className="font-bold text-gray-900 text-base">{user.name}</Text>
                            <View
                              className={`self-start px-3 py-1 rounded-full mt-1 ${
                                user.role === 'Administrador'
                                  ? 'bg-red-100'
                                  : user.role === 'Supervisor'
                                  ? 'bg-orange-100'
                                  : 'bg-green-100'
                              }`}
                            >
                              <Text
                                className={`text-xs font-semibold ${
                                  user.role === 'Administrador'
                                    ? 'text-red-700'
                                    : user.role === 'Supervisor'
                                    ? 'text-orange-700'
                                    : 'text-green-700'
                                }`}
                              >
                                {user.role}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <Text className="text-gray-600 mb-4 text-sm leading-relaxed">{user.description}</Text>

                        {/* Detalles */}
                        <View className="space-y-2">
                          <View className="flex-row items-center">
                            <View className="h-2 w-2 bg-blue-400 rounded-full mr-2" />
                            <Text className="font-medium text-gray-700 text-sm">Email: </Text>
                            <Text className="text-gray-600 text-sm flex-1" numberOfLines={1}>
                              {user.email}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <View className="h-2 w-2 bg-slate-400 rounded-full mr-2" />
                            <Text className="font-medium text-gray-700 text-sm">RUT: </Text>
                            <Text className="text-gray-600 text-sm">{user.run}</Text>
                          </View>
                          <View className="flex-row items-center">
                            <View className="h-2 w-2 bg-purple-400 rounded-full mr-2" />
                            <Text className="font-medium text-gray-700 text-sm">Contraseña: </Text>
                            <View className="bg-gray-100 px-2 py-1 rounded-md">
                              <Text className="text-gray-600 text-sm">{user.password}</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Botón seleccionar */}
                      <View className="ml-4">
                        <View className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                          <View className="flex-row items-center">
                            <Text className="text-white text-sm font-semibold mr-1">Seleccionar</Text>
                            <Ionicons name="arrow-forward" size={14} color="#fff" />
                          </View>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Footer */}
            <View className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="h-8 w-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-sm">💡</Text>
                  </View>
                  <Text className="text-sm text-gray-600 flex-1">
                    <Text className="font-semibold text-gray-800">Tip:</Text> Estos usuarios se crean automáticamente en el initialSetup
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowBaseUsers(false)}
                  className="px-6 py-2 bg-white/50 rounded-xl active:bg-white"
                >
                  <Text className="text-gray-600 font-medium">Cancelar</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
