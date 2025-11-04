# Cambios en el Formulario de Parte de Emergencia

## Resumen de Cambios

Se han realizado mejoras significativas en el formulario de creación de partes de emergencia (`CrearParteScreen.jsx`) para mejorar la usabilidad y garantizar la integridad de los datos.

---

## 1. Dueños de Inmuebles y Vehículos

### Antes:
- Dueño era un campo único (`dueno: null`)
- Se mostraba como "Dueño (opcional)" con campos inline

### Ahora:
- **Dueños es un array** (`duenos: []`)
- Se pueden agregar múltiples dueños mediante el botón **"+ Agregar dueño"**
- Cada dueño se muestra en una tarjeta individual con botón "Eliminar dueño"

**Estructura de datos:**
```javascript
{
  id: genId(),
  // ... otros campos del inmueble/vehículo
  duenos: [
    {
      nombreCompleto: '',
      run: '',
      telefono: '',
      esEmpresa: false,
      descripcionGravedad: ''
    }
  ]
}
```

---

## 2. Simplificación de Campos de Persona

### Cambio Global:
Se eliminaron los campos separados `nombres` y `apellidos`, reemplazándolos por un único campo **`nombreCompleto`**.

### Afecta a:
- ✅ **Dueños** (inmuebles y vehículos)
- ✅ **Habitantes** (inmuebles)
- ✅ **Chofer** (vehículos)
- ✅ **Pasajeros** (vehículos)

**Antes:**
```javascript
{
  nombres: '',
  apellidos: '',
  run: '',
  // ...
}
```

**Ahora:**
```javascript
{
  nombreCompleto: '',
  run: '',
  // ...
}
```

---

## 3. Campo Teléfono Agregado

Se agregó el campo **`telefono`** a las siguientes entidades:

### ✅ Habitantes (inmuebles)
```javascript
{
  nombreCompleto: '',
  run: '',
  edad: '',
  telefono: '',        // ← NUEVO
  descripcionGravedad: ''
}
```

### ✅ Chofer (vehículos)
```javascript
{
  nombreCompleto: '',
  run: '',
  edad: '',
  telefono: '',        // ← NUEVO
  descripcionGravedad: ''
}
```

### ✅ Pasajeros (vehículos)
```javascript
{
  nombreCompleto: '',
  run: '',
  edad: '',
  telefono: '',        // ← NUEVO
  descripcionGravedad: ''
}
```

**Nota:** Los dueños ya tenían el campo `telefono`.

---

## 4. Chofer como Campo Opcional con Botón

### Antes:
- Chofer se mostraba como campos inline opcionales

### Ahora:
- Si **NO existe chofer**: se muestra el botón **"+ Agregar chofer"**
- Si **existe chofer**: se muestra una tarjeta con el botón **"Eliminar chofer"**

```jsx
{veh.chofer ? (
  <View>
    {/* Formulario del chofer */}
    <TouchableOpacity onPress={()=> updateVehiculo(idx, { ...veh, chofer: null })}>
      <Text className="text-red-600">Eliminar chofer</Text>
    </TouchableOpacity>
  </View>
) : (
  <TouchableOpacity onPress={()=> {
    updateVehiculo(idx, { ...veh, chofer: { nombreCompleto:'', run:'', edad:'', telefono:'', descripcionGravedad:'' } });
  }}>
    <Text className="text-blue-600 font-semibold">+ Agregar chofer</Text>
  </TouchableOpacity>
)}
```

---

## 5. Limpieza en Cascada de Datos Dependientes

Se implementaron **useEffects** para limpiar automáticamente los datos dependientes cuando se eliminan o cambian entidades padre.

### 5.1 Limpieza al Cambiar Subtipo

Cuando el usuario cambia el subtipo de incidente, se limpian automáticamente:

