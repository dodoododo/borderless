import { useState, useEffect } from 'react';
import { fetchCountryProfile } from '../api/country.api';
import type { CountryProfile } from '../types/country.type';

export const useCountryProfile = (iso: string | null) => {
  const [data, setData] = useState<CountryProfile | null>(null);
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
        const result = await fetchCountryProfile(iso);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [iso]); // Hook sẽ tự động chạy lại khi iso thay đổi

  return { data, loading, error };
};