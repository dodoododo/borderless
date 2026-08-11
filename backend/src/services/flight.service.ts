// src/services/flight.service.ts
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import type { FlightSearchParams } from '../models/flight.model.js';

// Cấu hình đường dẫn cho chuẩn ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, '../cache');

// Tự động tạo thư mục cache nếu chưa có
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// ==========================================
// BƯỚC 1: TÌM CHUYẾN ĐI (Outbound)
// ==========================================
export const searchFlightsService = async (params: FlightSearchParams) => {
    // Lấy flight_type từ frontend (1: Khứ hồi, 2: Một chiều)
    const flightType = params.flight_type || params.type || '1';
    const cacheKey = `outbound_${params.departure_id}_${params.arrival_id}_${params.outbound_date}_t${flightType}`;
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);

    // 1. Kiểm tra cache
    if (fs.existsSync(cacheFile) && params.use_cache !== false) {
        console.log(`⚡ Lấy data từ Cache cục bộ cho: ${cacheKey}`);
        return { source: 'cache', data: JSON.parse(fs.readFileSync(cacheFile, 'utf8')) };
    }

    console.log(`🌐 Gọi SerpApi thật cho Outbound: ${cacheKey}`);
    
    const requestParams: any = {
        engine: 'google_flights',
        api_key: process.env.SERPAPI_API_KEY || process.env.SERP_API_KEY, // Hỗ trợ 2 chuẩn tên biến môi trường
        ...params
    };

    // Chuẩn hóa tên tham số gửi lên SerpApi (SerpApi dùng 'type' thay vì 'flight_type')
    if (requestParams.flight_type) {
        requestParams.type = requestParams.flight_type;
        delete requestParams.flight_type;
    }
    // Xóa cờ use_cache vì SerpApi không hiểu tham số này
    delete requestParams.use_cache;

    // 🔹 FIX LỖI: NẾU LÀ VÉ 1 CHIỀU (type = 2), BẮT BUỘC XÓA RETURN_DATE
    if (requestParams.type === '2') {
        delete requestParams.return_date;
    } 
    // Auto-fix: Nếu khứ hồi mà quên truyền return_date, tự bù ngày về sau 7 ngày
    else if ((requestParams.type === '1' || !requestParams.type) && !requestParams.return_date) {
        const outDate = new Date(requestParams.outbound_date || Date.now());
        outDate.setDate(outDate.getDate() + 7);
        requestParams.return_date = outDate.toISOString().split('T')[0];
    }

    // 2. Gọi API SerpApi
    const response = await axios.get('https://serpapi.com/search.json', { params: requestParams });

    // 3. Lưu vào Cache
    fs.writeFileSync(cacheFile, JSON.stringify(response.data, null, 2));

    return { source: 'serpapi_live', data: response.data };
};


