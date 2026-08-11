// src/controllers/flight.controller.ts
import { Request, Response } from 'express';
import { 
    searchFlightsService, 
    searchReturnFlightsService, 
    getBookingOptionsService 
} from '../services/flight.service.js';

export const searchFlights = async (req: Request, res: Response) => {
    try {
        // Truyền 1 tham số duy nhất là req.body
        const result = await searchFlightsService(req.body);
        res.status(200).json(result);
    } catch (error: any) {
        console.error('Lỗi API Outbound:', error.response?.data || error.message);
        res.status(500).json({ error: 'Lỗi API Outbound', details: error.message });
    }
};

export const searchReturnFlights = async (req: Request, res: Response) => {
    try {
        if (!req.body.departure_token) {
            return res.status(400).json({ error: 'Thiếu departure_token' });
        }

        // Truyền 1 tham số duy nhất là req.body (nó đã chứa sẵn params gốc + token)
        const result = await searchReturnFlightsService(req.body);
        res.status(200).json(result);
    } catch (error: any) {
        console.error('Lỗi API Return:', error.response?.data || error.message);
        res.status(500).json({ error: 'Lỗi API Return', details: error.message });
    }
};

export const getBookingOptions = async (req: Request, res: Response) => {
    try {
        if (!req.body.booking_token) {
            return res.status(400).json({ error: 'Thiếu booking_token' });
        }

        // Truyền 1 tham số duy nhất là req.body
        const result = await getBookingOptionsService(req.body);
        res.status(200).json(result);
    } catch (error: any) {
        console.error('Lỗi API Booking:', error.response?.data || error.message);
        res.status(500).json({ error: 'Lỗi API Booking', details: error.message });
    }
};