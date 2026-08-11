// src/routes/passport.route.ts
import { Router } from 'express';
import { getVisaStatus } from '../controllers/passport.controller.js';

const router = Router();

// Route 1: Kiểm tra cụ thể 1 nước đến (cần cả iso và destIso)
router.get('/:iso/:destIso', getVisaStatus);

// Route 2: Lấy full status của passport (chỉ cần iso)
router.get('/:iso', getVisaStatus);

// THÊM DÒNG NÀY VÀO CUỐI FILE
export default router;