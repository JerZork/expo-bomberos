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

/**
 * Obtiene los bomberos con licencias de una compañíaa
 * @param {number} companiaId - ID de la compañía
 * @returns {Promise<Array>} Lista de bomberos con licencias
 */
export const getBomberosConLicencias = async (companiaId) => {
  try {
    const response = await apiClient.get(`/bombero/licencias/${companiaId}`);
   
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error al obtener bomberos con licencias:', error);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene todos los bomberos
 * @returns {Promise<Array>} Lista de todos los bomberos
 */
export const getBomberos = async () => {
  try {
    const response = await apiClient.get('/bombero');
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error al obtener bomberos:', error);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene todos los detalles de un bombero en una sola consulta
 * Estructura esperada (backend): {
 *   informacionPersonal, contactosEmergencia, capacitaciones,
 *   historialActividades, eppAcargo, estadisticas
 * }
 * @param {number} idBombero
 * @returns {Promise<Object>} Objeto con los detalles del bombero
 */
export const getBomberoDetalles = async (idBombero) => {
  if (!idBombero) throw new Error('idBombero es requerido');
  try {
    const response = await apiClient.get(`/bombero/${idBombero}/detalles`);
    return response.data; // backend suele responder { status, data }
  } catch (error) {
    console.error('Error al obtener detalles completos del bombero:', error);
    throw error.response?.data || error;
  }
};
