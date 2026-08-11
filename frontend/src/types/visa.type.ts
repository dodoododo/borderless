// ============================================================================
// KIỂU DỮ LIỆU CHO API /passport/:iso (getVisaStatus)
// Khớp với model thật: src/models/Passport.ts
//   destinations: Map<destIso, statusString>
// Khi Mongoose Map serialize qua JSON, nó trở thành plain object:
//   { "VN": "visa-free", "US": "visa-required" }
// ⚠️ Các giá trị status cụ thể (vd "e-visa", "eta", "visa-on-arrival") là
// GIẢ ĐỊNH theo naming convention kebab-case dựa trên "visa-free" /
// "visa-required" bạn đã xác nhận. Nếu backend dùng string khác, chỉ cần
// sửa STATUS_LABELS bên dưới.
// ============================================================================

export interface PassportStatusResponse {
  passportIso: string;
  destinations: Record<string, string>; // key: ISO2 nước đến (in hoa), value: status string thô từ DB
}

// Dùng để hiển thị label đẹp trên UI + khớp màu trong STATUS_COLORS
export const STATUS_LABELS: Record<string, string> = {
  'visa-free': 'Visa Free',
  'visa-required': 'Visa Required',
  'e-visa': 'eVisa',
  'eta': 'ETA',
  'visa-on-arrival': 'Visa on Arrival',
  'restricted': 'Restricted',
};

// Chuyển 1 status string thô -> label hiển thị, fallback: title-case chính chuỗi gốc
// (phòng trường hợp DB có giá trị chưa map ở trên, tránh UI hiện "undefined")
export const resolveStatusLabel = (rawStatus: string): string => {
  if (STATUS_LABELS[rawStatus]) return STATUS_LABELS[rawStatus];
  return rawStatus
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};