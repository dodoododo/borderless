import type { PassportStatusResponse } from '../types/visa.type';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Gọi Route 2: GET /passport/:iso — lấy toàn bộ danh sách eligibility của 1 hộ chiếu
// LƯU Ý: controller trả thẳng { origin, destinations }, KHÔNG bọc { success, data }
// nên không được check json.success như country.api.ts.
export const fetchPassportStatus = async (iso: string): Promise<PassportStatusResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/passports/${iso}`);

    if (response.status === 404) {
      // Passport chưa được seed trong DB — không phải lỗi mạng, trả null để UI tự fallback
      console.warn(`[fetchPassportStatus] No passport data seeded for "${iso}"`);
      return null;
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const json = await response.json();
    return json as PassportStatusResponse;
  } catch (error) {
    console.error(`[API Call Failed] fetchPassportStatus(${iso}):`, error);
    throw error;
  }
};

// Gọi Route 1: GET /passport/:iso/:destIso — kiểm tra 1 điểm đến cụ thể
// (chưa dùng trong PassportDetailPage hiện tại, để sẵn cho tính năng search/lookup sau này)
export const fetchSingleDestinationStatus = async (
  iso: string,
  destIso: string
): Promise<{ origin: string; destination: string; status: string } | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/passports/${iso}/${destIso}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error(`[API Call Failed] fetchSingleDestinationStatus(${iso}, ${destIso}):`, error);
    throw error;
  }
};