import mongoose, { Schema, Document } from 'mongoose';

export interface IAirport extends Document {
    code: string;
    name: string;
    city: string;
    country: string;
    type: string;               // 'city' hoặc 'airport'
    main_airport_name?: string; 
    lat?: number;               
    lon?: number;               
}

const AirportSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    type: { type: String, required: true },
    main_airport_name: { type: String },
    lat: { type: Number },
    lon: { type: Number }
}, { timestamps: true });

// Đánh Text Index để tìm kiếm linh hoạt, siêu tốc độ
AirportSchema.index({ code: 'text', name: 'text', city: 'text', country: 'text' });

export default mongoose.model<IAirport>('Airport', AirportSchema);