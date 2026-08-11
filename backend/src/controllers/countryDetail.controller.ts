import { Request, Response } from 'express';
import { getCountryDetailData } from '../services/countryDetail.service.js';
import { CountryService } from '../services/country.service.js';

export const getCountryDiscover = async (req: Request, res: Response) => {
  try {
    const { iso2 } = req.params;

    if (!iso2 || typeof iso2 !== 'string') {
      return res.status(400).json({ error: 'Mã ISO bị thiếu hoặc không hợp lệ' });
    }

    const isoUpper = iso2.toUpperCase();

    // 1. Kéo dữ liệu Core (Dùng chung service của Modal để lấy đủ thuộc tính flag màu sắc)
    let coreCountry;
    try {
        coreCountry = await CountryService.getCountryByIso(isoUpper);
    } catch (err: any) {
        return res.status(404).json({ error: 'Quốc gia không tồn tại trong cơ sở dữ liệu cốt lõi' });
    }

    // 2. Gọi Service để lấy dữ liệu chi tiết AI/CIA
    const detailData = await getCountryDetailData(isoUpper);

    // 3. Trả về cho Frontend cả Core và Details
    return res.status(200).json({
      core: coreCountry, // Toàn bộ dữ liệu của ICountry (Có flag.accentRaw, flag.svgUrl...)
      details: detailData // Toàn bộ dữ liệu của ICountryDetail
    });

  } catch (error: any) {
    console.error("Lỗi Controller getCountryDiscover:", error);
    return res.status(500).json({ 
      error: 'Lỗi hệ thống khi tải dữ liệu khám phá',
      message: error.message 
    });
  }
};