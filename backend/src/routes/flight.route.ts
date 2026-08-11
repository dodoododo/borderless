import express from 'express';
import { 
    searchFlights, 
    searchReturnFlights, 
    getBookingOptions 
} from '../controllers/flight.controller.js';

const router = express.Router();

// BƯỚC 1: Tìm chuyến bay lượt đi
router.post('/search', searchFlights);

// BƯỚC 2: Tìm chuyến bay lượt về (dựa vào departure_token)
router.post('/return', searchReturnFlights);

// BƯỚC 3: Lấy danh sách link đại lý đặt vé (dựa vào booking_token)
router.post('/booking', getBookingOptions);

export default router;