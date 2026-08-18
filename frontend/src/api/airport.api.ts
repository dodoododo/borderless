// src/api/airport.api.ts

export interface AirportSuggestion {
  code: string;
  name: string;
  city: string;
  country: string;
  type: 'city' | 'airport';
  main_airport_name?: string;
}

export interface AirportSearchResponse {
  source: string;
  special_note?: string;
  data: AirportSuggestion[];
}

/**
 * Gọi API Backend để tìm kiếm Sân bay/Thành phố (Tự động Cache qua MongoDB)
 * @param query Từ khóa tìm kiếm (VD: "SGN", "Vatican", "Tokyo")
 */
export const searchAirportsCached = async (query: string): Promise<AirportSearchResponse> => {
  // Thay đổi fallback port 5000 thành port backend thật của bạn nếu cần
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  
  const response = await fetch(`${API_BASE}/airports/search?q=${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch airports');
  }
  
  return response.json();
};