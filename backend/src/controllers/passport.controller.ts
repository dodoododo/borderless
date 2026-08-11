import { Request, Response } from 'express';
import { PassportModel } from '../models/passport.model.js';

// Định nghĩa kiểu cho params để TS hiểu
interface PassportParams {
  iso: string;
  destIso?: string;
}

export const getVisaStatus = async (
  req: Request<PassportParams>,
  res: Response
): Promise<void> => {
  const { iso, destIso } = req.params;
  
  const entry = await PassportModel.findOne({ passportIso: iso.toUpperCase() });
  
  if (!entry) {
    res.status(404).json({ message: "Passport not found" });
    return;
  }

  // TRƯỜNG HỢP 1: Nếu có destIso -> Kiểm tra cụ thể 1 nước
  if (destIso) {
    const status = (entry.destinations ?? new Map()).get(destIso.toUpperCase());
    res.status(200).json({
      origin: iso.toUpperCase(),
      destination: destIso.toUpperCase(),
      status: status || "unknown"
    });
    return; // Dừng tại đây
  }

  // TRƯỜNG HỢP 2: Nếu KHÔNG có destIso -> Trả về full list
  res.status(200).json({
    origin: iso.toUpperCase(),
    destinations: Object.fromEntries(entry.destinations || new Map())
  });
};