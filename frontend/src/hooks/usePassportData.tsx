import { useState, useEffect } from 'react';
import { TERRITORY_MAPPING } from '../constants/territoryMapping'; // Import bảng mapping của bác
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export function usePassportData(iso: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Tính toán targetIso ngay từ đầu
  const upperIso = iso?.toUpperCase();
  const targetIso = TERRITORY_MAPPING[upperIso] || upperIso;
  
  useEffect(() => {
    // 2. Nếu không có iso hoặc iso rỗng thì không làm gì cả
    if (!upperIso) {
      setData(null);
      return;
    }

    const fetchPassport = async () => {
      setLoading(true);
      setError(null); // Reset lỗi mỗi lần fetch mới
      try {
        // 3. Sử dụng targetIso để fetch dữ liệu "cha"
        const response = await fetch(`${API_BASE_URL}/passports/${targetIso}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${targetIso}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPassport();
  }, [targetIso, upperIso]); // 4. Phụ thuộc vào targetIso để trigger fetch khi thay đổi

  return { data, loading, error };
}