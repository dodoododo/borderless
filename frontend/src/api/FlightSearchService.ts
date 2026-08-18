// src/api/FlightSearchService.ts

export interface FlightSearchParams {
  departure_id: string;
  arrival_id: string;
  outbound_date: string;
  return_date?: string;
  flight_type: string; // '1' Khứ hồi, '2' Một chiều
  travel_class: string;
  currency: string;
  use_cache: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_BASE = `${API_BASE_URL}/flights`;

// Bước 1: Tìm chuyến bay (Chiều đi)
export const searchOutboundFlights = async (params: FlightSearchParams) => {
  const response = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error('Lỗi khi gọi API tìm kiếm chuyến bay');
  return response.json();
};

// Bước 2: Tìm chuyến bay (Chiều về)
export const searchReturnFlights = async (params: FlightSearchParams, departure_token: string) => {
  const response = await fetch(`${API_BASE}/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // 🔹 Nối toàn bộ params cũ với token
    body: JSON.stringify({ ...params, departure_token }), 
  });
  if (!response.ok) throw new Error('Lỗi khi gọi API tìm chuyến về');
  return response.json();
};

// Bước 3: Lấy danh sách link thanh toán
export const getBookingOptions = async (params: FlightSearchParams, booking_token: string) => {
  const response = await fetch(`${API_BASE}/booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // 🔹 Nối toàn bộ params cũ với token
    body: JSON.stringify({ ...params, booking_token }),
  });
  if (!response.ok) throw new Error('Lỗi khi gọi API lấy link đặt vé');
  return response.json();
};