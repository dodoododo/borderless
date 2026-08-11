import { Request, Response } from 'express';
import { RankingModel } from '../models/ranking.model.js';
import { syncRankingsData } from '../services/ranking.service.js';

export const getGlobalRanking = async (req: Request, res: Response): Promise<void> => {
  try {
    const rankings = await RankingModel.find({}, '-_id -__v -lastUpdated')
      .sort({ globalScore: -1 }) // Vẫn sort điểm từ cao xuống thấp
      .lean();
    
    // Thuật toán Dense Ranking
    let currentRank = 1;
    let previousScore = rankings[0]?.globalScore || 0;

    const result = rankings.map((item) => {
      // Nếu điểm nước này thấp hơn nước trước đó -> Sang một hạng mới
      if (item.globalScore < previousScore) {
        currentRank++;
        previousScore = item.globalScore;
      }
      
      return {
        ...item,
        rank: currentRank // Các nước bằng điểm sẽ giữ nguyên currentRank
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Global Ranking" });
  }
};

export const getOpennessRanking = async (req: Request, res: Response): Promise<void> => {
  try {
    const rankings = await RankingModel.find({}, '-_id -__v -lastUpdated')
      .sort({ opennessScore: -1 }) // Sort theo độ mở (Openness)
      .lean();
    
    // Tương tự, tính rank cho Openness Score
    let currentRank = 1;
    let previousScore = rankings[0]?.opennessScore || 0;

    const result = rankings.map((item) => {
      if (item.opennessScore < previousScore) {
        currentRank++;
        previousScore = item.opennessScore;
      }
      
      return {
        ...item,
        rank: currentRank 
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Openness Ranking" });
  }
};

export const forceSyncRanking = async (req: Request, res: Response): Promise<void> => {
  try {
    const period = req.body.period || "2026-07"; 
    const isLatest = req.body.isLatest !== false;

    const count = await syncRankingsData(period, isLatest);
    
    res.status(200).json({ 
      message: `Đồng bộ thành công ${count} quốc gia cho kỳ ${period}.` 
    });
  } catch (error) {
    res.status(500).json({ message: "Đồng bộ thất bại", error });
  }
};