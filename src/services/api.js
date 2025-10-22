import axios from 'axios';
import { API_URL, API_TIMEOUT } from '@env';

const apiClient = axios.create({
  // API_URL debe incluir el prefijo /api (ej: http://10.30.164.245:3000/api)
  baseURL: API_URL || 'http://localhost:3000/api',
  timeout: parseInt(API_TIMEOUT) || 10000,
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
