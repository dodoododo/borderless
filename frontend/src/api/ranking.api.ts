// src/services/ranking.service.ts
import type { RankingData } from '../types/ranking.type';

// Nên lưu URL này trong file .env (ví dụ: VITE_API_URL=http://localhost:5000/api)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const RankingService = {
  /**
   * Lấy danh sách xếp hạng Global Mobility
   */
  getGlobalRanking: async (): Promise<RankingData[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/rankings/global`);
      if (!response.ok) throw new Error('Failed to fetch Global Ranking');
      return await response.json();
    } catch (error) {
      console.error('API Error [getGlobalRanking]:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách xếp hạng Openness
   */
  getOpennessRanking: async (): Promise<RankingData[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/rankings/openness`);
      if (!response.ok) throw new Error('Failed to fetch Openness Ranking');
      return await response.json();
    } catch (error) {
      console.error('API Error [getOpennessRanking]:', error);
      throw error;
    }
  }
};