import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getEstadosReportes } from '../../services/estadosParte.service';
import { getIncidentesResumen, borrarIncidente } from '../../services/incidentes.service';
import { authService } from '../../services/authService';

// Mapeo de colores del backend a estilos de Tailwind
const COLOR_STYLES = {
  slate: {
    bg: 'bg-sky-50',
    bgActive: 'bg-sky-500',
    border: 'border-sky-300',
    borderActive: 'border-sky-500',
    text: 'text-sky-700',
    textActive: 'text-white',
    icon: '#64748b', // slate-500
  },
  blue: {
    bg: 'bg-blue-50',
    bgActive: 'bg-blue-500',
    border: 'border-blue-300',
    borderActive: 'border-blue-500',
    text: 'text-blue-700',
    textActive: 'text-white',
    icon: '#3b82f6', // blue-500
  },
  green: {
    bg: 'bg-green-50',
    bgActive: 'bg-green-500',
    border: 'border-green-300',
    borderActive: 'border-green-500',
    text: 'text-green-700',
    textActive: 'text-white',
    icon: '#22c55e', // green-500
  },
  red: {
    bg: 'bg-red-50',
    bgActive: 'bg-red-500',
    border: 'border-red-300',
    borderActive: 'border-red-500',
    text: 'text-red-700',
    textActive: 'text-white',
    icon: '#ef4444', // red-500
  },
};

const ICON_MAP = {
  BORRADOR: 'document-text-outline',
  ENVIADO: 'send-outline',
  APROBADO: 'checkmark-circle-outline',
  CORREGIR: 'create-outline',
};

// ==== Utilidades de color (hex) ====
const getColorStyles = (colorName) => {
  const normalizedColor = (colorName || '').toLowerCase();
  return COLOR_STYLES[normalizedColor] || COLOR_STYLES.slate;
};

// ==== Filtro de valores basura ====
const safeString = (val) => {
  if (val === null || val === undefined || val === '' || val === 'null' || val === 'NULL') return '';
  const str = String(val).trim();
  return str === 'null' || str === 'NULL' ? '' : str;
};

