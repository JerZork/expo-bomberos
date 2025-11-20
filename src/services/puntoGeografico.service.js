import apiClient from './api';

export const getPuntosGeograficos = async () => {
    try {
        const response = await apiClient.get('/puntos-geograficos');
        // console.log(response.data)
        return response.data;
    } catch (error) {
        console.error('Error al obtener puntos geográficos:', error);
        throw error;
    }
};
