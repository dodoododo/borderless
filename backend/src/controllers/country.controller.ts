import { Request, Response } from 'express';
import { CountryService } from '../services/country.service.js';

export class CountryController {
  // Hàm mới: Lấy danh sách tất cả quốc gia
  static async getAllCountries(req: Request, res: Response) {
    try {
      const countries = await CountryService.getAllCountries();

      return res.status(200).json({
        success: true,
        count: countries.length,
        data: countries,
      });
    } catch (error: any) {
      console.error('[CountryController Error]:', error.message);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching all countries',
      });
    }
  }

  // Hàm cũ: Lấy chi tiết 1 quốc gia
  static async getCountryProfile(req: Request, res: Response) {
    try {
      const { iso } = req.params;

      if (!iso || iso.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ISO code provided',
        });
      }

      const countryData = await CountryService.getCountryByIso(iso as string);

      return res.status(200).json({
        success: true,
        data: countryData,
      });
    } catch (error: any) {
      console.error('[CountryController Error]:', error.message);
      
      if (error.message.includes('not found') || error.message.includes('404')) {
        return res.status(404).json({ success: false, message: 'Country not found' });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching country data',
      });
    }
  }
}