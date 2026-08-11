// src/types/ranking.types.ts

export interface VisaDetails {
  free: number;
  voa: number;
  evisa: number;
  eta: number;
  req: number;
  ban: number;
}

// Thêm interface cho từng phần tử lịch sử
export interface RankingHistory {
  period: string;
  rank: number;
  globalScore: number;
  opennessScore: number;
  details: VisaDetails;
}

export interface RankingData {
  rank: number;
  iso: string;
  globalScore: number;
  opennessScore: number;
  details: VisaDetails;
  // Bổ sung mảng history để match với DB và sửa lỗi TS
  history?: RankingHistory[]; 
}