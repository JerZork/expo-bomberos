import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, Pressable, StatusBar, Modal, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/authService';
import { formatRutForDisplay, formatRutForAPI, isValidRut, getRutErrorMessage } from '../../helpers/rutFormatter';
import apiClient from '../../services/api';

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

export default function LoginScreen({ onLoginSuccess }) {
  const [showBaseUsers, setShowBaseUsers] = useState(false);
  const [run, setRun] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ run: '', password: '' });

  // Manejar cambio de RUT con formateo automático
  const handleRunChange = (text) => {
    const formatted = formatRutForDisplay(text);
    setRun(formatted);
    if (errors.run) setErrors({ ...errors, run: '' });
  };

  // Manejar inicio de sesión
  const handleLogin = async () => {
    // Resetear errores
    setErrors({ run: '', password: '' });

    // Validaciones
    let hasErrors = false;
    const newErrors = { run: '', password: '' };

    // Validar RUT usando el helper
    const rutError = getRutErrorMessage(run);
    if (rutError) {
      newErrors.run = rutError;
      hasErrors = true;
    }

    if (!password.trim()) {
      newErrors.password = 'La contraseña es requerida';
      hasErrors = true;
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // Formatear RUT para enviar a la API (sin puntos, solo guión)
    const formattedRutForAPI = formatRutForAPI(run);

    // Intentar iniciar sesión
    setIsLoading(true);
    try {
      const response = await authService.login(formattedRutForAPI, password);

      // Éxito -> informar al contenedor (App) para navegar a Home
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(response);
      }
      
      // Mensaje opcional de éxito
      Alert.alert('Inicio de sesión exitoso', `Bienvenido ${response.user?.nombres || 'Usuario'}`);
    } catch (error) {
      console.error('Error en login:', error);
      
      let errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      
      if (error.response) {
        // El servidor respondió con un error
        switch (error.response.status) {
          case 401:
            errorMessage = 'RUT o contraseña incorrectos';
            break;
          case 403:
            errorMessage = 'Usuario inactivo o sin permisos';
            break;
          case 404:
            errorMessage = 'Usuario no encontrado';
            break;
          case 500:
            errorMessage = 'Error del servidor. Intenta más tarde.';
            break;
          default:
            errorMessage = error.response.data?.message || 'Error al iniciar sesión';
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión WiFi y que el backend esté corriendo.';
      }

      Alert.alert('Error de autenticación', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const selectBaseUser = (user) => {
    // Formatear el RUT automáticamente al seleccionar
    setRun(formatRutForDisplay(user.run));
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
                <View className={`mt-3 flex-row items-center rounded-2xl border ${errors.run ? 'border-rose-300 bg-rose-50' : 'border-blue-100 bg-blue-50'}`}>
                  <View className="h-16 w-16 items-center justify-center">
                    <MaterialCommunityIcons name="card-account-details-outline" size={24} color={errors.run ? "#F43F5E" : "#64748B"} />
                  </View>
                  <TextInput
                    className="flex-1 h-16 pr-4 text-gray-900 text-lg"
                    placeholder="12.345.678-9"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={run}
                    onChangeText={handleRunChange}
                    editable={!isLoading}
                    maxLength={12}
                  />
                </View>
                {errors.run ? (
                  <Text className="text-rose-600 text-xs mt-1 ml-1">{errors.run}</Text>
                ) : null}
              </View>

              {/* Contraseña */}
              <View className="mt-4">
                <Text className="text-sm font-semibold text-gray-700">
                  Contraseña <Text className="text-rose-500">*</Text>
                </Text>
                <View className={`mt-3 flex-row items-center rounded-2xl border ${errors.password ? 'border-rose-300 bg-rose-50' : 'border-blue-100 bg-blue-50'}`}>
                  <View className="h-16 w-16 items-center justify-center">
                    <MaterialCommunityIcons name="lock" size={24} color={errors.password ? "#F43F5E" : "#64748B"} />
                  </View>
                  <TextInput
                    className="flex-1 h-16 pr-4 text-gray-900 text-lg"
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    editable={!isLoading}
                  />
                  <Pressable 
                    className="h-16 w-16 items-center justify-center"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94A3B8" />
                  </Pressable>
                </View>
                {errors.password ? (
                  <Text className="text-rose-600 text-xs mt-1 ml-1">{errors.password}</Text>
                ) : null}
              </View>

              {/* Botón ingresar */}
              <Pressable
                accessibilityRole="button"
                className={`mt-8 h-16 rounded-2xl items-center justify-center ${
                  isLoading ? 'bg-orange-300' : 'bg-orange-500 active:bg-orange-600'
                }`}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-white font-bold text-base ml-2">Iniciando sesión...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-bold text-base">Iniciar sesión</Text>
                )}
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
            <View className="flex-row items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
              <View className="flex-row items-center flex-1">
                <LinearGradient
                  colors={["#3b82f6", "#9333ea"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 40, width: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                >
                  <MaterialCommunityIcons name="account" size={22} color="#fff" />
                </LinearGradient>
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
                    className="bg-white border border-gray-200 rounded-2xl p-5 active:border-blue-300"
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
                        <LinearGradient
                          colors={["#2563eb", "#9333ea"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                        >
                          <View className="flex-row items-center">
                            <Text className="text-white text-sm font-semibold mr-1">Seleccionar</Text>
                            <Ionicons name="arrow-forward" size={14} color="#fff" />
                          </View>
                        </LinearGradient>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Footer */}
            <View className="p-6 border-t border-gray-200 bg-gray-50">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <LinearGradient
                    colors={["#fb923c", "#f97316"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: 32, width: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                  >
                    <Text className="text-sm">💡</Text>
                  </LinearGradient>
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
