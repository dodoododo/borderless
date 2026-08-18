import axios from 'axios';
import Airport from '../models/airport.model.js';

export const getAirportsByKeyword = async (keyword: string) => {
    const lowerKeyword = keyword.toLowerCase();
    let specialNote = "";
    let searchKeyword = keyword;

    // ==========================================
    // 1. SMART FALLBACK (Xử lý các nước không có sân bay)
    // ==========================================
    const noAirportCountries: Record<string, { proxy: string, note: string }> = {
        "vatican": { proxy: "Rome", note: "Vatican doesn't have an airport. Rome (ROM) is the closest." },
        "monaco": { proxy: "Nice", note: "Monaco doesn't have an airport. Nice (NCE) is the closest." },
        "andorra": { proxy: "Barcelona", note: "Andorra uses Barcelona (BCN) or Toulouse (TLS)." },
        "san marino": { proxy: "Bologna", note: "Bologna (BLQ) is the closest airport to San Marino." },
        "liechtenstein": { proxy: "Zurich", note: "Zurich (ZRH) is the closest airport." }
    };

    for (const [key, val] of Object.entries(noAirportCountries)) {
        if (lowerKeyword.includes(key)) {
            searchKeyword = val.proxy;
            specialNote = val.note;
            console.log(`🧭 [SMART ROUTING] User tìm "${key}" -> Đổi thành "${val.proxy}"`);
            break;
        }
    }

    // ==========================================
    // 2. TÌM TRONG DATABASE (CACHE HIT)
    // ==========================================
    const regex = new RegExp(searchKeyword, 'i');
    const cachedAirports = await Airport.find({
        $or: [{ code: regex }, { name: regex }, { city: regex }, { country: regex }]
    }).limit(10);

    if (cachedAirports.length > 0) {
        console.log(`✅ [DB CACHE HIT] Sân bay: "${searchKeyword}"`);
        return { source: 'database', special_note: specialNote, data: cachedAirports };
    }

    // ==========================================
    // 3. NẾU MISS CACHE -> GỌI TRAVELPAYOUTS (FREE API)
    // ==========================================
    console.log(`🌐 [API CALL] Miss Cache, gọi Travelpayouts cho: "${searchKeyword}"`);
    const response = await axios.get(`https://autocomplete.travelpayouts.com/places2`, {
        params: {
            term: searchKeyword,
            locale: 'en',
            'types[]': ['city', 'airport']
        }
    });

    const apiResults = response.data || [];
    if (apiResults.length === 0) {
        return { source: 'api_empty', special_note: specialNote, data: [] };
    }

    // ==========================================
    // 4. CHUẨN HÓA DATA & LƯU VÀO DB ĐỂ CACHE
    // ==========================================
    const newAirports = apiResults
        .filter((item: any) => item.code)
        .map((item: any) => ({
            code: item.code,
            name: item.name || item.city_name || "Unknown",
            city: item.type === 'city' ? item.name : (item.city_name || item.name),
            country: item.country_name || "Unknown",
            type: item.type || "airport",
            main_airport_name: item.main_airport_name || "",
            lat: item.coordinates?.lat || null,
            lon: item.coordinates?.lon || null
        }));

    if (newAirports.length > 0) {
        const ops = newAirports.map((airport: any) => ({
            updateOne: {
                filter: { code: airport.code },
                update: { $set: airport },
                upsert: true
            }
        }));
        
        // Không dùng await trực tiếp để Request không bị chặn (Lưu background)
        Airport.bulkWrite(ops).catch(e => console.error("Cache DB Error:", e.message));
    }

    return { source: 'api_and_cached', special_note: specialNote, data: newAirports };
};