import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import { PassportModel } from '../models/passport.model.js';
import { syncRankingsData } from '../services/rankingV2.service.js'; // Nhập hàm tính Ranking

import dotenv from 'dotenv'; // Import thêm thư viện này để đọc file .env

dotenv.config(); // Kích hoạt đọc file .env (thường để ở file index/server là đủ, nhưng để đây cho chắc chắn nếu là script chạy độc lập)

// 🔹 Lấy key từ file .env
const MONGO_URI = process.env.MONGO_URI as string;

// 🛑 CẤU HÌNH CHO LẦN CHẠY NÀY
const PERIOD = "2020-11"; // Đổi tên kỳ tùy theo file CSV bác đang định import
const IS_LATEST = false;  // Đổi thành true NẾU ĐÂY LÀ FILE MỚI NHẤT (ví dụ: 2026-07)
const CSV_FILENAME = `src/data/${PERIOD}/passport-index-matrix-iso2.csv`; // Tên file tương ứng

async function importCSVAndSync() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`🚀 Đang kết nối Database để import dữ liệu kỳ [${PERIOD}]...`);

    const csvFilePath = path.join(process.cwd(), CSV_FILENAME);
    const results: any[] = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          console.log(`✅ Đã đọc xong ${results.length} dòng. Đang xử lý đẩy vào Mongo (PassportModel)...`);

          for (const row of results) {
            // row[0] là cột đầu tiên: passportIso
            const passportIso = Object.values(row)[0] as string;
            
            // Lấy các cột còn lại làm destinations
            const destinationsObj = Object.fromEntries(Object.entries(row).slice(1));

            // BƯỚC 1: Xóa lịch sử cũ của kỳ này (để phòng trường hợp bác chạy import lại file này 2 lần)
            await PassportModel.updateOne(
              { passportIso },
              { $pull: { history: { period: PERIOD } } }
            );

            // BƯỚC 2: Chuẩn bị query thêm vào lịch sử
            const updateDoc: any = {
              $push: { 
                history: { 
                  period: PERIOD, 
                  destinations: destinationsObj 
                } 
              }
            };

            // BƯỚC 3: Nếu là bản mới nhất, cập nhật luôn ra root `destinations` để App lấy cho nhanh
            if (IS_LATEST) {
              updateDoc.$set = { destinations: destinationsObj };
            }

            // Chạy lệnh Update / Upsert
            await PassportModel.updateOne(
              { passportIso },
              updateDoc,
              { upsert: true }
            );
          }

          console.log(`🎉 Đã cập nhật xong Passport Index cho kỳ ${PERIOD}.`);
          
          // ==============================================================
          // BƯỚC 4: TỰ ĐỘNG GỌI HÀM TÍNH RANKING NGAY SAU KHI IMPORT XONG
          // ==============================================================
          console.log(`\n⚙️ Đang tự động tính toán Ranking cho kỳ ${PERIOD}...`);
          const count = await syncRankingsData(PERIOD, IS_LATEST);
          console.log(`🎉 Tuyệt vời! Hoàn tất tính điểm và xếp hạng cho ${count} quốc gia.`);
          // ==============================================================

        } catch (dbError) {
          console.error("❌ Lỗi trong quá trình xử lý Database:", dbError);
        } finally {
          // Đóng connection khi tất cả mọi thứ đã xong (Dù thành công hay lỗi)
          await mongoose.connection.close();
          console.log("👋 Đã ngắt kết nối Database an toàn.");
        }
      });
  } catch (error) {
    console.error("❌ Có lỗi xảy ra khi đọc file CSV:", error);
    process.exit(1);
  }
}

importCSVAndSync();