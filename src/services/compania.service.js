import apiClient from './api';

/**
 * Obtiene una compañía por ID
 * @param {number} id - ID de la compañía
 * @returns {Promise<Object>} Datos de la compañía
 */
export const getCompaniaById = async (id) => {
  try {
    const response = await apiClient.get(`/compania/detalle/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener compañía:', error);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene todas las compañías
 * @param {Object} params - Parámetros de búsqueda y paginación
 * @returns {Promise<Object>} Respuesta con compañías y paginación
 */
export const getCompanias = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.nombre) queryParams.append('nombre', params.nombre);
    if (params.email) queryParams.append('email', params.email);
    if (params.telefono) queryParams.append('telefono', params.telefono);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await apiClient.get(`/compania?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener compañías:', error);
    throw error.response?.data || error;
  }
};
