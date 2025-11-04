import apiClient from './api';

// Devuelve lista de incidentes con su último estado y detalles mínimos para el kanban/drawer
export const getIncidentesResumen = async (params = {}) => {
  try {
    const resp = await apiClient.get('/incidentes/resumen', { params });

    return resp.data?.data ?? resp.data;
  } catch (error) {
    console.error('Error al obtener incidentes resumen:', error);
    throw error.response?.data || error;
  }
};

// Devuelve lista para revisión (todos los incidentes), filtrable por estados permitidos
// estados: array de strings, p.ej. ['ENVIADO','APROBADO','CORREGIR']
export const getIncidentesRevision = async (estados = []) => {
  try {
    const params = {};
    if (Array.isArray(estados) && estados.length > 0) {
      params.estados = estados.join(',');
    }
    const resp = await apiClient.get('/incidentes/revision', { params });
    return resp.data?.data ?? resp.data;
  } catch (error) {
    console.error('Error al obtener incidentes para revisión:', error);
    throw error.response?.data || error;
  }
};

// Cambia estado del incidente (sólo si el último estado actual es ENVIADO)
// body: { estado: 'APROBADO'|'CORREGIR', idBombero }
export const cambiarEstadoIncidente = async (id, { estado, idBombero }) => {
  try {
    const resp = await apiClient.post(`/incidentes/${id}/cambiar-estado`, { estado, idBombero });
    return resp.data?.data ?? resp.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Borra un incidente por id. Backend valida que el último estado sea BORRADOR o CORREGIR.
export const borrarIncidente = async (idIncidente) => {
  if (!Number.isFinite(Number(idIncidente))) {
    throw new Error('Id inválido');
  }
  try {
    const resp = await apiClient.delete(`/parteEmergencia/incidente/${idIncidente}`);
    return resp.data;
  } catch (error) {
    console.error('Error al borrar incidente:', error);
    throw error.response?.data || error;
  }
};

export default {
  getIncidentesResumen,
  getIncidentesRevision,
  cambiarEstadoIncidente,
  borrarIncidente,
};
