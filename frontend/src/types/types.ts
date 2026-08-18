export type RGBAColor = [number, number, number, number];

export type MapMode = 'globe' | 'flat' | 'satellite' | 'streets';

export interface FlightArc {
  /** [longitude, latitude] điểm xuất phát */
  from: [number, number];
  /** [longitude, latitude] điểm đến */
  to: [number, number];
  /** Màu RGB (0-255), mặc định xanh dương */
  color?: [number, number, number];
  /** Nhãn hiển thị khi hover (tuỳ chọn) */
  label?: string;
}

export interface WorldMapProps {
  /** Map mã ISO alpha-3 (VD: "VNM", "USA", "JPN") -> màu RGBA để tô quốc gia */
  countryColors?: Record<string, RGBAColor>;
  /** Danh sách các đường bay cong nối 2 điểm */
  flights?: FlightArc[];
  /** Tọa độ trung tâm ban đầu [lon, lat] */
  initialCenter?: [number, number];
  /** Zoom ban đầu */
  initialZoom?: number;
  /** Chế độ bản đồ ban đầu */
  initialMode?: MapMode;
  /** Callback khi user click vào 1 quốc gia đã tô màu */
  onCountryClick?: (iso3: string) => void;
  /** Chiều cao container, mặc định "100%" */
  height?: string;
}

export interface FlightSearchParams {
  departure_id: string;
  arrival_id: string;
  outbound_date: string;
  return_date?: string; // Ngày về có thể bỏ trống nếu bay 1 chiều
  
  // Xóa dấu ? ở các biến mặc định bắt buộc phải có
  flight_type: string; 
  travel_class: '1' | '2' | '3' | '4';
  currency: string;
  use_cache: boolean;

  // Các biến cấu hình nâng cao có thể tùy chọn (?)
  adults?: number;      
  stops?: '0' | '1' | '2' | '3'; 
  legs?: { departure_id: string; arrival_id: string; date: string }[];
  
  [key: string]: any;
}

export interface AirportDetails {
  id: string;
  name: string;
  time: string;
}

export interface PriceInsights {
  lowest_price: number;
  price_level: 'low' | 'typical' | 'high';
  typical_price_range: [number, number];
  price_history: [number, number][]; // [timestamp, price]
}

export interface FlightSegment {
  airline: string;
  airline_logo: string;
  flight_number: string;
  airplane: string;
  travel_class: string; // Thêm hạng vé (VD: "Economy")
  duration: number;
  legroom?: string; // Thêm chỗ để chân
  extensions?: string[]; // Các tiện ích: Wi-Fi, USB, Màn hình...
  overnight?: boolean; // Check bay qua đêm
  often_delayed_by_over_30_min?: boolean; // Cảnh báo delay
  plane_and_crew_by?: string; // Tên hãng vận hành thực tế
  ticket_also_sold_by?: string[];
  departure_airport: AirportDetails;
  arrival_airport: AirportDetails;
}

export interface Layover {
  id: string;
  name: string;
  duration: number;
}

export interface CarbonEmissions {
  this_flight: number;
  typical_for_this_route: number;
  difference_percent: number;
}

export interface FlightOption {
  flights: FlightSegment[];
  layovers?: Layover[];
  total_duration: number;
  carbon_emissions?: CarbonEmissions; // Lượng khí thải
  price: number;
  type: string;
  airline_logo?: string; // Logo hãng (hiện ở ngoài cục to)
  departure_token?: string; // Dùng để tìm vé khứ hồi
  booking_token?: string;   // Dùng để lấy link booking
}