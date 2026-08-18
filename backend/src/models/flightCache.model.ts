// src/models/flightCache.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IFlightCache extends Document {
  cacheKey: string;
  cacheType: 'OUTBOUND' | 'RETURN' | 'BOOKING_OPTIONS';
  data: any;
  createdAt: Date;
}

const FlightCacheSchema: Schema = new Schema({
  cacheKey: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  cacheType: { 
    type: String, 
    enum: ['OUTBOUND', 'RETURN', 'BOOKING_OPTIONS'], 
    required: true 
  },
  data: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 86400 // Tự động xóa Document này sau 86400 giây (24 giờ)
  }
});

export default mongoose.model<IFlightCache>('FlightCache', FlightCacheSchema);