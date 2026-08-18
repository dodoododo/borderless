import { Request, Response } from 'express';
import { getAirportsByKeyword } from '../services/airport.service.js';
import axios from 'axios';

// export const searchAirports = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const keyword = (req.query.q as string)?.trim() || '';

//         // Validate cơ bản
//         if (keyword.length < 2) {
//             res.status(200).json({ source: 'validation', data: [] });
//             return;
//         }

//         // Gọi Service xử lý mọi nghiệp vụ
//         const result = await getAirportsByKeyword(keyword);

//         // Trả kết quả cho Client
//         res.status(200).json(result);

//     } catch (error: any) {
//         console.error("❌ Lỗi API Search Airport Controller:", error.message);
//         // Trả về 200 kèm array rỗng để Frontend không bị sập UI
//         res.status(200).json({ source: 'error', data: [] }); 
//     }
// };

export const searchAirports = async (req: Request, res: Response): Promise<void> => {
    try {
        let keyword = (req.query.q as string)?.trim() || '';

        // 1. Validate cơ bản
        if (keyword.length < 2) {
            res.status(200).json({ source: 'validation', data: [] });
            return;
        }

        const lowerKeyword = keyword.toLowerCase();
        let specialNote = "";

        // ==========================================
        // 2. SMART FALLBACK (Xử lý các nước không có sân bay)
        // ==========================================
        const noAirportCountries: Record<string, { proxy: string, note: string }> = {
            "vatican": { proxy: "Rome", note: "Vatican doesn't have an airport. Rome (ROM) is the closest." },
            "monaco": { proxy: "Nice", note: "Monaco doesn't have an airport. Nice (NCE) is the closest." },
            "andorra": { proxy: "Barcelona", note: "Andorra uses Barcelona (BCN) or Toulouse (TLS)." },
            "san marino": { proxy: "Bologna", note: "Bologna (BLQ) is the closest airport to San Marino." },
            "liechtenstein": { proxy: "Zurich", note: "Zurich (ZRH) is the closest airport." },
            "adana": { proxy: "Cukurova", note: "Şakirpaşa Airport is closed. Flights to Adana use Çukurova Int'l Airport (COV)." }
        };

        for (const [key, val] of Object.entries(noAirportCountries)) {
            if (lowerKeyword.includes(key)) {
                keyword = val.proxy;
                specialNote = val.note;
                console.log(`🧭 [SMART ROUTING] Chuyển hướng ${key} -> ${val.proxy}`);
                break;
            }
        }

        // ==========================================
        // 3. GỌI TRỰC TIẾP TRAVELPAYOUTS (NO CACHE)
        // ==========================================
        console.log(`🌐 Gọi Travelpayouts API cho: "${keyword}"`);
        const response = await axios.get(`https://autocomplete.travelpayouts.com/places2`, {
            params: {
                term: keyword,
                locale: 'en',
                'types[]': ['city', 'airport']
            }
        });

        let apiResults = response.data || [];

        if (apiResults.length === 0) {
            res.status(200).json({ source: 'api_empty', special_note: specialNote, data: [] });
            return;
        }

        // BỘ LỌC CỨNG (STRICT FILTER) ĐỂ CHỐNG TRAVELPAYOUTS HIỂN THỊ SAI
        const searchLower = keyword.toLowerCase();
        const strictResults = apiResults.filter((item: any) => {
            const nameMatch = item.name && item.name.toLowerCase().includes(searchLower);
            const cityMatch = item.city_name && item.city_name.toLowerCase().includes(searchLower);
            const codeMatch = item.code && item.code.toLowerCase().includes(searchLower);
            return nameMatch || cityMatch || codeMatch;
        });

        // Nếu lọc quá tay mất hết, lấy lại 5 kết quả đầu
        const finalResults = strictResults.length > 0 ? strictResults : apiResults.slice(0, 5);

        // Chuẩn hóa Data trả về Frontend
        const cleanedAirports = finalResults
            .filter((item: any) => item.code)
            .map((item: any) => ({
                code: item.code,
                name: item.name || item.city_name || "Unknown",
                city: item.type === 'city' ? item.name : (item.city_name || item.name),
                country: item.country_name || "Unknown",
                type: item.type || "airport",
                main_airport_name: item.main_airport_name || ""
            }));

        res.status(200).json({ 
            source: 'live_api', 
            special_note: specialNote, 
            data: cleanedAirports 
        });

    } catch (error: any) {
        console.error("❌ Lỗi API Search Airport:", error.message);
        res.status(200).json({ source: 'error', data: [] }); 
    }
};