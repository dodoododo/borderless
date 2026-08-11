// src/models/Passport.ts
import mongoose, { Schema } from 'mongoose';

// Cấu trúc gợi ý cho PassportModel
const PassportSchema = new Schema({
  passportIso: { type: String, required: true, unique: true },
  destinations: { type: Map, of: String }, // Dành cho năm mới nhất (Dễ truy xuất)
  history: [{
    period: { type: String },
    destinations: { type: Map, of: String }
  }]
});

export const PassportModel = mongoose.model('Passport', PassportSchema);