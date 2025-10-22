import { useEffect, useMemo, useState } from 'react';
import apiClient from '../services/api';

/**
 * Hook para obtener la configuración de la compañía desde la API.
 * Si falla la API, retorna valores por defecto seguros.
 */
export function useCompaniaConfig() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState({});

  useEffect(() => {
    let isMounted = true;

    async function fetchConfig() {
      setLoading(true);
      setError(null);
      try {
        // Usar exactamente las rutas del backend (ver src/routes/compania.routes.js)
        // Para Home usamos la primera compañía disponible
        const res = await apiClient.get('/compania?page=1&limit=1');
        let data = {};
        if (res?.data?.data?.companias && res.data.data.companias.length > 0) {
          data = res.data.data.companias[0];
        } else if (res?.data?.data && Array.isArray(res.data.data)) {
          // por si el handler devolviera directamente el array (defensivo)
          data = res.data.data[0] || {};
        }

        if (isMounted) setConfig(data);
      } catch (e) {
        if (isMounted) setError(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const map = useMemo(() => {
    // Normaliza posibles claves recibidas desde el backend
    const c = config || {};
    const normalized = {
      company_name: c.nombre,
      company_founded_year: c.fechaFundacion ? String(new Date(c.fechaFundacion).getFullYear()) : undefined,
      company_phone: c.telefono,
      company_email: c.email,
      // dirección simple unida si viene precargada por servicio
      company_address: c.direccion
        ? [c.direccion.calle, c.direccion.numero, c.direccion.depto]
            .filter(Boolean)
            .join(' ')
        : undefined,
      // No hay ciudad/región directo en la compañía; se pueden derivar desde comuna->región en el futuro
      company_city: undefined,
      company_region: undefined,
    };
    return normalized;
  }, [config]);

  function getConfigValue(key, defaultValue = '') {
    if (map[key] === undefined || map[key] === null || map[key] === '') return defaultValue;
    return map[key];
  }

  return { loading, error, getConfigValue };
}
