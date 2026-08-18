import { Request, Response } from 'express';
import Country from '../models/country.model.js';
import CountryDetail from '../models/countryDetail.model.js';

export const getCountryMiniInfo = async (req: Request, res: Response): Promise<void> => {
  const { iso } = req.params as { iso: string };
  const isoUpper = iso.toUpperCase();

  try {
    // 1. Lấy tên quốc gia (Bảng Core)
    const coreCountry = await Country.findOne({ iso2: isoUpper }).select('nameCommon -_id');
    
    if (!coreCountry) {
      res.status(404).json({ message: "Country not found" });
      return;
    }

    // 2. Lấy ảnh bìa (Bảng Detail). Chỉ lấy field `coverImageUrl`
    const detailCountry = await CountryDetail.findOne({ iso2: isoUpper }).select('coverImageUrl -_id');

    // 3. Trả về format gọn nhẹ nhất
    res.status(200).json({
      iso: isoUpper,
      name: coreCountry.nameCommon,
      // Nếu chưa có detail hoặc detail không có ảnh, trả về null để Frontend tự fallback
      coverImage: detailCountry?.coverImageUrl || null 
    });

  } catch (error) {
    console.error(`[getCountryMiniInfo] Error for ${isoUpper}:`, error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};