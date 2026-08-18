import { Router } from 'express';
import { searchAirports } from '../controllers/airport.controller.js';

const router = Router();

// Đường dẫn: GET /api/airports/search?q=SGN
router.get('/search', searchAirports);

export default router;