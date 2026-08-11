import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import dotenv from 'dotenv';

import fs from 'fs';
import path from 'path';
import axios from 'axios';

import { connectDB } from './config/db.js';
import passportRoutes from './routes/passport.route.js';
import countryRoutes from './routes/country.route.js'; // Nhét thằng em mới vào đây
import rankingRoutes from './routes/ranking.route.js';
import flightRoutes from './routes/flight.route.js';
import { fileURLToPath } from 'url';
// import placeRoutes from './routes/place.route.js';

// dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BorderLess Backend is running smoothly!' });
});

// Gắn route vào đây
app.use('/api/passports', passportRoutes);
app.use('/api/countries', countryRoutes); // Bơm route country vào path /api/countries
app.use('/api/rankings', rankingRoutes);
// app.use('/api/places', placeRoutes);
app.use('/api/flights', flightRoutes);

// --- KHỞI ĐỘNG SERVER ---

// Kết nối DB trước khi lắng nghe request
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is flying on port ${PORT}`);
    console.log(`🌍 Country API Ready: http://localhost:${PORT}/api/countries/ca`);
  });
}).catch((err) => {
  console.error("❌ Lỗi kết nối Database:", err);
  process.exit(1);
});