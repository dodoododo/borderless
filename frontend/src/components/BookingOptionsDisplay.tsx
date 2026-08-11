// src/components/BookingOptionsDisplay.tsx
import React from 'react';

interface Props {
  bookingData: any;
  onReset: () => void;
}

export default function BookingOptionsDisplay({ bookingData, onReset }: Props) {
  if (!bookingData || bookingData.length === 0) {
    return <div className="text-center text-stone-400 py-10 bg-stone-900 rounded-xl">Không tìm thấy đại lý nào cung cấp vé này.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-900/20 border border-emerald-800/50 p-4 rounded-xl text-emerald-200 text-sm mb-6">
        🎉 Chuyến bay của bạn đã được chốt. Vui lòng chọn một trong các đại lý dưới đây để hoàn tất thanh toán.
      </div>

      <div className="space-y-3">
        {bookingData.map((option: any, index: number) => {
          const provider = option.together || option.departing; // Fallback
          if (!provider) return null;

          const req = provider.booking_request;

          return (
            <div key={index} className="bg-stone-900 border border-stone-800 p-5 rounded-xl flex items-center justify-between hover:border-stone-700 transition-colors">
              <div className="flex items-center gap-4">
                {provider.airline_logos && (
                  <img src={provider.airline_logos[0]} alt="Logo" className="w-10 h-10 rounded bg-white p-1" />
                )}
                <div>
                  <h3 className="font-bold text-lg text-white">{provider.book_with}</h3>
                  <p className="text-xs text-stone-400">{provider.option_title || 'Tiêu chuẩn'}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">${provider.price}</div>
                </div>

                {/* XỬ LÝ AN TOÀN NÚT ĐẶT VÉ CỦA SERPAPI */}
                {req?.post_data ? (
                  <form action={req.url} method="POST" target="_blank">
                    {/* SerpApi yêu cầu truyền data vào biến 'u' */}
                    <input type="hidden" name="u" value={req.post_data.replace('u=', '')} />
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg shadow-lg shadow-emerald-900/20">
                      Thanh Toán
                    </button>
                  </form>
                ) : (
                  <a href={req?.url || '#'} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg shadow-lg shadow-emerald-900/20 inline-block">
                    Thanh Toán
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <button onClick={onReset} className="text-stone-400 hover:text-white underline text-sm">
          ← Hủy và tìm chuyến bay khác
        </button>
      </div>
    </div>
  );
}