import CountryDetail from '../models/countryDetail.model.js';
import Country from '../models/country.model.js';
import { generateCountryInsights } from './gemini.service.js';
import { mergePalestineCiaData, transformCiaToCountryDetail } from '../utils/ciaMapper.js';

// Import JSON chuẩn ES Module của Node 22
import factbookData from '../data/factbook.json' with { type: 'json' };

export const getCountryDetailData = async (iso2: string) => {
  const iso2Upper = iso2.toUpperCase();

  // 1. Lấy tên chuẩn của quốc gia từ bảng Core (Dùng cho cả Factbook và Gemini)
  const coreCountry = await Country.findOne({ iso2: iso2Upper });
  if (!coreCountry) {
    throw new Error("Không tìm thấy quốc gia trong hệ thống lõi");
  }
  const countryName = coreCountry.nameCommon;

  // 2. Tìm trong MongoDB xem đã có data chưa
  let detail = await CountryDetail.findOne({ iso2: iso2Upper });

  // Kiểm tra xem bản ghi hiện tại đã có các trường MỚI cập nhật chưa?
  // (Vì trong schema ta set default: null, nên các bản cũ sẽ có location là null)
  const isMissingNewFields = detail ? (detail.geography?.location == null) : true;

  // =========================================================
  // TRƯỜNG HỢP 1: HOÀN HẢO - Đã gen AI và đã có đủ trường mới -> Trả về luôn
  // =========================================================
  if (detail && detail.isAiGenerated && !isMissingNewFields) {
    console.log(`[CACHE HIT] Lấy dữ liệu chi tiết từ MongoDB cho ${iso2Upper}`);
    return detail;
  }

  // =========================================================
  // CHUẨN BỊ DATA TỪ CIA FACTBOOK (Sẽ dùng cho cả TH 2 và TH 3)
  // =========================================================
  const typedFactbookData = factbookData as Record<string, any>;
  const countriesDict = typedFactbookData.countries || {};
  let mappedCiaData: any = { iso2: iso2Upper };

  if (iso2Upper === 'PS') {
    console.log(`[ĐẶC BIỆT] Đang gộp dữ liệu CIA cho West Bank và Gaza Strip thành Palestine...`);
    
    // CIA key cho 2 khu vực này
    const wbRaw = countriesDict['west_bank'];
    const gzRaw = countriesDict['gaza_strip'];

    const wbMapped = wbRaw ? transformCiaToCountryDetail('PS', wbRaw) : {};
    const gzMapped = gzRaw ? transformCiaToCountryDetail('PS', gzRaw) : {};

    // Gọi hàm gộp bên mapper
    mappedCiaData = mergePalestineCiaData(wbMapped, gzMapped);

  } else {
    // LOGIC CŨ CHO CÁC NƯỚC BÌNH THƯỜNG
    const explicitFactbookKeys: Record<string, string> = {
      "CD": "congo_democratic_republic_of_the", 
      "CG": "congo_republic_of_the",            
      "KR": "korea_south", 
      "KP": "korea_north",
      "CI": "cote_d'_ivoire",                   
      "CR": "costa_rica",
      "MM": "burma",
      "TL" : "timor_leste",
      "VA" : "holy_see_vatican_city",
      "BS" : "bahamas_the",
      "GW" : "guinea_bissau",
      "FM" : "micronesia_federated_states_of",
      "ST" : "sao_tome_and_principe",
      "CW" : "curacao",
      "GS" : "south_georgia_and_south_sandwich_islands",
      "FK" : "falkland_islands_islas_malvinas",
      "SH" : "saint_helena_ascension_and_tristan_da_cunha",
    };

    let ciaKey: string | undefined = explicitFactbookKeys[iso2Upper];

    if (!ciaKey) {
      const safeCountryName = (countryName || "").toLowerCase();
      ciaKey = Object.keys(countriesDict).find(k => {
        const formattedCiaKey = (k || "").replace(/_/g, ' ').toLowerCase(); 
        return formattedCiaKey === safeCountryName;
      });
    }

    const rawCiaData = ciaKey ? countriesDict[ciaKey] : null;

    if (!rawCiaData) {
      console.log(`[CẢNH BÁO] Không tìm thấy data CIA trong factbook.json cho nước: ${countryName || iso2Upper}`);
    } else {
      mappedCiaData = transformCiaToCountryDetail(iso2Upper, rawCiaData);
    }
  }

  // =========================================================
  // TRƯỜNG HỢP 2: Đã gen AI, nhưng THIẾU TRƯỜNG MỚI -> Chỉ update CIA (Partial Update)
  // =========================================================
  if (detail && detail.isAiGenerated && isMissingNewFields) {
    console.log(`[PARTIAL UPDATE] Dữ liệu ${iso2Upper} thiếu trường mới. Đang cập nhật lại từ Factbook (Bỏ qua gọi AI)...`);
    
    // Bóc tách cẩn thận: Loại bỏ các field rỗng của Gemini trong Mapper để KHÔNG đè mất data xịn trong DB
    const {
      historyTimeline,
      culturalNuances,
      faqs,
      nationalDishes,
      funFacts,
      mustVisitPlaces,
      isAiGenerated,
      ...onlyCiaFields // <-- Chỉ giữ lại geography, economy, demographics, military...
    } = mappedCiaData;

    const updatedDetail = await CountryDetail.findOneAndUpdate(
      { iso2: iso2Upper },
      { $set: onlyCiaFields }, // Chỉ đè phần CIA lên
      { 
        returnDocument: 'after', 
        upsert: true, 
        setDefaultsOnInsert: true 
      }
    );

    return updatedDetail;
  }

  // =========================================================
  // TRƯỜNG HỢP 3: CACHE MISS hoặc AI CHƯA GEN XONG -> Gọi Gemini tạo mới từ A-Z
  // =========================================================
  console.log(`[CACHE MISS] Đang tạo toàn bộ dữ liệu mới (CIA + Gemini) cho ${iso2Upper}...`);

  const aiGeneratedData = await generateCountryInsights(countryName);

  const isGeminiSuccess = Array.isArray(aiGeneratedData?.historyTimeline) && aiGeneratedData.historyTimeline.length > 0;

  if (!isGeminiSuccess) {
    console.log(`[CẢNH BÁO] Gọi Gemini API thất bại cho ${countryName}. Đặt isAiGenerated = false để thử lại sau.`);
  }

  const finalMergedData = {
    ...mappedCiaData,
    ...aiGeneratedData, 
    isAiGenerated: isGeminiSuccess,
    lastUpdated: new Date()
  };

  const updatedDetail = await CountryDetail.findOneAndUpdate(
    { iso2: iso2Upper },
    { $set: finalMergedData },
    { 
      returnDocument: 'after',
      upsert: true, 
      setDefaultsOnInsert: true 
    }
  );

  return updatedDetail;
};