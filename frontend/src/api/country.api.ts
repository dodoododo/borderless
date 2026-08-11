import type { CountryProfile } from '../types/country.type';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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