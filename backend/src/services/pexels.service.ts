/**
 * Hàm gọi Pexels API với cơ chế chống trùng lặp (Tracker) và ép ảnh toàn cảnh
 */
export const fetchPexelsImage = async (
  keyword: string, 
  type: 'cover' | 'place' | 'food' = 'place',
  usedUrls: Set<string> // 👈 Truyền Set chứa các URL đã dùng để loại trừ trùng lặp
): Promise<string | null> => {
  try {
    const PEXELS_KEY = process.env.PEXELS_API_KEY;
    if (!PEXELS_KEY) {
      console.warn("⚠️ [CẢNH BÁO] Chưa cấu hình PEXELS_API_KEY trong .env");
      return null;
    }

    let enhancedKeyword = keyword;
    if (type === 'place') {
      enhancedKeyword = `${keyword} wide angle panoramic landscape view overview`;
    } else if (type === 'cover') {
      enhancedKeyword = `${keyword} majestic aerial panoramic scenery landscape`;
    } else if (type === 'food') {
      enhancedKeyword = `${keyword} traditional dish plate food photography`;
    }

    const safeKeyword = enhancedKeyword.substring(0, 100);
    const query = encodeURIComponent(safeKeyword);

    // Kéo 15-20 kết quả để có một kho ảnh lớn tha hồ lọc và chọn ảnh không bị trùng
    const url = `https://api.pexels.com/v1/search?query=${query}&orientation=landscape&per_page=20`;

    const response = await fetch(url, {
      headers: {
        Authorization: PEXELS_KEY
      }
    });

    if (!response.ok) return null;

    const data: any = await response.json();

    if (data.photos && data.photos.length > 0) {
      // 1. Lọc ưu tiên ảnh ngang rộng (tỷ lệ khung hình > 1.4)
      const widePhotos = data.photos.filter((p: any) => p.width / p.height > 1.4);
      const candidatePhotos = widePhotos.length > 0 ? widePhotos : data.photos;

      // 2. Duyệt qua mảng ứng viên, tìm bức nào CHƯA TỪNG ĐƯỢC SỬ DỤNG
      for (const photo of candidatePhotos) {
        const imageUrl = photo.src.large || photo.src.medium;
        
        if (imageUrl && !usedUrls.has(imageUrl)) {
          usedUrls.add(imageUrl); // Đánh dấu URL này đã dùng
          return imageUrl;        // Trả về ngay bức ảnh độc nhất này
        }
      }

      // Xui lắm nếu cả 20 ảnh đều bị trùng hết (hiếm khi xảy ra), ta lấy tạm tấm đầu tiên
      const fallbackUrl = candidatePhotos[0].src.large || candidatePhotos[0].src.medium;
      return fallbackUrl;
    }

    return null;
  } catch (error) {
    console.error(`[PEXELS LỖI] Cho từ khóa "${keyword}":`, error);
    return null;
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Hàm bơm ảnh thông minh từ Pexels (Tích hợp chống trùng lặp toàn diện)
 */
export const enrichAiDataWithImages = async (countryName: string, aiData: any) => {
  console.log(`[PEXELS] Đang kéo ảnh toàn cảnh, không trùng lặp cho: ${countryName}...`);

  // Tạo một Set dùng chung cho toàn bộ tiến trình của quốc gia này
  const usedUrls = new Set<string>();

  // 1. Ảnh bìa quốc gia (Cover)
  aiData.coverImageUrl = await fetchPexelsImage(`${countryName}`, 'place', usedUrls) || null;
  await delay(200);

  // 2. Địa danh (mustVisitPlaces)
  if (aiData.mustVisitPlaces && Array.isArray(aiData.mustVisitPlaces)) {
    const updatedPlaces = [];
    for (const place of aiData.mustVisitPlaces) {
      let imageUrl = await fetchPexelsImage(`${place.name} ${countryName}`, 'place', usedUrls);
      if (!imageUrl) imageUrl = await fetchPexelsImage(place.name, 'place', usedUrls);
      
      updatedPlaces.push({ ...place, imageUrl });
      await delay(200);
    }
    aiData.mustVisitPlaces = updatedPlaces;
  }

  // 3. Món ăn (nationalDishes)
  if (aiData.nationalDishes && Array.isArray(aiData.nationalDishes)) {
    const updatedDishes = [];
    for (const dish of aiData.nationalDishes) {
      let imageUrl = await fetchPexelsImage(`${dish.name} ${countryName}`, 'food', usedUrls);
      if (!imageUrl) imageUrl = await fetchPexelsImage(dish.name, 'food', usedUrls);
      
      updatedDishes.push({ ...dish, imageUrl });
      await delay(200);
    }
    aiData.nationalDishes = updatedDishes;
  }

  console.log(`[PEXELS] Hoàn tất! Đã cô lập mọi trường hợp trùng ảnh cho ${countryName}!`);
  return aiData;
};