import apiClient from './api';

/**
 * Obtiene todas las clasificaciones de emergencia
 * @returns {Promise<Array>} Lista de clasificaciones
 */
export const getClasificacionesEmergencia = async () => {
  try {
    const response = await apiClient.get('/subtipoIncidente/clasificaciones');
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error al obtener clasificaciones de emergencia:', error);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene los subtipos de incidente por clasificación
 * @param {number} idClasificacion - ID de la clasificación
 * @returns {Promise<Array>} Lista de subtipos
 */
export const getSubtiposIncidente = async (idClasificacion) => {
  try {
    const response = await apiClient.get(`/subtipoIncidente/subtipos/${idClasificacion}`);
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error al obtener subtipos de incidente:', error);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene los tipos de daño
 * @returns {Promise<Array>} Lista de tipos de daño
 */
export const getTiposDano = async () => {
  try {
    const response = await apiClient.get('/subtipoIncidente/tiposDano');
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error al obtener tipos de daño:', error);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene las fases de incidente
 * @returns {Promise<Array>} Lista de fases
 */
export const getFasesIncidente = async () => {
  try {
    const response = await apiClient.get('/subtipoIncidente/fasesIncidente');
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error al obtener fases de incidente:', error);
    throw error.response?.data || error;
  }
};
