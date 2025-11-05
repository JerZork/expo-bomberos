import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { obtenerParteEmergenciaPorId, obtenerUltimoEstadoIncidente } from '../../services/parteEmergencia.service';
import { cambiarEstadoIncidente } from '../../services/incidentes.service';
import { getCompaniaById } from '../../services/compania.service';
import { getRegiones, getComunas } from '../../services/region.service';
import { 
  getClasificacionesEmergencia, 
  getSubtiposIncidente, 
  getTiposDano, 
  getFasesIncidente 
} from '../../services/subtipoIncidente.service';
import { getBomberosPorCompania } from '../../services/bombero.service';
import { getCarrosByCompania } from '../../services/carro.service';
import { getServicios } from '../../services/servicios.service';
import { authService } from '../../services/authService';

export default function DetalleParteScreen({ route, navigation }) {
  const { parteId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [parte, setParte] = useState(null);
  const [estadoActual, setEstadoActual] = useState('');
  const [sending, setSending] = useState(false);
  
  // Estados para controlar qué tarjetas están expandidas
  const [expandedInmuebles, setExpandedInmuebles] = useState({});
  const [expandedVehiculos, setExpandedVehiculos] = useState({});

  // Utilidad para formatear fecha a DD-MM-YYYY
  const formatDDMMYYYY = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Formatea "HH:MM:SS" o "HH:MM" a solo "HH:MM"
  const formatHHMM = (value) => {
    if (!value) return '-';
    const parts = String(value).split(':');
    if (parts.length < 2) return String(value);
    const h = parts[0]?.padStart(2, '0') ?? '';
    const m = parts[1]?.padStart(2, '0') ?? '';
    return `${h}:${m}`;
  };

  useEffect(() => {
    let mounted = true;
    const loadParteData = async () => {
      try {
        setLoading(true);
        setError('');

        // Obtener usuario actual
        const userData = await authService.getUserData();
        const redactorId = userData?.id;
        
        if (!redactorId) {
          throw new Error('No se pudo determinar el usuario actual');
        }

        // Obtener parte de emergencia
        const baseResp = await obtenerParteEmergenciaPorId(parteId, { idRedactor: redactorId });
        const p = baseResp?.data ?? baseResp;
        
        if (!p) throw new Error('Parte no encontrado');

        // Cargar último estado
        try {
          const estResp = await obtenerUltimoEstadoIncidente(parteId);
          const e = estResp?.data ?? estResp;
          if (mounted) setEstadoActual((e?.estado || '').toString().toUpperCase());
        } catch {
          if (mounted) setEstadoActual('');
        }

        // Cargar datos relacionados en paralelo
        const [
          regiones,
          clasificaciones,
          tiposDano,
          fases,
          companiasDetalle,
          bomberos,
          carros,
          servicios,
          comunas
        ] = await Promise.all([
          getRegiones().catch(() => []),
          getClasificacionesEmergencia().catch(() => []),
          getTiposDano().catch(() => []),
          getFasesIncidente().catch(() => []),
          p.companiaId ? getCompaniaById(p.companiaId).catch(() => null) : Promise.resolve(null),
          p.companiaId ? getBomberosPorCompania(p.companiaId).catch(() => []) : Promise.resolve([]),
          p.companiaId ? getCarrosByCompania(p.companiaId).catch(() => []) : Promise.resolve([]),
          getServicios().catch(() => []),
          p.regionId ? getComunas(p.regionId).catch(() => []) : Promise.resolve([]),
        ]);

        const subtipos = p.clasificacionId 
          ? await getSubtiposIncidente(p.clasificacionId).catch(() => []) 
          : [];

        // Cargar compañías y bomberos de accidentados si existen
        const companiasAccidentados = new Map();
        const bomberosAccidentados = new Map();
        
        if (Array.isArray(p.accidentados) && p.accidentados.length > 0) {
          const companiasIds = [...new Set(
            p.accidentados
              .map(a => a.companiaId)
              .filter(id => id && id !== p.companiaId)
          )];

          // Cargar compañías de accidentados
          const companiasPromises = companiasIds.map(async (compId) => {
            try {
              const comp = await getCompaniaById(compId);
              const compData = comp?.data ?? comp;
              if (compData) { 
                companiasAccidentados.set(compId, compData);
              }
            } catch {
              // Error al cargar compañía
            }
          });

          await Promise.all(companiasPromises);

          // Cargar bomberos de cada compañía de accidentados
          const bomberosPromises = companiasIds.map(async (compId) => {
            try {
              const bombsList = await getBomberosPorCompania(compId);
              if (Array.isArray(bombsList)) {
                bomberosAccidentados.set(compId, bombsList);
              }
            } catch {
              // Error al cargar bomberos
            }
          });

          await Promise.all(bomberosPromises);
        }

        // Funciones helper
        const findById = (arr, id) => 
          Array.isArray(arr) ? arr.find(x => String(x.id) === String(id)) : undefined;

        const companiaObj = companiasDetalle?.data ?? companiasDetalle ?? null;
        const clasificacionObj = findById(clasificaciones, p.clasificacionId) || null;
        const subtipoObj = findById(subtipos, p.subtipoId) || null;
        const tipoDanoObj = findById(tiposDano, p.tipoIncendioId) || null;
        const faseObj = findById(fases, p.faseId) || null;
        const regionObj = findById(regiones, p.regionId) || null;
        const comunaObj = findById(comunas, p.comunaId) || null;

        const bomberoById = (id, companiaId = null) => {
          // Primero buscar en la lista de bomberos de la compañía del parte
          let b = findById(bomberos, id);
          
          // Si no se encuentra y se proporciona una companiaId diferente, buscar en esa compañía
          if (!b && companiaId && companiaId !== p.companiaId) {
            const bomberosOtraCompania = bomberosAccidentados.get(companiaId);
            if (bomberosOtraCompania) {
              b = findById(bomberosOtraCompania, id);
            }
          }
          
          if (!b) return id ? { id, nombreCompleto: `Bombero #${id}` } : null;
          const nombreCompleto = [b.nombres, b.apellidos]
            .filter(Boolean)
            .join(' ')
            .trim() || `Bombero #${b.id}`;
          return { id: b.id, nombreCompleto, run: b.run };
        };

        const companiaById = (id) => {
          if (!id) return null;
          
          // Si es la compañía del parte
          if (companiaObj && String(companiaObj.id) === String(id)) {
            return { id: companiaObj.id, nombre: companiaObj.nombre };
          }
          
          // Buscar en compañías de accidentados
          const compAccidentado = companiasAccidentados.get(id);
          if (compAccidentado) {
            return { id: compAccidentado.id, nombre: compAccidentado.nombre };
          }
          
          return { id, nombre: null };
        };

        const carroById = (id) => {
          const c = findById(carros, id);
          return c 
            ? { id: c.id, patente: c.patente } 
            : (id ? { id, patente: null } : null);
        };

        const servicioById = (id) => {
          const s = findById(servicios, id);
          return s 
            ? { id: s.id, nombre: s.nombre } 
            : (id ? { id, nombre: null } : null);
        };

        // Construir objeto detallado del parte
        const parteDet = {
          id: p.id,
          compania: companiaObj 
            ? { id: companiaObj.id, nombre: companiaObj.nombre } 
            : (p.companiaId ? { id: p.companiaId, nombre: null } : null),
          fecha: p.fecha || null,
          horaDespacho: p.horaDespacho || null,
          hora6_0: p.hora6_0 || null,
          hora6_3: p.hora6_3 || null,
          hora6_9: p.hora6_9 || null,
          hora6_10: p.hora6_10 || null,
          descripcionPreliminar: p.descripcionPreliminar || '',
          direccion: {
            calle: p.calle || '',
            numero: p.numero || '',
            depto: p.depto || null,
            referencia: p.referencia || null,
            comuna: comunaObj 
              ? { id: comunaObj.id, nombre: comunaObj.nombre } 
              : (p.comunaId ? { id: p.comunaId, nombre: null } : null),
            region: regionObj 
              ? { id: regionObj.id, nombre: regionObj.nombre } 
              : (p.regionId ? { id: p.regionId, nombre: null } : null),
          },
          clasificacion: clasificacionObj 
            ? { id: clasificacionObj.id, nombre: clasificacionObj.nombre } 
            : (p.clasificacionId ? { id: p.clasificacionId, nombre: null } : null),
          subtipo: subtipoObj 
            ? { 
                id: subtipoObj.id, 
                claveRadial: subtipoObj.claveRadial, 
                descripcion: subtipoObj.descripcion 
              } 
            : (p.subtipoId ? { id: p.subtipoId } : null),
          incendio: {
            tipo: tipoDanoObj 
              ? { id: tipoDanoObj.id, nombre: tipoDanoObj.nombre } 
              : (p.tipoIncendioId ? { id: p.tipoIncendioId, nombre: null } : null),
            fase: faseObj 
              ? { id: faseObj.id, nombre: faseObj.nombre } 
              : (p.faseId ? { id: p.faseId, nombre: null } : null),
          },
          bomberoACargo: bomberoById(p.bomberoACargoId),
          redactor: bomberoById(p.idRedactor),
          inmuebles: Array.isArray(p.inmuebles) ? p.inmuebles : [],
          vehiculos: Array.isArray(p.vehiculos) ? p.vehiculos : [],
          materialMayor: Array.isArray(p.materialMayor) 
            ? p.materialMayor.map(m => ({
                unidad: carroById(m.unidadId),
                conductor: bomberoById(m.conductorId),
                jefeUnidad: bomberoById(m.bomberoId),
                voluntarios: m.voluntarios ?? null,
                kmSalida: m.kmSalida ?? null,
                kmLlegada: m.kmLlegada ?? null,
              })) 
            : [],
          accidentados: Array.isArray(p.accidentados) 
            ? p.accidentados.map(a => ({
                bombero: bomberoById(a.bomberoId, a.companiaId),
                compania: companiaById(a.companiaId),
                lesiones: a.lesiones || '',
                constancia: a.constancia || '',
                comisaria: a.comisaria || '',
                acciones: a.acciones || '',
              })) 
            : [],
          otrosServicios: Array.isArray(p.otrosServicios) 
            ? p.otrosServicios.map(s => ({
                servicio: servicioById(s.servicioId),
                tipoUnidad: s.tipoUnidad || '',
                responsable: s.responsable || '',
                personal: s.personal ?? null,
                observaciones: s.observaciones || '',
              })) 
            : [],
          asistencia: {
            lugar: Array.isArray(p.asistencia?.lugar) 
              ? p.asistencia.lugar.map(bomberoById) 
              : [],
            cuartel: Array.isArray(p.asistencia?.cuartel) 
              ? p.asistencia.cuartel.map(bomberoById) 
              : [],
          },
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          fechaHoraDespacho: p.fechaHoraDespacho,
        };

        if (mounted) setParte(parteDet);
      } catch (e) {
        const msg = e?.message || 'No se pudo cargar el parte';
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadParteData();
    return () => { mounted = false; };
  }, [parteId]);

  // Computed values
  const direccion = useMemo(() => {
    const calle = parte?.direccion?.calle || '';
    const numero = parte?.direccion?.numero || '';
    return [[calle, numero].filter(Boolean).join(' ')].filter(Boolean).join('');
  }, [parte?.direccion?.calle, parte?.direccion?.numero]);

  const fechaIncidente = useMemo(
    () => formatDDMMYYYY(parte?.fecha) || (parte?.fecha ?? '-'), 
    [parte?.fecha]
  );

  const timelineItems = useMemo(() => ([
    { label: '6-0', time: parte?.hora6_0 || '-' },
    { label: '6-3', time: parte?.hora6_3 || '-' },
    { label: '6-9', time: parte?.hora6_9 || '-' },
    { label: '6-10', time: parte?.hora6_10 || '-' },
  ]), [parte?.hora6_0, parte?.hora6_3, parte?.hora6_9, parte?.hora6_10]);

  // Función para enviar el parte (cambiar estado a ENVIADO)
  const handleEnviar = async () => {
    if (sending) return;
    
    Alert.alert(
      'Confirmar envío',
      '¿Estás seguro de enviar este parte de emergencia?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              setSending(true);
              const userData = await authService.getUserData();
              const idBombero = userData?.id;
              
              if (!idBombero) {
                throw new Error('No se pudo obtener el ID del bombero');
              }

              await cambiarEstadoIncidente(Number(parteId), { 
                estado: 'ENVIADO', 
                idBombero 
              });

              Alert.alert('Éxito', 'Parte enviado correctamente');
              
              // Refrescar el estado actual
              try {
                const resp = await obtenerUltimoEstadoIncidente(parteId);
                const data = resp?.data ?? resp;
                setEstadoActual((data?.estado || '').toString().toUpperCase());
              } catch (e) {
                console.warn('No se pudo refrescar el estado del incidente:', e);
              }
            } catch (e) {
              Alert.alert('Error', e?.message || 'No se pudo enviar el parte');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const puedeEnviar = estadoActual === 'BORRADOR' || estadoActual === 'CORREGIR';

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600">Cargando parte...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-4 py-4 bg-blue-600">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text className="mt-4 text-red-600 text-center">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!parte) return null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-4 bg-blue-600">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Reporte Emergencia {fechaIncidente}</Text>
          {puedeEnviar ? (
            <TouchableOpacity onPress={() => navigation.navigate('EditarParte', { parteId })}>
              <Ionicons name="create-outline" size={22} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Botón para enviar parte (solo si estado es BORRADOR o CORREGIR) */}
        {puedeEnviar && (
          <View className="p-4 bg-blue-50 border-b border-blue-200">
            <TouchableOpacity
              onPress={handleEnviar}
              disabled={sending}
              className={`bg-blue-600 rounded-lg py-3 px-4 flex-row items-center justify-center ${
                sending ? 'opacity-50' : ''
              }`}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color="#fff" 
                style={{ marginRight: 8 }} 
              />
              <Text className="text-white font-bold text-base">
                {sending ? 'Enviando...' : 'Enviar parte'}
              </Text>
            </TouchableOpacity>
          </View>
        )}


        {/* Información general */}
        <View className="bg-white border-b border-gray-200 p-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Antecedentes generales</Text>
          
          <SectionRow 
            icon="business-outline" 
            label="Compañía" 
            value={parte?.compania?.nombre || `#${parte?.compania?.id || '-'}`} 
          />
          <SectionRow 
            icon="calendar-outline" 
            label="Fecha" 
            value={fechaIncidente} 
          />
          <SectionRow 
            icon="time-outline" 
            label="Hora despacho" 
            value={parte?.horaDespacho || '-'} 
          />
          <SectionRow 
            icon="location-outline" 
            label="Dirección" 
            value={direccion || '-'} 
          />
          <SectionRow 
            icon="map-outline" 
            label="Comuna" 
            value={parte?.direccion?.comuna?.nombre || '-'} 
          />
          {parte?.direccion?.depto && (
            <SectionRow icon="home-outline" label="Depto" value={parte.direccion.depto} />
          )}
          {parte?.direccion?.referencia && (
            <SectionRow 
              icon="information-circle-outline" 
              label="Referencia" 
              value={parte.direccion.referencia} 
            />
          )}
        </View>

        {/* Responsables */}
        <View className="bg-white border-b border-gray-200 p-4">
          <Text className="text-base font-bold text-gray-900 mb-3">Responsables</Text>
          <View className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-2">
            <Text className="text-xs font-semibold text-indigo-600 mb-1">Bombero a cargo</Text>
            <Text className="text-sm text-gray-900">
              {parte?.bomberoACargo?.nombreCompleto || `#${parte?.bomberoACargo?.id || '-'}`}
            </Text>
          </View>
          <View className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <Text className="text-xs font-semibold text-emerald-600 mb-1">Redactor</Text>
            <Text className="text-sm text-gray-900">
              {parte?.redactor?.nombreCompleto || `#${parte?.redactor?.id || '-'}`}
            </Text>
          </View>
        </View>

    {/* Línea de tiempo */}
                <View className="bg-white border-b border-gray-200 p-4">
                  <Text className="text-base font-bold text-gray-900 mb-3">Línea de tiempo</Text>
                  <View className="flex-row justify-between">
                    {timelineItems.map((item, idx) => (
                      <View key={idx} className="items-center flex-1 relative">
                    {idx !== 0 && (
                      <View
                        pointerEvents="none"
                        className="absolute top-4 left-0 w-1/2 h-0.5 bg-blue-100 z-0"
                      />
                    )}
                    {idx !== timelineItems.length - 1 && (
                      <View
                        pointerEvents="none"
                        className="absolute top-4 right-0 w-1/2 h-0.5 bg-blue-100 z-0"
                      />
                    )}
                    <Text
                      className="bg-blue-500 rounded-full text-xs text-white font-medium p-2 z-10"
                    >
                      {item.label}
                    </Text>
                    <Text className="text-sm text-gray-900 font-semibold mt-1">
                      {formatHHMM(item.time)}
                    </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Descripción preliminar */}
        <View className="bg-white border-b border-gray-200 p-4">
          <Text className="text-base font-bold text-gray-900 mb-2">Descripción preliminar</Text>
          <Text className="text-sm text-gray-700">
            {parte?.descripcionPreliminar || '-'}
          </Text>
        </View>

        {/* Características del incidente */}
        <View className="bg-white border-b border-gray-200 p-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Características del incidente
          </Text>
          
          {parte?.clasificacion && (
            <SectionRow 
              icon="shield-checkmark-outline" 
              label="Clasificación" 
              value={parte.clasificacion.nombre || `#${parte.clasificacion.id}`} 
            />
          )}
          {parte?.subtipo && (
            <SectionRow 
              icon="radio-outline" 
              label="Clave radial" 
              value={
                parte.subtipo.claveRadial 
                  ? `${parte.subtipo.claveRadial}` 
                  : `Subtipo #${parte.subtipo.id}`
              } 
            />
          )}
          {parte?.subtipo?.descripcion && (
            <View className="mt-2 mb-2">
              <Text className="text-xs font-semibold text-gray-600 mb-1">Descripción tipo emergencia</Text>
              <Text className="text-sm text-gray-700">{parte.subtipo.descripcion}</Text>
            </View>
          )}
          {parte?.incendio?.tipo && (
            <SectionRow 
              icon="flame-outline" 
              label="Tipo incendio" 
              value={parte.incendio.tipo.nombre || `#${parte.incendio.tipo.id}`} 
            />
          )}
          {parte?.incendio?.fase && (
            <SectionRow 
              icon="flag-outline" 
              label="Fase" 
              value={parte.incendio.fase.nombre || `#${parte.incendio.fase.id}`} 
            />
          )}
        </View>

        {/* Inmuebles */}
        {Array.isArray(parte.inmuebles) && parte.inmuebles.length > 0 && (
          <View className="bg-white border-b border-gray-200 p-4">
            <Text className="text-base font-bold text-gray-900 mb-3">Inmuebles</Text>
            {parte.inmuebles.map((inm, idx) => {
              const isExpanded = expandedInmuebles[idx];
              return (
                <View key={idx} className="mb-3">
                  <Pressable
                    onPress={() => setExpandedInmuebles(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="font-semibold text-gray-900 flex-1">
                        {[inm?.direccion?.calle || inm?.calle, inm?.direccion?.numero || inm?.numero]
                          .filter(Boolean)
                          .join(' ') || `Inmueble #${idx + 1}`}
                      </Text>
                      <Ionicons 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color="#6b7280" 
                      />
                    </View>
                    
                    {/* Grid de 2 columnas para la información */}
                    <View className="flex-row flex-wrap">
                      <View className="w-1/2 pr-1">
                        <InfoRow label="Tipo" value={inm.tipo_construccion} />
                      </View>
                      <View className="w-1/2 pl-1">
                        <InfoRow label="Pisos" value={inm.n_pisos} />
                      </View>
                      <View className="w-1/2 pr-1">
                        <InfoRow label="m² construcción" value={inm.m2_construccion} />
                      </View>
                      <View className="w-1/2 pl-1">
                        <InfoRow label="m² afectado" value={inm.m2_afectado} />
                      </View>
                      <View className="w-full">
                        <InfoRow label="Daños" value={inm.danos_vivienda} />
                      </View>
                      {inm.danos_anexos && (
                        <View className="w-full">
                          <InfoRow label="Daños anexos" value={inm.danos_anexos} />
                        </View>
                      )}
                    </View>
                  </Pressable>
                  
                  {isExpanded && (
                    <View className="mt-2 bg-white border border-gray-300 rounded-lg p-3">
                      {/* Tabla: Dueño/Propietario */}
                      <Text className="text-sm font-bold text-gray-900 mb-2">
                        Dueño / Propietario
                      </Text>
                      {(inm.propietario || inm.dueno) ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                          <View className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                            {/* Encabezado */}
                            <View className="bg-blue-100 flex-row border-b border-gray-200">
                              <Text className="w-32 p-2 text-xs font-semibold text-gray-700">Nombre</Text>
                              <Text className="w-24 p-2 text-xs font-semibold text-gray-700">RUN</Text>
                              <Text className="w-24 p-2 text-xs font-semibold text-gray-700">Teléfono</Text>
                              <Text className="w-16 p-2 text-xs font-semibold text-gray-700">Edad</Text>
                              <Text className="w-28 p-2 text-xs font-semibold text-gray-700">Gravedad</Text>
                            </View>
                            {/* Fila de datos */}
                            <View className="bg-white flex-row">
                              <Text className="w-32 p-2 text-xs text-gray-900">
                                {(inm.propietario?.nombreCompleto || inm.dueno?.nombreCompleto) ?? '-'}
                              </Text>
                              <Text className="w-24 p-2 text-xs text-gray-600">
                                {(inm.propietario?.run || inm.dueno?.run) ?? '-'}
                              </Text>
                              <Text className="w-24 p-2 text-xs text-gray-600">
                                {inm.dueno?.telefono ?? '-'}
                              </Text>
                              <Text className="w-16 p-2 text-xs text-gray-600">
                                {inm.dueno?.edad ?? '-'}
                              </Text>
                              <Text className="w-28 p-2 text-xs text-gray-600">
                                {inm.dueno?.descripcionGravedad ?? '-'}
                              </Text>
                            </View>
                          </View>
                        </ScrollView>
                      ) : (
                        <Text className="text-xs text-gray-500 italic mb-3">Sin datos de propietario</Text>
                      )}

                      {/* Tabla: Habitantes */}
                      <Text className="text-sm font-bold text-gray-900 mb-2">
                        Habitantes
                      </Text>
                      {Array.isArray(inm.habitantes) && inm.habitantes.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                          <View className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Encabezado */}
                            <View className="bg-gray-100 flex-row border-b border-gray-200">
                              <Text className="w-32 p-2 text-xs font-semibold text-gray-700">Nombre</Text>
                              <Text className="w-24 p-2 text-xs font-semibold text-gray-700">RUN</Text>
                              <Text className="w-24 p-2 text-xs font-semibold text-gray-700">Teléfono</Text>
                              <Text className="w-16 p-2 text-xs font-semibold text-gray-700">Edad</Text>
                              <Text className="w-28 p-2 text-xs font-semibold text-gray-700">Gravedad</Text>
                            </View>
                            {/* Filas de datos */}
                            {inm.habitantes.map((hab, hIdx) => (
                              <View 
                                key={hIdx} 
                                className={`flex-row border-b border-gray-100 ${
                                  hIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                }`}
                              >
                                <Text className="w-32 p-2 text-xs text-gray-900">
                                  {hab?.nombreCompleto ?? '-'}
                                </Text>
                                <Text className="w-24 p-2 text-xs text-gray-600">
                                  {hab?.run ?? '-'}
                                </Text>
                                <Text className="w-24 p-2 text-xs text-gray-600">
                                  {hab?.telefono ?? '-'}
                                </Text>
                                <Text className="w-16 p-2 text-xs text-gray-600">
                                  {hab?.edad ?? '-'}
                                </Text>
                                <Text className="w-28 p-2 text-xs text-gray-600">
                                  {hab?.descripcionGravedad ?? '-'}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                      ) : (
                        <Text className="text-xs text-gray-500 italic">Sin habitantes registrados</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Vehículos */}
        {Array.isArray(parte.vehiculos) && parte.vehiculos.length > 0 && (
          <View className="bg-white border-b border-gray-200 p-4">
            <Text className="text-base font-bold text-gray-900 mb-3">Vehículos</Text>
            {parte.vehiculos.map((veh, idx) => {
              const isExpanded = expandedVehiculos[idx];
              const pasajeros = Array.isArray(veh.pasajeros) ? veh.pasajeros : [];
              const ocupantes = [
                veh.chofer ? { ...veh.chofer, esChofer: true, vinculo: 'Chofer' } : null,
                ...pasajeros.map(p => ({ ...p, esChofer: false }))
              ].filter(Boolean);

              return (
                <View key={idx} className="mb-3">
                  <Pressable
                    onPress={() => setExpandedVehiculos(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="font-semibold text-gray-900 flex-1">
                        {[veh.marca, veh.modelo, veh.anio].filter(Boolean).join(' ') || 
                          `Vehículo #${idx + 1}`}
                      </Text>
                      <Ionicons 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color="#6b7280" 
                      />
                    </View>
                    
                    {/* Grid de 2 columnas para la información */}
                    <View className="flex-row flex-wrap">
                      <View className="w-1/2 pr-1">
                        <InfoRow label="Patente" value={veh.patente} />
                      </View>
                      <View className="w-1/2 pl-1">
                        <InfoRow label="Color" value={veh.color} />
                      </View>
                      <View className="w-full">
                        <InfoRow label="Daños" value={veh.danos_vehiculo} />
                      </View>
                    </View>
                  </Pressable>
                  
                  {isExpanded && (
                    <View className="mt-2 bg-white border border-gray-300 rounded-lg p-3">
                      {/* Tabla: Dueño */}
                      <Text className="text-sm font-bold text-gray-900 mb-2">Dueño</Text>
                      {veh.dueno ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                          <View className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                            {/* Encabezado */}
                            <View className="bg-blue-100 flex-row border-b border-gray-200">
                              <Text className="w-32 p-2 text-xs font-semibold text-gray-700">Nombre</Text>
                              <Text className="w-24 p-2 text-xs font-semibold text-gray-700">RUN</Text>
                              <Text className="w-24 p-2 text-xs font-semibold text-gray-700">Teléfono</Text>
                              <Text className="w-16 p-2 text-xs font-semibold text-gray-700">Edad</Text>
                              <Text className="w-28 p-2 text-xs font-semibold text-gray-700">Gravedad</Text>
                              <Text className="w-20 p-2 text-xs font-semibold text-gray-700">Empresa</Text>
                            </View>
                            {/* Fila de datos */}
                            <View className="bg-white flex-row">
                              <Text className="w-32 p-2 text-xs text-gray-900">
                                {veh.dueno?.nombreCompleto ?? '-'}
                              </Text>
                              <Text className="w-24 p-2 text-xs text-gray-600">
                                {veh.dueno?.run ?? '-'}
                              </Text>
                              <Text className="w-24 p-2 text-xs text-gray-600">
                                {veh.dueno?.telefono ?? '-'}
                              </Text>
                              <Text className="w-16 p-2 text-xs text-gray-600">
                                {veh.dueno?.edad ?? '-'}
                              </Text>
                              <Text className="w-28 p-2 text-xs text-gray-600">
                                {veh.dueno?.descripcionGravedad ?? '-'}
                              </Text>
                              <Text className="w-20 p-2 text-xs text-gray-600">
                                {typeof veh.dueno?.esEmpresa === 'boolean' 
                                  ? (veh.dueno.esEmpresa ? 'Sí' : 'No') 
                                  : '-'}
                              </Text>
                            </View>
                          </View>
                        </ScrollView>
                      ) : (
                        <Text className="text-xs text-gray-500 italic mb-3">Sin datos de dueño</Text>
                      )}

                      {/* Tabla: Ocupantes (Chofer y Pasajeros) */}
                      <Text className="text-sm font-bold text-gray-900 mb-2">
                        Ocupantes
                      </Text>
                      {ocupantes.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                          <View className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Encabezado */}
                            <View className="bg-gray-100 flex-row border-b border-gray-200">
                              <Text className="w-20 p-2 text-xs font-semibold text-gray-700">Tipo</Text>
                              <Text className="w-32 p-2 text-xs font-semibold text-gray-700">Nombre</Text>
                              <Text className="w-24 p-2 text-xs font-semibold text-gray-700">RUN</Text>
                              <Text className="w-24 p-2 text-xs font-semibold text-gray-700">Teléfono</Text>
                              <Text className="w-16 p-2 text-xs font-semibold text-gray-700">Edad</Text>
                              <Text className="w-28 p-2 text-xs font-semibold text-gray-700">Gravedad</Text>
                            </View>
                            {/* Filas de datos */}
                            {ocupantes.map((ocu, oIdx) => (
                              <View 
                                key={oIdx} 
                                className={`flex-row border-b border-gray-100 ${
                                  ocu.esChofer 
                                    ? 'bg-yellow-50' 
                                    : (oIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50')
                                }`}
                              >
                                <Text className={`w-20 p-2 text-xs font-bold ${
                                  ocu.esChofer ? 'text-yellow-700' : 'text-gray-600'
                                }`}>
                                  {ocu.esChofer ? 'Chofer' : 'Pasajero'}
                                </Text>
                                <Text className="w-32 p-2 text-xs text-gray-900">
                                  {ocu?.nombreCompleto ?? '-'}
                                </Text>
                                <Text className="w-24 p-2 text-xs text-gray-600">
                                  {ocu?.run ?? '-'}
                                </Text>
                                <Text className="w-24 p-2 text-xs text-gray-600">
                                  {ocu?.telefono ?? '-'}
                                </Text>
                                <Text className="w-16 p-2 text-xs text-gray-600">
                                  {ocu?.edad ?? '-'}
                                </Text>
                                <Text className="w-28 p-2 text-xs text-gray-600">
                                  {ocu?.descripcionGravedad ?? '-'}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                      ) : (
                        <Text className="text-xs text-gray-500 italic">
                          Sin ocupantes registrados
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Material mayor */}
        {Array.isArray(parte.materialMayor) && parte.materialMayor.length > 0 && (
          <View className="bg-white border-b border-gray-200 p-4">
            <Text className="text-base font-bold text-gray-900 mb-3">Material mayor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Encabezado */}
                <View className="bg-gray-100 flex-row border-b border-gray-200">
                  <Text className="w-24 p-2 text-xs font-semibold text-gray-700">Unidad</Text>
                  <Text className="w-32 p-2 text-xs font-semibold text-gray-700">Conductor</Text>
                  <Text className="w-32 p-2 text-xs font-semibold text-gray-700">Jefe unidad</Text>
                  <Text className="w-24 p-2 text-xs font-semibold text-gray-700">Voluntarios</Text>
                  <Text className="w-24 p-2 text-xs font-semibold text-gray-700">KM salida</Text>
                  <Text className="w-24 p-2 text-xs font-semibold text-gray-700">KM llegada</Text>
                </View>
                {/* Filas de datos */}
                {parte.materialMayor.map((mat, idx) => (
                  <View 
                    key={idx} 
                    className={`flex-row border-b border-gray-100 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <Text className="w-24 p-2 text-xs text-gray-900">
                      {mat.unidad?.patente || `#${mat.unidad?.id || '-'}`}
                    </Text>
                    <Text className="w-32 p-2 text-xs text-gray-600">
                      {mat.conductor?.nombreCompleto || `#${mat.conductor?.id || '-'}`}
                    </Text>
                    <Text className="w-32 p-2 text-xs text-gray-600">
                      {mat.jefeUnidad?.nombreCompleto || `#${mat.jefeUnidad?.id || '-'}`}
                    </Text>
                    <Text className="w-24 p-2 text-xs text-gray-600">
                      {mat.voluntarios ?? '-'}
                    </Text>
                    <Text className="w-24 p-2 text-xs text-gray-600">
                      {mat.kmSalida ?? '-'}
                    </Text>
                    <Text className="w-24 p-2 text-xs text-gray-600">
                      {mat.kmLlegada ?? '-'}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Otros servicios */}
        {Array.isArray(parte.otrosServicios) && parte.otrosServicios.length > 0 && (
          <View className="bg-white border-b border-gray-200 p-4">
            <Text className="text-base font-bold text-gray-900 mb-3">
              Otros servicios de emergencia
            </Text>
            {parte.otrosServicios.map((serv, idx) => (
              <View key={idx} className="mb-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                {/* Primera fila: 2 columnas */}
                <View className="flex-row flex-wrap mb-2">
                  <View className="w-1/2 pr-1">
                    <InfoRow label="Servicio" value={serv.servicio?.nombre || '-'} />
                  </View>
                  <View className="w-1/2 pl-1">
                    <InfoRow label="Tipo unidad" value={serv.tipoUnidad} />
                  </View>
                </View>
                
                {/* Segunda fila: 2 columnas */}
                <View className="flex-row flex-wrap mb-2">
                  <View className="w-1/2 pr-1">
                    <InfoRow label="Responsable" value={serv.responsable} />
                  </View>
                  <View className="w-1/2 pl-1">
                    <InfoRow label="Personal" value={serv.personal} />
                  </View>
                </View>
                
                {/* Tercera fila: ancho completo */}
                {serv.observaciones && (
                  <View className="w-full">
                    <InfoRow label="Observaciones" value={serv.observaciones} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Bomberos accidentados */}
        {Array.isArray(parte.accidentados) && parte.accidentados.length > 0 && (
          <View className="bg-white border-b border-gray-200 p-4">
            <Text className="text-base font-bold text-gray-900 mb-3">
              Bomberos accidentados
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View className="border border-red-200 rounded-lg overflow-hidden">
                {/* Encabezado */}
                <View className="bg-red-100 flex-row border-b border-red-200">
                  <Text className="w-32 p-2 text-xs font-semibold text-gray-700">Bombero</Text>
                  <Text className="w-32 p-2 text-xs font-semibold text-gray-700">Compañía</Text>
                  <Text className="w-40 p-2 text-xs font-semibold text-gray-700">Lesiones</Text>
                  <Text className="w-32 p-2 text-xs font-semibold text-gray-700">Constancia</Text>
                  <Text className="w-32 p-2 text-xs font-semibold text-gray-700">Comisaría</Text>
                  <Text className="w-40 p-2 text-xs font-semibold text-gray-700">Acciones</Text>
                </View>
                {/* Filas de datos */}
                {parte.accidentados.map((acc, idx) => (
                  <View 
                    key={idx} 
                    className={`flex-row border-b border-red-100 ${
                      idx % 2 === 0 ? 'bg-red-50' : 'bg-white'
                    }`}
                  >
                    <Text className="w-32 p-2 text-xs text-gray-900">
                      {acc.bombero?.nombreCompleto || `#${acc.bombero?.id || '-'}`}
                    </Text>
                    <Text className="w-32 p-2 text-xs text-gray-600">
                      {acc.compania?.nombre || `#${acc.compania?.id || '-'}`}
                    </Text>
                    <Text className="w-40 p-2 text-xs text-gray-600">
                      {acc.lesiones || '-'}
                    </Text>
                    <Text className="w-32 p-2 text-xs text-gray-600">
                      {acc.constancia || '-'}
                    </Text>
                    <Text className="w-32 p-2 text-xs text-gray-600">
                      {acc.comisaria || '-'}
                    </Text>
                    <Text className="w-40 p-2 text-xs text-gray-600">
                      {acc.acciones || '-'}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Asistencia */}
        {parte.asistencia && (
          <View className="bg-white border-b border-gray-200 p-4 mb-4">
            <Text className="text-base font-bold text-gray-900 mb-3">
              Asistencia a la emergencia
            </Text>
            
            {/* Tabla: En el lugar */}
            <View className="mb-4">
              <Text className="text-sm font-bold text-gray-900 mb-2">En el lugar</Text>
              {Array.isArray(parte.asistencia.lugar) && parte.asistencia.lugar.length > 0 ? (
                <View className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Encabezado de tabla */}
                  <View className="bg-gray-100 flex-row border-b border-gray-200">
                    <Text className="flex-1 p-2 text-xs font-semibold text-gray-700">
                      Nombre
                    </Text>
                    <Text className="w-24 p-2 text-xs font-semibold text-gray-700">
                      RUN
                    </Text>
                  </View>
                  {/* Filas de datos */}
                  {parte.asistencia.lugar.map((bombero, idx) => (
                    <View 
                      key={idx} 
                      className={`flex-row border-b border-gray-100 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <Text className="flex-1 p-2 text-xs text-gray-900">
                        {bombero?.nombreCompleto || `#${bombero?.id || ''}`}
                      </Text>
                      <Text className="w-24 p-2 text-xs text-gray-600">
                        {bombero?.run || '-'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-xs text-gray-500 italic">
                  Sin bomberos registrados en el lugar
                </Text>
              )}
            </View>

            {/* Tabla: En cuartel */}
            <View>
              <Text className="text-sm font-bold text-gray-900 mb-2">En cuartel</Text>
              {Array.isArray(parte.asistencia.cuartel) && parte.asistencia.cuartel.length > 0 ? (
                <View className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Encabezado de tabla */}
                  <View className="bg-gray-100 flex-row border-b border-gray-200">
                    <Text className="flex-1 p-2 text-xs font-semibold text-gray-700">
                      Nombre
                    </Text>
                    <Text className="w-24 p-2 text-xs font-semibold text-gray-700">
                      RUN
                    </Text>
                  </View>
                  {/* Filas de datos */}
                  {parte.asistencia.cuartel.map((bombero, idx) => (
                    <View 
                      key={idx} 
                      className={`flex-row border-b border-gray-100 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <Text className="flex-1 p-2 text-xs text-gray-900">
                        {bombero?.nombreCompleto || `#${bombero?.id || ''}`}
                      </Text>
                      <Text className="w-24 p-2 text-xs text-gray-600">
                        {bombero?.run || '-'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-xs text-gray-500 italic">
                  Sin bomberos registrados en cuartel
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente auxiliar para mostrar filas de sección con iconos
const SectionRow = ({ icon, label, value }) => (
  <View className="flex-row items-center py-2 border-b border-gray-100">
    <Ionicons name={icon} size={20} color="#6b7280" />
    <Text className="ml-3 text-xs font-semibold text-gray-600 flex-shrink-0 w-32">{label}:</Text>
    <Text className="text-sm text-gray-900 flex-1">{value || '-'}</Text>
  </View>
);

// Componente auxiliar para mostrar información simple
const InfoRow = ({ label, value }) => (
  <View className="flex-row justify-between py-1">
    <Text className="text-xs font-semibold text-gray-600">{label}:</Text>
    <Text className="text-xs text-gray-900 flex-1 ml-2">
      {value !== null && value !== undefined ? String(value) : '-'}
    </Text>
  </View>
);
