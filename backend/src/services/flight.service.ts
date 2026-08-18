// src/services/flight.service.ts
import axios from 'axios';
import FlightCache from '../models/flightCache.model.js';
import type { FlightSearchParams } from '../models/flight.model.js';

// ==========================================
// BƯỚC 1: TÌM CHUYẾN ĐI (Outbound)
// ==========================================
export const searchFlightsService = async (params: FlightSearchParams) => {
    const flightType = params.flight_type || params.type || '1';
    // Key định danh cho chuyến đi
    const cacheKey = `outbound_${params.departure_id}_${params.arrival_id}_${params.outbound_date}_t${flightType}`;

    // 1. Kiểm tra Cache trong MongoDB
    if (params.use_cache !== false) {
        const cachedData = await FlightCache.findOne({ cacheKey, cacheType: 'OUTBOUND' });
        if (cachedData) {
            console.log(`⚡ Lấy data từ DB Cache cho: ${cacheKey}`);
            return { source: 'database_cache', data: cachedData.data };
        }
    }

    console.log(`🌐 Gọi SerpApi thật cho Outbound: ${cacheKey}`);
    const requestParams: any = {
        engine: 'google_flights',
        api_key: process.env.SERPAPI_API_KEY || process.env.SERP_API_KEY,
        ...params
    };

    if (requestParams.flight_type) {
        requestParams.type = requestParams.flight_type;
        delete requestParams.flight_type;
    }
    delete requestParams.use_cache;

    if (requestParams.type === '2') {
        delete requestParams.return_date;
    } else if ((requestParams.type === '1' || !requestParams.type) && !requestParams.return_date) {
        const outDate = new Date(requestParams.outbound_date || Date.now());
        outDate.setDate(outDate.getDate() + 7);
        requestParams.return_date = outDate.toISOString().split('T')[0];
    }

    // 2. Gọi API SerpApi
    const response = await axios.get('https://serpapi.com/search.json', { params: requestParams });

    // 3. Lưu vào MongoDB Cache (upsert để update nếu đã tồn tại, tránh lỗi Duplicate Key)
    await FlightCache.findOneAndUpdate(
        { cacheKey },
        { cacheKey, cacheType: 'OUTBOUND', data: response.data },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { source: 'serpapi_live', data: response.data };
};


// ==========================================
// BƯỚC 2: TÌM CHUYẾN VỀ (Return) - Dành cho Khứ hồi
// ==========================================
export const searchReturnFlightsService = async (params: any) => {
    const { departure_token, use_cache, ...originalParams } = params;
    
    // Dùng chính token làm key vì nó là duy nhất cho mỗi options bay
    const cacheKey = `return_${departure_token}`;

    if (use_cache !== false) {
        const cachedData = await FlightCache.findOne({ cacheKey, cacheType: 'RETURN' });
        if (cachedData) {
            console.log(`⚡ Lấy chiều về từ DB Cache`);
            return { source: 'database_cache', data: cachedData.data };
        }
    }

    console.log(`🌐 Gọi SerpApi tìm chiều về`);
    const requestParams: any = {
        engine: 'google_flights',
        api_key: process.env.SERPAPI_API_KEY || process.env.SERP_API_KEY,
        ...originalParams, 
        departure_token
    };

    if (requestParams.flight_type) {
        requestParams.type = requestParams.flight_type;
        delete requestParams.flight_type;
    }

    try {
        const response = await axios.get('https://serpapi.com/search.json', { params: requestParams });
        
        await FlightCache.findOneAndUpdate(
            { cacheKey },
            { cacheKey, cacheType: 'RETURN', data: response.data },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return { source: 'serpapi_live', data: response.data };
    } catch (error: any) {
        console.error("❌ Lỗi API Chuyến Về (Có thể do token cũ). Kích hoạt MOCK DATA...");
        // Trả về mock data (như code cũ của bạn) để UI không crash
        return {
            source: 'mock_data_fallback',
            data: {
                other_flights: [{
                    price: 950, type: "Round trip", total_duration: 600, booking_token: "MOCK_BOOKING_TOKEN_12345",
                    airline_logo: "https://www.gstatic.com/flights/airline_logos/70px/VN.png",
                    flights: [{
                        airline: "Vietnam Airlines (Mock)", flight_number: "VN 999", airplane: "Boeing 787",
                        travel_class: "Economy", duration: 600,
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
    const { booking_token, use_cache, ...originalParams } = params;

    // Dùng booking_token làm Cache Key
    const cacheKey = `booking_${booking_token}`;

    console.log(`\n🔎 [BOOKING] Đang lấy link đặt vé...`);

    if (use_cache !== false) {
        const cachedData = await FlightCache.findOne({ cacheKey, cacheType: 'BOOKING_OPTIONS' });
        if (cachedData) {
            console.log(`✅ [HIT DB CACHE] Lấy link Booking từ MongoDB.`);
            return { source: 'database_cache', data: cachedData.data };
        }
    }

    console.log(`🌐 [MISS CACHE] Gọi SerpApi lấy Booking Options`);
    const requestParams: any = {
        engine: 'google_flights',
        api_key: process.env.SERPAPI_API_KEY || process.env.SERP_API_KEY,
        ...originalParams,
        booking_token
    };

    if (requestParams.flight_type) {
        requestParams.type = requestParams.flight_type;
        delete requestParams.flight_type;
    }
    delete requestParams.use_cache;
    if (requestParams.type === '2') {
        delete requestParams.return_date;
    }

    try {
        const response = await axios.get('https://serpapi.com/search.json', { params: requestParams });
        
        await FlightCache.findOneAndUpdate(
            { cacheKey },
            { cacheKey, cacheType: 'BOOKING_OPTIONS', data: response.data },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return { source: 'serpapi_live', data: response.data };
    } catch (error: any) {
        console.error("❌ Lỗi Token Booking. Kích hoạt MOCK DATA...");
        return {
            source: 'mock_data_fallback',
            data: {
                booking_options: [
                    {
                        together: {
                            book_with: "Qatar Airways (Mock)", price: 950, option_title: "Hạng vé tiêu chuẩn",
                            airline_logos: ["https://www.gstatic.com/flights/airline_logos/70px/QR.png"],
                            booking_request: { url: "https://qatarairways.com" }
                        }
                    },
                    {
                        together: {
                            book_with: "Agoda Flights (Mock)", price: 960, option_title: "Thanh toán siêu tốc",
                            airline_logos: ["https://www.gstatic.com/flights/partner_logos/70px/AGODA.png"],
                            booking_request: { url: "https://agoda.com/flights" }
                        }
                    }
                ]
            }
        };
    }
};