// ==========================================
// BƯỚC 2: TÌM CHUYẾN VỀ (Return) - Dành cho Khứ hồi
// ==========================================
export const searchReturnFlightsService = async (params: any) => {
    // Tách departure_token ra khỏi cục params
    const { departure_token, use_cache, ...originalParams } = params;
    
    // Rút gọn token làm tên file cache để tránh lỗi đường dẫn quá dài
    const safeToken = departure_token.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '');
    const cacheKey = `return_${safeToken}`;
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);

    if (fs.existsSync(cacheFile) && use_cache !== false) {
        console.log(`⚡ Lấy data từ Cache cho chiều về`);
        return { source: 'cache', data: JSON.parse(fs.readFileSync(cacheFile, 'utf8')) };
    }

    console.log(`🌐 Gọi SerpApi tìm chiều về`);
    const requestParams: any = {
        engine: 'google_flights',
        api_key: process.env.SERPAPI_API_KEY || process.env.SERP_API_KEY,
        ...originalParams, // 🔹 Bơm lại toàn bộ departure_id, arrival_id, date...
        departure_token
    };

    // Chuẩn hóa tên tham số type
    if (requestParams.flight_type) {
        requestParams.type = requestParams.flight_type;
        delete requestParams.flight_type;
    }

    try {
        const response = await axios.get('https://serpapi.com/search.json', { params: requestParams });
        fs.writeFileSync(cacheFile, JSON.stringify(response.data, null, 2));
        return { source: 'serpapi_live', data: response.data };
    } catch (error: any) {
        console.error("❌ Lỗi API Chuyến Về (Có thể do token cũ). Kích hoạt MOCK DATA...");
        console.error("Chi tiết lỗi:", error.response?.data || error.message);
        
        // Trả về dữ liệu giả để Dev tiếp tục test UI mà không bị crash
        return {
            source: 'mock_data_fallback',
            data: {
                other_flights: [{
                    price: 950,
                    type: "Round trip",
                    total_duration: 600,
                    booking_token: "MOCK_BOOKING_TOKEN_12345",
                    airline_logo: "https://www.gstatic.com/flights/airline_logos/70px/VN.png",
                    flights: [{
                        airline: "Vietnam Airlines (Mock)",
                        flight_number: "VN 999",
                        airplane: "Boeing 787",
                        travel_class: "Economy",
                        duration: 600,
                        departure_airport: { id: originalParams.arrival_id || "IST", time: `${originalParams.return_date} 10:00`, name: "Return Airport" },
                        arrival_airport: { id: originalParams.departure_id || "SGN", time: `${originalParams.return_date} 16:00`, name: "Home Airport" }
                    }]
                }]
            }
        };
    }
};


// ==========================================
// 3. LẤY LINK THANH TOÁN (Booking Options)
// ==========================================
export const getBookingOptionsService = async (params: any) => {
    // Tách booking_token ra khỏi cục params
    const { booking_token, use_cache, ...originalParams } = params;

    const safeToken = booking_token.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '');
    const cacheKey = `booking_${safeToken}`;
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);

    console.log(`\n🔎 [BOOKING] Đang lấy link đặt vé...`);

    if (fs.existsSync(cacheFile) && use_cache !== false) {
        console.log(`✅ [HIT CACHE] Lấy link Booking từ file.`);
        return { source: 'cache', data: JSON.parse(fs.readFileSync(cacheFile, 'utf8')) };
    }

    console.log(`🌐 [MISS CACHE] Gọi SerpApi lấy Booking Options`);
    const requestParams: any = {
        engine: 'google_flights',
        api_key: process.env.SERPAPI_API_KEY || process.env.SERP_API_KEY,
        ...originalParams, // 🔹 Bơm lại toàn bộ tham số gốc
        booking_token
    };

    // Chuẩn hóa tên tham số type
    if (requestParams.flight_type) {
        requestParams.type = requestParams.flight_type;
        delete requestParams.flight_type;
    }
    delete requestParams.use_cache;

    // 🔹 FIX LỖI 1 CHIỀU: NẾU VÉ 1 CHIỀU (type = 2), BẮT BUỘC XÓA RETURN_DATE
    if (requestParams.type === '2') {
        delete requestParams.return_date;
    }

    try {
        const response = await axios.get('https://serpapi.com/search.json', { params: requestParams });
        fs.writeFileSync(cacheFile, JSON.stringify(response.data, null, 2));
        return { source: 'serpapi_live', data: response.data };
    } catch (error: any) {
        console.error("❌ Lỗi Token Booking. Kích hoạt MOCK DATA...");
        console.error("Chi tiết lỗi:", error.response?.data || error.message);
        
        return {
            source: 'mock_data_fallback',
            data: {
                booking_options: [
                    {
                        together: {
                            book_with: "Qatar Airways (Mock)",
                            price: 950,
                            option_title: "Hạng vé tiêu chuẩn",
                            airline_logos: ["https://www.gstatic.com/flights/airline_logos/70px/QR.png"],
                            booking_request: { url: "https://qatarairways.com" }
                        }
                    },
                    {
                        together: {
                            book_with: "Agoda Flights (Mock)",
                            price: 960,
                            option_title: "Thanh toán siêu tốc",
                            airline_logos: ["https://www.gstatic.com/flights/partner_logos/70px/AGODA.png"],
                            booking_request: { url: "https://agoda.com/flights" }
                        }
                    }
                ]
            }
        };
    }
};