import mongoose from 'mongoose';
import { syncRankingsData } from '../services/ranking.service.js';

import dotenv from 'dotenv'; // Import thêm thư viện này để đọc file .env

dotenv.config(); // Kích hoạt đọc file .env (thường để ở file index/server là đủ, nhưng để đây cho chắc chắn nếu là script chạy độc lập)

// 🔹 Lấy key từ file .env
const MONGO_URI = process.env.MONGO_URI as string;

// 🛑 CẤU HÌNH CHO LẦN CHẠY NÀY (Đồng bộ với cấu hình file Import)
const PERIOD = "2025-01"; 
const IS_LATEST = false;  

async function runSync() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`🚀 Đã kết nối DB. Đang tính toán Ranking cho kỳ [${PERIOD}]...`);

    // Gọi trực tiếp service tính toán Ranking
    const count = await syncRankingsData(PERIOD, IS_LATEST);

    console.log(`🎉 Thành công! Đã tính điểm và xếp hạng xong cho ${count} quốc gia.`);
    
    // Đóng connection
    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Có lỗi xảy ra:", error);
    process.exit(1);
  }
}

runSync();