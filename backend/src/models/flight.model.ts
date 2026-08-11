import mongoose, { Schema, Document } from 'mongoose';


export interface FlightSearchParams {
  departure_id: string;
  arrival_id: string;
  outbound_date: string;
  return_date?: string;
  type?: string;
  travel_class?: string;
  currency?: string;
  use_cache?: boolean;
  [key: string]: any;
}

// 1. Khai báo Interface cho TypeScript
export interface IFlight extends Document {
  userId: mongoose.Types.ObjectId; // Liên kết với User đang đăng nhập
  searchParams: {
    departure_id: string;
    arrival_id: string;
    outbound_date: string;
    return_date?: string;
    flight_type: string; // '1': Khứ hồi, '2': Một chiều
    travel_class: string;
  };
  flightDetails: {
    airline: string;
    airline_logo: string;
    flight_number: string;
    departure_time: string;
    arrival_time: string;
    duration: number; // Tổng thời gian bay (phút)
  }[];
  price: number;
  currency: string;
  totalDuration: number;
  tokens: {
    departure_token?: string; // Dùng để tra chuyến về
    booking_token?: string;   // Dùng để lấy link thanh toán
  };
  status: 'saved' | 'booked' | 'cancelled';
  rawSerpApiData?: any; // Lưu dự phòng full JSON của chuyến bay nếu cần render lại UI
}

// 2. Khởi tạo Mongoose Schema
const FlightSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Trỏ tới User Model của bác (nếu có)
      required: true,
    },
    searchParams: {
      departure_id: { type: String, required: true, uppercase: true, trim: true },
      arrival_id: { type: String, required: true, uppercase: true, trim: true },
      outbound_date: { type: String, required: true },
      return_date: { type: String, default: null },
      flight_type: { type: String, default: '1' },
      travel_class: { type: String, default: '1' },
    },
    flightDetails: [
      {
        airline: { type: String, required: true },
        airline_logo: { type: String },
        flight_number: { type: String, required: true },
        departure_time: { type: String, required: true },
        arrival_time: { type: String, required: true },
        duration: { type: Number, required: true },
      },
    ],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    totalDuration: {
      type: Number,
      required: true,
    },
    tokens: {
      departure_token: { type: String },
      booking_token: { type: String },
    },
    status: {
      type: String,
      enum: ['saved', 'booked', 'cancelled'],
      default: 'saved',
    },
    rawSerpApiData: {
      type: Schema.Types.Mixed, // Schema.Types.Mixed cho phép lưu JSON object linh hoạt
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  }
);

// Bổ sung Index để query nhanh hơn (Ví dụ: Lấy lịch sử vé của 1 user)
FlightSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IFlight>('Flight', FlightSchema);