import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/authService';
import { getBomberoDetalles } from '../../services/bombero.service';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Fila de información: muestra solo si hay valor
const InfoRow = ({ icon, label, value, iconColor = '#111827' }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View className="flex-row items-center justify-between py-2">
      <View className="flex-row items-center">
        {icon}
        <Text className="text-sm text-gray-700 ml-2">{label}</Text>
      </View>
      <Text className="text-sm text-gray-900 font-medium max-w-[60%]" numberOfLines={1} ellipsizeMode="tail">
        {String(value)}
      </Text>
    </View>
  );
};

export default function ProfileScreen({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // desde token
  const [detalles, setDetalles] = useState(null); // respuesta de /bombero/:id/detalles

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.getUserData();
      setUser(userData || null);
      if (userData?.id) {
        const resp = await getBomberoDetalles(userData.id);
        const data = resp?.data ?? resp; // soporta {status, data} o solo {data}
        setDetalles(data || null);
      } else {
        setDetalles(null);
      }
    } catch (e) {
      setError(e?.message || 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handleLogout = async () => {
    await authService.logout();
    if (onLogout) {
      onLogout();
    }
  };

  // Helpers similares a Profile.jsx (simplificados)
  const nombreCompleto = useMemo(() => {
    const base = detalles?.informacionPersonal || {};
    const n = base.nombres || user?.nombres || '';
    const a = base.apellidos || user?.apellidos || '';
    return `${n} ${a}`.trim() || 'Usuario Bombero';
  }, [detalles, user]);

  const companiaNombre = useMemo(() => {
    const raw = detalles?.informacionPersonal?.compania ?? detalles?.informacionPersonal?.companiaNombre;
    if (!raw) return '—';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') return raw?.nombre || '—';
    return '—';
  }, [detalles]);

  const cargo = useMemo(() => {
    // último rol del usuario si existe en token, si no, usar del detalle si viene
    const roles = user?.roles || [];
    if (Array.isArray(roles) && roles.length > 0) {
      return roles[roles.length - 1]?.nombre || roles[roles.length - 1] || 'Bombero';
    }
    const rawCargo = detalles?.informacionPersonal?.cargo;
    if (!rawCargo) return 'Bombero';
    return typeof rawCargo === 'string' ? rawCargo : (rawCargo?.nombre || 'Bombero');
  }, [user, detalles]);

  const fotoPerfilURL = detalles?.informacionPersonal?.fotoPerfilURL || null;
  const run = detalles?.informacionPersonal?.run || user?.run || '—';
  const email = detalles?.informacionPersonal?.email || user?.email || '—';

  const estadisticasResumen = useMemo(() => {
    const est = detalles?.estadisticas || {};
    return {
      contactos: Array.isArray(detalles?.contactosEmergencia) ? detalles.contactosEmergencia.length : (est.tieneContactosEmergencia ? 1 : 0),
      capacitaciones: Array.isArray(detalles?.capacitaciones) ? detalles.capacitaciones.length : (est.totalCapacitaciones || 0),
      epp: Array.isArray(detalles?.eppAcargo) ? detalles.eppAcargo.length : (est.totalEppAcargo || 0),
    };
  }, [detalles]);

  // Utilidades de formato
  const formatDate = useCallback((d) => {
    try {
      if (!d) return null;
      const date = new Date(d);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString();
    } catch {
      return null;
    }
  }, []);

  const calculateAge = useCallback((dateStr) => {
    if (!dateStr) return null;
    const b = new Date(dateStr);
    if (isNaN(b.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#f3f4f6]">
      {/* ====== HEADER GRADIENTE Y AVATAR ====== */}
      <View className="relative">
        <LinearGradient
          colors={["#dc2626", "#ea580c"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ height: 140, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, zIndex: 1, elevation: 1, alignItems: 'center', justifyContent: 'flex-end' }}
        >
          <View className="flex-1 px-6 justify-end pb-4 items-center w-full">
            <Text className="text-white/80 text-base text-center mb-1">Mi espacio</Text>
            <Text className="text-white text-5xl font-extrabold text-center">Perfil</Text>
          </View>
          {/* Decoración */}
          <View className="absolute right-6 top-6 w-20 h-20 bg-white/15 rounded-full" />
          <View className="absolute left-10 bottom-2 w-14 h-14 bg-white/15 rounded-full" />
        </LinearGradient>
        {/* AVATAR flotante */}
        <View
          pointerEvents="box-none"
          className="absolute -bottom-10 left-4 w-20 h-20 rounded-full items-center justify-center z-50"
          style={{ elevation: 16, borderWidth: 3, borderColor: '#fff', backgroundColor: '#dc2626' }}
        >
          {fotoPerfilURL ? (
            <Image
              source={{ uri: fotoPerfilURL }}
              className="w-20 h-20 rounded-full bg-gray-200 border-2 border-white"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-[#dc2626] items-center justify-center border-2 border-white">
              <Text className="text-white text-2xl font-semibold">
                {(nombreCompleto?.[0] || 'U').toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ====== CONTENIDO SCROLL ====== */}
      <ScrollView
        className="flex-1 bg-[#f3f4f6]"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      >
        {loading ? (
          <View className="bg-white rounded-lg p-6 items-center justify-center shadow-sm mt-4">
            <ActivityIndicator size="large" color="#1f2937" />
            <Text className="text-gray-600 mt-3">Cargando perfil...</Text>
          </View>
        ) : error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 mt-4">
            <Text className="text-red-700 font-semibold mb-1">No se pudo cargar el perfil</Text>
            <Text className="text-red-600 mb-2">{String(error)}</Text>
            <TouchableOpacity onPress={loadData} className="bg-red-600 px-4 py-2 rounded">
              <Text className="text-white font-semibold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Card principal: ahora contiene toda la info del bombero */}
            <View
              className="bg-white rounded-2xl mb-4 shadow-sm border border-[#e5e7eb] relative mt-12 px-5 pt-6 pb-4"
              style={{ zIndex: 0, elevation: 0 }}
            >
              {/* Contenido alineado normal, sin flex-row ni padding izquierdo excesivo */}
              <Text className="text-lg font-semibold text-slate-900 mb-1.5" numberOfLines={1} ellipsizeMode="tail">
                {nombreCompleto}
              </Text>
              <View className="flex-row flex-wrap mb-2 items-center">
                <View className="bg-[#eef2ff] px-2 py-1 rounded-md mr-2 flex-row items-center">
                  <Ionicons name="briefcase-outline" size={14} color="#6366f1" />
                  <Text className="text-[#4338CA] text-xs ml-1" numberOfLines={1} ellipsizeMode="tail">
                    {cargo}
                  </Text>
                </View>
                <View className="bg-[#d1fae5] px-2 py-1 rounded-md flex-row items-center">
                  <MaterialCommunityIcons name="office-building" size={14} color="#047857" />
                  <Text className="text-[#047857] text-xs ml-1" numberOfLines={1} ellipsizeMode="tail">
                    {companiaNombre}
                  </Text>
                </View>
              </View>

              {/* Información personal dentro de la tarjeta */}
              <View className="mt-2">
                <InfoRow icon={<Ionicons name="card-outline" size={16} color="#111827" />} label="RUN" value={run} />
                <InfoRow icon={<Ionicons name="mail-outline" size={16} color="#111827" />} label="Email" value={email} />
                <InfoRow icon={<Ionicons name="call-outline" size={16} color="#111827" />} label="Teléfono" value={detalles?.informacionPersonal?.telefono} />
                <InfoRow icon={<Ionicons name="location-outline" size={16} color="#111827" />} label="Dirección" value={detalles?.informacionPersonal?.direccion} />
                <InfoRow icon={<Ionicons name="calendar-outline" size={16} color="#111827" />} label="Nacimiento" value={formatDate(detalles?.informacionPersonal?.fechaNacimiento)} />
                <InfoRow icon={<Ionicons name="hourglass-outline" size={16} color="#111827" />} label="Edad" value={calculateAge(detalles?.informacionPersonal?.fechaNacimiento)} />
                <InfoRow icon={<Ionicons name="pulse-outline" size={16} color="#111827" />} label="Estado servicio" value={detalles?.informacionPersonal?.estadoServicio} />
              </View>
            </View>

            {/* Contactos de emergencia */}
            {Array.isArray(detalles?.contactosEmergencia) && detalles.contactosEmergencia.length > 0 && (
              <View className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e7eb] mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-semibold text-slate-900">Contactos de emergencia</Text>
                  <View className="bg-[#d1fae5] px-2 py-0.5 rounded-full">
                    <Text className="text-[#047857] text-[11px]">{detalles.contactosEmergencia.length} en total</Text>
                  </View>
                </View>
                {detalles.contactosEmergencia.map((c, idx) => (
                  <View key={`contacto-${idx}`} className="flex-row items-center justify-between py-2 border-b border-[#f3f4f6]">
                    <View className="flex-1 pr-2">
                      <Text className="text-slate-900 text-sm font-medium" numberOfLines={1}>
                        {c?.nombreCompleto || c?.nombres || 'Contacto'}
                      </Text>
                      <Text className="text-slate-500 text-xs" numberOfLines={1}>
                        {c?.vinculo?.nombre || '—'}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="call-outline" size={14} color="#b91c1c" />
                      <Text className="text-slate-900 text-sm ml-1">{c?.telefono || c?.telefono1 || '—'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}


            {/* EPP a cargo */}
            {Array.isArray(detalles?.eppAcargo) && detalles.eppAcargo.length > 0 && (
              <View className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e7eb] mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-semibold text-slate-900">EPP a cargo</Text>
                  <View className="bg-[#fef3c7] px-2 py-0.5 rounded-full">
                    <Text className="text-[#92400e] text-[11px]">{detalles.eppAcargo.length} elementos</Text>
                  </View>
                </View>
                {detalles.eppAcargo.map((item, idx) => (
                  <View key={`epp-${idx}`} className="py-2 border-b border-[#f3f4f6]">
                    <Text className="text-slate-900 text-sm font-medium" numberOfLines={1}>
                      {item?.epp?.nombre || 'EPP'}
                    </Text>
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-slate-500 text-xs" numberOfLines={1}>
                        {item?.epp?.tipoEpp?.nombre || 'Tipo —'}
                      </Text>
                      <Text className="text-slate-500 text-xs" numberOfLines={1}>
                        {item?.estado || item?.estadoActual || 'Estado —'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Botón de logout */}
            <TouchableOpacity className="bg-[#dc2626] p-4 rounded-xl mt-2 items-center shadow-sm" onPress={handleLogout}>
              <Text className="text-white text-base font-semibold">Cerrar Sesión</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
