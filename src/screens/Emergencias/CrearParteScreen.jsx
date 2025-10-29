import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { authService } from '../../services/authService';
import { crearParteEmergencia } from '../../services/parteEmergencia.service';
import { getCompaniaById, getCompanias } from '../../services/compania.service';
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

// Helpers
const genId = () => Math.random().toString(36).slice(2, 10);

const normalizeArray = (res, nestedKey) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (nestedKey && Array.isArray(res?.data?.[nestedKey])) return res.data[nestedKey];
  return [];
};

const nombreBombero = (b) => {
  const n = [b.nombres, b.apellidos].filter(Boolean).join(' ').trim();
  return n || `Bombero ${b.id}`;
};

// Formateadores
const toYYYYMMDD = (d) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};
const toHHMM = (d) => {
  if (!d) return '';
  if (typeof d === 'string') return d.length >= 5 ? d.slice(0,5) : d;
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

// Campos reutilizables
const FieldLabel = ({ children, required }) => (
  <Text className="text-sm font-semibold text-gray-700 mb-1">
    {children} {required ? <Text className="text-red-500">*</Text> : null}
  </Text>
);

const DateField = ({ label, value, onChange, error }) => {
  const [show, setShow] = useState(false);
  const display = value ? toYYYYMMDD(value) : '';
  return (
    <View className="mb-4">
      <FieldLabel required>{label}</FieldLabel>
      <TouchableOpacity
        onPress={() => setShow(true)}
        className={`border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 bg-white`}
      >
        <Text className={display ? 'text-gray-900' : 'text-gray-400'}>
          {display || 'Selecciona fecha'}
        </Text>
      </TouchableOpacity>
      {show && Platform.OS !== 'web' && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={(e, date) => {
            setShow(false);
            if (date) onChange(toYYYYMMDD(date));
          }}
        />
      )}
      {Platform.OS === 'web' && show && (
        <TextInput
          autoFocus
          className={`mt-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2`}
          placeholder="YYYY-MM-DD"
          value={display}
          onChangeText={onChange}
          onBlur={() => setShow(false)}
        />
      )}
      {error ? <Text className="text-red-500 text-xs mt-1">{error}</Text> : null}
    </View>
  );
};

const TimeField = ({ label, value, onChange, error }) => {
  const [show, setShow] = useState(false);
  const display = value ? toHHMM(value) : '';
  return (
    <View className="mb-4">
      <FieldLabel required={false}>{label}</FieldLabel>
      <TouchableOpacity
        onPress={() => setShow(true)}
        className={`border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 bg-white`}
      >
        <Text className={display ? 'text-gray-900' : 'text-gray-400'}>
          {display || 'Selecciona hora'}
        </Text>
      </TouchableOpacity>
      {show && Platform.OS !== 'web' && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(e, date) => {
            setShow(false);
            if (date) onChange(toHHMM(date));
          }}
        />
      )}
      {Platform.OS === 'web' && show && (
        <TextInput
          autoFocus
          className={`mt-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2`}
          placeholder="HH:MM"
          value={display}
          onChangeText={onChange}
          onBlur={() => setShow(false)}
        />
      )}
      {error ? <Text className="text-red-500 text-xs mt-1">{error}</Text> : null}
    </View>
  );
};

const SelectField = ({ label, selectedValue, onValueChange, options, placeholder, error }) => (
  <View className="mb-4">
    <FieldLabel required>{label}</FieldLabel>
    <View className={`border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg overflow-hidden bg-white`}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={(val) => onValueChange(val)}
      >
        <Picker.Item label={placeholder} value="" />
        {options.map(opt => (
          <Picker.Item key={String(opt.value)} label={String(opt.label)} value={String(opt.value)} />
        ))}
      </Picker>
    </View>
    {error ? <Text className="text-red-500 text-xs mt-1">{error}</Text> : null}
  </View>
);

