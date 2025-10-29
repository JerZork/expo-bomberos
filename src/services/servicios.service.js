import apiClient from './api';

/**
 * Obtiene todos los servicios de emergencia
 * @returns {Promise<Array>} Lista de servicios
 */
export const getServicios = async () => {
  try {
    const response = await apiClient.get('/servicios');
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    throw error.response?.data || error;
  }
};
