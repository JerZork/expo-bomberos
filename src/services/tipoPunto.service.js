import apiClient from './api';

export const getTiposPunto = async () => {
    try {
        const response = await apiClient.get('/tipos-punto');

        return response.data;

    } catch (error) {
        console.error('Error al obtener tipos de punto:', error);
        throw error;
    }
};
