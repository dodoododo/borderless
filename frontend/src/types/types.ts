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