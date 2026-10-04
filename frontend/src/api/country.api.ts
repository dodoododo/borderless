import type { CountryProfile } from '../types/country.type';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Lấy chi tiết thông tin 1 quốc gia theo ISO code
 */
export const fetchCountryProfile = async (iso: string): Promise<CountryProfile | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/countries/${iso}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const json = await response.json();
    
    if (json.success) {
      return json.data as CountryProfile;
    }
    
    return null;
  } catch (error) {
    console.error(`[API Call Failed] fetchCountryProfile(${iso}):`, error);
    throw error;
  }
};

/**
 * Lấy danh sách TOÀN BỘ quốc gia đã được cache trong Database
 */
export const fetchAllCountries = async (): Promise<CountryProfile[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/countries`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const json = await response.json();
    
    if (json.success) {
      return json.data as CountryProfile[];
    }
    
    return [];
  } catch (error) {
    console.error(`[API Call Failed] fetchAllCountries():`, error);
    throw error;
  }
};

/**
 * Lấy thông tin tóm tắt (Mini Info) của 1 quốc gia (Thường dùng cho thẻ Card/Preview)
 */
export const fetchCountryMiniInfo = async (
  iso: string
): Promise<{ iso: string; name: string; coverImage: string | null } | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/countries/${iso}/mini`);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error(`[API Call Failed] fetchCountryMiniInfo(${iso}):`, error);
    throw error; // Quăng lỗi để UI bắt được (hiện thông báo)
  }
};