import mongoose, { Schema, Document } from 'mongoose';

// 1. Định nghĩa interface cho 1 record Lịch sử
export interface IRankingHistory {
  period: string; // Ví dụ: 2019, 2020... 2026
  rank: number;
  globalScore: number;
  opennessScore: number;
  details: {
    free: number;
    voa: number;
    evisa: number;
    eta: number;
    req: number;
    ban: number;
  };
}

// 2. Cập nhật interface chính
export interface IRanking extends Document {
  iso: string;
  rank: number; // Thêm rank hiện tại
  globalScore: number;
  opennessScore: number;
  details: {
    free: number;
    voa: number;
    evisa: number;
    eta: number;
    req: number;
    ban: number;
  };
  history: IRankingHistory[]; // <--- Lưu lịch sử ở đây
  lastUpdated: Date;
}

const HistorySchema = new Schema<IRankingHistory>({
  period: { type: String, required: true },
  rank: { type: Number, required: true },
  globalScore: { type: Number, default: 0 },
  opennessScore: { type: Number, default: 0 },
  details: {
    free: { type: Number, default: 0 },
    voa: { type: Number, default: 0 },
    evisa: { type: Number, default: 0 },
    eta: { type: Number, default: 0 },
    req: { type: Number, default: 0 },
    ban: { type: Number, default: 0 },
  }
}, { _id: false }); // Không cần tạo _id cho sub-document để nhẹ DB

const RankingSchema = new Schema<IRanking>({
  iso: { type: String, required: true, unique: true, index: true },
  rank: { type: Number, default: 0, index: 1 }, 
  globalScore: { type: Number, default: 0, index: -1 }, 
  opennessScore: { type: Number, default: 0, index: -1 },
  details: {
    free: { type: Number, default: 0 },
    voa: { type: Number, default: 0 },
    evisa: { type: Number, default: 0 },
    eta: { type: Number, default: 0 },
    req: { type: Number, default: 0 },
    ban: { type: Number, default: 0 },
  },
  history: [HistorySchema],
  lastUpdated: { type: Date, default: Date.now }
});

export const RankingModel = mongoose.model<IRanking>('Ranking', RankingSchema);