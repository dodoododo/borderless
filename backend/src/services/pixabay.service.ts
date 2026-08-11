/**
 * Hàm lõi để gọi API Pixabay và trả về URL ảnh đầu tiên
 * Lọc: ảnh thật (photo), nằm ngang (horizontal), lọc 18+ (safesearch), phổ biến nhất (popular)
 */
export const fetchPixabayImage = async (keyword: string): Promise<string | null> => {
  try {
    const PIXABAY_KEY = process.env.PIXABAY_API_KEY;
    if (!PIXABAY_KEY) {
      console.warn("⚠️ [CẢNH BÁO] Chưa cấu hình PIXABAY_API_KEY trong .env");
      return null;
    }

    const safeKeyword = keyword.substring(0, 100);
    const query = encodeURIComponent(safeKeyword);

    // Ép lấy 20 kết quả để tăng tỷ lệ tìm được ảnh có lượng Like khủng
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${query}&image_type=photo&orientation=horizontal&safesearch=true&order=popular&per_page=20`;

    const response = await fetch(url);
    
    if (!response.ok) {
        console.error(`[PIXABAY LỖI] HTTP Error: ${response.status} - ${response.statusText}`);
        return null;
    }

    const data = await response.json();

    if (data.hits && data.hits.length > 0) {
      // 🔥 THỦ THUẬT Ở ĐÂY: Sắp xếp lại mảng kết quả theo số lượng Likes giảm dần
      const sortedHits = data.hits.sort((a: any, b: any) => b.likes - a.likes);

      // Bốc bức ảnh có nhiều Like nhất (đứng ở vị trí 0 sau khi sort)
      return sortedHits[0].webformatURL;
    }

    return null; 
  } catch (error) {
    console.error(`[PIXABAY LỖI] Exception khi lấy ảnh cho "${keyword}":`, error);
    return null;
  }
};

/**
 * Hàm tìm ảnh có cơ chế Fallback (Lốp dự phòng)
 * Nếu tìm "Phở food Vietnam" không ra, sẽ thử "Phở food", rồi "Vietnam food"
 */
export const fetchImageSmart = async (itemName: string, countryName: string, type: 'food' | 'place'): Promise<string | null> => {
    const suffix = type === 'food' ? 'food' : 'landmark travel';
    
    // Lần 1: Cụ thể nhất (Tên món + thể loại + Tên nước)
    let imageUrl = await fetchPixabayImage(`${itemName} ${suffix} ${countryName}`);
    if (imageUrl) return imageUrl;
    
    // Lần 2: Rộng hơn (Tên món + thể loại)
    imageUrl = await fetchPixabayImage(`${itemName} ${suffix}`);
    if (imageUrl) return imageUrl;

    // Lần 3: Vét máng (Lấy ảnh chung của quốc gia đó cho có ảnh minh họa)
    return await fetchPixabayImage(`${countryName} ${suffix}`);
}


/**
 * Hàm chính để nhồi (enrich) ảnh vào dữ liệu JSON của AI
 * Hàm này sẽ được gọi bên trong gemini.service.ts
 */
export const enrichAiDataWithImages = async (countryName: string, aiData: any) => {
  console.log(`[PIXABAY] Bắt đầu tìm ảnh cho quốc gia: ${countryName}...`);

  // 1. Tìm ảnh bìa quốc gia (Cover Image)
  // Ưu tiên tìm ảnh phong cảnh (landscape/landmark)
  aiData.coverImageUrl = await fetchPixabayImage(`${countryName} scenery`) || null;

  // 2. Tìm ảnh cho danh sách địa danh (mustVisitPlaces)
  if (aiData.mustVisitPlaces && Array.isArray(aiData.mustVisitPlaces)) {
    // Dùng Promise.all để fetch ảnh song song, tăng tốc độ đáng kể
    aiData.mustVisitPlaces = await Promise.all(
      aiData.mustVisitPlaces.map(async (place: any) => {
        const imageUrl = await fetchImageSmart(place.name, countryName, 'place');
        return { ...place, imageUrl };
      })
    );
  }

  // 3. Tìm ảnh cho danh sách món ăn (nationalDishes)
  if (aiData.nationalDishes && Array.isArray(aiData.nationalDishes)) {
    aiData.nationalDishes = await Promise.all(
      aiData.nationalDishes.map(async (dish: any) => {
        const imageUrl = await fetchImageSmart(dish.name, countryName, 'food');
        return { ...dish, imageUrl };
      })
    );
  }

  console.log(`[PIXABAY] Hoàn tất bơm ảnh cho ${countryName}!`);
  return aiData; // Trả về object đã được gắn link ảnh
};