import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Switch,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import {
  getDisponibilidades,
  createDisponibilidad,
  cerrarDisponibilidad,
} from '../../services/disponibilidad.service';

/**
 * Screen de Disponibilidad para la app móvil
 * Permite a los bomberos marcar su disponibilidad y ver el personal disponible
 * Sin sockets - actualización manual con pull to refresh
 */
const DisponibilidadScreen = () => {
  // Estados principales
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Datos
  const [miDisponibilidad, setMiDisponibilidad] = useState(null);
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [stats, setStats] = useState({
    disponibles: 0,
    total: 0,
  });

  // Calcular estadísticas
  const calculateStats = (data) => {
    const dataArray = Array.isArray(data) ? data : [];
    
    // Filtrar disponibilidades activas (sin fechaTermino o fechaTermino futura)
    const activas = dataArray.filter((disponibilidad) => {
      if (!disponibilidad.fechaTermino) return true;
      try {
        return new Date(disponibilidad.fechaTermino) > new Date();
      } catch {
        return false;
      }
    });

    // Eliminar duplicados por bombero, mantener la más reciente
    const uniqueActivas = activas.reduce((unique, disponibilidad) => {
      const existingIndex = unique.findIndex(d => d.idBombero === disponibilidad.idBombero);
      if (existingIndex === -1) {
        unique.push(disponibilidad);
      } else {
        const existing = unique[existingIndex];
        const currentDate = new Date(disponibilidad.fechaInicio);
        const existingDate = new Date(existing.fechaInicio);
        
        if (currentDate > existingDate) {
          unique[existingIndex] = disponibilidad;
        }
      }
      return unique;
    }, []);

    setStats({
      disponibles: uniqueActivas.length,
      total: dataArray.length,
    });
  };

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar usuario si no está cargado
      if (!user) {
        const userData = await authService.getUserData();
        setUser(userData);
      }

      // Cargar todas las disponibilidades
      const disponibilidadesData = await getDisponibilidades();
      const disponibilidadesArray = Array.isArray(disponibilidadesData) ? disponibilidadesData : [];
      setDisponibilidades(disponibilidadesArray);

      // Buscar mi disponibilidad activa
      if (user?.id) {
        const miDisp = disponibilidadesArray.find(d => 
          d.idBombero === user.id && (!d.fechaTermino || new Date(d.fechaTermino) > new Date())
        );
        setMiDisponibilidad(miDisp || null);
      }

      calculateStats(disponibilidadesArray);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de disponibilidad');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refrescar datos
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Cargar datos al montar
  useEffect(() => {
    const initUser = async () => {
      const userData = await authService.getUserData();
      setUser(userData);
    };
    initUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Obtener nombre del bombero
  const getBomberoNombre = (disponibilidad) => {
    if (disponibilidad?.bombero) {
      const { nombres, apellidos } = disponibilidad.bombero;
      return `${nombres} ${apellidos}`;
    }
    return `Bombero ID: ${disponibilidad.idBombero}`;
  };

  // Manejar acceso rápido
  const handleAccesoRapido = (valor) => {
    if (miDisponibilidad) {
      Alert.alert(
        'Disponibilidad Activa',
        'Ya tienes una disponibilidad activa. Ciérrala antes de crear una nueva.',
        [{ text: 'OK' }]
      );
      return;
    }

    let mensaje = '';
    if (valor === 0) {
      mensaje = '¿Activar disponibilidad inmediata sin hora de término?';
    } else if (typeof valor === 'string') {
      mensaje = `¿Crear disponibilidad hasta las ${valor} de hoy?`;
    } else {
      mensaje = valor === 24 
        ? '¿Crear disponibilidad por 24 horas (1 día completo)?' 
        : `¿Crear disponibilidad por ${valor} horas?`;
    }

    Alert.alert(
      'Confirmar Disponibilidad',
      mensaje,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => confirmarAccesoRapido(valor) },
      ]
    );
  };

  // Confirmar acceso rápido
  const confirmarAccesoRapido = async (valor) => {
    if (!user?.id) {
      Alert.alert('Error', 'Usuario no válido');
      return;
    }

    try {
      setSubmitting(true);
      
      const now = new Date();
      let fechaTermino = null;

      if (valor === 0) {
        // "Ahora" - sin fecha de término
        fechaTermino = null;
      } else if (typeof valor === 'string') {
        // Horario específico (22:00 o 06:00)
        const [horas, minutos] = valor.split(':').map(Number);
        const targetDate = new Date();
        targetDate.setHours(horas, minutos, 0, 0);
        
        // Si la hora ya pasó hoy, programar para mañana
        if (targetDate <= now) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
        
        fechaTermino = targetDate.toISOString();
      } else {
        // Número de horas
        const fechaTerminoDate = new Date(now.getTime() + valor * 60 * 60 * 1000);
        fechaTermino = fechaTerminoDate.toISOString();
      }
      
      const disponibilidadData = {
        idBombero: user.id,
        fechaInicio: now.toISOString(),
        ...(fechaTermino && { fechaTermino }),
      };

      await createDisponibilidad(disponibilidadData);
      
      let mensajeExito = '¡Disponibilidad activada!';
      if (valor === 0) {
        mensajeExito = '¡Disponibilidad activada sin límite de tiempo!';
      } else if (typeof valor === 'string') {
        mensajeExito = `¡Disponibilidad creada hasta las ${valor}!`;
      } else {
        mensajeExito = valor === 24 
          ? '¡Disponibilidad creada por 24 horas!' 
          : `¡Disponibilidad creada por ${valor} horas!`;
      }
      
      Alert.alert('¡Éxito!', mensajeExito);
      loadData();
    } catch (error) {
      console.error('Error al crear disponibilidad:', error);
      const errorMsg = error.message || error.details || 'No se pudo crear la disponibilidad';
      Alert.alert('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Cerrar disponibilidad
  const handleCerrarDisponibilidad = () => {
    Alert.alert(
      'Cerrar Disponibilidad',
      '¿Estás seguro que deseas cerrar tu disponibilidad actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar', style: 'destructive', onPress: confirmarCerrarDisponibilidad },
      ]
    );
  };

  const confirmarCerrarDisponibilidad = async () => {
    if (!user?.id) return;

    try {
      setSubmitting(true);
      await cerrarDisponibilidad({ idBombero: user.id });
      Alert.alert('¡Éxito!', 'Disponibilidad cerrada correctamente');
      loadData();
    } catch (error) {
      console.error('Error al cerrar disponibilidad:', error);
      const errorMsg = error.message || error.details || 'No se pudo cerrar la disponibilidad';
      Alert.alert('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Formatear fecha para mostrar
  const formatFecha = (fecha) => {
    if (!fecha) return 'Sin definir';
    const date = new Date(fecha);
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtener disponibilidades activas
  const getDisponibilidadesActivas = () => {
    return disponibilidades.filter(d => 
      !d.fechaTermino || new Date(d.fechaTermino) > new Date()
    );
  };

  // Toggle principal: activar/desactivar en servicio
  const toggleServicio = async (value) => {
    if (!user?.id) return;

    try {
      setSubmitting(true);
      if (value) {
        // Activar disponibilidad inmediata sin fecha de término
        await createDisponibilidad({
          idBombero: user.id,
          fechaInicio: new Date().toISOString(),
        });
        Alert.alert('En servicio', 'Tu disponibilidad fue activada.');
      } else {
        // Cerrar disponibilidad activa
        await cerrarDisponibilidad({ idBombero: user.id });
        Alert.alert('Fuera de servicio', 'Tu disponibilidad fue cerrada.');
      }
      loadData();
    } catch (error) {
      console.error('Error al cambiar estado de servicio:', error);
      const errorMsg = error.message || error.details || 'No se pudo cambiar tu estado';
      Alert.alert('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // (Historial removido en app móvil)

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <ActivityIndicator size="large" color="#d00" />
        <Text className="mt-4 text-gray-600">Cargando disponibilidades...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-2 pb-4">
        <View className="flex-row items-center">
          <Ionicons name="person-circle" size={32} color="#d00" />
          <Text className="ml-3 text-2xl font-bold text-gray-800">Disponibilidad</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#d00']}
            tintColor="#d00"
          />
        }
      >
        <View className="p-4">
            {/* Estadísticas */}
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <Text className="text-lg font-bold text-gray-800 mb-3">Personal Disponible</Text>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Ionicons name="people" size={32} color="#22c55e" />
                  <Text className="text-2xl font-bold text-gray-800 mt-1">
                    {stats.disponibles}
                  </Text>
                  <Text className="text-xs text-gray-500">Disponibles</Text>
                </View>
              </View>
            </View>

            {/* Switch principal: En servicio */}
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name={miDisponibilidad ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={miDisponibilidad ? '#22c55e' : '#64748b'} />
                  <Text className="ml-2 text-base font-bold text-gray-800">En servicio</Text>
                </View>
                <Switch
                  value={!!miDisponibilidad}
                  onValueChange={toggleServicio}
                  disabled={submitting || loading}
                  trackColor={{ false: '#d1d5db', true: '#22c55e' }}
                  thumbColor={'#ffffff'}
                />
              </View>
              {miDisponibilidad ? (
                <Text className="mt-2 text-xs text-gray-600">Activo desde {formatFecha(miDisponibilidad.fechaInicio)}</Text>
              ) : (
                <Text className="mt-2 text-xs text-gray-500">Activa el switch para ponerte en servicio</Text>
              )}
            </View>

            {/* Mi Disponibilidad */}
            {miDisponibilidad ? (
              <View className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  <Text className="ml-2 text-lg font-bold text-green-800">
                    Disponibilidad Activa
                  </Text>
                </View>
                <Text className="text-gray-700 mb-1">
                  <Text className="font-semibold">Inicio:</Text> {formatFecha(miDisponibilidad.fechaInicio)}
                </Text>
                {miDisponibilidad.fechaTermino && (
                  <Text className="text-gray-700 mb-3">
                    <Text className="font-semibold">Término:</Text>{' '}
                    {formatFecha(miDisponibilidad.fechaTermino)}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={handleCerrarDisponibilidad}
                  disabled={submitting}
                  className="bg-red-500 py-3 rounded-xl items-center mt-2"
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold">Cerrar Disponibilidad</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
                <View className="flex-row items-center mb-4">
                  <Ionicons name="time-outline" size={20} color="#1e40af" />
                  <Text className="ml-2 text-lg font-bold text-gray-800">
                    Acceso Rápido
                  </Text>
                </View>
                
                {/* Primera fila: Ahora, 2 Horas, 4 Horas */}
                <View className="flex-row justify-between mb-3">
                  <TouchableOpacity
                    onPress={() => handleAccesoRapido(0)}
                    disabled={submitting}
                    className="bg-blue-50 flex-1 py-5 rounded-2xl items-center mx-1 border border-blue-100"
                    style={{ maxWidth: '31%' }}
                  >
                    <View className="bg-blue-500 rounded-full w-10 h-10 items-center justify-center mb-2">
                      <Ionicons name="flash" size={20} color="white" />
                    </View>
                    <Text className="text-blue-700 font-bold text-base">Ahora</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleAccesoRapido(2)}
                    disabled={submitting}
                    className="bg-green-50 flex-1 py-5 rounded-2xl items-center mx-1 border border-green-100"
                    style={{ maxWidth: '31%' }}
                  >
                    <View className="bg-green-500 rounded-full w-10 h-10 items-center justify-center mb-2">
                      <Ionicons name="time-outline" size={20} color="white" />
                    </View>
                    <Text className="text-green-700 font-bold text-base">2 Horas</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleAccesoRapido(4)}
                    disabled={submitting}
                    className="bg-orange-50 flex-1 py-5 rounded-2xl items-center mx-1 border border-orange-100"
                    style={{ maxWidth: '31%' }}
                  >
                    <View className="bg-orange-500 rounded-full w-10 h-10 items-center justify-center mb-2">
                      <Ionicons name="time-outline" size={20} color="white" />
                    </View>
                    <Text className="text-orange-700 font-bold text-base">4 Horas</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Segunda fila: 8 Horas, Hasta 22:00, Hasta 06:00 */}
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    onPress={() => handleAccesoRapido(8)}
                    disabled={submitting}
                    className="bg-purple-50 flex-1 py-5 rounded-2xl items-center mx-1 border border-purple-100"
                    style={{ maxWidth: '31%' }}
                  >
                    <View className="bg-purple-500 rounded-full w-10 h-10 items-center justify-center mb-2">
                      <Ionicons name="time-outline" size={20} color="white" />
                    </View>
                    <Text className="text-purple-700 font-bold text-base">8 Horas</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleAccesoRapido('22:00')}
                    disabled={submitting}
                    className="bg-indigo-50 flex-1 py-5 rounded-2xl items-center mx-1 border border-indigo-100"
                    style={{ maxWidth: '31%' }}
                  >
                    <View className="bg-indigo-500 rounded-full w-10 h-10 items-center justify-center mb-2">
                      <Ionicons name="moon" size={20} color="white" />
                    </View>
                    <Text className="text-indigo-700 font-bold text-base">Hasta 22:00</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleAccesoRapido('06:00')}
                    disabled={submitting}
                    className="bg-red-50 flex-1 py-5 rounded-2xl items-center mx-1 border border-red-100"
                    style={{ maxWidth: '31%' }}
                  >
                    <View className="bg-red-500 rounded-full w-10 h-10 items-center justify-center mb-2">
                      <Ionicons name="sunny" size={20} color="white" />
                    </View>
                    <Text className="text-red-700 font-bold text-base">Hasta 06:00</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Personal Disponible */}
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-gray-800">
                  Personal Actualmente Disponible
                </Text>
                <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
                  <Ionicons 
                    name="refresh" 
                    size={20} 
                    color={refreshing ? '#999' : '#d00'} 
                  />
                </TouchableOpacity>
              </View>
              {getDisponibilidadesActivas().length === 0 ? (
                <Text className="text-center text-gray-500 py-4">
                  No hay personal disponible en este momento
                </Text>
              ) : (
                getDisponibilidadesActivas().map((disp, index) => (
                  <View
                    key={disp.id || index}
                    className="flex-row items-center py-3 border-b border-gray-100"
                  >
                    <Ionicons name="person" size={20} color="#64748b" />
                    <View className="ml-3 flex-1">
                      <Text className="font-semibold text-gray-800">
                        {getBomberoNombre(disp)}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Desde: {formatFecha(disp.fechaInicio)}
                      </Text>
                      {disp.fechaTermino && (
                        <Text className="text-xs text-gray-500">
                          Hasta: {formatFecha(disp.fechaTermino)}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  </View>
                ))
              )}
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DisponibilidadScreen;
