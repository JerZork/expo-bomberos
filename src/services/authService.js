import apiClient from './api';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

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

      // Guardar token y datos del usuario de forma segura
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));

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
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
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
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
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
