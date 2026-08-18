import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { ExplorePage } from "./pages/ExplorePage";
import { GlobalPower } from "./pages/GlobalPower";
import { LandPower } from "./pages/LandPower";
import { NotFound } from "./pages/404Page";
import { OpennessPage } from  "./pages/OpennessPage";
import { PassportDetailPage } from "./pages/PassportDetailPage";
import { ComparePage } from "./pages/ComparePage";
import FoursquareTest  from "./pages/FoursquareTest";
import CountryDiscover from "./pages/CountryDiscoverPage";

import FlightTester from "./pages/FlightPage"; // Import FlightTester component
import VisaRequirements from "./pages/VisaRequirements"; // Import VisaRequirements component
// Import các trang khác trong tương lai ở đây, ví dụ:
// import { ProfilePage } from "./pages/ProfilePage";

import 'maplibre-gl/dist/maplibre-gl.css';


function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("app-theme");
    return (savedTheme as "dark" | "light") || "light"; // Đổi "dark" thành "light" ở đây
});

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    // if (theme === "dark") document.documentElement.classList.add("dark");
    // else document.documentElement.classList.remove("dark");
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground font-sans relative isolate z-0">
        
        {/* Header bây giờ không cần activeTab state nữa, Router sẽ lo việc đó */}
        <Header theme={theme} setTheme={setTheme} />

        {/* Khai báo các đường dẫn */}
        <Routes>
          {/* Khi người dùng vào thẳng localhost:3000 -> tự động chuyển sang trang /explorer */}
          <Route path="/" element={<Navigate to="/explore" replace />} />
          
          {/* Trang chính */}
          <Route path="/explore" element={<ExplorePage theme={theme} />} />
          <Route path="/discover" element={<CountryDiscover />} />
          <Route path="/discover/:iso" element={<CountryDiscover />} />
          <Route path="/rank/global" element={<GlobalPower />} />
          <Route path="/rank/landpower" element={<LandPower />} />
          <Route path="/rank/openness" element={<OpennessPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/passport/:iso" element={<PassportDetailPage theme={theme} setTheme={setTheme} />} />
          
          <Route path="/book-flight" element={<FlightTester />} />

          <Route path="/requirements" element={<VisaRequirements />} />
          <Route path="*" element={<NotFound/>} />
        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;