export default function EmergenciasScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [estados, setEstados] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeEstado, setActiveEstado] = useState(null);
  const [selectedParte, setSelectedParte] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Obtener datos del usuario
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getUserData();
        setUser(userData);
      } catch (error) {
        console.error('Error al cargar usuario:', error);
      }
    };
    loadUser();
  }, []);

  // Cargar estados desde backend
  const fetchEstados = async () => {
    try {
      const resp = await getEstadosReportes();
      const data = resp?.data ?? resp;
      const rawArray = Array.isArray(data) ? data : [];

      const normalizedEstados = rawArray.map((e) => {
        const id = e?.id ?? e?.idEstado ?? e?.idReporteEstado ?? null;
        const rawKey = e?.codigo ?? e?.key ?? e?.nombre ?? e?.descripcion ?? e;
        const label = safeString(e?.nombre ?? e?.label ?? String(rawKey).toUpperCase());
        const key = String(rawKey).toUpperCase();
        const color = safeString(e?.color) || 'slate';

        return { id, key, label, color };
      });

      // Ordenar por id si está disponible
      const sorted = normalizedEstados.sort((a, b) => {
        const ai = typeof a.id === 'number' ? a.id : Number(a.id);
        const bi = typeof b.id === 'number' ? b.id : Number(b.id);
        const aValid = !Number.isNaN(ai);
        const bValid = !Number.isNaN(bi);
        if (aValid && bValid) return ai - bi;
        if (aValid) return -1;
        if (bValid) return 1;
        return 0;
      });

      setEstados(sorted);

      // Establecer primer estado como activo si no hay uno seleccionado
      if (sorted.length > 0 && !activeEstado) {
        setActiveEstado(sorted[0].key);
      }
    } catch (error) {
      console.error('Error al cargar estados:', error);
      Alert.alert('Error', 'No se pudieron cargar los estados');
    }
  };

  // Cargar incidentes desde backend
  const fetchIncidentes = async () => {
    try {
      const userId = Number(user?.id);
      if (!Number.isInteger(userId)) {
        setItems([]);
        return;
      }

      const data = await getIncidentesResumen({ redactorId: userId });
      const normalized = (Array.isArray(data) ? data : []).map((x) => ({
        ...x,
        estado: safeString(x.estado).toUpperCase() || '',
        tipo: safeString(x.tipo),
        compania: safeString(x.compania),
        creador: safeString(x.creador),
        fecha: safeString(x.fecha),
      }));

      setItems(normalized);
    } catch (error) {
      console.error('Error al cargar incidentes:', error);
      Alert.alert('Error', 'No se pudieron cargar los partes de emergencia');
    }
  };

  // Cargar datos iniciales
  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchEstados(), fetchIncidentes()]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  // Agrupar partes por estado
  const partesData = useMemo(() => {
    const grouped = {};

    // Inicializar grupos con todos los estados
    estados.forEach((estado) => {
      grouped[estado.key] = [];
    });

    // Agrupar items por estado
    items.forEach((item) => {
      const estadoKey = item.estado;
      if (!grouped[estadoKey]) {
        grouped[estadoKey] = [];
      }
      grouped[estadoKey].push(item);
    });

    return grouped;
  }, [items, estados]);

  // Mapa rápido: estadoKey -> {label, color}
  const stateMetaByKey = useMemo(() => {
    const map = {};
    for (const e of estados) {
      map[e.key] = { label: e.label, color: e.color };
    }
    return map;
  }, [estados]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filtrar partes según búsqueda
  const filteredPartes = useMemo(() => {
    if (!activeEstado) return [];
    const partes = partesData[activeEstado] || [];

    if (!searchText.trim()) return partes;

    const search = searchText.toLowerCase();
    return partes.filter((p) => {
      const desc = safeString(p?.detalle?.descripcionPreliminar || p?.titulo).toLowerCase();
      const clave = safeString(p?.detalle?.claveRadial).toLowerCase();
      const fecha = safeString(p?.fecha).toLowerCase();
      return desc.includes(search) || clave.includes(search) || fecha.includes(search);
    });
  }, [activeEstado, partesData, searchText]);

  const openDetail = (parte) => {
    setSelectedParte(parte);
    setModalVisible(true);
  };

  const closeDetail = () => {
    setModalVisible(false);
    setSelectedParte(null);
  };

  const handleDelete = async () => {
    if (!selectedParte?.id || deleting) return;

    const estadoKey = (selectedParte?.estado || '').toUpperCase();
    const puedeBorrar = estadoKey === 'BORRADOR' || estadoKey === 'CORREGIR';

    if (!puedeBorrar) {
      Alert.alert(
        'No permitido',
        'Solo se pueden eliminar partes en estado BORRADOR o CORREGIR.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar este parte? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await borrarIncidente(selectedParte.id);

              // Actualizar la lista local removiendo el item
              setItems((prevItems) => prevItems.filter((item) => item.id !== selectedParte.id));

              // Cerrar el modal
              closeDetail();

              Alert.alert('Éxito', 'Parte eliminado correctamente');
            } catch (error) {
              console.error('Error al borrar parte:', error);
              Alert.alert(
                'Error',
                error?.message || 'No se pudo borrar el parte. Intenta nuevamente.'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const getStreetNumber = (direccion) => {
    if (!direccion) return '';
    if (typeof direccion === 'string') return safeString(direccion);
    const { calle = '', numero = '' } = direccion;
    return [safeString(calle), safeString(numero)].filter(Boolean).join(' ');
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-gray-100 items-center justify-center">
        <ActivityIndicator size="large" color="#dc2626" />
        <Text className="mt-4 text-gray-600">Cargando emergencias...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">Partes de Emergencia</Text>
            <Text className="text-sm text-gray-600 mt-1">
              {filteredPartes.length} reporte{filteredPartes.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('CrearParte')}
            className="bg-blue-600 rounded-lg px-4 py-2 flex-row items-center"
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text className="text-white font-semibold ml-2">Nuevo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tarjetas de filtro de estados — compactas y sin radio */}
      <View className="bg-white border-b border-gray-200 px-4 py-2">
        <View className="flex-row flex-wrap -mt-1">
          {estados.map((estado) => {
            const isActive = activeEstado === estado.key;
            const count = partesData[estado.key]?.length || 0;
            const color = getColorStyles(estado.color);

            return (
              <TouchableOpacity
                key={estado.key}
                onPress={() => setActiveEstado(estado.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                className={`mr-2 mt-2 px-3 py-1.5 rounded-full border
            ${isActive ? `${color.border} ${color.bg}` : 'border-gray-300 bg-white'}
            shadow-sm
          `}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={ICON_MAP[estado.key] || 'document-outline'}
                    size={14}
                    color={isActive ? color.icon : '#6b7280'} // gray-500
                  />
                  <Text
                    className={`ml-1 text-[12px] font-medium ${isActive ? color.text : 'text-gray-700'
                      }`}
                    numberOfLines={1}
                  >
                    {estado.label}
                  </Text>

                  {/* contador diminuto */}
                  <View
                    className={`ml-2 px-1.5 py-[1px] rounded-full
                ${isActive ? color.bgActive : 'bg-gray-100'}
                border ${isActive ? color.borderActive : 'border-gray-200'}
              `}
                  >
                    <Text className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                      {count}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Búsqueda */}
      <View className="bg-white px-4 py-2 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder="Buscar por descripción, clave o fecha..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Lista de partes */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-0"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredPartes.length === 0 ? (
          <View className="items-center justify-center py-12 ">
            <Ionicons name="folder-open-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 mt-4">
              {searchText ? 'No se encontraron resultados' : 'Sin reportes en este estado'}
            </Text>
          </View>
        ) : (
          filteredPartes.map((parte) => {
            const desc = safeString(parte?.detalle?.descripcionPreliminar || parte?.titulo);
            const clave = safeString(parte?.detalle?.claveRadial);
            const shortDesc = desc.length > 60 ? `${desc.slice(0, 60)}...` : desc;
            const street = getStreetNumber(parte?.detalle?.direccion);
            const estadoKey = safeString(parte?.estado).toUpperCase() || '';
            const estadoColor = stateMetaByKey[estadoKey]?.color || 'slate';
            const colorStyles = getColorStyles(estadoColor);

            return (
              <TouchableOpacity
                key={parte.id}
                onPress={() => openDetail(parte)}
                className={`rounded-xl p-4 mb-3 border ${colorStyles.bg} ${colorStyles.border}`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text className="text-xs text-gray-600 ml-1">{safeString(parte?.fecha)}</Text>
                  </View>
                  {clave ? (
                    <View className={`px-2 py-1 rounded border ${colorStyles.bg} ${colorStyles.border}`}>
                      <Text className={`text-xs font-semibold ${colorStyles.text}`}>{clave}</Text>
                    </View>
                  ) : null}
                </View>

                <Text className="text-base text-gray-800 font-medium mb-1">{shortDesc}</Text>

                {street ? (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text className="text-xs text-gray-600 ml-1">{street}</Text>
                  </View>
                ) : null}

                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-xs text-gray-500">{safeString(parte?.tipo)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal de detalle */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeDetail}
        transparent={false}
      >
        <SafeAreaView className="flex-1 bg-white">
          {selectedParte ? (
            <>
              {/* Header del modal */}
              <View className={`px-4 py-4 ${getColorStyles(stateMetaByKey[safeString(selectedParte?.estado).toUpperCase() || '']?.color).bgActive}`}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-white text-xl font-bold">Detalle del Parte</Text>
                  <TouchableOpacity onPress={closeDetail}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView className="flex-1 p-4">
                {/* Estado */}
                <View className="mb-4">
                  <Text className="text-xs text-gray-500 mb-1">Estado</Text>
                  <View className={`px-3 py-2 rounded-lg border ${getColorStyles(stateMetaByKey[safeString(selectedParte?.estado).toUpperCase() || '']?.color).bg} ${getColorStyles(stateMetaByKey[safeString(selectedParte?.estado).toUpperCase() || '']?.color).border}`}>
                    <Text className={`font-semibold ${getColorStyles(stateMetaByKey[safeString(selectedParte?.estado).toUpperCase() || '']?.color).text}`}>
                      {safeString(selectedParte?.estado)}
                    </Text>
                  </View>
                </View>

                {/* Fecha */}
                <View className="mb-4">
                  <Text className="text-xs text-gray-500 mb-1">Fecha</Text>
                  <Text className="text-base text-gray-800">{safeString(selectedParte?.fecha)}</Text>
                </View>

                {/* Clave Radial */}
                {safeString(selectedParte?.detalle?.claveRadial) ? (
                  <View className="mb-4">
                    <Text className="text-xs text-gray-500 mb-1">Clave Radial</Text>
                    <Text className="text-base text-gray-800">{safeString(selectedParte.detalle.claveRadial)}</Text>
                  </View>
                ) : null}

                {/* Descripción */}
                <View className="mb-4">
                  <Text className="text-xs text-gray-500 mb-1">Descripción</Text>
                  <Text className="text-base text-gray-800">
                    {safeString(selectedParte?.detalle?.descripcionPreliminar || selectedParte?.titulo) || 'Sin descripción'}
                  </Text>
                </View>

                {/* Dirección */}
                {getStreetNumber(selectedParte?.detalle?.direccion) ? (
                  <View className="mb-4">
                    <Text className="text-xs text-gray-500 mb-1">Dirección</Text>
                    <Text className="text-base text-gray-800">
                      {getStreetNumber(selectedParte.detalle.direccion)}
                    </Text>
                  </View>
                ) : null}

                {/* Tipo */}
                {safeString(selectedParte?.tipo) ? (
                  <View className="mb-4">
                    <Text className="text-xs text-gray-500 mb-1">Tipo</Text>
                    <Text className="text-base text-gray-800">{safeString(selectedParte.tipo)}</Text>
                  </View>
                ) : null}

                {/* Compañía */}
                {safeString(selectedParte?.compania) ? (
                  <View className="mb-4">
                    <Text className="text-xs text-gray-500 mb-1">Compañía</Text>
                    <Text className="text-base text-gray-800">{safeString(selectedParte.compania)}</Text>
                  </View>
                ) : null}
              </ScrollView>

              {/* Footer con botones */}
              <View className="border-t border-gray-200 p-4">
                <TouchableOpacity
                  onPress={() => {
                    closeDetail();
                    // Navegar a la pantalla de detalle completo del parte
                    navigation.navigate('DetalleParte', { parteId: selectedParte?.id });
                  }}
                  className="bg-blue-600 py-3 rounded-lg items-center mb-3"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="document-text-outline" size={20} color="#fff" />
                    <Text className="text-white font-semibold ml-2">Ver parte completo</Text>
                  </View>
                </TouchableOpacity>

                {/* Botón para editar parte - solo para estados BORRADOR o CORREGIR */}
                {(() => {
                  const estadoKey = safeString(selectedParte?.estado).toUpperCase() || '';
                  const puedeEditar = estadoKey === 'BORRADOR' || estadoKey === 'CORREGIR';

                  if (!puedeEditar) return null;
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        closeDetail();
                        navigation.navigate('EditarParte', { parteId: selectedParte?.id });
                      }}
                      className="bg-gray-700 py-3 rounded-lg items-center mb-3"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="create-outline" size={20} color="#fff" />
                        <Text className="text-white font-semibold ml-2">Editar parte</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })()}

                {/* Botón de eliminar - solo para estados BORRADOR o CORREGIR */}
                {(() => {
                  const estadoKey = safeString(selectedParte?.estado).toUpperCase() || '';
                  const puedeBorrar = estadoKey === 'BORRADOR' || estadoKey === 'CORREGIR';

                  if (puedeBorrar) {
                    return (
                      <TouchableOpacity
                        onPress={handleDelete}
                        disabled={deleting}
                        className={`py-3 rounded-lg items-center mb-3 ${deleting ? 'bg-red-400' : 'bg-red-600'
                          }`}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#fff"
                          />
                          <Text className="text-white font-semibold ml-2">
                            {deleting ? 'Eliminando...' : 'Eliminar parte'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }
                  return null;
                })()}

                <TouchableOpacity
                  onPress={closeDetail}
                  className="bg-gray-600 py-3 rounded-lg items-center"
                >
                  <Text className="text-white font-semibold">Cerrar</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
