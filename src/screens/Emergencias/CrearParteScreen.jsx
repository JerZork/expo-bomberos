import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { authService } from '../../services/authService';
import { crearParteEmergencia } from '../../services/parteEmergencia.service';
import { getRegiones, getComunas } from '../../services/region.service';
import { 
  getClasificacionesEmergencia, 
  getSubtiposIncidente, 
  getTiposDano, 
  getFasesIncidente 
} from '../../services/subtipoIncidente.service';
import { getBomberosPorCompania, getBomberosConLicencias, getMiCompania } from '../../services/bombero.service';
import { getCarrosByCompania } from '../../services/carro.service';
import { getServicios } from '../../services/servicios.service';
import { getCompanias } from '../../services/compania.service';

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
  const [compania, setCompania] = useState(null); // Ahora guardamos el objeto completo de la compañía
  const [clasificaciones, setClasificaciones] = useState([]);
  const [subtipos, setSubtipos] = useState([]);
  const [tiposDano, setTiposDano] = useState([]);
  const [fasesIncidente, setFasesIncidente] = useState([]);
  const [bomberos, setBomberos] = useState([]); // Todos los bomberos para asistencia
  const [conductores, setConductores] = useState([]); // Bomberos con licencias para Material Mayor
  const [carros, setCarros] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [companias, setCompanias] = useState([]);
  // Cache de bomberos por compañía para Accidentados
  const [bomberosByCompania, setBomberosByCompania] = useState({});
  const [loadingBomberosByCompania, setLoadingBomberosByCompania] = useState({});
  const [errorBomberosByCompania, setErrorBomberosByCompania] = useState({});
  
  // Estados de carga para lazy loading
  const [loadingBomberos, setLoadingBomberos] = useState(false);
  const [loadingConductores, setLoadingConductores] = useState(false);
  const [loadingCarros, setLoadingCarros] = useState(false);
  
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
  const [searchAsistencia, setSearchAsistencia] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15; // Mostrar 50 bomberos por página
  
  const totalLugar = useMemo(() => Object.values(asistenciaLugar).filter(Boolean).length, [asistenciaLugar]);
  const totalCuartel = useMemo(() => Object.values(asistenciaCuartel).filter(Boolean).length, [asistenciaCuartel]);
  
  // Filtrar bomberos por búsqueda
  const filteredBomberos = useMemo(
    () => bomberos.filter(b => (
      nombreBombero(b).toLowerCase().includes((searchAsistencia || '').toLowerCase())
    )),
    [bomberos, searchAsistencia]
  );
  
  // Calcular paginación
  const totalPages = Math.ceil(filteredBomberos.length / ITEMS_PER_PAGE);
  const paginatedBomberos = useMemo(
    () => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      return filteredBomberos.slice(startIndex, endIndex);
    },
    [filteredBomberos, currentPage]
  );
  
  // Reset página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchAsistencia]);
  
  // Errores
  const [errors, setErrors] = useState({});

  // Cargar usuario
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getUserData();
        setUser(userData);

        // Cargar catálogos iniciales (en paralelo al fetch de compañía)
        const catalogsPromise = loadInitialData();

        // Auto-seleccionar compañía del usuario
        if (userData?.compania?.id) {
          const cId = String(userData.compania.id);
          setCompaniaId(cId);
          setCompania(userData.compania);
        } else {
          // Fallback: consultar compañía del usuario autenticado
          try {
            const res = await getMiCompania();
            // Normalizar: intentar varias formas comunes
            const c = res?.data?.compania || res?.data || res;
            if (c?.id) {
              setCompaniaId(String(c.id));
              setCompania(c);
            }
          } catch (e) {
            console.warn('No se pudo obtener la compañía del usuario (fallback).', e?.message || e);
          }
        }

        await catalogsPromise;
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
      // FASE 1: Solo catálogos esenciales para inicio (reducir de 6 a 2)
      const [regionesData, clasificacionesData] = await Promise.all([
        getRegiones().catch(() => []),
        getClasificacionesEmergencia().catch(() => []),
      ]);

      setRegiones(normalizeArray(regionesData));
      setClasificaciones(normalizeArray(clasificacionesData));

      // FASE 2: Cargar catálogos secundarios en background (sin bloquear UI)
      Promise.all([
        getTiposDano().catch(() => []),
        getFasesIncidente().catch(() => []),
        getServicios().catch(() => []),
        getCompanias().catch(() => []),
      ]).then(([tiposDanoData, fasesData, serviciosData, companiasData]) => {
        setTiposDano(normalizeArray(tiposDanoData));
        setFasesIncidente(normalizeArray(fasesData));
        setServicios(normalizeArray(serviciosData));
        
        const compArr = normalizeArray(companiasData, 'companias').length > 0
          ? normalizeArray(companiasData, 'companias')
          : normalizeArray(companiasData, 'data').length > 0
            ? normalizeArray(companiasData, 'data')
            : normalizeArray(companiasData);
        setCompanias(compArr);
      }).catch((error) => {
        console.error('Error al cargar catálogos secundarios:', error);
      });
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

  // Limpiar datos dependientes cuando cambia el subtipo
  useEffect(() => {
    const selectedSubtipo = subtipos.find(s => s.id === parseInt(subtipoId));
    
    // Si el nuevo subtipo no tiene fuego, limpiar tipo de daño y fase
    if (selectedSubtipo && !selectedSubtipo.contieneFuego) {
      setTipoIncendioId('');
      setFaseId('');
    }
    
    // Si el nuevo subtipo no tiene inmuebles, limpiar inmuebles
    if (selectedSubtipo && !selectedSubtipo.contieneInmuebles) {
      setInmuebles([]);
    }
    
    // Si el nuevo subtipo no tiene vehículos, limpiar vehículos
    if (selectedSubtipo && !selectedSubtipo.contieneVehiculos) {
      setVehiculos([]);
    }
  }, [subtipoId, subtipos]);

  // Cargar bomberos y carros cuando cambia la compañía (LAZY: solo cuando sea necesario)
  useEffect(() => {
    if (!companiaId) return;

    // Reset asistencia
    setAsistenciaLugar({});
    setAsistenciaCuartel({});

    // CARGA DIFERIDA: Solo cargar cuando el usuario llegue a tabs que los necesiten
    // Por ahora, solo cargar carros (Material Mayor es tab 2, más común)
    // Bomberos se cargarán bajo demanda
  }, [companiaId]);

  // Cargar bomberos solo cuando se necesiten (tab Asistencia o Material Mayor)
  useEffect(() => {
    if (!companiaId) return;
    
    // Solo cargar si estamos en tab que los necesita (Material Mayor = 2, Asistencia = 4)
    if (activeTab === 2 || activeTab === 4) {
      // Evitar recargas múltiples
      if (bomberos.length === 0 && !loadingBomberos) {
        setLoadingBomberos(true);
        getBomberosPorCompania(companiaId)
          .then(data => {
            const bomberosData = normalizeArray(data);
            setBomberos(bomberosData);
          })
          .catch((err) => {
            console.error('Error al cargar bomberos:', err);
            setBomberos([]);
          })
          .finally(() => setLoadingBomberos(false));
      }
    }
  }, [companiaId, activeTab, bomberos.length, loadingBomberos]);

  // Cargar conductores solo cuando se necesiten (tab Material Mayor)
  useEffect(() => {
    if (!companiaId) return;
    
    // Solo cargar si estamos en tab Material Mayor (activeTab === 2)
    if (activeTab === 2) {
      // Evitar recargas múltiples
      if (conductores.length === 0 && !loadingConductores) {
        setLoadingConductores(true);
        getBomberosConLicencias(companiaId)
          .then(data => {
            const conductoresData = normalizeArray(data);
            setConductores(conductoresData);
          })
          .catch((err) => {
            console.error('Error al cargar conductores:', err);
            setConductores([]);
          })
          .finally(() => setLoadingConductores(false));
      }
    }
  }, [companiaId, activeTab, conductores.length, loadingConductores]);

  // Cargar carros solo cuando se necesiten (tab Material Mayor)
  useEffect(() => {
    if (!companiaId) return;
    
    // Solo cargar si estamos en tab Material Mayor (activeTab === 2)
    if (activeTab === 2) {
      // Evitar recargas múltiples
      if (carros.length === 0 && !loadingCarros) {
        setLoadingCarros(true);
        getCarrosByCompania(companiaId)
          .then(data => {
            const carrosData = normalizeArray(data);
            setCarros(carrosData);
          })
          .catch((err) => {
            console.error('Error al cargar carros:', err);
            setCarros([]);
          })
          .finally(() => setLoadingCarros(false));
      }
    }
  }, [companiaId, activeTab, carros.length, loadingCarros]);

  // Validación
  const isPosInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

  const validate = () => {
    const nextErrors = {};

    // Requeridos simples
    if (!companiaId) nextErrors.companiaId = 'Obligatorio.';
    if (!fecha) nextErrors.fecha = 'Obligatorio.';
    if (!horaDespacho) nextErrors.horaDespacho = 'Obligatorio.';
    if (!hora60) nextErrors.hora60 = 'Obligatorio.';
    if (!hora63) nextErrors.hora63 = 'Obligatorio.';
    if (!hora69) nextErrors.hora69 = 'Obligatorio.';
    if (!hora610) nextErrors.hora610 = 'Obligatorio.';
    if (!regionId && regionId !== 0) nextErrors.regionId = 'Obligatorio.';
    if (!comunaId && comunaId !== 0) nextErrors.comunaId = 'Obligatorio.';
    if (!calle || !calle.trim()) nextErrors.calle = 'Obligatorio.';

    // Tipo de emergencia / Clave radial
    if (!clasificacionId) nextErrors.clasificacionId = 'Seleccione una clasificación.';
    if (!subtipoId) nextErrors.subtipoId = 'Seleccione una clave radial.';
    
    // Si la clave radial elegida contiene fuego, exigir tipo de incendio y fase
    const subtipoSeleccionado = subtipos.find((s) => s.id === parseInt(subtipoId));
    if (subtipoSeleccionado?.contieneFuego) {
      if (!tipoIncendioId) nextErrors.tipoIncendioId = 'Seleccione el tipo de incendio/daño.';
      if (!faseId) nextErrors.faseId = 'Seleccione la fase alcanzada.';
    }

    // Material mayor: al menos 1 y completo
    if (materialMayor.length === 0) {
      nextErrors.materialMayor = 'Debe agregar al menos una unidad.';
    } else {
      const invalidRow = materialMayor.find(
        (r) => !r.unidadId || !r.conductorId || !r.bomberoId || !isPosInt(r.voluntarios) || !isPosInt(r.kmSalida) || !isPosInt(r.kmLlegada)
      );
      if (invalidRow) {
        nextErrors.materialMayor = 'Complete todos los campos de la(s) unidad(es). Voluntarios y KM deben ser enteros > 0.';
      }
    }

    // Asistencia en el lugar: al menos 1
    const anyLugar = Object.values(asistenciaLugar).some(Boolean);
    if (!anyLugar) nextErrors.asistenciaLugar = 'Registre al menos 1 voluntario presente en el lugar.';

    // Inmuebles: validaciones extra
    const inmErrors = [];
    inmuebles.forEach((inm, i) => {
      if (inm.n_pisos !== '' && !isPosInt(inm.n_pisos)) {
        inmErrors.push(`Inmueble #${i + 1}: "N° de pisos" debe ser entero > 0.`);
      }
      if (inm.m2_construccion !== '' && !(Number(inm.m2_construccion) > 0)) {
        inmErrors.push(`Inmueble #${i + 1}: "m² construcción" debe ser > 0.`);
      }
      if (inm.m2_afectado !== '' && !(Number(inm.m2_afectado) > 0)) {
        inmErrors.push(`Inmueble #${i + 1}: "m² afectado" debe ser > 0.`);
      }
      // Validar edades solo de habitantes (dueños no tienen edad)
      const edades = [];
      (inm.habitantes || []).forEach(h => {
        if (h?.edad !== undefined && h?.edad !== '') edades.push(h.edad);
      });
      const invalidEdad = edades.find(ed => !isPosInt(ed));
      if (invalidEdad !== undefined) {
        inmErrors.push(`Inmueble #${i + 1}: "Edad" debe ser entero positivo en los campos informados.`);
      }
    });
    if (inmErrors.length > 0) {
      nextErrors.inmuebles = inmErrors.join(' ');
    }

    // Vehículos: validaciones extra
    const currentYear = new Date().getFullYear();
    const vehErrors = [];
    vehiculos.forEach((v, i) => {
      if (v.anio !== '' && (!isPosInt(v.anio) || Number(v.anio) <= 1900 || Number(v.anio) >= currentYear)) {
        vehErrors.push(`Vehículo #${i + 1}: "Año" debe ser entero > 1900 y menor que ${currentYear}.`);
      }
      // Validar edades de chofer y pasajeros (dueños no tienen edad)
      const edades = [];
      if (v.chofer?.edad !== undefined && v.chofer?.edad !== '') edades.push(v.chofer.edad);
      (v.pasajeros || []).forEach(p => {
        if (p?.edad !== undefined && p?.edad !== '') edades.push(p.edad);
      });
      const invalidEdad = edades.find(ed => !isPosInt(ed));
      if (invalidEdad !== undefined) {
        vehErrors.push(`Vehículo #${i + 1}: "Edad" debe ser entero positivo en los campos informados.`);
      }
    });
    if (vehErrors.length > 0) {
      nextErrors.vehiculos = vehErrors.join(' ');
    }

    // Validar idRedactor (usuario autenticado)
    const idRedactor = user?.id ? Number(user.id) : null;
    if (!idRedactor) {
      nextErrors.idRedactor = 'Sesión inválida: vuelva a iniciar sesión.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Error de validación', 'Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);

      // Construir fechaHoraDespacho (igual que en web)
      const fechaTrim = (fecha || '').trim();
      const horaTrim = (horaDespacho || '').trim();
      let fechaHoraDespacho = null;
      if (fechaTrim && horaTrim && /^\d{4}-\d{2}-\d{2}$/.test(fechaTrim) && /^\d{2}:\d{2}$/.test(horaTrim)) {
        const [yy, mm, dd] = fechaTrim.split('-').map(Number);
        const [hh, mi] = horaTrim.split(':').map(Number);
        const localDate = new Date(yy, mm - 1, dd, hh, mi, 0, 0);
        fechaHoraDespacho = localDate.toISOString();
      }

      const payload = {
        companiaId: parseInt(companiaId),
        fecha,
        horaDespacho,
        fechaHoraDespacho,
        hora6_0: hora60,
        hora6_3: hora63,
        hora6_9: hora69,
        hora6_10: hora610,
        regionId: parseInt(regionId),
        comunaId: parseInt(comunaId),
        calle: calle.trim(),
        numero: (numero || '').toString().trim() || null,
        depto: (depto || '').toString().trim() || null,
        referencia: (referencia || '').toString().trim() || '',
        clasificacionId: parseInt(clasificacionId),
        subtipoId: parseInt(subtipoId),
        tipoIncendioId: tipoIncendioId ? parseInt(tipoIncendioId) : null,
        faseId: faseId ? parseInt(faseId) : null,
        descripcionPreliminar: (descripcionPreliminar || '').trim() || '',
        bomberoACargoId: bomberoACargoId ? parseInt(bomberoACargoId) : null,
        idRedactor: user.id,
        inmuebles,
        vehiculos,
        materialMayor,
        accidentados,
        otrosServicios,
        asistencia: {
          lugar: Object.keys(asistenciaLugar).filter((id) => asistenciaLugar[id]).map(Number),
          cuartel: Object.keys(asistenciaCuartel).filter((id) => asistenciaCuartel[id]).map(Number),
        },
      };

      console.log('Payload parte (con fechaHoraDespacho calculada):', payload);

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
      duenos: [], // Ahora es un array
      habitantes: [],
    }]);
  };

  const updateInmueble = (idx, next) => {
    setInmuebles(prev => prev.map((it, i) => (i === idx ? next : it)));
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
      duenos: [], // Ahora es un array
      chofer: null,
      pasajeros: [],
    }]);
  };

  const removeVehiculo = (idx) => {
    setVehiculos(prev => prev.filter((_, i) => i !== idx));
  };

  const updateVehiculo = (idx, next) => {
    setVehiculos(prev => prev.map((it, i) => (i === idx ? next : it)));
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

  const updateAccidentado = (idx, next) => {
    setAccidentados(prev => prev.map((a, i) => (i === idx ? next : a)));
  };

  // Cargar bomberos por compañía bajo demanda (para Accidentados)
  const ensureBomberosForCompania = async (compId) => {
    const id = String(compId || '');
    if (!id) return;
    if (bomberosByCompania[id]) return; // ya cargado
    try {
      setLoadingBomberosByCompania(prev => ({ ...prev, [id]: true }));
      setErrorBomberosByCompania(prev => ({ ...prev, [id]: '' }));
      const res = await getBomberosPorCompania(id);
      const arr = normalizeArray(res, 'bomberos').length > 0
        ? normalizeArray(res, 'bomberos')
        : normalizeArray(res);
      setBomberosByCompania(prev => ({ ...prev, [id]: arr }));
    } catch (e) {
      console.error('No se pudieron cargar los bomberos de la compañía', id, e);
      setBomberosByCompania(prev => ({ ...prev, [id]: [] }));
      setErrorBomberosByCompania(prev => ({ ...prev, [id]: 'No se pudieron cargar los bomberos.' }));
    } finally {
      setLoadingBomberosByCompania(prev => ({ ...prev, [id]: false }));
    }
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

  const updateOtroServicio = (idx, next) => {
    setOtrosServicios(prev => prev.map((s, i) => (i === idx ? next : s)));
  };

  // Toggle asistencia con useCallback para evitar re-renders
  const toggleLugar = useCallback((id, checked) => {
    setAsistenciaLugar(prev => ({ ...prev, [id]: checked }));
    if (checked) setAsistenciaCuartel(prev => ({ ...prev, [id]: false }));
  }, []);

  const toggleCuartel = useCallback((id, checked) => {
    setAsistenciaCuartel(prev => ({ ...prev, [id]: checked }));
    if (checked) setAsistenciaLugar(prev => ({ ...prev, [id]: false }));
  }, []);

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
              
              {/* Compañía - Solo lectura */}
              <View className="mb-4">
                <FieldLabel required>Compañía</FieldLabel>
                <View className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
                  <Text className="text-gray-700">
                    {compania?.nombre || user?.compania?.nombre || 'Cargando...'}
                  </Text>
                </View>
                {errors.companiaId ? <Text className="text-red-500 text-xs mt-1">{errors.companiaId}</Text> : null}
              </View>

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
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="font-bold text-gray-700">Inmueble {idx + 1}</Text>
                        <TouchableOpacity onPress={() => removeInmueble(idx)}>
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>

                      {/* Tipo de construcción y N° pisos */}
                      <View className="flex-row gap-2">
                        <View className="flex-1 mb-3">
                          <Text className="text-sm font-semibold text-gray-700 mb-1">Tipo de construcción</Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Ej: Casa, Departamento..."
                            value={inm.tipo_construccion}
                            onChangeText={(v)=> updateInmueble(idx, { ...inm, tipo_construccion: v })}
                          />
                        </View>
                        <View className="flex-1 mb-3">
                          <Text className="text-sm font-semibold text-gray-700 mb-1">N° Pisos</Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="0"
                            keyboardType="numeric"
                            value={String(inm.n_pisos || '')}
                            onChangeText={(v)=> updateInmueble(idx, { ...inm, n_pisos: v.replace(/[^0-9]/g,'') })}
                          />
                        </View>
                      </View>

                      {/* Metros cuadrados */}
                      <View className="flex-row gap-2">
                        <View className="flex-1 mb-3">
                          <Text className="text-sm font-semibold text-gray-700 mb-1">m² construcción</Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="0"
                            keyboardType="numeric"
                            value={String(inm.m2_construccion || '')}
                            onChangeText={(v)=> updateInmueble(idx, { ...inm, m2_construccion: v.replace(/[^0-9.]/g,'') })}
                          />
                        </View>
                        <View className="flex-1 mb-3">
                          <Text className="text-sm font-semibold text-gray-700 mb-1">m² afectado</Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="0"
                            keyboardType="numeric"
                            value={String(inm.m2_afectado || '')}
                            onChangeText={(v)=> updateInmueble(idx, { ...inm, m2_afectado: v.replace(/[^0-9.]/g,'') })}
                          />
                        </View>
                      </View>

                      {/* Daños */}
                      <View className="mb-3">
                        <Text className="text-sm font-semibold text-gray-700 mb-1">Daños en vivienda</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Descripción de daños"
                          value={inm.danos_vivienda}
                          onChangeText={(v)=> updateInmueble(idx, { ...inm, danos_vivienda: v })}
                        />
                      </View>
                      <View className="mb-3">
                        <Text className="text-sm font-semibold text-gray-700 mb-1">Daños en anexos</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Descripción de daños en anexos"
                          value={inm.danos_anexos}
                          onChangeText={(v)=> updateInmueble(idx, { ...inm, danos_anexos: v })}
                        />
                      </View>

                      {/* Dirección específica del inmueble */}
                      <View className="flex-row gap-2">
                        <View className="flex-1 mb-3">
                          <Text className="text-sm font-semibold text-gray-700 mb-1">Calle</Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Calle"
                            value={inm.calle}
                            onChangeText={(v)=> updateInmueble(idx, { ...inm, calle: v })}
                          />
                        </View>
                        <View className="w-28 mb-3">
                          <Text className="text-sm font-semibold text-gray-700 mb-1">Número</Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="N°"
                            value={inm.numero}
                            onChangeText={(v)=> updateInmueble(idx, { ...inm, numero: v })}
                          />
                        </View>
                      </View>

                      {/* Dueños */}
                      <Text className="text-sm font-semibold text-gray-800 mb-2">Dueños</Text>
                      {(inm.duenos||[]).map((d, di) => (
                        <View key={`${inm.id}-d-${di}`} className="bg-white rounded-lg p-2 mb-2 border border-gray-200">
                          <View className="mb-2">
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Nombre completo"
                              value={d.nombreCompleto || ''}
                              onChangeText={(v)=> {
                                const next = [...(inm.duenos||[])];
                                next[di] = { ...(next[di]||{}), nombreCompleto: v };
                                updateInmueble(idx, { ...inm, duenos: next });
                              }}
                            />
                          </View>
                          <View className="flex-row gap-2">
                            <TextInput
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="RUN"
                              value={d.run || ''}
                              onChangeText={(v)=> {
                                const next = [...(inm.duenos||[])];
                                next[di] = { ...(next[di]||{}), run: v };
                                updateInmueble(idx, { ...inm, duenos: next });
                              }}
                            />
                            <TextInput
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Teléfono"
                              value={d.telefono || ''}
                              onChangeText={(v)=> {
                                const next = [...(inm.duenos||[])];
                                next[di] = { ...(next[di]||{}), telefono: v };
                                updateInmueble(idx, { ...inm, duenos: next });
                              }}
                            />
                          </View>
                          <View className="flex-row items-center justify-between my-2">
                            <Text className="text-sm font-semibold text-gray-700">¿Es empresa?</Text>
                            <Switch
                              value={!!d.esEmpresa}
                              onValueChange={(val)=> {
                                const next = [...(inm.duenos||[])];
                                next[di] = { ...(next[di]||{}), esEmpresa: val };
                                updateInmueble(idx, { ...inm, duenos: next });
                              }}
                            />
                          </View>
                          <View className="mb-2">
                            <Text className="text-sm font-semibold text-gray-700 mb-1">Descripción de gravedad</Text>
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Detalle de la gravedad del afectado"
                              value={d.descripcionGravedad || ''}
                              onChangeText={(v)=> {
                                const next = [...(inm.duenos||[])];
                                next[di] = { ...(next[di]||{}), descripcionGravedad: v };
                                updateInmueble(idx, { ...inm, duenos: next });
                              }}
                            />
                          </View>
                          <View className="items-end">
                            <TouchableOpacity onPress={()=>{
                              const next = (inm.duenos||[]).filter((_,i)=> i!==di);
                              updateInmueble(idx, { ...inm, duenos: next });
                            }}>
                              <Text className="text-red-600">Eliminar dueño</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                      <TouchableOpacity onPress={()=>{
                        const next = [...(inm.duenos||[]), { nombreCompleto:'', run:'', telefono:'', esEmpresa: false, descripcionGravedad:'' }];
                        updateInmueble(idx, { ...inm, duenos: next });
                      }} className="mb-3">
                        <Text className="text-blue-600 font-semibold">+ Agregar dueño</Text>
                      </TouchableOpacity>

                      {/* Habitantes */}
                      <Text className="text-sm font-semibold text-gray-800 mb-2">Habitantes</Text>
                      {(inm.habitantes||[]).map((h, hi) => (
                        <View key={`${inm.id}-h-${hi}`} className="bg-white rounded-lg p-2 mb-2 border border-gray-200">
                          <View className="mb-2">
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Nombre completo"
                              value={h.nombreCompleto || ''}
                              onChangeText={(v)=> {
                                const next = [...(inm.habitantes||[])];
                                next[hi] = { ...(next[hi]||{}), nombreCompleto: v };
                                updateInmueble(idx, { ...inm, habitantes: next });
                              }}
                            />
                          </View>
                          <View className="flex-row gap-2">
                            <TextInput
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="RUN"
                              value={h.run || ''}
                              onChangeText={(v)=> {
                                const next = [...(inm.habitantes||[])];
                                next[hi] = { ...(next[hi]||{}), run: v };
                                updateInmueble(idx, { ...inm, habitantes: next });
                              }}
                            />
                            <TextInput
                              className="w-24 border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Edad"
                              keyboardType="numeric"
                              value={String(h.edad || '')}
                              onChangeText={(v)=> {
                                const next = [...(inm.habitantes||[])];
                                next[hi] = { ...(next[hi]||{}), edad: v.replace(/[^0-9]/g,'') };
                                updateInmueble(idx, { ...inm, habitantes: next });
                              }}
                            />
                          </View>
                          <View className="mt-2 mb-2">
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Teléfono"
                              value={h.telefono || ''}
                              onChangeText={(v)=> {
                                const next = [...(inm.habitantes||[])];
                                next[hi] = { ...(next[hi]||{}), telefono: v };
                                updateInmueble(idx, { ...inm, habitantes: next });
                              }}
                            />
                          </View>
                          <View className="mb-2">
                            <Text className="text-sm font-semibold text-gray-700 mb-1">Descripción de gravedad</Text>
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Detalle de la gravedad del afectado"
                              value={h.descripcionGravedad || ''}
                              onChangeText={(v)=> {
                                const next = [...(inm.habitantes||[])];
                                next[hi] = { ...(next[hi]||{}), descripcionGravedad: v };
                                updateInmueble(idx, { ...inm, habitantes: next });
                              }}
                            />
                          </View>
                          <View className="items-end">
                            <TouchableOpacity onPress={()=>{
                              const next = (inm.habitantes||[]).filter((_,i)=> i!==hi);
                              updateInmueble(idx, { ...inm, habitantes: next });
                            }}>
                              <Text className="text-red-600">Eliminar habitante</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                      <TouchableOpacity onPress={()=>{
                        const next = [...(inm.habitantes||[]), { nombreCompleto:'', run:'', edad:'', telefono:'', descripcionGravedad:'' }];
                        updateInmueble(idx, { ...inm, habitantes: next });
                      }}>
                        <Text className="text-blue-600 font-semibold">+ Agregar habitante</Text>
                      </TouchableOpacity>
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
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="font-bold text-gray-700">Vehículo {idx + 1}</Text>
                        <TouchableOpacity onPress={() => removeVehiculo(idx)}>
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>

                      {/* Identificación vehículo */}
                      <View className="flex-row gap-2">
                        <View className="w-36 mb-3">
                          <Text className="text-sm font-semibold text-gray-700 mb-1">Patente</Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="ABC123"
                            value={veh.patente || ''}
                            onChangeText={(v)=> updateVehiculo(idx, { ...veh, patente: v })}
                          />
                        </View>
                        <View className="flex-1 mb-3">
                          <Text className="text-sm font-semibold text-gray-700 mb-1">Marca</Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Marca"
                            value={veh.marca || ''}
                            onChangeText={(v)=> updateVehiculo(idx, { ...veh, marca: v })}
                          />
                        </View>
                        <View className="flex-1 mb-3">
                          <Text className="text-sm font-semibold text-gray-700 mb-1">Modelo</Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Modelo"
                            value={veh.modelo || ''}
                            onChangeText={(v)=> updateVehiculo(idx, { ...veh, modelo: v })}
                          />
                        </View>
                      </View>

                      <View className="flex-row gap-2">
                        <View className="w-28 mb-3">
                          <Text className="text-sm font-semibold text-gray-700 mb-1">Año</Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="2020"
                            keyboardType="numeric"
                            value={String(veh.anio || '')}
                            onChangeText={(v)=> updateVehiculo(idx, { ...veh, anio: v.replace(/[^0-9]/g,'') })}
                          />
                        </View>
                        <View className="flex-1 mb-3">
                          <Text className="text-sm font-semibold text-gray-700 mb-1">Color</Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Color"
                            value={veh.color || ''}
                            onChangeText={(v)=> updateVehiculo(idx, { ...veh, color: v })}
                          />
                        </View>
                      </View>

                      <View className="mb-3">
                        <Text className="text-sm font-semibold text-gray-700 mb-1">Daños del vehículo</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Descripción de daños"
                          value={veh.danos_vehiculo || ''}
                          onChangeText={(v)=> updateVehiculo(idx, { ...veh, danos_vehiculo: v })}
                        />
                      </View>

                      {/* Dueños */}
                      <Text className="text-sm font-semibold text-gray-800 mb-2">Dueños</Text>
                      {(veh.duenos||[]).map((d, di) => (
                        <View key={`${veh.id}-d-${di}`} className="bg-white rounded-lg p-2 mb-2 border border-gray-200">
                          <View className="mb-2">
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Nombre completo"
                              value={d.nombreCompleto || ''}
                              onChangeText={(v)=> {
                                const next = [...(veh.duenos||[])];
                                next[di] = { ...(next[di]||{}), nombreCompleto: v };
                                updateVehiculo(idx, { ...veh, duenos: next });
                              }}
                            />
                          </View>
                          <View className="flex-row gap-2">
                            <TextInput
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="RUN"
                              value={d.run || ''}
                              onChangeText={(v)=> {
                                const next = [...(veh.duenos||[])];
                                next[di] = { ...(next[di]||{}), run: v };
                                updateVehiculo(idx, { ...veh, duenos: next });
                              }}
                            />
                            <TextInput
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Teléfono"
                              value={d.telefono || ''}
                              onChangeText={(v)=> {
                                const next = [...(veh.duenos||[])];
                                next[di] = { ...(next[di]||{}), telefono: v };
                                updateVehiculo(idx, { ...veh, duenos: next });
                              }}
                            />
                          </View>
                          <View className="flex-row items-center justify-between my-2">
                            <Text className="text-sm font-semibold text-gray-700">¿Es empresa?</Text>
                            <Switch
                              value={!!d.esEmpresa}
                              onValueChange={(val)=> {
                                const next = [...(veh.duenos||[])];
                                next[di] = { ...(next[di]||{}), esEmpresa: val };
                                updateVehiculo(idx, { ...veh, duenos: next });
                              }}
                            />
                          </View>
                          <View className="mb-2">
                            <Text className="text-sm font-semibold text-gray-700 mb-1">Descripción de gravedad</Text>
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Detalle de la gravedad del afectado"
                              value={d.descripcionGravedad || ''}
                              onChangeText={(v)=> {
                                const next = [...(veh.duenos||[])];
                                next[di] = { ...(next[di]||{}), descripcionGravedad: v };
                                updateVehiculo(idx, { ...veh, duenos: next });
                              }}
                            />
                          </View>
                          <View className="items-end">
                            <TouchableOpacity onPress={()=>{
                              const next = (veh.duenos||[]).filter((_,i)=> i!==di);
                              updateVehiculo(idx, { ...veh, duenos: next });
                            }}>
                              <Text className="text-red-600">Eliminar dueño</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                      <TouchableOpacity onPress={()=>{
                        const next = [...(veh.duenos||[]), { nombreCompleto:'', run:'', telefono:'', esEmpresa: false, descripcionGravedad:'' }];
                        updateVehiculo(idx, { ...veh, duenos: next });
                      }} className="mb-3">
                        <Text className="text-blue-600 font-semibold">+ Agregar dueño</Text>
                      </TouchableOpacity>

                      {/* Chofer */}
                      <Text className="text-sm font-semibold text-gray-800 mb-2 mt-3">Chofer (opcional)</Text>
                      {veh.chofer ? (
                        <View className="bg-white rounded-lg p-2 mb-2 border border-gray-200">
                          <View className="mb-2">
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Nombre completo"
                              value={veh.chofer.nombreCompleto || ''}
                              onChangeText={(v)=> updateVehiculo(idx, { ...veh, chofer: { ...(veh.chofer||{}), nombreCompleto: v } })}
                            />
                          </View>
                          <View className="flex-row gap-2">
                            <TextInput
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="RUN"
                              value={veh.chofer.run || ''}
                              onChangeText={(v)=> updateVehiculo(idx, { ...veh, chofer: { ...(veh.chofer||{}), run: v } })}
                            />
                            <TextInput
                              className="w-24 border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Edad"
                              keyboardType="numeric"
                              value={String(veh.chofer.edad || '')}
                              onChangeText={(v)=> updateVehiculo(idx, { ...veh, chofer: { ...(veh.chofer||{}), edad: v.replace(/[^0-9]/g,'') } })}
                            />
                          </View>
                          <View className="mt-2 mb-2">
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Teléfono"
                              value={veh.chofer.telefono || ''}
                              onChangeText={(v)=> updateVehiculo(idx, { ...veh, chofer: { ...(veh.chofer||{}), telefono: v } })}
                            />
                          </View>
                          <View className="mb-2">
                            <Text className="text-sm font-semibold text-gray-700 mb-1">Descripción de gravedad</Text>
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Detalle de la gravedad del afectado"
                              value={veh.chofer.descripcionGravedad || ''}
                              onChangeText={(v)=> updateVehiculo(idx, { ...veh, chofer: { ...(veh.chofer||{}), descripcionGravedad: v } })}
                            />
                          </View>
                          <View className="items-end">
                            <TouchableOpacity onPress={()=> updateVehiculo(idx, { ...veh, chofer: null })}>
                              <Text className="text-red-600">Eliminar chofer</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={()=>{
                          updateVehiculo(idx, { ...veh, chofer: { nombreCompleto:'', run:'', edad:'', telefono:'', descripcionGravedad:'' } });
                        }} className="mb-3">
                          <Text className="text-blue-600 font-semibold">+ Agregar chofer</Text>
                        </TouchableOpacity>
                      )}

                      {/* Pasajeros */}
                      <Text className="text-sm font-semibold text-gray-800 mb-2 mt-3">Pasajeros</Text>
                      {(veh.pasajeros||[]).map((p, pi) => (
                        <View key={`${veh.id}-p-${pi}`} className="bg-white rounded-lg p-2 mb-2 border border-gray-200">
                          <View className="mb-2">
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Nombre completo"
                              value={p.nombreCompleto || ''}
                              onChangeText={(v)=> {
                                const next = [...(veh.pasajeros||[])];
                                next[pi] = { ...(next[pi]||{}), nombreCompleto: v };
                                updateVehiculo(idx, { ...veh, pasajeros: next });
                              }}
                            />
                          </View>
                          <View className="flex-row gap-2">
                            <TextInput
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="RUN"
                              value={p.run || ''}
                              onChangeText={(v)=> {
                                const next = [...(veh.pasajeros||[])];
                                next[pi] = { ...(next[pi]||{}), run: v };
                                updateVehiculo(idx, { ...veh, pasajeros: next });
                              }}
                            />
                            <TextInput
                              className="w-24 border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Edad"
                              keyboardType="numeric"
                              value={String(p.edad || '')}
                              onChangeText={(v)=> {
                                const next = [...(veh.pasajeros||[])];
                                next[pi] = { ...(next[pi]||{}), edad: v.replace(/[^0-9]/g,'') };
                                updateVehiculo(idx, { ...veh, pasajeros: next });
                              }}
                            />
                          </View>
                          <View className="mt-2 mb-2">
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Teléfono"
                              value={p.telefono || ''}
                              onChangeText={(v)=> {
                                const next = [...(veh.pasajeros||[])];
                                next[pi] = { ...(next[pi]||{}), telefono: v };
                                updateVehiculo(idx, { ...veh, pasajeros: next });
                              }}
                            />
                          </View>
                          <View className="mb-2">
                            <Text className="text-sm font-semibold text-gray-700 mb-1">Descripción de gravedad</Text>
                            <TextInput
                              className="border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Detalle de la gravedad del afectado"
                              value={p.descripcionGravedad || ''}
                              onChangeText={(v)=> {
                                const next = [...(veh.pasajeros||[])];
                                next[pi] = { ...(next[pi]||{}), descripcionGravedad: v };
                                updateVehiculo(idx, { ...veh, pasajeros: next });
                              }}
                            />
                          </View>
                          <View className="items-end">
                            <TouchableOpacity onPress={()=>{
                              const next = (veh.pasajeros||[]).filter((_,i)=> i!==pi);
                              updateVehiculo(idx, { ...veh, pasajeros: next });
                            }}>
                              <Text className="text-red-600">Eliminar pasajero</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                      <TouchableOpacity onPress={()=>{
                        const next = [...(veh.pasajeros||[]), { nombreCompleto:'', run:'', edad:'', telefono:'', descripcionGravedad:'' }];
                        updateVehiculo(idx, { ...veh, pasajeros: next });
                      }}>
                        <Text className="text-blue-600 font-semibold">+ Agregar pasajero</Text>
                      </TouchableOpacity>
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

              {materialMayor.map((unidad, idx) => {
                // Evitar duplicados de Carro y Conductor entre unidades
                const usedUnidadIds = materialMayor.map(r => r.unidadId).filter(Boolean).map(String);
                const usedConductorIds = materialMayor.map(r => r.conductorId).filter(Boolean).map(String);
                const unidadIdStr = unidad.unidadId ? String(unidad.unidadId) : '';
                const conductorIdStr = unidad.conductorId ? String(unidad.conductorId) : '';

                const carrosDisponibles = carros.filter(c => {
                  const id = String(c.id);
                  return id === unidadIdStr || !usedUnidadIds.includes(id);
                });

                const conductoresDisponibles = conductores.filter(b => {
                  const id = String(b.id);
                  return id === conductorIdStr || !usedConductorIds.includes(id);
                });

                return (
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
                    options={carrosDisponibles.map(c => ({ value: c.id, label: c.patente || `Carro #${c.id}` }))}
                    placeholder="Seleccione carro"
                  />

                  <SelectField
                    label="Conductor"
                    selectedValue={unidad.conductorId}
                    onValueChange={(val) => updateUnidad(idx, 'conductorId', val)}
                    options={conductoresDisponibles.map(b => ({ value: b.id, label: nombreBombero(b) }))}
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
              )})}
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

              {accidentados.map((acc, idx) => {
                const compId = String(acc.companiaId || '');
                const bomberosCompania = bomberosByCompania[compId] || [];
                const loadingFila = !!loadingBomberosByCompania[compId];
                const errorFila = errorBomberosByCompania[compId] || '';
                return (
                  <View key={acc.id} className="bg-red-50 rounded-lg p-3 mb-3">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-bold text-gray-700">Accidentado {idx + 1}</Text>
                      <TouchableOpacity onPress={() => removeAccidentado(idx)}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Compañía */}
                    <SelectField
                      label="Compañía"
                      selectedValue={acc.companiaId}
                      onValueChange={(val) => {
                        updateAccidentado(idx, { ...acc, companiaId: val, bomberoId: '' });
                        ensureBomberosForCompania(val);
                      }}
                      options={companias.map(c => ({ value: c.id, label: c.nombre || `Compañía #${c.id}` }))}
                      placeholder="Seleccione compañía"
                    />
                    {/* Bombero (dependiente de compañía) */}
                    <SelectField
                      label="Bombero"
                      selectedValue={acc.bomberoId}
                      onValueChange={(val) => updateAccidentado(idx, { ...acc, bomberoId: val })}
                      options={bomberosCompania.map(b => ({ value: b.id, label: nombreBombero(b) }))}
                      placeholder={compId ? (loadingFila ? 'Cargando bomberos…' : 'Seleccione bombero') : 'Seleccione compañía primero'}
                    />
                    {errorFila ? (
                      <Text className="text-red-600 text-xs mb-2">{errorFila}</Text>
                    ) : null}

                    {/* RUT (opcional, como en web) */}
                    <View className="mb-3">
                      <Text className="text-sm font-semibold text-gray-700 mb-1">RUT</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        placeholder="RUN/RUT del accidentado"
                        value={acc.rut || ''}
                        onChangeText={(v) => updateAccidentado(idx, { ...acc, rut: v })}
                      />
                    </View>

                    {/* Lesiones */}
                    <View className="mb-3">
                      <Text className="text-sm font-semibold text-gray-700 mb-1">Lesiones</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        placeholder="Detalle de lesiones"
                        value={acc.lesiones || ''}
                        onChangeText={(v) => updateAccidentado(idx, { ...acc, lesiones: v })}
                        multiline
                      />
                    </View>

                    {/* Constancia */}
                    <View className="mb-3">
                      <Text className="text-sm font-semibold text-gray-700 mb-1">Constancia</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        placeholder="N° o descripción de constancia"
                        value={acc.constancia || ''}
                        onChangeText={(v) => updateAccidentado(idx, { ...acc, constancia: v })}
                      />
                    </View>

                    {/* Comisaría */}
                    <View className="mb-3">
                      <Text className="text-sm font-semibold text-gray-700 mb-1">Comisaría</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        placeholder="Nombre de la comisaría"
                        value={acc.comisaria || ''}
                        onChangeText={(v) => updateAccidentado(idx, { ...acc, comisaria: v })}
                      />
                    </View>

                    {/* Acciones */}
                    <View className="mb-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-1">Acciones</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        placeholder="Acciones tomadas"
                        value={acc.acciones || ''}
                        onChangeText={(v) => updateAccidentado(idx, { ...acc, acciones: v })}
                        multiline
                      />
                    </View>
                  </View>
                );
              })}

              <Text className="text-lg font-bold text-gray-900 mb-4 mt-6">Otros Servicios</Text>
              
              <TouchableOpacity
                onPress={addOtroServicio}
                className="bg-purple-600 rounded-lg py-3 items-center mb-4"
              >
                <Text className="text-white font-semibold">+ Agregar Servicio</Text>
              </TouchableOpacity>

              {otrosServicios.map((row, idx) => (
                <View key={row.id} className="bg-purple-50 rounded-lg p-3 mb-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-bold text-gray-700">Servicio {idx + 1}</Text>
                    <TouchableOpacity onPress={() => removeOtroServicio(idx)}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Servicio (catálogo) */}
                  <SelectField
                    label="Servicio"
                    selectedValue={row.servicioId}
                    onValueChange={(val) => updateOtroServicio(idx, { ...row, servicioId: val })}
                    options={servicios.map(s => ({ value: s.id, label: s.nombre ?? s.label ?? s.descripcion ?? `Servicio ${s.id}` }))}
                    placeholder={servicios.length ? 'Seleccione servicio' : 'No hay servicios disponibles'}
                  />

                  {/* Tipo de unidad y Responsable */}
                  <View className="flex-row gap-2">
                    <View className="flex-1 mb-3">
                      <Text className="text-sm font-semibold text-gray-700 mb-1">Tipo de unidad</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        placeholder="Ej: Ambulancia, Patrulla..."
                        value={row.tipoUnidad || ''}
                        onChangeText={(v) => updateOtroServicio(idx, { ...row, tipoUnidad: v })}
                      />
                    </View>
                    <View className="flex-1 mb-3">
                      <Text className="text-sm font-semibold text-gray-700 mb-1">Responsable</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        placeholder="Nombre del responsable"
                        value={row.responsable || ''}
                        onChangeText={(v) => updateOtroServicio(idx, { ...row, responsable: v })}
                      />
                    </View>
                  </View>

                  {/* Personal */}
                  <View className="mb-3">
                    <Text className="text-sm font-semibold text-gray-700 mb-1">Personal</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                      placeholder="Cantidad de personal"
                      value={String(row.personal || '')}
                      onChangeText={(v) => updateOtroServicio(idx, { ...row, personal: v.replace(/[^0-9]/g,'') })}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Observaciones */}
                  <View className="mb-1">
                    <Text className="text-sm font-semibold text-gray-700 mb-1">Observaciones</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                      placeholder="Observaciones del servicio"
                      value={row.observaciones || ''}
                      onChangeText={(v) => updateOtroServicio(idx, { ...row, observaciones: v })}
                      multiline
                    />
                  </View>
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

              {/* Buscador */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-gray-700 mb-1">Buscar voluntario</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Escribe para filtrar por nombre…"
                  value={searchAsistencia}
                  onChangeText={setSearchAsistencia}
                />
              </View>

              {/* Información de paginación */}
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text className="text-sm text-gray-700">
                    Mostrando {paginatedBomberos.length} de {filteredBomberos.length} bomberos
                  </Text>
                  <View className="flex-row gap-3 mt-1">
                    <Text className="text-xs text-gray-600">En el lugar: <Text className="font-semibold text-blue-600">{totalLugar}</Text></Text>
                    <Text className="text-xs text-gray-600">En el cuartel: <Text className="font-semibold text-green-600">{totalCuartel}</Text></Text>
                  </View>
                </View>
                {totalPages > 1 && (
                  <Text className="text-xs text-gray-500">Página {currentPage} de {totalPages}</Text>
                )}
              </View>

              {/* Tabla compacta con paginación */}
              <View className="rounded-lg border border-gray-200 overflow-hidden mb-3">
                {/* Header */}
                <View className="flex-row bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <Text className="flex-1 text-xs font-semibold text-gray-600">Voluntario</Text>
                  <Text className="w-28 text-xs font-semibold text-gray-600 text-center">En el lugar</Text>
                  <Text className="w-28 text-xs font-semibold text-gray-600 text-center">En el cuartel</Text>
                </View>

                {/* Lista paginada sin scroll interno (más eficiente) */}
                <View>
                  {paginatedBomberos.map(b => {
                    const presentLugar = !!asistenciaLugar[b.id];
                    const presentCuartel = !!asistenciaCuartel[b.id];
                    return (
                      <View key={b.id} className="flex-row items-center px-3 py-2 border-b border-gray-100 bg-white">
                        <Text className="flex-1 text-gray-800">{nombreBombero(b)}</Text>

                        {/* En el lugar */}
                        <View className="w-28 items-center">
                          <TouchableOpacity
                            onPress={() => toggleLugar(String(b.id), !presentLugar)}
                            className={`w-12 h-6 rounded-full ${presentLugar ? 'bg-blue-600' : 'bg-gray-300'}`}
                          >
                            <View className={`w-5 h-5 rounded-full bg-white m-0.5 ${presentLugar ? 'self-end' : 'self-start'}`} />
                          </TouchableOpacity>
                        </View>

                        {/* En el cuartel */}
                        <View className="w-28 items-center">
                          <TouchableOpacity
                            onPress={() => toggleCuartel(String(b.id), !presentCuartel)}
                            className={`w-12 h-6 rounded-full ${presentCuartel ? 'bg-green-600' : 'bg-gray-300'}`}
                          >
                            <View className={`w-5 h-5 rounded-full bg-white m-0.5 ${presentCuartel ? 'self-end' : 'self-start'}`} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}

                  {paginatedBomberos.length === 0 && (
                    <View className="px-3 py-6">
                      <Text className="text-gray-500 text-sm text-center">
                        {searchAsistencia ? 'No se encontraron bomberos con ese filtro' : 'No hay bomberos disponibles'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Controles de paginación mejorados */}
              {totalPages > 1 && (
                <View className="gap-2">
                  {/* Navegación principal */}
                  <View className="flex-row justify-between items-center gap-2">
                    <TouchableOpacity
                      onPress={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className={`py-2 px-3 rounded-lg border ${
                        currentPage === 1 
                          ? 'bg-gray-100 border-gray-200' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text className={currentPage === 1 ? 'text-gray-400' : 'text-gray-700'}>
                        ⟪
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex-1 py-2 px-4 rounded-lg border ${
                        currentPage === 1 
                          ? 'bg-gray-100 border-gray-200' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text className={`text-center font-semibold ${
                        currentPage === 1 ? 'text-gray-400' : 'text-gray-700'
                      }`}>
                        ← Anterior
                      </Text>
                    </TouchableOpacity>

                    <View className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                      <Text className="text-sm font-bold text-blue-700">
                        {currentPage} / {totalPages}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex-1 py-2 px-4 rounded-lg border ${
                        currentPage === totalPages 
                          ? 'bg-gray-100 border-gray-200' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text className={`text-center font-semibold ${
                        currentPage === totalPages ? 'text-gray-400' : 'text-gray-700'
                      }`}>
                        Siguiente →
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`py-2 px-3 rounded-lg border ${
                        currentPage === totalPages 
                          ? 'bg-gray-100 border-gray-200' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text className={currentPage === totalPages ? 'text-gray-400' : 'text-gray-700'}>
                        ⟫
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Acceso rápido a páginas */}
                  {totalPages > 3 && (
                    <View className="flex-row flex-wrap gap-1 justify-center">
                      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                        const pageNum = i + 1;
                        // Mostrar primeras 3, últimas 3, y cercanas a la actual
                        const showPage = pageNum <= 3 || 
                                        pageNum > totalPages - 3 || 
                                        Math.abs(pageNum - currentPage) <= 1;
                        
                        if (!showPage) {
                          // Mostrar "..." solo una vez entre grupos
                          if (pageNum === 4 && currentPage > 5) {
                            return (
                              <Text key={`dots-${pageNum}`} className="px-2 py-1 text-gray-400">
                                ⋯
                              </Text>
                            );
                          }
                          return null;
                        }

                        return (
                          <TouchableOpacity
                            key={pageNum}
                            onPress={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded ${
                              currentPage === pageNum
                                ? 'bg-blue-600'
                                : 'bg-gray-200'
                            }`}
                          >
                            <Text className={`text-xs font-semibold ${
                              currentPage === pageNum ? 'text-white' : 'text-gray-700'
                            }`}>
                              {pageNum}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
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
