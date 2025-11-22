# Implementación de Disponibilidad en Expo App

## Resumen

Se ha implementado la funcionalidad de **Disponibilidad** en la aplicación móvil de Expo, permitiendo a los bomberos:

- ✅ Marcar su disponibilidad (activa/inactiva)
- ✅ Ver el personal disponible en tiempo real
- ✅ Acceso rápido con presets de tiempo (2h, 4h, 8h, 12h)
- ✅ Crear disponibilidades manuales con fechas personalizadas
- ✅ Ver historial de disponibilidades
- ✅ Cerrar disponibilidad activa

## Archivos Creados/Modificados

### 1. Servicio de Disponibilidad
**📄 `src/services/disponibilidad.service.js`**

Servicio que se conecta con la API del backend para gestionar disponibilidades:

```javascript
- getDisponibilidades(idBombero) // Obtener todas o por bombero
- getDisponibilidad(id) // Obtener una específica
- createDisponibilidad(data) // Crear nueva disponibilidad
- updateDisponibilidad(id, data) // Actualizar existente
- deleteDisponibilidad(id) // Eliminar
- cerrarDisponibilidad(data) // Cerrar disponibilidad activa
- getDisponibilidadActiva(idBombero) // Obtener disponibilidad activa
```

### 2. Screen de Disponibilidad
**📄 `src/screens/Disponibilidad/DisponibilidadScreen.jsx`**

Screen principal con dos pestañas:

#### Pestaña "Marcar"
- **Estadísticas**: Muestra personal disponible vs total
- **Mi Disponibilidad Activa**: Card verde con información de disponibilidad actual
- **Acceso Rápido**: Botones para crear disponibilidad de 2h, 4h, 8h, 12h
- **Formulario Manual**: Para crear disponibilidades personalizadas
- **Personal Disponible**: Lista de bomberos actualmente disponibles

#### Pestaña "Historial"
- Muestra todas las disponibilidades del usuario
- Distingue entre activas y finalizadas
- Ordenadas por fecha (más recientes primero)

### 3. Navegación
**📄 `src/navigation/TabNavigator.jsx`** (modificado)

Se agregó una nueva tab al bottom navigator:

```javascript
{
  key: 'disponibilidad',
  name: 'Disponibilidad',
  label: 'Disponibilidad',
  component: DisponibilidadScreen,
  icon: 'person-circle',
  showWhen: () => featureFlags.disponibilidad !== false,
}
```

## Características Implementadas

### 🎨 Diseño Consistente
- Sigue el mismo diseño que la versión web (`Disponibilidad.jsx`)
- Usa Tailwind CSS (NativeWind) para estilos
- Colores y estilos coherentes con la app
- Iconos de Ionicons

### 🔄 Funcionalidades Principales

1. **Acceso Rápido**
   - Botones predefinidos: 2h, 4h, 8h, 12h
   - Crea disponibilidad inmediatamente
   - Muestra confirmación antes de crear

2. **Creación Manual**
   - Formulario para fechas personalizadas
   - Opción de establecer fecha de término
   - Validaciones de campos

3. **Gestión de Estado**
   - Muestra disponibilidad activa del usuario
   - Botón para cerrar disponibilidad
   - Previene crear múltiples disponibilidades activas

4. **Vista de Personal**
   - Lista de bomberos disponibles
   - Información de fecha/hora de disponibilidad
   - Actualización con pull-to-refresh

5. **Historial**
   - Todas las disponibilidades del usuario
   - Estados visuales (activa/finalizada)
   - Ordenadas cronológicamente

### 🔐 Seguridad
- Usa el token de autenticación del usuario
- Valida permisos antes de acciones
- Maneja errores de API adecuadamente

### 📱 UX/UI
- Loading states con ActivityIndicator
- Pull to refresh para actualizar datos
- Alerts para confirmaciones
- Mensajes de éxito/error claros
- Diseño responsivo

## Flujo de Uso

### Marcar Disponibilidad (Acceso Rápido)
1. Usuario entra a la tab "Disponibilidad"
2. Si no tiene disponibilidad activa, ve los botones de acceso rápido
3. Presiona botón (ej: "4 horas")
4. Aparece confirmación
5. Se crea la disponibilidad
6. Se muestra card verde con info de disponibilidad activa

