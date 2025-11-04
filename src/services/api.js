import axios from 'axios';

// Configuración hardcodeada para builds (EAS no soporta bien @env)
const API_BASE_URL = 'http://10.178.241.245:3000/api';
const API_TIMEOUT = 10000;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a las peticiones
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Import dinámico para evitar dependencias cíclicas y carga innecesaria
      const SecureStore = await import('expo-secure-store');
      const token = await SecureStore.getItemAsync?.('authToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_e) {
      // si falla SecureStore, mandamos la request igual
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error de respuesta:', error.response.data);
      console.error('Código de estado:', error.response.status);
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta
      console.error('Error de petición:', error.request);
    } else {
      // Algo pasó al configurar la petición
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
