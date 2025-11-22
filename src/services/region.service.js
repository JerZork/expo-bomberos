import apiClient from './api';

/**
 * Obtiene todas las regiones
 * @returns {Promise<Array>} Lista de regiones
 */
export const getRegiones = async () => {
  try {
    const response = await apiClient.get('/region/regiones');
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error al obtener regiones:', error);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene las comunas de una región
 * @param {number} regionId - ID de la región
 * @returns {Promise<Array>} Lista de comunas
 */
export const getComunas = async (regionId) => {
  try {
    const response = await apiClient.get(`/region/comunas/region/${regionId}`);
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error al obtener comunas:', error);
    throw error.response?.data || error;
  }
};
