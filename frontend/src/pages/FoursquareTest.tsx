import React, { useState, useEffect } from 'react';
import { Country, City } from 'country-state-city';

export default function FoursquareTest() {
  // State quản lý form input
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [countryCode, setCountryCode] = useState('VN');
  const [cityName, setCityName] = useState('Biên Hòa');
  const [query, setQuery] = useState('Tourist Attractions');
  
  // State cho các tính năng khác
  const [matchName, setMatchName] = useState('Cà phê');
  const [askQuery, setAskQuery] = useState('Quán cafe nào đẹp ở đây?');
  const [selectedFsqId, setSelectedFsqId] = useState('');

  // State dữ liệu trả về & UI
  const [places, setPlaces] = useState<any[]>([]);
  const [singleResult, setSingleResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'SEARCH' | 'MATCH' | 'ASK' | 'DETAILS' | 'PHOTOS' | 'TIPS'>('SEARCH');

  // Load danh sách quốc gia khi khởi động
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountryList => allCountries);
  }, []);

  // Cập nhật danh sách thành phố khi đổi quốc gia
  useEffect(() => {
    const countryCities = City.getCitiesOfCountry(countryCode) || [];
    setCities(countryCities);
    if (countryCities.length > 0) {
      setCityName(countryCities[0].name);
    } else {
      setCityName('');
    }
  }, [countryCode]);

  // 1. Search Places
  const handleSearch = async () => {
    try {
      setLoading(true); setError(null); setSingleResult(null); setMode('SEARCH');
      const countryName = Country.getCountryByCode(countryCode)?.name || '';
      const searchLocation = cityName ? `${cityName}, ${countryName}` : countryName;

      const params = new URLSearchParams();
      if (searchLocation) params.append('near', searchLocation);
      if (query) params.append('query', query);

      const res = await fetch(`http://localhost:5000/api/places/search?${params.toString()}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Lỗi API Search');
      setPlaces(data.results || data.results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Match Place
  const handleMatch = async () => {
    try {
      setLoading(true); setError(null); setSingleResult(null); setMode('MATCH');
      const countryName = Country.getCountryByCode(countryCode)?.name || '';

      const params = new URLSearchParams();
      if (matchName) params.append('name', matchName);
      if (cityName) params.append('city', cityName);
      if (countryName) params.append('country', countryName);

      const res = await fetch(`http://localhost:5000/api/places/match?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Lỗi API Match');
      setSingleResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Ask Places (AI NLP)
  const handleAsk = async () => {
    try {
      setLoading(true); setError(null); setSingleResult(null); setMode('ASK');
      const countryName = Country.getCountryByCode(countryCode)?.name || '';
      const location = cityName ? `${cityName}, ${countryName}` : countryName;

      const params = new URLSearchParams();
      if (askQuery) params.append('query', askQuery);
      if (location) params.append('location', location);

      const res = await fetch(`http://localhost:5000/api/places/ask?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Lỗi API Ask');
      setSingleResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Details
  const handleGetDetails = async (fsq_id: string) => {
    try {
      setLoading(true); setError(null); setMode('DETAILS');
      const res = await fetch(`http://localhost:5000/api/places/${fsq_id}/details`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lấy Details');
      setSingleResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. Photos
  const handleGetPhotos = async (fsq_id: string) => {
    try {
      setLoading(true); setError(null); setMode('PHOTOS');
      const res = await fetch(`http://localhost:5000/api/places/${fsq_id}/photos`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lấy Photos');
      setSingleResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 6. Tips
  const handleGetTips = async (fsq_id: string) => {
    try {
      setLoading(true); setError(null); setMode('TIPS');
      const res = await fetch(`http://localhost:5000/api/places/${fsq_id}/tips`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lấy Tips');
      setSingleResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h2>Borderless - Foursquare Testing Dashboard</h2>

      {/* Khu vực cấu hình Input */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
        <div>
          <label><strong>Quốc gia:</strong></label><br />
          <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ width: '100%', padding: '6px' }}>
            {countries.map((c) => (
              <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label><strong>Thành phố / Huyện:</strong></label><br />
          <select value={cityName} onChange={(e) => setCityName(e.target.value)} style={{ width: '100%', padding: '6px' }}>
            {cities.map((city, index) => (
              <option key={`${city.name}-${index}`} value={city.name}>{city.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label><strong>Từ khóa Search:</strong></label><br />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: '100%', padding: '6px' }} />
        </div>

        <div>
          <label><strong>Tên Match:</strong></label><br />
          <input type="text" value={matchName} onChange={(e) => setMatchName(e.target.value)} style={{ width: '100%', padding: '6px' }} />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label><strong>Hỏi AI (Ask):</strong></label><br />
          <input type="text" value={askQuery} onChange={(e) => setAskQuery(e.target.value)} style={{ width: '100%', padding: '6px' }} />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={handleSearch} style={{ padding: '10px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Search Places</button>
        <button onClick={handleMatch} style={{ padding: '10px 15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Match Place</button>
        <button onClick={handleAsk} style={{ padding: '10px 15px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Ask AI</button>
      </div>

      {/* Trạng thái Loading / Error */}
      {loading && <p style={{ color: 'orange' }}>Đang tải dữ liệu từ Foursquare...</p>}
      {error && <p style={{ color: 'red' }}>Lỗi API: {error}</p>}

      {/* Khu vực hiển thị kết quả */}
      {/* Khu vực hiển thị kết quả */}
      <div style={{ marginTop: '20px', background: '#fff', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h3>Kết quả hiển thị (Mode: {mode})</h3>

        {/* Hiển thị danh sách nếu là SEARCH */}
        {mode === 'SEARCH' && places.length > 0 && (
          <ul style={{ paddingLeft: '20px' }}>
            {places.map((place: any, index: number) => {
              // Sửa lại thành lấy trường fsq_place_id đúng như JSON trả về
              const placeId = place.fsq_place_id || place.fsq_id || place.id; 

              return (
                <li key={`${placeId || 'place'}-${index}`} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <strong>{place.name}</strong> - <span>{place.location?.formatted_address}</span><br />
                  
                  {placeId ? (
                    <div style={{ marginTop: '5px' }}>
                      <button onClick={() => handleGetDetails(placeId)} style={{ marginRight: '5px', padding: '4px 8px' }}>Details</button>
                      <button onClick={() => handleGetPhotos(placeId)} style={{ marginRight: '5px', padding: '4px 8px' }}>Photos</button>
                      <button onClick={() => handleGetTips(placeId)} style={{ padding: '4px 8px' }}>Tips</button>
                    </div>
                  ) : (
                    <span style={{ color: 'red', fontSize: '12px' }}>Không có ID địa điểm</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Hiển thị kết quả dạng JSON / Object đơn (Match, Ask, Details, Photos, Tips) */}
        {mode !== 'SEARCH' && singleResult && (
          <pre style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', overflowX: 'auto', maxHeight: '400px' }}>
            {JSON.stringify(singleResult, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}