### Marcar Disponibilidad (Manual)
1. Usuario entra a la tab "Disponibilidad"
2. Si no tiene disponibilidad activa, ve el formulario
3. Ajusta fecha/hora de inicio (pre-llenadas con fecha actual)
4. Opcionalmente marca checkbox para establecer término
5. Presiona "Crear Disponibilidad"
6. Se crea y muestra la disponibilidad activa

### Cerrar Disponibilidad
1. Usuario tiene disponibilidad activa (card verde)
2. Presiona "Cerrar Disponibilidad"
3. Confirma en el alert
4. Se cierra la disponibilidad
5. Vuelve a ver las opciones de crear

### Ver Historial
1. Usuario cambia a pestaña "Historial"
2. Ve lista de todas sus disponibilidades
3. Las activas aparecen en verde
4. Las finalizadas en gris

## Integración con Backend

El servicio se conecta a los siguientes endpoints:

```
GET    /api/disponibilidad              // Listar todas
GET    /api/disponibilidad?idBombero=X  // Listar por bombero
GET    /api/disponibilidad/detail/:id   // Obtener una
GET    /api/disponibilidad/activa/:id   // Obtener activa
POST   /api/disponibilidad              // Crear
PATCH  /api/disponibilidad/detail/:id   // Actualizar
PATCH  /api/disponibilidad/cerrar       // Cerrar activa
DELETE /api/disponibilidad/detail/:id   // Eliminar
```

## Dependencias Requeridas

Las siguientes dependencias ya deberían estar instaladas:
- `@react-navigation/bottom-tabs`
- `@expo/vector-icons`
- `axios` (para API)
- `expo-secure-store` (para tokens)
- `nativewind` (para Tailwind CSS)

## Configuración

### Habilitar/Deshabilitar la Tab

En `App.js` o donde inicialices `TabNavigator`:

```javascript
// Para habilitar (por defecto)
<TabNavigator 
  onLogout={handleLogout}
  featureFlags={{ 
    emergencias: true,
    disponibilidad: true  // Habilitada por defecto
  }}
/>

// Para deshabilitar
<TabNavigator 
  onLogout={handleLogout}
  featureFlags={{ 
    emergencias: true,
    disponibilidad: false  // Deshabilitada
  }}
/>
```

## Próximas Mejoras Sugeridas

1. **Sockets en Tiempo Real**
   - Actualizar lista cuando otros marcan disponibilidad
   - Notificaciones push cuando se necesita personal

2. **Filtros en Historial**
   - Por fecha
   - Por estado (activa/finalizada)
   - Búsqueda

3. **Estadísticas Avanzadas**
   - Horas totales de disponibilidad
   - Promedio por mes
   - Gráficos

4. **Geolocalización**
   - Mostrar ubicación del bombero disponible
   - Distancia a la compañía

5. **Notificaciones**
   - Recordatorio antes de que expire disponibilidad
   - Notificación cuando se necesita personal

## Testing

Para probar la funcionalidad:

```bash
# 1. Asegurarse de que el backend esté corriendo
cd Bomberos/backend
npm run dev

# 2. Asegurarse de que la URL de la API esté correcta en .env
API_URL=http://TU_IP:3000/api

# 3. Iniciar la app de Expo
cd expo-bomberos
npm start

# 4. Probar en emulador o dispositivo físico
```

## Estructura de Datos

### Disponibilidad Object
```javascript
{
  id: number,
  idBombero: number,
  fechaInicio: string (ISO 8601),
  fechaTermino: string | null (ISO 8601),
  createdAt: string (ISO 8601),
  updatedAt: string (ISO 8601),
  bombero: {
    id: number,
    nombres: string,
    apellidos: string,
    // ... otros campos
  }
}
```

## Notas de Implementación

- ✅ Compatibilidad total con el backend existente
- ✅ Usa el mismo servicio de autenticación
- ✅ Consistente con el diseño de la app web
- ✅ Responsive y optimizado para móvil
- ✅ Manejo robusto de errores
- ✅ Loading states en todas las operaciones
- ✅ Pull-to-refresh para actualizar datos

## Soporte

Para problemas o mejoras, contactar al equipo de desarrollo.

---

**Versión:** 1.0.0  
**Fecha:** 3 de noviembre de 2025  
**Autor:** Sistema de Disponibilidad - Expo Bomberos