```javascript
useEffect(() => {
  const selectedSubtipo = subtipos.find(s => s.id === parseInt(subtipoId));
  
  // Si el nuevo subtipo NO tiene fuego → limpiar tipo de daño y fase
  if (selectedSubtipo && !selectedSubtipo.contieneFuego) {
    setTipoIncendioId('');
    setFaseId('');
  }
  
  // Si el nuevo subtipo NO tiene inmuebles → limpiar inmuebles
  if (selectedSubtipo && !selectedSubtipo.contieneInmuebles) {
    setInmuebles([]);
  }
  
  // Si el nuevo subtipo NO tiene vehículos → limpiar vehículos
  if (selectedSubtipo && !selectedSubtipo.contieneVehiculos) {
    setVehiculos([]);
  }
}, [subtipoId, subtipos]);
```

**Escenario:**
1. Usuario selecciona subtipo "Incendio Estructural" → agrega inmuebles
2. Usuario cambia a subtipo "Rescate Vehicular" (sin inmuebles) → **inmuebles se limpian automáticamente**

### 5.2 Limpieza al Eliminar Inmueble

Cuando se elimina un inmueble con `removeInmueble(idx)`, se eliminan:
- ✅ El inmueble completo
- ✅ Todos los **dueños** asociados
- ✅ Todos los **habitantes** asociados

```javascript
const removeInmueble = (idx) => {
  setInmuebles(prev => prev.filter((_, i) => i !== idx));
};
```

### 5.3 Limpieza al Eliminar Vehículo

Cuando se elimina un vehículo con `removeVehiculo(idx)`, se eliminan:
- ✅ El vehículo completo
- ✅ Todos los **dueños** asociados
- ✅ El **chofer** asociado
- ✅ Todos los **pasajeros** asociados

```javascript
const removeVehiculo = (idx) => {
  setVehiculos(prev => prev.filter((_, i) => i !== idx));
};
```

---

## 6. Actualización de Validaciones

Se actualizaron las validaciones para reflejar los nuevos cambios:

### Validación de Inmuebles:
- ❌ Se eliminó validación de `edad` en **dueños** (ya no existe)
- ✅ Se mantiene validación de `edad` en **habitantes**

```javascript
// Validar edades solo de habitantes (dueños no tienen edad)
const edades = [];
(inm.habitantes || []).forEach(h => {
  if (h?.edad !== undefined && h?.edad !== '') edades.push(h.edad);
});
```

### Validación de Vehículos:
- ❌ Se eliminó validación de `edad` en **dueños** (ya no existe)
- ✅ Se mantiene validación de `edad` en **chofer** y **pasajeros**

```javascript
// Validar edades de chofer y pasajeros (dueños no tienen edad)
const edades = [];
if (v.chofer?.edad !== undefined && v.chofer?.edad !== '') edades.push(v.chofer.edad);
(v.pasajeros || []).forEach(p => {
  if (p?.edad !== undefined && p?.edad !== '') edades.push(p.edad);
});
```

---

## 7. Estructura de Datos Final

### Inmueble Completo:
```javascript
{
  id: genId(),
  tipo_construccion: '',
  n_pisos: '',
  m2_construccion: '',
  m2_afectado: '',
  danos_vivienda: '',
  danos_anexos: '',
  calle: '',
  numero: '',
  duenos: [                    // ← Array de dueños
    {
      nombreCompleto: '',      // ← Antes: nombres + apellidos
      run: '',
      telefono: '',
      esEmpresa: false,
      descripcionGravedad: ''
    }
  ],
  habitantes: [
    {
      nombreCompleto: '',      // ← Antes: nombres + apellidos
      run: '',
      edad: '',
      telefono: '',            // ← NUEVO
      descripcionGravedad: ''
    }
  ]
}
```

### Vehículo Completo:
```javascript
{
  id: genId(),
  patente: '',
  marca: '',
  modelo: '',
  anio: '',
  color: '',
  danos_vehiculo: '',
  duenos: [                    // ← Array de dueños
    {
      nombreCompleto: '',      // ← Antes: nombres + apellidos
      run: '',
      telefono: '',
      esEmpresa: false,
      descripcionGravedad: ''
    }
  ],
  chofer: {                    // ← Null o objeto
    nombreCompleto: '',        // ← Antes: nombres + apellidos
    run: '',
    edad: '',
    telefono: '',              // ← NUEVO
    descripcionGravedad: ''
  },
  pasajeros: [
    {
      nombreCompleto: '',      // ← Antes: nombres + apellidos
      run: '',
      edad: '',
      telefono: '',            // ← NUEVO
      descripcionGravedad: ''
    }
  ]
}
```

