import { useState, useEffect } from 'react';
import { getCatalogs } from '../services/flagService';
import type { Catalog } from '../types/models';

export const useCatalogs = () => {
  const [countries, setCountries] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await getCatalogs();
        // Accedemos a response.data porque la interfaz ApiResponse así lo define
        setCountries(response.data);
      } catch (err: any) {
        // Si sale 401 aquí, es que la cookie no está o expiró
        setError(err.response?.status === 401 ? 'Sesión no autorizada' : 'Error de conexión');
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  return { countries, loading, error };
};