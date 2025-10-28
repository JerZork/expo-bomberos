import apiClient from './api';

export const getEstadosReportes = async () => {
  try {
    const response = await apiClient.get('/estadosParte/');
    console.log('Estados de parte obtenidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al listar estados de parte:', error);
    throw error.response?.data || error;
  }
};

export default {
  getEstadosReportes,
};
