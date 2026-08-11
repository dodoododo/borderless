import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import { PassportModel } from '../models/passport.model.js';
import { syncRankingsData } from '../services/ranking.service.js'; // Nhập hàm tính Ranking (nhớ trỏ đúng file service của bác)

import dotenv from 'dotenv'; // Import thêm thư viện này để đọc file .env

dotenv.config(); // Kích hoạt đọc file .env (thường để ở file index/server là đủ, nhưng để đây cho chắc chắn nếu là script chạy độc lập)

// 🔹 Lấy key từ file .env
const MONGO_URI = process.env.MONGO_URI as string;

// 🛑 CẤU HÌNH CHO LẦN CHẠY NÀY
const PERIOD = "2020-02"; // Thay đổi tên kỳ cho phù hợp với file
const IS_LATEST = false;  
const CSV_FILENAME = `src/data/${PERIOD}/passport-index-matrix-iso2.csv`; 

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
            const passportIso = Object.values(row)[0] as string;
            
            // ========================================================
            // 🚀 HÀM DỊCH MÃ SIÊU VIỆT (Hỗ trợ số 2019 và mã viết tắt mới)
            // ========================================================
            const translateStatus = (val: string): string => {
              const s = String(val).trim().toUpperCase(); // Đưa về chữ HOA để dễ so sánh
              
              // 1. Xử lý mã viết tắt (Chuẩn mới bác vừa đưa)
              if (s === 'VR') return 'visa required';
              if (s === 'VF') return 'visa-free';
              if (s === 'VOA') return 'visa on arrival';
              if (s === 'ETA') return 'eta';
              
              // 2. Hỗ trợ ngược cho bản data cũ (2019 dạng số 0,1,2,3)
              if (s === '3') return 'visa-free';
              if (s === '2') return 'visa on arrival';
              if (s === '1') return 'e-visa';
              if (s === '0') return 'visa required';
              
              // 3. Giữ nguyên Home Country
              if (s === '-1') return '-1';
              
              // 4. Nếu là số ngày lưu trú (VD: "90", "30", "180"), giữ nguyên để UI hiện "Visa Free (90 days)"
              if (!isNaN(Number(s)) && s !== '') {
                return s; 
              }

              // 5. Fallback: Nếu data vốn đã là chữ (như bản 2026), trả về dạng chữ thường
              return String(val).trim().toLowerCase();
            };

            const destinationsObj: Record<string, string> = {};
            Object.entries(row).slice(1).forEach(([destIso, val]) => {
              destinationsObj[destIso] = translateStatus(val as string);
            });
            // ========================================================

            await PassportModel.updateOne(
              { passportIso },
              { $pull: { history: { period: PERIOD } } }
            );

            const updateDoc: any = {
              $push: { 
                history: { 
                  period: PERIOD, 
                  destinations: destinationsObj 
                } 
              }
            };

            if (IS_LATEST) {
              updateDoc.$set = { destinations: destinationsObj };
            }

            await PassportModel.updateOne(
              { passportIso },
              updateDoc,
              { upsert: true }
            );
          }

          console.log(`🎉 Đã cập nhật xong Passport Index cho kỳ ${PERIOD}.`);
          
          console.log(`\n⚙️ Đang tự động tính toán Ranking cho kỳ ${PERIOD}...`);
          const count = await syncRankingsData(PERIOD, IS_LATEST);
          console.log(`🎉 Tuyệt vời! Hoàn tất tính điểm và xếp hạng cho ${count} quốc gia.`);

        } catch (dbError) {
          console.error("❌ Lỗi trong quá trình xử lý Database:", dbError);
        } finally {
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