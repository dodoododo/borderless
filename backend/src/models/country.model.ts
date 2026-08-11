import mongoose, { Schema, Document } from 'mongoose';

// Interface cho Mongoose Document (Kế thừa từ CountryProfile để đảm bảo đồng bộ)
export interface ICountry extends Document {
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

// Khai báo Schema
const CountrySchema: Schema = new Schema(
  {
    schemaVersion: { type: Number, default: 1 },
    nameCommon: { type: String, required: true },
    nameOfficial: { type: String, default: "" },
    nativeOfficial: { type: String, default: null },
    iso2: { type: String, required: true, unique: true, uppercase: true, index: true },
    iso3: { type: String, required: true, unique: true, uppercase: true, index: true },
    capital: { type: String, default: null },
    region: { type: String, default: null },
    subregion: { type: String, default: null },
    population: { type: Number, default: null },
    areaKm2: { type: Number, default: null },
    borders: [{ type: String }],
    landlocked: { type: Boolean, default: false },
    currencies: [
      {
        code: { type: String },
        name: { type: String },
        symbol: { type: String },
      },
    ],
    languages: [
      {
        name: { type: String },
        native_name: { type: String },
      },
    ],
    timezones: [{ type: String }],
    callingCodes: [{ type: String }],
    drivingSide: { type: String, default: null },
    measurementSystem: { type: String, default: null },
    temperatureScale: { type: String, default: null },
    
    // Dùng kiểu Object (Mixed) để lưu linh hoạt các key như 'un', 'eu', 'asean'...
    memberships: { type: Object, default: {} },
    
    lastUpdated: { type: Date, default: null },
    
    flag: {
      svgUrl: { type: String, default: "" },
      description: { type: String, default: "" },
      accentRaw: { type: String, default: "#52525B" },
      accentText: { type: String },
      accentMuted: { type: String, default: "#71717A" },
      accentSoft: { type: String },
      accentSoftStrong: { type: String },
      accentBorder: { type: String },
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
    versionKey: false,
    minimize: false, // Bắt buộc false: Để Mongoose không tự động xóa các object rỗng (như memberships: {})
  }
);

// Tránh lỗi overwrite model khi hot-reload (cực kỳ quan trọng khi dev bằng NextJS/Nodemon)
const Country = mongoose.models.Country || mongoose.model<ICountry>('Country', CountrySchema);

export default Country;