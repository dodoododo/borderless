// src/config/db.ts
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/borderless');
    console.log(`✅ MongoDB Connected`);
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1); // Dừng app nếu không kết nối được DB
  }
};