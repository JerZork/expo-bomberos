import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, Pressable, StatusBar, Alert, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import logoSistema from '../../../assets/logo-sf.png';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/authService';
import { formatRutForDisplay, formatRutForAPI, isValidRut, getRutErrorMessage } from '../../helpers/rutFormatter';
import apiClient from '../../services/api';



export default function LoginScreen({ onLoginSuccess }) {
  const [run, setRun] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ run: '', password: '' });

  // Manejar cambio de RUT
  const handleRunChange = (text) => {
    // No formateamos en tiempo real para evitar bugs de duplicación en Android
    // Solo permitimos caracteres válidos (números, k, K, puntos y guión)
    const cleaned = text.replace(/[^0-9kK\.\-]/g, '');
    setRun(cleaned.toUpperCase());
    if (errors.run) setErrors({ ...errors, run: '' });
  };

  const handleRunBlur = () => {
    // Formatear al perder el foco
    if (run.length > 1) {
      const formatted = formatRutForDisplay(run);
      setRun(formatted);
    }
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
    } catch (error) {
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
              <Image
                source={logoSistema}
                style={{ width: 140, height: 140 }}
                resizeMode="contain"
              />
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
                  placeholder="12.345.678-K"
                  placeholderTextColor="#94A3B8"
                  keyboardType="default"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
                  textContentType="none"
                  value={run}
                  onChangeText={handleRunChange}
                  onBlur={handleRunBlur}
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
              className={`mt-8 h-16 rounded-2xl items-center justify-center ${isLoading ? 'bg-orange-300' : 'bg-orange-500 active:bg-orange-600'
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


          </View>
        </View>
      </ScrollView>


    </SafeAreaView >
  );
}