const RadioChipsField = ({ label, selectedValue, onValueChange, options, error }) => (
  <View className="mb-4">
    <FieldLabel required>{label}</FieldLabel>
    <View className="flex-row flex-wrap gap-2 mt-2">
      {options.map(opt => {
        const isSelected = String(selectedValue) === String(opt.value);
        return (
          <TouchableOpacity
            key={String(opt.value)}
            onPress={() => onValueChange(String(opt.value))}
            className={`px-4 py-2 rounded-full border-2 ${
              isSelected 
                ? 'bg-blue-600 border-blue-600' 
                : 'bg-white border-gray-300'
            }`}
          >
            <Text className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
              {String(opt.label)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
    {error ? <Text className="text-red-500 text-xs mt-1">{error}</Text> : null}
  </View>
);

export default function CrearParteScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Tabs
  const [activeTab, setActiveTab] = useState(0);
  
  // Catálogos
  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [companias, setCompanias] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [subtipos, setSubtipos] = useState([]);
  const [tiposDano, setTiposDano] = useState([]);
  const [fasesIncidente, setFasesIncidente] = useState([]);
  const [bomberos, setBomberos] = useState([]);
  const [carros, setCarros] = useState([]);
  const [servicios, setServicios] = useState([]);
  
  // Campos del formulario
  const [companiaId, setCompaniaId] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaDespacho, setHoraDespacho] = useState('');
  const [hora60, setHora60] = useState('');
  const [hora63, setHora63] = useState('');
  const [hora69, setHora69] = useState('');
  const [hora610, setHora610] = useState('');
  const [descripcionPreliminar, setDescripcionPreliminar] = useState('');
  const [bomberoACargoId, setBomberoACargoId] = useState('');
  
  // Dirección
  const [regionId, setRegionId] = useState('');
  const [comunaId, setComunaId] = useState('');
  const [calle, setCalle] = useState('');
  const [numero, setNumero] = useState('');
  const [depto, setDepto] = useState('');
  const [referencia, setReferencia] = useState('');
  
  // Tipo de emergencia
  const [clasificacionId, setClasificacionId] = useState('');
  const [subtipoId, setSubtipoId] = useState('');
  const [tipoIncendioId, setTipoIncendioId] = useState('');
  const [faseId, setFaseId] = useState('');
  
  // Secciones dinámicas
  const [inmuebles, setInmuebles] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [materialMayor, setMaterialMayor] = useState([]);
  const [accidentados, setAccidentados] = useState([]);
  const [otrosServicios, setOtrosServicios] = useState([]);
  
  // Asistencia
  const [asistenciaLugar, setAsistenciaLugar] = useState({});
  const [asistenciaCuartel, setAsistenciaCuartel] = useState({});
  
  // Errores
  const [errors, setErrors] = useState({});

  // Cargar usuario
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getUserData();
        setUser(userData);
        
          // Si el usuario tiene compañía, autoseleccionarla
          if (userData?.compania?.id) {
            setCompaniaId(String(userData.compania.id));
          }
        
        // Cargar catálogos iniciales
        await loadInitialData();
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        Alert.alert('Error', 'No se pudo cargar la información del usuario');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const loadInitialData = async () => {
    try {
      const [regionesData, clasificacionesData, tiposDanoData, fasesData, serviciosData, companiasData] = await Promise.all([
        getRegiones().catch(() => []),
        getClasificacionesEmergencia().catch(() => []),
        getTiposDano().catch(() => []),
        getFasesIncidente().catch(() => []),
        getServicios().catch(() => []),
        getCompanias().catch(() => []),
      ]);

      setRegiones(normalizeArray(regionesData));
      setClasificaciones(normalizeArray(clasificacionesData));
      setTiposDano(normalizeArray(tiposDanoData));
      setFasesIncidente(normalizeArray(fasesData));
      setServicios(normalizeArray(serviciosData));
      setCompanias(normalizeArray(companiasData, 'data'));
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  };

  // Cargar comunas cuando cambia la región
  useEffect(() => {
    if (regionId) {
      getComunas(regionId)
        .then(data => setComunas(normalizeArray(data)))
        .catch(() => setComunas([]));
    } else {
      setComunas([]);
      setComunaId('');
    }
  }, [regionId]);

  // Cargar subtipos cuando cambia la clasificación
  useEffect(() => {
    if (clasificacionId) {
      getSubtiposIncidente(clasificacionId)
        .then(data => setSubtipos(normalizeArray(data)))
        .catch(() => setSubtipos([]));
    } else {
      setSubtipos([]);
      setSubtipoId('');
    }
  }, [clasificacionId]);

  // Cargar bomberos y carros cuando cambia la compañía
  useEffect(() => {
    if (companiaId) {
      Promise.all([
        getBomberosPorCompania(companiaId).catch(() => []),
        getCarrosByCompania(companiaId).catch(() => []),
      ]).then(([bomberosData, carrosData]) => {
        setBomberos(normalizeArray(bomberosData));
        setCarros(normalizeArray(carrosData));
      });
      
      // Reset asistencia
      setAsistenciaLugar({});
      setAsistenciaCuartel({});
    } else {
      setBomberos([]);
      setCarros([]);
    }
  }, [companiaId]);

  // Validación
  const validate = () => {
    const newErrors = {};

    // Tab 1: Datos generales
    if (!companiaId) newErrors.companiaId = 'Seleccione una compañía';
    if (!fecha) newErrors.fecha = 'Ingrese la fecha';
    if (!horaDespacho) newErrors.horaDespacho = 'Ingrese la hora de despacho';
    if (!hora60) newErrors.hora60 = 'Ingrese la hora 6-0';
    if (!regionId) newErrors.regionId = 'Seleccione una región';
    if (!comunaId) newErrors.comunaId = 'Seleccione una comuna';
    if (!calle || !calle.trim()) newErrors.calle = 'Ingrese la calle';
    if (!bomberoACargoId) newErrors.bomberoACargoId = 'Seleccione el bombero a cargo';

    // Tab 2: Tipo de emergencia
    if (!clasificacionId) newErrors.clasificacionId = 'Seleccione una clasificación';
    if (!subtipoId) newErrors.subtipoId = 'Seleccione un subtipo';

    const selectedSubtipo = subtipos.find(s => s.id === parseInt(subtipoId));
    
    // Validar inmuebles si el subtipo los requiere
    if (selectedSubtipo?.contieneInmuebles && inmuebles.length === 0) {
      newErrors.inmuebles = 'Agregue al menos un inmueble';
    }
    
    // Validar vehículos si el subtipo los requiere
    if (selectedSubtipo?.contieneVehiculos && vehiculos.length === 0) {
      newErrors.vehiculos = 'Agregue al menos un vehículo';
    }

    // Tab 3: Material mayor
    if (materialMayor.length === 0) {
      newErrors.materialMayor = 'Agregue al menos una unidad';
    }

    // Tab 5: Asistencia
    const lugarIds = Object.keys(asistenciaLugar).filter(k => asistenciaLugar[k]);
    if (lugarIds.length === 0) {
      newErrors.asistenciaLugar = 'Seleccione al menos un bombero en el lugar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Error de validación', 'Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        idRedactor: user.id,
        companiaId: parseInt(companiaId),
        fecha,
        horaDespacho,
        hora6_0: hora60,
        hora6_3: hora63 || null,
        hora6_9: hora69 || null,
        hora6_10: hora610 || null,
        descripcionPreliminar: descripcionPreliminar.trim() || null,
        idBomberoACargo: parseInt(bomberoACargoId),
        direccion: {
          regionId: parseInt(regionId),
          comunaId: parseInt(comunaId),
          calle: calle.trim(),
          numero: numero.trim() || null,
          depto: depto.trim() || null,
          referencia: referencia.trim() || null,
        },
        clasificacionId: parseInt(clasificacionId),
        subtipoId: parseInt(subtipoId),
        incendio: tipoIncendioId ? {
          tipoId: parseInt(tipoIncendioId),
          faseId: faseId ? parseInt(faseId) : null,
        } : null,
        inmuebles: inmuebles.map(inm => ({
          tipo_construccion: inm.tipo_construccion || null,
          n_pisos: inm.n_pisos ? parseInt(inm.n_pisos) : null,
          m2_construccion: inm.m2_construccion ? parseFloat(inm.m2_construccion) : null,
          m2_afectado: inm.m2_afectado ? parseFloat(inm.m2_afectado) : null,
          danos_vivienda: inm.danos_vivienda || null,
          danos_anexos: inm.danos_anexos || null,
          calle: inm.calle?.trim() || null,
          numero: inm.numero?.trim() || null,
          dueno: inm.dueno ? {
            nombres: inm.dueno.nombres?.trim() || null,
            apellidos: inm.dueno.apellidos?.trim() || null,
            run: inm.dueno.run?.trim() || null,
            telefono: inm.dueno.telefono?.trim() || null,
          } : null,
          habitantes: inm.habitantes.map(h => ({
            nombres: h.nombres?.trim() || null,
            apellidos: h.apellidos?.trim() || null,
            run: h.run?.trim() || null,
            edad: h.edad ? parseInt(h.edad) : null,
          })),
        })),
        vehiculos: vehiculos.map(veh => ({
          patente: veh.patente?.trim() || null,
          marca: veh.marca?.trim() || null,
          modelo: veh.modelo?.trim() || null,
          anio: veh.anio ? parseInt(veh.anio) : null,
          color: veh.color?.trim() || null,
          danos_vehiculo: veh.danos_vehiculo?.trim() || null,
          dueno: veh.dueno ? {
            nombres: veh.dueno.nombres?.trim() || null,
            apellidos: veh.dueno.apellidos?.trim() || null,
            run: veh.dueno.run?.trim() || null,
            telefono: veh.dueno.telefono?.trim() || null,
          } : null,
          chofer: veh.chofer ? {
            nombres: veh.chofer.nombres?.trim() || null,
            apellidos: veh.chofer.apellidos?.trim() || null,
            run: veh.chofer.run?.trim() || null,
            edad: veh.chofer.edad ? parseInt(veh.chofer.edad) : null,
          } : null,
          pasajeros: veh.pasajeros.map(p => ({
            nombres: p.nombres?.trim() || null,
            apellidos: p.apellidos?.trim() || null,
            run: p.run?.trim() || null,
            edad: p.edad ? parseInt(p.edad) : null,
          })),
        })),
        materialMayor: materialMayor.map(m => ({
          unidadId: parseInt(m.unidadId),
          conductorId: m.conductorId ? parseInt(m.conductorId) : null,
          jefeUnidadId: m.bomberoId ? parseInt(m.bomberoId) : null,
          voluntarios: m.voluntarios ? parseInt(m.voluntarios) : null,
          kmSalida: m.kmSalida ? parseFloat(m.kmSalida) : null,
          kmLlegada: m.kmLlegada ? parseFloat(m.kmLlegada) : null,
        })),
        accidentados: accidentados.map(a => ({
          companiaId: parseInt(a.companiaId),
          bomberoId: parseInt(a.bomberoId),
          lesiones: a.lesiones?.trim() || null,
          constancia: a.constancia?.trim() || null,
          comisaria: a.comisaria?.trim() || null,
          acciones: a.acciones?.trim() || null,
        })),
        otrosServicios: otrosServicios.map(s => ({
          servicioId: parseInt(s.servicioId),
          tipoUnidad: s.tipoUnidad?.trim() || null,
          responsable: s.responsable?.trim() || null,
          personal: s.personal ? parseInt(s.personal) : null,
          observaciones: s.observaciones?.trim() || null,
        })),
        asistencia: {
          lugar: Object.keys(asistenciaLugar).filter(k => asistenciaLugar[k]).map(id => parseInt(id)),
          cuartel: Object.keys(asistenciaCuartel).filter(k => asistenciaCuartel[k]).map(id => parseInt(id)),
        },
      };

      await crearParteEmergencia(payload);
      
      Alert.alert(
        'Éxito',
        'Parte de emergencia creado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error al crear parte:', error);
      Alert.alert('Error', error?.message || 'No se pudo crear el parte de emergencia');
    } finally {
      setSubmitting(false);
    }
  };

  // Funciones para manejar inmuebles
  const addInmueble = () => {
    setInmuebles(prev => [...prev, {
      id: genId(),
      tipo_construccion: '',
      n_pisos: '',
      m2_construccion: '',
      m2_afectado: '',
      danos_vivienda: '',
      danos_anexos: '',
      calle: '',
      numero: '',
      dueno: null,
      habitantes: [],
    }]);
  };

  const removeInmueble = (idx) => {
    setInmuebles(prev => prev.filter((_, i) => i !== idx));
  };

  // Funciones para manejar vehículos
  const addVehiculo = () => {
    setVehiculos(prev => [...prev, {
      id: genId(),
      patente: '',
      marca: '',
      modelo: '',
      anio: '',
      color: '',
      danos_vehiculo: '',
      dueno: null,
      chofer: null,
      pasajeros: [],
    }]);
  };

  const removeVehiculo = (idx) => {
    setVehiculos(prev => prev.filter((_, i) => i !== idx));
  };

  // Funciones para manejar material mayor
  const addUnidad = () => {
    setMaterialMayor(prev => [...prev, {
      id: genId(),
      unidadId: '',
      conductorId: '',
      bomberoId: '',
      voluntarios: '',
      kmSalida: '',
      kmLlegada: '',
    }]);
  };

  const removeUnidad = (idx) => {
    setMaterialMayor(prev => prev.filter((_, i) => i !== idx));
  };

  const updateUnidad = (idx, field, value) => {
    setMaterialMayor(prev => prev.map((item, i) => 
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  // Funciones para manejar accidentados
  const addAccidentado = () => {
    setAccidentados(prev => [...prev, {
      id: genId(),
      companiaId: '',
      bomberoId: '',
      lesiones: '',
      constancia: '',
      comisaria: '',
      acciones: '',
    }]);
  };

  const removeAccidentado = (idx) => {
    setAccidentados(prev => prev.filter((_, i) => i !== idx));
  };

  // Funciones para manejar otros servicios
  const addOtroServicio = () => {
    setOtrosServicios(prev => [...prev, {
      id: genId(),
      servicioId: '',
      tipoUnidad: '',
      responsable: '',
      personal: '',
      observaciones: '',
    }]);
  };

  const removeOtroServicio = (idx) => {
    setOtrosServicios(prev => prev.filter((_, i) => i !== idx));
  };

  // Toggle asistencia
  const toggleLugar = (id, checked) => {
    setAsistenciaLugar(prev => ({ ...prev, [id]: checked }));
    if (checked) setAsistenciaCuartel(prev => ({ ...prev, [id]: false }));
  };

  const toggleCuartel = (id, checked) => {
    setAsistenciaCuartel(prev => ({ ...prev, [id]: checked }));
    if (checked) setAsistenciaLugar(prev => ({ ...prev, [id]: false }));
  };

  const selectedSubtipo = subtipos.find(s => s.id === parseInt(subtipoId));
  const hasFuego = !!selectedSubtipo?.contieneFuego;
  const hasInmuebles = !!selectedSubtipo?.contieneInmuebles;
  const hasVehiculos = !!selectedSubtipo?.contieneVehiculos;

  const tabs = [
    { key: 'general', label: 'Datos Generales' },
    { key: 'tipo', label: 'Tipo de Emergencia' },
    { key: 'material', label: 'Material Mayor' },
    { key: 'otros', label: 'Accidentados y Servicios' },
    { key: 'asistencia', label: 'Asistencia' },
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Cargando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-600 px-4 py-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Nuevo Parte de Emergencia</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Tabs compactos (chip style) */}
{/* Tabs horizontales scrolleables tipo pestaña */}
<View className="bg-white border-b border-gray-200 z-10">
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}
  >
    {tabs.map((tab, idx) => {
      const isActive = activeTab === idx;
      return (
        <TouchableOpacity
          key={tab.key}
          onPress={() => setActiveTab(idx)}
          accessibilityRole="tab"
          accessibilityState={{ selected: isActive }}
          className="items-center justify-center py-3 px-3 rounded-t-md"
          style={{ minWidth: 96 }} // evita que se aplasten/solapen
        >
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className={`text-[12px] leading-none ${
              isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'
            }`}
          >
            {tab.label}
          </Text>

          {/* Indicador inferior */}
          <View
            className={`h-0.5 w-full rounded-full mt-1 ${
              isActive ? 'bg-blue-600' : 'bg-transparent'
            }`}
          />
        </TouchableOpacity>
      );
    })}
  </ScrollView>
</View>



      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
  <ScrollView className="flex-1 px-4 py-4 pb-24">
          {/* Tab 1: Datos Generales */}
          {activeTab === 0 && (
            <View>
              <Text className="text-lg font-bold text-gray-900 mb-4">Datos Generales y Dirección</Text>
              
              {/* Compañía */}
              <SelectField
                label="Compañía"
                selectedValue={companiaId}
                onValueChange={setCompaniaId}
                options={companias.map(c => ({ value: c.id, label: c.nombre || `Compañía #${c.id}` }))}
                placeholder="Seleccione compañía"
                error={errors.companiaId}
              />

              {/* Fecha y Hora Despacho en 2 columnas */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <DateField label="Fecha" value={fecha} onChange={setFecha} error={errors.fecha} />
                </View>
                <View className="flex-1">
                  <TimeField label="Hora Despacho" value={horaDespacho} onChange={setHoraDespacho} error={errors.horaDespacho} />
                </View>
              </View>

              {/* Horas 6-0 y 6-3 en 2 columnas */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <TimeField label="Hora 6-0" value={hora60} onChange={setHora60} error={errors.hora60} />
                </View>
                <View className="flex-1">
                  <TimeField label="Hora 6-3" value={hora63} onChange={setHora63} />
                </View>
              </View>

              {/* Horas 6-9 y 6-10 en 2 columnas */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <TimeField label="Hora 6-9" value={hora69} onChange={setHora69} />
                </View>
                <View className="flex-1">
                  <TimeField label="Hora 6-10" value={hora610} onChange={setHora610} />
                </View>
              </View>

              {/* Descripción Preliminar */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-1">Descripción Preliminar</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Descripción breve del incidente"
                  value={descripcionPreliminar}
                  onChangeText={setDescripcionPreliminar}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Bombero a Cargo */}
              <SelectField
                label="Bombero a Cargo"
                selectedValue={bomberoACargoId}
                onValueChange={setBomberoACargoId}
                options={bomberos.map(b => ({ value: b.id, label: nombreBombero(b) }))}
                placeholder="Seleccione un bombero"
                error={errors.bomberoACargoId}
              />

              {/* Dirección */}
              <Text className="text-lg font-bold text-gray-900 mb-4 mt-6">Dirección</Text>

              {/* Región y Comuna en 2 columnas */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <SelectField
                    label="Región"
                    selectedValue={regionId}
                    onValueChange={setRegionId}
                    options={regiones.map(r => ({ value: r.id, label: r.nombre }))}
                    placeholder="Seleccione región"
                    error={errors.regionId}
                  />
                </View>
                <View className="flex-1">
                  {regionId ? (
                    <SelectField
                      label="Comuna"
                      selectedValue={comunaId}
                      onValueChange={setComunaId}
                      options={comunas.map(c => ({ value: c.id, label: c.nombre }))}
                      placeholder="Seleccione comuna"
                      error={errors.comunaId}
                    />
                  ) : null}
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-1">
                  Calle <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`border ${errors.calle ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2`}
                  placeholder="Nombre de la calle"
                  value={calle}
                  onChangeText={setCalle}
                />
                {errors.calle && (
                  <Text className="text-red-500 text-xs mt-1">{errors.calle}</Text>
                )}
              </View>

              {/* Número y Depto en 2 columnas */}
              <View className="flex-row gap-3">
                <View className="flex-1 mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-1">Número</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Número"
                    value={numero}
                    onChangeText={setNumero}
                  />
                </View>
                <View className="flex-1 mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-1">Depto</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Departamento"
                    value={depto}
                    onChangeText={setDepto}
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-1">Referencia</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Referencia"
                  value={referencia}
                  onChangeText={setReferencia}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          )}

          {/* Tab 2: Tipo de Emergencia */}
          {activeTab === 1 && (
            <View>
              <Text className="text-lg font-bold text-gray-900 mb-4">Tipo de Emergencia</Text>
              
              <RadioChipsField
                label="Clasificación"
                selectedValue={clasificacionId}
                onValueChange={setClasificacionId}
                options={clasificaciones.map(c => ({ value: c.id, label: c.nombre }))}
                error={errors.clasificacionId}
              />

              {clasificacionId && (
                <SelectField
                  label="Subtipo"
                  selectedValue={subtipoId}
                  onValueChange={setSubtipoId}
                  options={subtipos.map(s => ({ value: s.id, label: s.claveRadial ? `${s.claveRadial} - ${s.descripcion}` : s.descripcion }))}
                  placeholder="Seleccione subtipo"
                  error={errors.subtipoId}
                />
              )}

              {hasFuego && (
                <>
                  <Text className="text-lg font-bold text-gray-900 mb-4 mt-6">Características del Incendio</Text>
                  
                  <SelectField
                    label="Tipo de Daño"
                    selectedValue={tipoIncendioId}
                    onValueChange={setTipoIncendioId}
                    options={tiposDano.map(t => ({ value: t.id, label: t.nombre }))}
                    placeholder="Seleccione tipo de daño"
                  />

                  <SelectField
                    label="Fase"
                    selectedValue={faseId}
                    onValueChange={setFaseId}
                    options={fasesIncidente.map(f => ({ value: f.id, label: f.nombre }))}
                    placeholder="Seleccione fase"
                  />
                </>
              )}

              {hasInmuebles && (
                <>
                  <Text className="text-lg font-bold text-gray-900 mb-4 mt-6">Inmuebles Afectados</Text>
                  {errors.inmuebles && (
                    <Text className="text-red-500 text-sm mb-2">{errors.inmuebles}</Text>
                  )}
                  <TouchableOpacity
                    onPress={addInmueble}
                    className="bg-green-600 rounded-lg py-3 items-center mb-4"
                  >
                    <Text className="text-white font-semibold">+ Agregar Inmueble</Text>
                  </TouchableOpacity>
                  {inmuebles.map((inm, idx) => (
                    <View key={inm.id} className="bg-gray-50 rounded-lg p-3 mb-3">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="font-bold text-gray-700">Inmueble {idx + 1}</Text>
                        <TouchableOpacity onPress={() => removeInmueble(idx)}>
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-xs text-gray-500 mb-2">
                        (Campos básicos - implementar completo según necesidad)
                      </Text>
                    </View>
                  ))}
                </>
              )}

              {hasVehiculos && (
                <>
                  <Text className="text-lg font-bold text-gray-900 mb-4 mt-6">Vehículos Afectados</Text>
                  {errors.vehiculos && (
                    <Text className="text-red-500 text-sm mb-2">{errors.vehiculos}</Text>
                  )}
                  <TouchableOpacity
                    onPress={addVehiculo}
                    className="bg-green-600 rounded-lg py-3 items-center mb-4"
                  >
                    <Text className="text-white font-semibold">+ Agregar Vehículo</Text>
                  </TouchableOpacity>
                  {vehiculos.map((veh, idx) => (
                    <View key={veh.id} className="bg-gray-50 rounded-lg p-3 mb-3">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="font-bold text-gray-700">Vehículo {idx + 1}</Text>
                        <TouchableOpacity onPress={() => removeVehiculo(idx)}>
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-xs text-gray-500 mb-2">
                        (Campos básicos - implementar completo según necesidad)
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          {/* Tab 3: Material Mayor */}
          {activeTab === 2 && (
            <View>
              <Text className="text-lg font-bold text-gray-900 mb-4">Material Mayor</Text>
              {errors.materialMayor && (
                <Text className="text-red-500 text-sm mb-2">{errors.materialMayor}</Text>
              )}
              
              <TouchableOpacity
                onPress={addUnidad}
                className="bg-green-600 rounded-lg py-3 items-center mb-4"
              >
                <Text className="text-white font-semibold">+ Agregar Unidad</Text>
              </TouchableOpacity>

              {materialMayor.map((unidad, idx) => (
                <View key={unidad.id} className="bg-gray-50 rounded-lg p-3 mb-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-bold text-gray-700">Unidad {idx + 1}</Text>
                    <TouchableOpacity onPress={() => removeUnidad(idx)}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <SelectField
                    label="Carro"
                    selectedValue={unidad.unidadId}
                    onValueChange={(val) => updateUnidad(idx, 'unidadId', val)}
                    options={carros.map(c => ({ value: c.id, label: c.patente || `Carro #${c.id}` }))}
                    placeholder="Seleccione carro"
                  />

                  <SelectField
                    label="Conductor"
                    selectedValue={unidad.conductorId}
                    onValueChange={(val) => updateUnidad(idx, 'conductorId', val)}
                    options={bomberos.map(b => ({ value: b.id, label: nombreBombero(b) }))}
                    placeholder="Seleccione conductor"
                  />

                  <SelectField
                    label="Jefe de Unidad"
                    selectedValue={unidad.bomberoId}
                    onValueChange={(val) => updateUnidad(idx, 'bomberoId', val)}
                    options={bomberos.map(b => ({ value: b.id, label: nombreBombero(b) }))}
                    placeholder="Seleccione jefe de unidad"
                  />

                  <View className="mb-3">
                    <Text className="text-sm font-semibold text-gray-700 mb-1">Voluntarios</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Número de voluntarios"
                      value={unidad.voluntarios}
                      onChangeText={(val) => updateUnidad(idx, 'voluntarios', val)}
                      keyboardType="numeric"
                    />
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-1">KM Salida</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="KM"
                        value={unidad.kmSalida}
                        onChangeText={(val) => updateUnidad(idx, 'kmSalida', val)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-1">KM Llegada</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="KM"
                        value={unidad.kmLlegada}
                        onChangeText={(val) => updateUnidad(idx, 'kmLlegada', val)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Tab 4: Accidentados y Otros Servicios */}
          {activeTab === 3 && (
            <View>
              <Text className="text-lg font-bold text-gray-900 mb-4">Bomberos Accidentados</Text>
              
              <TouchableOpacity
                onPress={addAccidentado}
                className="bg-orange-600 rounded-lg py-3 items-center mb-4"
              >
                <Text className="text-white font-semibold">+ Agregar Accidentado</Text>
              </TouchableOpacity>

              {accidentados.map((acc, idx) => (
                <View key={acc.id} className="bg-red-50 rounded-lg p-3 mb-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-bold text-gray-700">Accidentado {idx + 1}</Text>
                    <TouchableOpacity onPress={() => removeAccidentado(idx)}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-xs text-gray-500">
                    (Implementar campos según necesidad)
                  </Text>
                </View>
              ))}

              <Text className="text-lg font-bold text-gray-900 mb-4 mt-6">Otros Servicios</Text>
              
              <TouchableOpacity
                onPress={addOtroServicio}
                className="bg-purple-600 rounded-lg py-3 items-center mb-4"
              >
                <Text className="text-white font-semibold">+ Agregar Servicio</Text>
              </TouchableOpacity>

              {otrosServicios.map((serv, idx) => (
                <View key={serv.id} className="bg-purple-50 rounded-lg p-3 mb-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-bold text-gray-700">Servicio {idx + 1}</Text>
                    <TouchableOpacity onPress={() => removeOtroServicio(idx)}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-xs text-gray-500">
                    (Implementar campos según necesidad)
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Tab 5: Asistencia */}
          {activeTab === 4 && (
            <View>
              <Text className="text-lg font-bold text-gray-900 mb-4">Asistencia a la Emergencia</Text>
              {errors.asistenciaLugar && (
                <Text className="text-red-500 text-sm mb-2">{errors.asistenciaLugar}</Text>
              )}
              
              <Text className="text-base font-semibold text-gray-800 mb-2">En el Lugar</Text>
              <View className="bg-blue-50 rounded-lg p-3 mb-4">
                {bomberos.length === 0 ? (
                  <Text className="text-gray-500">No hay bomberos disponibles</Text>
                ) : (
                  bomberos.map(b => (
                    <View key={b.id} className="flex-row items-center justify-between py-2 border-b border-blue-100">
                      <Text className="text-gray-700">{nombreBombero(b)}</Text>
                      <TouchableOpacity
                        onPress={() => toggleLugar(String(b.id), !asistenciaLugar[b.id])}
                        className={`w-12 h-6 rounded-full ${
                          asistenciaLugar[b.id] ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <View
                          className={`w-5 h-5 rounded-full bg-white m-0.5 ${
                            asistenciaLugar[b.id] ? 'self-end' : 'self-start'
                          }`}
                        />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              <Text className="text-base font-semibold text-gray-800 mb-2">En Cuartel</Text>
              <View className="bg-green-50 rounded-lg p-3 mb-4">
                {bomberos.length === 0 ? (
                  <Text className="text-gray-500">No hay bomberos disponibles</Text>
                ) : (
                  bomberos.map(b => (
                    <View key={b.id} className="flex-row items-center justify-between py-2 border-b border-green-100">
                      <Text className="text-gray-700">{nombreBombero(b)}</Text>
                      <TouchableOpacity
                        onPress={() => toggleCuartel(String(b.id), !asistenciaCuartel[b.id])}
                        className={`w-12 h-6 rounded-full ${
                          asistenciaCuartel[b.id] ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <View
                          className={`w-5 h-5 rounded-full bg-white m-0.5 ${
                            asistenciaCuartel[b.id] ? 'self-end' : 'self-start'
                          }`}
                        />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Footer fijo con botones de navegación siempre visibles */}
      <View className="border-t border-gray-200 p-4 bg-white">
        <View className="flex-row gap-2">
          {activeTab > 0 && (
            <TouchableOpacity
              onPress={() => setActiveTab(prev => prev - 1)}
              className="flex-1 bg-gray-600 rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">Anterior</Text>
            </TouchableOpacity>
          )}
          {activeTab < tabs.length - 1 ? (
            <TouchableOpacity
              onPress={() => setActiveTab(prev => prev + 1)}
              className="flex-1 bg-blue-600 rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">Siguiente</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className={`flex-1 rounded-lg py-3 items-center ${
                submitting ? 'bg-gray-400' : 'bg-green-600'
              }`}
            >
              <Text className="text-white font-semibold">
                {submitting ? 'Guardando...' : 'Guardar Parte'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
