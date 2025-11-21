import api from './api';

export const getJurisdicciones = async () => {
    try {
        const response = await api.get('/jurisdicciones');
        return response.data;
    } catch (error) {
        console.error("Error fetching jurisdicciones:", error);
        return [];
    }
};
