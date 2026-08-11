import { PassportModel } from '../models/passport.model.js';
import { RankingModel } from '../models/ranking.model.js';

const normalizeStatus = (val: any): string => {
  if (!val) return '';
  return String(val).trim().toLowerCase();
};

export const syncRankingsData = async (period: string, isLatest: boolean = false): Promise<number> => {
  console.log(`⚙️ Bắt đầu đồng bộ Ranking cho kỳ ${period} (isLatest: ${isLatest})...`);
  
  const passports = await PassportModel.find({});
  const rankingMap = new Map();

  // 1. Khởi tạo Map
  passports.forEach(p => {
    rankingMap.set(p.passportIso, {
      iso: p.passportIso,
      globalScore: 0,
      opennessScore: 0,
      rank: 0,
      details: { free: 0, voa: 0, evisa: 0, eta: 0, req: 0, ban: 0 }
    });
  });

  // 2. Vòng lặp quét và tính điểm
  passports.forEach(p => {
    const originIso = p.passportIso;
    const originRank = rankingMap.get(originIso);
    
    // 🚀 BẢN VÁ LỖI NẰM Ở ĐÂY: TÌM ĐÚNG DỮ LIỆU CỦA KỲ ĐÓ (PERIOD)
    let currentDestinations = null;
    
    const historicalData = p.history?.find((h: any) => h.period === period);
    if (historicalData && historicalData.destinations) {
      currentDestinations = historicalData.destinations;
    } else if (p.destinations) {
      // Fallback: Nếu không tìm thấy trong history, lấy tạm ở root
      currentDestinations = p.destinations;
    }

    // Nếu quốc gia này không có dữ liệu của kỳ đang xét thì bỏ qua
    if (!currentDestinations) return; 

    // Quét trên tập dữ liệu chuẩn của đúng năm đó
    currentDestinations.forEach((val: any, destIso: string) => {
      const s = normalizeStatus(val);
      if (!s || s === '-1' || destIso === originIso) return; 

      let isAccessible = false;

      if (s.includes('required')) {
        originRank.details.req++;
      } else if (s.includes('arrival') || s === 'voa') {
        originRank.details.voa++;
        isAccessible = true;
      } else if (s.includes('e-visa') || s.includes('evisa')) {
        originRank.details.evisa++;
        isAccessible = true;
      } else if (s.includes('eta')) {
        originRank.details.eta++;
        isAccessible = true;
      } else if (s.includes('admission') || s.includes('ban')) {
        originRank.details.ban++;
      } else if (s.includes('free') || !isNaN(Number(s))) {
        originRank.details.free++;
        isAccessible = true;
      } else {
        originRank.details.req++;
      }

      if (isAccessible && rankingMap.has(destIso)) {
        rankingMap.get(destIso).opennessScore += 1;
      }
    });

    originRank.globalScore = 
      originRank.details.free + originRank.details.voa + originRank.details.evisa + originRank.details.eta;
  });

  // 3. TÍNH TOÁN THỨ HẠNG (RANK) DỰA TRÊN GLOBAL SCORE
  const rankingsArray = Array.from(rankingMap.values());
  rankingsArray.sort((a, b) => b.globalScore - a.globalScore);

  let currentRank = 1;
  let previousScore = rankingsArray[0]?.globalScore || 0;

  rankingsArray.forEach(item => {
    if (item.globalScore < previousScore) {
      currentRank++;
      previousScore = item.globalScore;
    }
    item.rank = currentRank;
  });

  // 4. LẤY DỮ LIỆU CŨ TỪ DB ĐỂ UPDATE ARRAY HISTORY AN TOÀN
  const existingRankings = await RankingModel.find({});
  const existingMap = new Map(existingRankings.map(r => [r.iso, r]));

  // 5. BULK WRITE VÀO MONGODB
  const bulkOps = rankingsArray.map(data => {
    const existing = existingMap.get(data.iso);
    
    let history = existing ? existing.history.filter((h: any) => h.period !== period) : [];
    
    history.push({
      period, 
      rank: data.rank,
      globalScore: data.globalScore,
      opennessScore: data.opennessScore,
      details: data.details
    });

    history.sort((a, b) => b.period.localeCompare(a.period));

    const updateDoc: any = {
      $set: {
        history: history,
        lastUpdated: new Date()
      }
    };

    if (isLatest) {
      updateDoc.$set.globalScore = data.globalScore;
      updateDoc.$set.opennessScore = data.opennessScore;
      updateDoc.$set.rank = data.rank;
      updateDoc.$set.details = data.details;
    }

    return {
      updateOne: {
        filter: { iso: data.iso },
        update: updateDoc,
        upsert: true
      }
    };
  });

  if (bulkOps.length > 0) {
    await RankingModel.bulkWrite(bulkOps);
  }

  console.log(`✅ Đồng bộ xong Ranking kỳ ${period} cho ${bulkOps.length} quốc gia!`);
  return bulkOps.length;
};