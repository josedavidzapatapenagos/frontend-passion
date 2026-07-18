import { useState, useEffect } from 'react';
import { getCatalogs } from '../services/flagService';
import type { Catalog } from '../types/models';
import { useNotification } from './useNotification';

type ApiError = {
  response?: {
    status?: number;
  };
};

export const useCatalogs = () => {
  const { error: notifyError } = useNotification();
  const [countries, setCountries] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await getCatalogs();
        // Accedemos a response.data porque la interfaz ApiResponse así lo define
        setCountries(response.data);
      } catch (err: unknown) {
        const apiError = err as ApiError;
        // Si sale 401 aquí, es que la cookie no está o expiró
        const message =
          apiError.response?.status === 401
            ? 'Sesión no autorizada'
            : 'Error de conexión';

        setError(message);
        notifyError({
          title: 'No pudimos cargar países',
          description: message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  return { countries, loading, error };
};