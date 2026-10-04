import React, { useState } from 'react';
import QuickCheckView from '../components/visa-requirements/QuickCheckView';
import BrowseAllView from '../components/visa-requirements/BrowseAllView';

export default function VisaRequirements() {
  const [activeTab, setActiveTab] = useState<'quick' | 'browse'>('quick');

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2C2A] py-8 md:py-8 pt-5 px-4 md:px-8 font-sans">
      <div className="mx-auto max-w-7xl">
        
        {/* HEADER & TAB NAVIGATION */}
        <header className="mb-4 flex flex-col items-start">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-5xl text-[#1A1A19] tracking-tight leading-[1.1] md:leading-[0.95] mb-4 md:mb-6 lg:mb-1">
            Visa Requirements Checker<br className="hidden md:block" />
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-[#6E6D67] font-light leading-relaxed max-w-7xl mb-6 md:mb-2">
            Navigate borders with confidence. Check single routes or browse full passport power.
          </p>

          {/* NÚT CHUYỂN TAB CỰC MƯỢT */}
          <div className="flex bg-[#F5F5F4] p-1.5 rounded-xl w-full md:w-auto border border-[#E7E5E4] shadow-inner">
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 md:flex-none px-6 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-bold transition-all duration-300 ${
                activeTab === 'quick' 
                  ? 'bg-white text-[#1A1A19] shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#E7E5E4]' 
                  : 'text-[#8A8984] hover:text-[#1A1A19]'
              }`}
            >
              Quick Check
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 md:flex-none px-6 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-bold transition-all duration-300 ${
                activeTab === 'browse' 
                  ? 'bg-white text-[#1A1A19] shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#E7E5E4]' 
                  : 'text-[#8A8984] hover:text-[#1A1A19]'
              }`}
            >
              Browse All
            </button>
          </div>
        </header>

        {/* NỘI DUNG TƯƠNG ỨNG VỚI TAB */}
        {activeTab === 'quick' ? (
           <QuickCheckView />
        ) : (
           <BrowseAllView />
        )}

      </div>
    </div>
  );
}