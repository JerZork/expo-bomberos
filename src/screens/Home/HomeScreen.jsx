// HomeScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar'; // <- usamos el de Expo
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useCompaniaConfig } from '../../hooks/useCompaniaConfig';
import { authService } from '../../services/authService';


const STATUS_BAR_COLOR = '#b01c1c';    
const STATUS_ICON_STYLE = 'light';       

export default function HomeScreen({ onLogout }) {
  const insets = useSafeAreaInsets();
  const { loading: configLoading, getConfigValue } = useCompaniaConfig();
  const [user, setUser] = useState(null);

  // Estado simulado
  const [isConnected] = useState(false);
  const [activeBomberos] = useState('--');
  const [connectionError] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const u = await authService.getUserData();
      if (mounted) setUser(u);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const companyName = getConfigValue('company_name', 'Bomberos de Chile');
  const companyCity = getConfigValue('company_city', 'Chile');
  const companyRegion = getConfigValue('company_region', '');
  const companyFoundedYear = getConfigValue('company_founded_year', '');

  const handleLogout = async () => {
    try {
      await authService.logout();
      if (typeof onLogout === 'function') onLogout();
    } catch (e) {
      Alert.alert('Error', 'No se pudo cerrar sesión. Intenta nuevamente.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#b01c1c]" edges={['top']}>
      {/* iOS: pintamos el área segura superior para simular el fondo de la status bar */}
      <View
        style={{
          height: insets.top,
          backgroundColor: STATUS_BAR_COLOR, // 🔴 <--- MISMO COLOR
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}
      />

      {/* Android: color real + estilo de iconos. iOS: solo iconos. */}
      <ExpoStatusBar
        style={STATUS_ICON_STYLE}           // 🔧 'light' o 'dark' -> color de íconos
        backgroundColor={STATUS_BAR_COLOR}  // 🔴 <--- MISMO COLOR (Android)
        translucent={false}
        animated
      />

      {/* Hero */}
      <View style={{ position: 'relative', overflow: 'hidden' }}>
        <LinearGradient
           colors={["#dc2626", "#ea580c"]}  // usamos el color arriba para continuidad
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ paddingHorizontal: 24, paddingTop: 15, paddingBottom: 12 }}
        >
          <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)' }} />

          {/* Botón salir */}
          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            className="absolute right-4 h-10 px-3 rounded-xl bg-white/15 border border-white/25 items-center justify-center"
            style={{ top: Math.max(8, 20) }}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="logout" size={18} color="#fff" />
              <Text className="text-white ml-2 font-medium">Salir</Text>
            </View>
          </Pressable>

          <View className="items-center">
            <View className="h-16 w-16 items-center justify-center mb-3">
              <MaterialIcons name="local-fire-department" size={56} color="#fff" />
            </View>
            <Text className="text-white text-4xl font-extrabold mb-2">
              {configLoading ? 'Cargando...' : companyName}
            </Text>
            <Text className="text-red-100 text-base mb-3">
              {user ? (
                <>¡Bienvenido/a de vuelta, <Text className="font-semibold">{user.nombres}</Text>!</>
              ) : (
                'Sistema de Gestión para Cuerpos de Bomberos'
              )}
            </Text>
            {!configLoading && (companyCity || companyRegion) ? (
              <View className="items-center mb-2">
                <View className="flex-row items-center">
                  <MaterialIcons name="location-on" size={18} color="#fecaca" />
                  <Text className="text-red-100 ml-1">
                    {companyCity}
                    {companyRegion ? `, ${companyRegion}` : ''}
                  </Text>
                </View>
                {companyFoundedYear ? (
                  <View className="flex-row items-center mt-1">
                    <MaterialIcons name="calendar-today" size={16} color="#fecaca" />
                    <Text className="text-red-100 ml-1">Fundado en {companyFoundedYear}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </View>

      <ScrollView className="flex-1 bg-slate-100" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pt-6">
          {/* Estado del sistema */}
          <Text className="text-2xl font-bold text-center text-slate-900 mb-6">Estado del Sistema</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Personal Disponible */}
            <View className="bg-white rounded-xl p-5 shadow-lg border border-slate-200" style={{ flex: 1 }}>
              <View className="flex-col items-center">
                <MaterialIcons name="group" size={32} color="#16a34a" />
                <Text className="text-slate-600 text-xs font-medium mt-2 text-center">Personal Disponible</Text>
                <Text className="text-green-600 text-2xl font-bold mt-1">--</Text>
              </View>
            </View>

            {/* Bomberos Conectados */}
            <View className="bg-white rounded-xl p-5 shadow-lg border border-slate-200" style={{ flex: 1 }}>
              <View className="flex-col items-center">
                <MaterialIcons name="people" size={32} color={isConnected ? '#2563eb' : '#9ca3af'} />
                <Text className="text-slate-600 text-xs font-medium mt-2 text-center">Bomberos Conectados</Text>
                <Text
                  className={`text-2xl font-bold mt-1 ${isConnected ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {isConnected ? activeBomberos : '--'}
                </Text>
                {isConnected ? <Text className="text-green-600 text-[11px] mt-1">● En línea</Text> : null}
                {!isConnected && !connectionError ? (
                  <Text className="text-orange-600 text-[11px] mt-1">● Conectando...</Text>
                ) : null}
                {connectionError ? <Text className="text-red-600 text-[11px] mt-1">● Error de conexión</Text> : null}
              </View>
            </View>
          </View>
        </View>

        {/* Información de Contacto */}
        {!configLoading ? (
          <View className="px-4 mt-6">
            <View className="bg-white rounded-xl shadow-lg border border-slate-200 p-5">
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="business" size={22} color={STATUS_BAR_COLOR} />
                <Text className="text-slate-900 text-xl font-bold ml-2">Información de Contacto</Text>
              </View>

              <View>
                {getConfigValue('company_address') ? (
                  <View className="flex-row items-center mt-2">
                    <MaterialIcons name="location-on" size={18} color="#6b7280" />
                    <Text className="text-slate-700 ml-2">{getConfigValue('company_address')}</Text>
                  </View>
                ) : null}
                {getConfigValue('company_phone') ? (
                  <View className="flex-row items-center mt-2">
                    <MaterialIcons name="phone" size={18} color="#6b7280" />
                    <Text className="text-slate-700 ml-2">{getConfigValue('company_phone')}</Text>
                  </View>
                ) : null}
                {getConfigValue('company_email') ? (
                  <View className="flex-row items-center mt-2">
                    <MaterialIcons name="email" size={18} color="#6b7280" />
                    <Text className="text-slate-700 ml-2">{getConfigValue('company_email')}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        <View className="items-center mt-12 px-4">
          <Text className="text-slate-500 text-center">
            © {new Date().getFullYear()} {companyName}. Sistema de Gestión para Cuerpos de Bomberos.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
