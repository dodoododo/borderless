import { useState, useEffect } from 'react';
import { fetchPassportStatus } from '../api/passport.api.ts';
import type { PassportStatusResponse } from '../types/visa.type.ts';

export const usePassportStatus = (iso: string | null) => {
  const [data, setData] = useState<PassportStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iso) {
      setData(null);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPassportStatus(iso);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [iso]);

  return { data, loading, error };
};