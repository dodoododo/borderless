// ============================================================================
// 1. DỮ LIỆU THÔ TỪ REST COUNTRIES V5 API (ĐÃ BỔ SUNG ĐẦY ĐỦ CÁC TRƯỜNG)
// ============================================================================
export interface RestCountriesV5Response {
  data: {
    objects: Array<{
      names: {
        common: string;
        official: string;
        native?: Record<string, { common: string; official: string }>;
      };
      codes: { 
        alpha_2: string; 
        alpha_3: string; 
      };
      capitals?: Array<{ name: string }>;
      region?: string;
      subregion?: string;
      population?: number;
      area?: { kilometers: number };
      borders?: string[];
      landlocked?: boolean;
      currencies?: Array<{ code: string; name: string; symbol: string }>;
      languages?: Array<{ name: string; native_name?: string }>;
      timezones?: string[];
      calling_codes?: string[];
      cars?: { driving_side?: string };
      units?: { measurement_system?: string; temperature_scale?: string };
      memberships?: Record<string, boolean>;
      _meta?: { lastUpdatedTimestamp?: number };
      flag?: {
        emoji?: string;
        url_svg: string;
        description?: string;
        colors?: {
          dominant?: string;
          prominent?: string;
          swatches?: {
            vibrant?: string | null;
            dark_vibrant?: string | null;
            muted?: string | null;
            dark_muted?: string | null;
            light_vibrant?: string | null;
            light_muted?: string | null;
          };
        };
      };
    }>;
  };
}

// ============================================================================
// 2. DỮ LIỆU ĐÃ NẤU CHÍN (OUTPUT TRẢ VỀ FRONTEND)
// ============================================================================
export interface CountryProfile {
  nameCommon: string;
  nameOfficial: string;
  nativeOfficial: string | null;
  iso2: string;
  iso3: string;
  capital: string | null;
  region: string | null;
  subregion: string | null;
  population: number | null;
  areaKm2: number | null;
  borders: string[];
  landlocked: boolean;
  currencies: Array<{ code: string; name: string; symbol: string }>;
  languages: Array<{ name: string; native_name: string }>;
  timezones: string[];
  callingCodes: string[];
  drivingSide: string | null;
  measurementSystem: string | null;
  temperatureScale: string | null;
  memberships: Record<string, boolean>;
  lastUpdated: Date | null;
  flag: {
    svgUrl: string;
    description: string;
    accentRaw: string;
    accentText: string;
    accentMuted: string;
    accentSoft: string;
    accentSoftStrong: string;
    accentBorder: string;
  };
}