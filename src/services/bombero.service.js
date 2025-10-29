import apiClient from './api';

/**
 * Obtiene todos los bomberos de una compañía
 * @param {number} companiaId - ID de la compañía
 * @returns {Promise<Array>} Lista de bomberos
 */
export const getBomberosPorCompania = async (companiaId) => {
  try {
    const response = await apiClient.get(`/bombero/compania/${companiaId}`);
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error al obtener bomberos por compañía:', error);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene la compañía del usuario autenticado
 */
export const getMiCompania = async () => {
  try {
    const response = await apiClient.get('/bombero/mi-compania');
    return response.data;
  } catch (error) {
    console.error('Error al obtener mi compañía:', error);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene todos los bomberos de la compañía del usuario autenticado
 */
export const getBomberosMiCompania = async () => {
  try {
    const response = await apiClient.get('/bombero/mi-compania/bomberos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener bomberos de mi compañía:', error);
    throw error.response?.data || error;
  }
};
