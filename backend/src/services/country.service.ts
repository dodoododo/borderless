import Country, { ICountry } from '../models/country.model.js';
import { RestCountriesV5Response } from '../types/country.type.js';

// --- HÀM TIỆN ÍCH XỬ LÝ MÀU SẮC DÀNH RIÊNG CHO UI TẠP CHÍ ---

/**
 * Chuyển đổi mã màu HEX sang RGBA với độ trong suốt (alpha)
 */
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
  const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
  const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Thuật toán tính độ sáng của màu nền để quyết định màu chữ (Trắng hay Đen)
 */
function readableAccent(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
  const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
  const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#17171B' : '#FFFFFF';
}


const CURRENT_SCHEMA_VERSION = 1; // tăng số này mỗi khi đổi cấu trúc ICountry

export class CountryService {
  static async getCountryByIso(isoCode: string): Promise<ICountry> {
    const code = isoCode.toUpperCase();

    const existingCountry = await Country.findOne({
      $or: [{ iso2: code }, { iso3: code }],
    });

    if (existingCountry) {
      const doc = existingCountry.toObject();

      // Check duy nhất 1 chỗ: version không khớp -> coi là outdated
      const isDataOutdated = (doc.schemaVersion ?? 0) < CURRENT_SCHEMA_VERSION;

      if (isDataOutdated) {
        console.log(`[Schema Outdated]: ${code} đang ở version ${doc.schemaVersion ?? 0}, cần version ${CURRENT_SCHEMA_VERSION}. Xóa để fetch lại...`);
        await Country.deleteOne({ _id: existingCountry._id });
        return this.getCountryByIso(isoCode);
      }

      console.log(`[MongoDB Hit]: Lấy data ${code} từ Database`);
      return existingCountry;
    }


    console.log(`[API Call]: MongoDB chưa có ${code}, tiến hành fetch từ API...`);

    // 2. Gọi REST Countries API
    const API_KEY = process.env.REST_COUNTRIES_API_KEY || 'rc_live_demo';
    const url = `https://api.restcountries.com/countries/v5/codes.alpha_2/${code}?api-key=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch country data. Status: ${response.status}`);
    }

    const data = (await response.json()) as RestCountriesV5Response;

    if (!data.data.objects || data.data.objects.length === 0) {
      throw new Error('Country not found');
    }

    const raw = data.data.objects[0];

    // 3. Logic bóc tách tên Native Official an toàn
    const nativeEntries = raw.names?.native ? Object.values(raw.names.native) : [];
    const nativeOfficial = nativeEntries.length > 0 ? nativeEntries[0].official : null;

    // 4. Logic bóc tách màu sắc cờ
    const swatches = raw.flag?.colors?.swatches || {};
    const rawAccent = swatches.vibrant || swatches.dark_vibrant || raw.flag?.colors?.prominent || "#52525B";
    const rawMuted = swatches.muted || swatches.dark_muted || raw.flag?.colors?.dominant || "#71717A";

    // 5. Mapping data từ API chuẩn xác 100% với ICountry Schema
    const countryData = {
      nameCommon: raw.names?.common || "Unknown territory",
      nameOfficial: raw.names?.official || "",
      nativeOfficial: nativeOfficial,
      
      iso2: raw.codes?.alpha_2 || "—",
      iso3: raw.codes?.alpha_3 || "—",
      
      capital: raw.capitals && raw.capitals.length > 0 ? raw.capitals[0].name : null,
      region: raw.region || null,
      subregion: raw.subregion || null,
      population: typeof raw.population === "number" ? raw.population : null,
      areaKm2: raw.area?.kilometers ?? null,
      
      borders: raw.borders || [],
      landlocked: !!raw.landlocked,
      
      currencies: raw.currencies || [],
      
      // Xử lý array languages lấy cả tên tiếng Anh lẫn tên bản địa
      languages: raw.languages ? raw.languages.map((lang: any) => ({
        name: lang.name || "",
        native_name: lang.native_name || lang.name || ""
      })) : [],
      
      timezones: raw.timezones || [],
      callingCodes: raw.calling_codes || [],
      drivingSide: raw.cars?.driving_side || null,
      
      measurementSystem: raw.units?.measurement_system || null,
      temperatureScale: raw.units?.temperature_scale || null,
      
      memberships: raw.memberships || {},
      
      lastUpdated: raw._meta?.lastUpdatedTimestamp 
        ? new Date(raw._meta.lastUpdatedTimestamp * 1000) 
        : null,

      // Tạo bộ màu động Dynamic Theme cho UI
      flag: {
        svgUrl: raw.flag?.url_svg || "",
        description: raw.flag?.description || "",
        accentRaw: rawAccent,
        accentText: readableAccent(rawAccent),
        accentMuted: rawMuted,
        accentSoft: hexToRgba(rawAccent, 0.09),
        accentSoftStrong: hexToRgba(rawAccent, 0.16),
        accentBorder: hexToRgba(rawAccent, 0.35),
      },
    };

    // 6. Lưu data tuyệt đẹp này vào MongoDB
    const newCountry = new Country(countryData);
    await newCountry.save();

    console.log(`[MongoDB Save]: Đã lưu thành công ${code} vào Database`);

    return newCountry;
  }
}