---

## 8. Beneficios de los Cambios

### ✅ Usabilidad Mejorada:
- Múltiples dueños por inmueble/vehículo
- Botones claros para agregar/eliminar entidades
- Formulario más intuitivo

### ✅ Integridad de Datos:
- Limpieza automática en cascada previene datos huérfanos
- No se envían datos inconsistentes al backend

### ✅ Simplicidad:
- Un solo campo para nombre completo
- Estructura de datos más limpia

### ✅ Extensibilidad:
- Fácil agregar más campos a cada entidad
- Patrón reutilizable para otras secciones

---

## 9. Impacto en Backend

### ⚠️ IMPORTANTE: El backend debe actualizar el modelo de datos

El payload ahora envía:

```javascript
{
  // ... otros campos
  inmuebles: [
    {
      // ... campos del inmueble
      duenos: [                    // ← Era "dueno" (objeto único)
        {
          nombreCompleto: '',      // ← Era "nombres" + "apellidos"
          run: '',
          telefono: '',
          esEmpresa: false,
          descripcionGravedad: ''
        }
      ],
      habitantes: [
        {
          nombreCompleto: '',      // ← Era "nombres" + "apellidos"
          run: '',
          edad: '',
          telefono: '',            // ← NUEVO campo
          descripcionGravedad: ''
        }
      ]
    }
  ],
  vehiculos: [
    {
      // ... campos del vehículo
      duenos: [                    // ← Era "dueno" (objeto único)
        {
          nombreCompleto: '',      // ← Era "nombres" + "apellidos"
          run: '',
          telefono: '',
          esEmpresa: false,
          descripcionGravedad: ''
        }
      ],
      chofer: {                    // ← Puede ser null
        nombreCompleto: '',        // ← Era "nombres" + "apellidos"
        run: '',
        edad: '',
        telefono: '',              // ← NUEVO campo
        descripcionGravedad: ''
      },
      pasajeros: [
        {
          nombreCompleto: '',      // ← Era "nombres" + "apellidos"
          run: '',
          edad: '',
          telefono: '',            // ← NUEVO campo
          descripcionGravedad: ''
        }
      ]
    }
  ]
}
```

### Migraciones de Base de Datos Necesarias:

1. **Tabla `inmuebles_duenos` / `vehiculos_duenos`**:
   - Crear relación uno-a-muchos (antes era uno-a-uno)
   - Cambiar `nombres` + `apellidos` → `nombreCompleto`

2. **Tablas `habitantes`, `choferes`, `pasajeros`**:
   - Cambiar `nombres` + `apellidos` → `nombreCompleto`
   - Agregar columna `telefono`

3. **Actualizar validaciones del backend** para aceptar arrays de dueños

---

## 10. Testing Recomendado

### Casos de Prueba:

1. **Agregar/Eliminar múltiples dueños** en inmueble y vehículo
2. **Cambiar subtipo** y verificar limpieza automática:
   - De "Incendio" a "Rescate" → tipo de daño y fase se limpian
   - De subtipo con inmuebles a subtipo sin inmuebles → inmuebles se limpian
3. **Eliminar inmueble** con dueños/habitantes → verificar limpieza completa
4. **Eliminar vehículo** con dueños/chofer/pasajeros → verificar limpieza completa
5. **Validación de edad** en habitantes/chofer/pasajeros (NO en dueños)
6. **Guardar parte** y verificar payload en backend

---

## 11. Archivos Modificados

- ✅ `expo-bomberos/src/screens/Emergencias/CrearParteScreen.jsx`
  - Estructura de datos de inmuebles y vehículos
  - Funciones `addInmueble`, `addVehiculo`
  - UseEffect para limpieza en cascada
  - Renderizado de dueños (botón + array)
  - Renderizado de chofer (condicional)
  - Campos de habitantes, chofer, pasajeros
  - Validaciones actualizadas

---

## Fecha de Cambios
**30 de octubre de 2025**
