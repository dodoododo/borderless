// src/services/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { enrichAiDataWithImages } from './pexels.service.js'; // Nhớ check đường dẫn file pixabay.service của bác cho đúng

/**
 * Hàm phân tích JSON từ Gemini siêu việt (Phiên bản dọn rác RegExp)
 */
export const parseGeminiJson = (text: string) => {
  try {
    if (!text) throw new Error("Gemini trả về chuỗi rỗng.");

    // BƯỚC 1: Xóa bỏ các ký tự Markdown (```json ... ```) bọc ngoài
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();

    // BƯỚC 2: Dọn dẹp ký tự độc hại gây lỗi JSON
    // - Loại bỏ các dấu xuống dòng thực tế (newline) nằm lọt thỏm trong chuỗi String
    // - Loại bỏ các ký tự điều khiển (control characters) không hợp lệ trong chuẩn JSON
    cleanText = cleanText
      .replace(/[\n\r\t]/g, " ") // Đổi toàn bộ xuống dòng, tab thành khoảng trắng an toàn
      .replace(/\\"/g, "'")      // Đổi các dấu ngoặc kép nội bộ (escaped quote) thành nháy đơn để tránh đụng độ
      .replace(/[^\x20-\x7E\xA0-\uFFFF]/g, ""); // Dọn rác các ký tự ẩn (invisible control chars)

    try {
      // BƯỚC 3: Parse JSON
      return JSON.parse(cleanText);
    } catch (parseError: any) {
      console.warn(`[CẢNH BÁO GEMINI JSON] Lỗi cú pháp JSON. Đang tiến hành khôi phục mảng bị cắt cụt... (${parseError.message})`);

      // BƯỚC 4: Cứu vãn JSON bị đứt gánh do giới hạn Token/API timeout
      if (parseError.message.includes('Unterminated string') || parseError.message.includes('Unexpected end of JSON')) {
        
        // Cố gắng tìm vị trí object/mảng đóng lại gần nhất
        const lastBracket = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
        
        if (lastBracket > 0) {
           let rescuedText = cleanText.substring(0, lastBracket + 1);
           
           // Tính toán độ lệch đóng mở ngoặc nhọn
           let openBraces = (rescuedText.match(/\{/g) || []).length;
           let closeBraces = (rescuedText.match(/\}/g) || []).length;
           
           // Đóng ngoặc Object tổng tự động
           while (openBraces > closeBraces) {
               rescuedText += '}';
               closeBraces++;
           }
           
           // Tính độ lệch ngoặc vuông
           let openBrackets = (rescuedText.match(/\[/g) || []).length;
           let closeBrackets = (rescuedText.match(/\]/g) || []).length;
           
           while (openBrackets > closeBrackets) {
              // Chèn ] trước } cuối cùng để đóng mảng
              rescuedText = rescuedText.slice(0, -1) + ']}'; 
              closeBrackets++;
           }
           
           return JSON.parse(rescuedText);
        }
      }
      
      throw parseError; 
    }
    
  } catch (err: any) {
    console.error("[GEMINI JSON ERROR] Không thể khôi phục JSON:", err.message);
    
    // Fallback: Trả về một Object rỗng có cấu trúc cơ bản để app không bị crash
    return {
      historyTimeline: [],
      culturalNuances: {
        communicationStyle: "Đang cập nhật...",
        etiquette: { dos: [], donts: [] },
        culinaryCulture: "Đang cập nhật...",
        nationalVibe: "Đang cập nhật..."
      },
      faqs: [],
      nationalDishes: [],
      funFacts: ["Dữ liệu bị lỗi do vấn đề xử lý ngôn ngữ. Sẽ được cập nhật sau."],
      mustVisitPlaces: []
    };
  }
};

/**
 * Gọi API Gemini để sinh ra các thông tin chi tiết về Văn hóa, Ẩm thực, Lịch sử
 * dựa trên tên quốc gia.
 * 
 * @param countryName Tên quốc gia (Ví dụ: "Japan", "Vietnam")
 */
export const generateCountryInsights = async (countryName: string) => {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY chưa được cấu hình trong biến môi trường');
    }

    // 1. Khởi tạo SDK chính thức
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // 2. Lấy model thông qua phương thức getGenerativeModel
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash-lite", // Hoặc "gemini-2.5-flash"
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
      }
    });

    const prompt = `
    You are an expert travel guide, cultural anthropologist, and a master historian.
    Provide fascinating, deep, and accurate insights for the country: ${countryName}.
    
    CRITICAL RULE: You MUST return strictly a valid JSON object matching the exact structure below. 
    DO NOT wrap the response in markdown code blocks (\`\`\`json). Return raw JSON only.

    {
      "historyTimeline": [
        { 
          "year": "c. 3000 BCE", 
          "event": "Name of the Era or Major Event", 
          "description": "Deep historical context. Detail the people/tribes living there, key figures, societal shifts, and why this fundamentally shaped the nation's identity..." 
        }
      ],
      "culturalNuances": {
        "communicationStyle": "Description of how locals communicate, unwritten rules...",
        "etiquette": {
          "dos": ["Do this 1", "Do this 2"],
          "donts": ["Taboo 1", "Taboo 2"]
        },
        "culinaryCulture": "Tipping culture, dining rules, drinking habits...",
        "nationalVibe": "The overall personality and vibe of the people..."
      },
      "faqs": [
        { "question": "Common question 1?", "answer": "Detailed answer 1" }
      ],
      "nationalDishes": [
        { "name": "Local Dish Name", "description": "Ingredients and taste description" }
      ],
      "funFacts": [
        "Fascinating fact 1...",
        "Fascinating fact 2..."
      ],
      "mustVisitPlaces": [
        {
          "name": "Landmark/Place Name",
          "location": "City/Region",
          "description": "Why it defines the country..."
        }
      ]
    }

    - historyTimeline: LIMIT is 15 most pivotal historical events. You MUST carefully distribute the timeline chronologically: allocate the vast majority of events to ancient, medieval, and pre-1800s eras; allocate AT LEAST 3 events specifically to the 19th and 20th centuries (1800-2000); and allocate 1 or more event to the modern day (post-2000s or present). You MUST provide a highly comprehensive, chronological journey of the country's development. Cover all defining eras: prehistoric settlements, ancient indigenous peoples, empires, colonization, independence, and the modern era. Emphasize the people who lived there, significant leaders, and profound details that define the country today. The description for each event MUST be exactly 3 to 4 sentences long.
    - faqs: Exactly 10 questions. DO NOT provide generic travel questions (e.g., "Is tap water safe?" or "Do they take cards?") unless it is a genuine issue for this specific country. Instead, focus on genuine, country-specific concerns, cultural curiosities, and unique logistical quirks that travelers actually wonder about before visiting ${countryName} (e.g., "How strict are the dress codes in Iranian mosques?", "What is the deal with the siesta in Spain?", "How do I navigate the JR Pass in Japan?", or "Is altitude sickness a real concern in Peru?").
    - nationalDishes: Exactly 6 dishes. Provide a diverse culinary mix: include the famous national dish, a beloved street food, a festive/family meal, and a traditional dessert or beverage. Descriptions MUST be 2 to 3 sentences long. Use sensory language (textures, aromas) and explain the cultural significance or origin of the ingredients.
    - funFacts: Exactly 8 facts. Avoid boring geographic stats. Provide mind-blowing, quirky, or obscure insights—such as bizarre local laws, strange historical anecdotes, unique geographical anomalies, bizarre world records, or fascinating local superstitions.
    - etiquette: Provide at least 5 dos and 5 don'ts. Focus on hyper-local, unwritten cultural rules. Detail specific hand gestures to avoid, temple/religious site dress codes, home-visiting protocols (e.g., removing shoes, bringing gifts), and dining taboos. DO NOT use generic advice like "be polite" or "don't litter".
    - mustVisitPlaces: Exactly 8 iconic places. You MUST provide SPECIFIC, highly popular, and well-known touristic destinations or critically important landmarks that define the country (e.g., "The Colosseum", "Machu Picchu", "Taj Mahal", or "Mount Fuji"). DO NOT provide broad areas, whole cities, or entire provinces (e.g., do not say "Rome", "Bali", or "The Andes"). Focus on the absolute top-tier, must-see sights and specific defining locations.
    - For funFacts, strictly return a flat array of strings. Do NOT return an array of objects
    - Keep all text in English.
    `;

    // 3. Gọi trực tiếp bằng SDK thay vì fetch
    const result = await model.generateContent(prompt);
    const response = await result.response;

    // --- THÊM ĐOẠN LOG NÀY ĐỂ BẮT BỆNH FINISH REASON ---
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      console.log(`[GEMINI TÌNH TRẠNG KẾT THÚC CHO ${countryName}]:`, candidate.finishReason);
      
      // Nếu có cảnh báo an toàn (Safety Filter)
      if (candidate.finishReason === 'SAFETY') {
        console.warn(`[CẢNH BÁO SAFETY] Nội dung cho ${countryName} đã bị chặn bởi bộ lọc an toàn của Google!`);
      }
      
      // Nếu đụng trần Max Tokens (dù đã set 8192)
      if (candidate.finishReason === 'MAX_TOKENS') {
         console.warn(`[CẢNH BÁO MAX TOKENS] Nội dung cho ${countryName} quá dài, đã bị cắt ngang!`);
      }
    }
    const aiText = response.text();

    let parsedJson = parseGeminiJson(aiText);

    // Giao dữ liệu cho Pixabay Service tự động tìm và gắn các link ảnh
    parsedJson = await enrichAiDataWithImages(countryName, parsedJson);

    return parsedJson;

  } catch (error) {
    console.error(`[LỖI] Xảy ra lỗi khi gọi Gemini API cho ${countryName}:`, error);
    
    return {
      coverImageUrl: null,
      historyTimeline: [],
      culturalNuances: { 
        communicationStyle: "", 
        etiquette: { dos: [], donts: [] }, 
        culinaryCulture: "", 
        nationalVibe: "" 
      },
      faqs: [], 
      nationalDishes: [], 
      funFacts: [], 
      mustVisitPlaces: []
    };
  }
};