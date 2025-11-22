import apiClient from './api';

/**
 * Obtiene todos los carros de una compañía
 * @param {number} companiaId - ID de la compañía
 * @returns {Promise<Array>} Lista de carros
 */
export const getCarrosByCompania = async (companiaId) => {
  try {
    const response = await apiClient.get(`/carro/compania/${companiaId}`);
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error al obtener carros por compañía:', error);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene todos los carros
 * @param {Object} params - Parámetros de búsqueda
 * @returns {Promise<Object>} Respuesta con carros
 */
export const getCarros = async (params = {}) => {
  try {
    const response = await apiClient.get('/carro', { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener carros:', error);
    throw error.response?.data || error;
  }
};
