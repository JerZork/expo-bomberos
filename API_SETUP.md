# Configuración de la API

## Variables de Entorno

Este proyecto utiliza variables de entorno para configurar la conexión con la API backend.

### Configuración Inicial

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` con tus configuraciones (nota: incluye el prefijo `/api`):
   ```env
   API_URL=http://localhost:3000/api
   API_TIMEOUT=10000
   NODE_ENV=development
   ```

### Usar la API en Dispositivo Físico

Si estás probando en un dispositivo físico (no emulador), necesitas cambiar `localhost` por la IP de tu computadora:

```env
API_URL=http://192.168.1.X:3000/api
```

Para encontrar tu IP:
- **Windows**: `ipconfig` en CMD
- **Mac/Linux**: `ifconfig` en terminal

### Variables Disponibles

- `API_URL`: URL base de la API backend (debe terminar en `/api`)
- `API_TIMEOUT`: Tiempo máximo de espera para peticiones (en milisegundos)
- `NODE_ENV`: Entorno de ejecución (development, production)

## Servicios

### authService

Servicio para manejar la autenticación de usuarios.

```javascript
import { authService } from './services/authService';

// Login
const response = await authService.login(run, password);

// Logout
await authService.logout();

// Obtener token
const token = await authService.getToken();

// Obtener datos del usuario
const user = await authService.getUserData();

// Verificar si está autenticado
const isAuth = await authService.isAuthenticated();
```

### apiClient

Cliente Axios configurado con interceptores.

```javascript
import apiClient from './services/api';

// GET
const response = await apiClient.get('/api/endpoint');

// POST
const response = await apiClient.post('/api/endpoint', { data });

// PUT
const response = await apiClient.put('/api/endpoint/:id', { data });

// DELETE
const response = await apiClient.delete('/api/endpoint/:id');
```

## Helpers

### rutFormatter

Helper completo para manejo de RUT chileno. Ver documentación completa en `src/helpers/RUT_FORMATTER_GUIDE.md`.

```javascript
import { 
  formatRutForDisplay, 
  formatRutForAPI, 
  isValidRut,
  getRutErrorMessage 
} from './helpers/rutFormatter';

// Formatear para mostrar
const displayRut = formatRutForDisplay('123456785'); // "12.345.678-5"

// Formatear para API
const apiRut = formatRutForAPI('12.345.678-5'); // "12345678-5"

// Validar RUT
const isValid = isValidRut('12.345.678-5'); // true

// Obtener mensaje de error
const error = getRutErrorMessage('123'); // "Formato de RUT inválido..."
```

## Funcionalidades del Login

- ✅ **Validación de RUT**: Verifica formato y dígito verificador
- ✅ **Formateo automático**: El RUT se formatea mientras escribes
- ✅ **Validación de contraseña**: Mínimo 6 caracteres
- ✅ **Mensajes de error específicos**: Por campo y tipo de error
- ✅ **Indicador de carga**: Durante el proceso de autenticación
- ✅ **Manejo de errores HTTP**: 401, 403, 404, 500
- ✅ **Almacenamiento seguro**: Tokens en `expo-secure-store`
- ✅ **Decodificación JWT**: Extrae datos del usuario del token
- ✅ **Toggle de contraseña**: Botón para ver/ocultar

## Notas Importantes

- El archivo `.env` está en `.gitignore` para proteger datos sensibles
- Usa `.env.example` como referencia para nuevos desarrolladores
- Después de cambiar variables de entorno, reinicia el servidor de desarrollo de Expo
- Los tokens se guardan de forma segura usando `expo-secure-store`

## Solución de Problemas

### Error de conexión
- Verifica que el backend esté corriendo en `localhost:3000`
- Si usas dispositivo físico, asegúrate de usar la IP correcta
- Verifica que ambos dispositivos estén en la misma red

### Variables de entorno no se cargan
- Reinicia completamente Expo: `expo start -c`
- Verifica que `babel.config.js` esté configurado correctamente
- Asegúrate de que el archivo `.env` exista en la raíz del proyecto
