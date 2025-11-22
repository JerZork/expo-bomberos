import apiClient from './api';

/**
 * Obtiene todas las disponibilidades o las de un bombero específico
 * @param {number} idBombero - ID del bombero (opcional, si no se proporciona obtiene todas)
 * @returns {Promise} Promesa que resuelve con la lista de disponibilidades
 */
export const getDisponibilidades = async (idBombero = null) => {
  try {
    const params = {};
    if (idBombero) {
      params.idBombero = idBombero;
    }
    
    const response = await apiClient.get('/disponibilidad', { params });
    return response.data.data; // Extraer el array de la propiedad data
  } catch (error) {
    console.error('Error al obtener disponibilidades:', error);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene una disponibilidad específica por ID
 * @param {number} id - ID de la disponibilidad
 * @returns {Promise} Promesa que resuelve con los datos de la disponibilidad
 */
export const getDisponibilidad = async (id) => {
  try {
    const response = await apiClient.get(`/disponibilidad/detail/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    throw error.response?.data || error;
  }
};

/**
 * Crea una nueva disponibilidad
 * @param {Object} disponibilidadData - Datos de la disponibilidad
 * @returns {Promise} Promesa que resuelve con la disponibilidad creada
 */
export const createDisponibilidad = async (disponibilidadData) => {
  try {
    const response = await apiClient.post('/disponibilidad', disponibilidadData);
    return response.data.data;
  } catch (error) {
    console.error('Error al crear disponibilidad:', error);
    throw error.response?.data || error;
  }
};

/**
 * Actualiza una disponibilidad existente
 * @param {number} id - ID de la disponibilidad
 * @param {Object} disponibilidadData - Datos actualizados de la disponibilidad
 * @returns {Promise} Promesa que resuelve con la disponibilidad actualizada
 */
export const updateDisponibilidad = async (id, disponibilidadData) => {
  try {
    const response = await apiClient.patch(`/disponibilidad/detail/${id}`, disponibilidadData);
    return response.data.data;
  } catch (error) {
    console.error('Error al actualizar disponibilidad:', error);
    throw error.response?.data || error;
  }
};

/**
 * Elimina una disponibilidad
 * @param {number} id - ID de la disponibilidad
 * @returns {Promise} Promesa que resuelve con el resultado de la eliminación
 */
export const deleteDisponibilidad = async (id) => {
  try {
    const response = await apiClient.delete(`/disponibilidad/detail/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al eliminar disponibilidad:', error);
    throw error.response?.data || error;
  }
};

/**
 * Cambia el estado de disponibilidad de un bombero (cerrar disponibilidad activa)
 * @param {Object} statusData - Datos del cambio de estado
 * @param {number} statusData.idBombero - ID del bombero
 * @returns {Promise} Promesa que resuelve con la disponibilidad actualizada
 */
export const cerrarDisponibilidad = async (statusData) => {
  try {
    const response = await apiClient.patch('/disponibilidad/cerrar', statusData);
    return response.data.data;
  } catch (error) {
    console.error('Error al cerrar disponibilidad:', error);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene la disponibilidad activa de un bombero
 * @param {number} idBombero - ID del bombero
 * @returns {Promise} Promesa que resuelve con la disponibilidad activa
 */
export const getDisponibilidadActiva = async (idBombero) => {
  try {
    const response = await apiClient.get(`/disponibilidad/detalle/activa/${idBombero}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener disponibilidad activa:', error);
    throw error.response?.data || error;
  }
};
