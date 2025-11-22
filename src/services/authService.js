import apiClient from './api';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { Alert } from 'react-native';

const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

export const authService = {
  /**
   * Inicia sesión del usuario
   * @param {string} run - RUT del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise} - Promesa con los datos del usuario
   */
  login: async (run, password) => {
    try {
      // DEBUG: Mostrar URL que se está usando
      Alert.alert('DEBUG', `Conectando a: ${apiClient.defaults.baseURL}/auth/login`);
      
      const response = await apiClient.post('/auth/login', {
        run,
        password,
      });

      const { token } = response.data.data; // La respuesta viene en response.data.data.token

      if (!token) {
        throw new Error('No se recibió token del servidor');
      }

      // Decodificar el token para obtener los datos del usuario
      const decodedToken = jwtDecode(token);
      
      const user = {
        id: decodedToken.id,
        nombres: decodedToken.nombres,
        apellidos: decodedToken.apellidos,
        email: decodedToken.email,
        run: decodedToken.run,
        activo: decodedToken.activo,
        roles: decodedToken.roles,
      };

  // Guardar token de forma segura y user en AsyncStorage (evitar >2KB en SecureStore)
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

      return { token, user };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cierra sesión del usuario
   */
  logout: async () => {
    try {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  },

  /**
   * Obtiene el token almacenado
   * @returns {Promise<string|null>} - Token o null
   */
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error al obtener token:', error);
      return null;
    }
  },

  /**
   * Obtiene los datos del usuario almacenados
   * @returns {Promise<object|null>} - Datos del usuario o null
   */
  getUserData: async () => {
    try {
      // 1) Intentar desde AsyncStorage (nuevo flujo)
      const stored = await AsyncStorage.getItem(USER_DATA_KEY);
      if (stored) return JSON.parse(stored);

      // 2) Migración: si existe en SecureStore (flujo antiguo), mover a AsyncStorage
      const legacy = await SecureStore.getItemAsync(USER_DATA_KEY);
      if (legacy) {
        await AsyncStorage.setItem(USER_DATA_KEY, legacy);
        await SecureStore.deleteItemAsync(USER_DATA_KEY);
        return JSON.parse(legacy);
      }
      return null;
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      return null;
    }
  },

  /**
   * Verifica si el usuario está autenticado
   * @returns {Promise<boolean>} - true si está autenticado
   */
  isAuthenticated: async () => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      return !!token;
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      return false;
    }
  },
};
