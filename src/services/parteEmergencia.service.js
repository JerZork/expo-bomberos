import apiClient from './api';

export const crearParteEmergencia = async (parteEmergenciaData) => {
  try {
    const response = await apiClient.post('/parteEmergencia', parteEmergenciaData);
    return response.data;
  } catch (error) {
    console.error('Error al crear parte de emergencia:', error);
    throw error.response?.data || error;
  }
};

export const obtenerParteEmergenciaPorId = async (id, params = {}) => {
  try {
    const response = await apiClient.get(`/parteEmergencia/${id}`, { params });
    //console.log('Parte de emergencia obtenido:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al obtener parte de emergencia:', error);
    throw error.response?.data || error;
  }
};

export const actualizarParteEmergencia = async (id, data) => {
  try {
    const response = await apiClient.put(`/parteEmergencia/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar parte de emergencia:', error);
    throw error.response?.data || error;
  }
};

export const obtenerParteEmergenciaDetallado = async (id) => {
  try {
    const response = await apiClient.get(`/parteEmergencia/${id}/detallado`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener parte detallado:', error);
    throw error.response?.data || error;
  }
};

export const obtenerUltimoEstadoIncidente = async (id) => {
  try {
    const response = await apiClient.get(`/parteEmergencia/${id}/estado`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener último estado:', error);
    throw error.response?.data || error;
  }
};

export default {
  crearParteEmergencia,
  obtenerParteEmergenciaPorId,
  actualizarParteEmergencia,
  obtenerParteEmergenciaDetallado,
  obtenerUltimoEstadoIncidente,
};
