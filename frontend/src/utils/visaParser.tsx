// src/utils/visaParser.ts

export type StatusCategory = "home" | "restricted" | "free" | "eta" | "arrival" | "evisa" | "required" | "other";

export interface ParsedVisaStatus {
  category: StatusCategory;
  displayText: string;
  note: string;
}

export function parseDestinationStatus(rawStatus: string): ParsedVisaStatus {
  const status = (rawStatus || "").trim();

  // =====================================================================
  // 0. XỬ LÝ QUÊ NHÀ (HOME COUNTRY)
  // =====================================================================
  if (status === "-1") {
    return {
      category: "home",
      displayText: "Home Country",
      note: ""
    };
  }

  // =====================================================================
  // 1. TÁCH BẠCH CHUỖI VÀ NOTE SIÊU CHUẨN (Cân mọi định dạng)
  // =====================================================================
  let baseStatus = status;
  let noteContent = "";

  const match = status.match(/(\s+-\s+|\s+(?=["']))/);
  if (match && match.index !== undefined) {
    baseStatus = status.substring(0, match.index).trim();
    noteContent = status.substring(match.index + match[0].length).trim();
    // Dọn dẹp sạch sẽ ngoặc kép bọc ngoài note
    noteContent = noteContent.replace(/^["']+|["']+$/g, "").trim();
  }

  const s = baseStatus.toLowerCase();

  // =====================================================================
  // 2. LỌC CATEGORY (THỨ TỰ ƯU TIÊN TUYỆT ĐỐI)
  // =====================================================================
  let category: StatusCategory = "other";
  
  if (/^\d+/.test(s)) {
    category = "free";
  } 
  else if (
    s.includes('restricted') || s.includes('prohibited') || 
    s.includes('no admission') || s.includes('noadmission') || 
    s.includes('refused') || s.includes('suspended') || 
    s.includes('banned') || /\bban\b/.test(s) || s.includes('covid')
  ) {
    category = "restricted";
  } 
  else if (s.includes('required') || s.includes('tourist card')) {
    category = "required";
  } 
  else if (s.includes('arrival') || s === 'voa' || s.includes('e-voa')) {
    category = "arrival";
  } 
  else if (s.includes('eta') || s.includes('electronic travel') || s.includes('electronic border')) {
    category = "eta";
  } 
  else if (
    s.includes('e-visa') || s.includes('evisa') || s.includes('e visa') || 
    s.includes('electronic') || s.includes('online') || s.includes('smart service')
  ) {
    category = "evisa";
  } 
  else if (s.includes('free') || s.includes('not required') || s.includes('freedom')) {
    category = "free";
  } 
  else {
    category = "required"; 
  }

  // =====================================================================
  // 3. FORMAT TEXT HIỂN THỊ LÊN UI SẠCH BÓNG
  // =====================================================================
  const isNumeric = /^\d+$/.test(baseStatus);
  let displayText = baseStatus;

  if (isNumeric && baseStatus === '1') {
    displayText = "Home Country";
  } else if (isNumeric) {
    displayText = `Visa Free (${baseStatus} days)`;
  } else if (category === "free") {
    displayText = "Visa Free";
  } else {
    // Viết hoa chữ cái đầu cho đẹp
    displayText = baseStatus.charAt(0).toUpperCase() + baseStatus.slice(1);
  }

  return {
    category,
    displayText,
    note: noteContent
  };
}