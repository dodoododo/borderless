import mongoose, { Schema, Document } from 'mongoose';

// ============================================================================
// 1. TYPESCRIPT INTERFACE
// ============================================================================
export interface ICountryDetail extends Document {
  iso2: string;

  // --- 1. CORE & OVERVIEW ---
  coverImageUrl: string | null; // <-- Ảnh bìa quốc gia (chuyển lên Core)
  introduction: string | null;
  etymology: string | null;
  nationalAnthem: {
    name: string | null;
    author: string | null;
    audioUrl: string | null;
  };
  nationalSymbols: string[];
  religions: Array<{ name: string; percent: number }>;

  // --- 2. GEOGRAPHY ---
  geography: {
    location: string | null; // <--- MỚI: Vị trí địa lý
    climate: string | null;
    terrain: string | null;
    elevation: {
      highestPoint: string | null;
      highestElevation: number | null;
      lowestPoint: string | null;
      lowestElevation: number | null;
    };
    landBoundaries: { // <--- MỚI: Biên giới đất liền
      totalKm: number | null;
      borderCountries: Array<{ country: string; borderLengthKm: number | null }>;
    };
    coastlineKm: number | null;
    naturalHazards: string[];
  };

  // --- 3. DEMOGRAPHICS & SOCIETY ---
  demographics: {
    ethnicGroups: Array<{ name: string; percent: number }>;
    languages: { // <--- MỚI: Ngôn ngữ chi tiết
      language: Array<{ name: string; percent: number | null; note: string | null }>;
      note: string | null;
    };
    majorUrbanAreas: Array<{ name: string; population: number }>;
    lifeExpectancy: number | null;
    literacyRate: number | null;
    totalFertilityRate: { // <--- MỚI: Tỷ lệ sinh
      childrenBornPerWoman: number | null;
      globalRank: number | null;
    };
    ageStructure: {
      "0_14": number | null;
      "15_24": number | null;
      "25_54": number | null;
      "55_64": number | null;
      "65_over": number | null;
    };
    medianAge: number | null;
    populationGrowthRate: number | null;
    urbanizationRate: number | null;
    obesityRate: number | null;
    meanMaternalAge: number | null;
    sexRatioTotal: number | null;
    physiciansDensity: number | null;
    hospitalBedDensity: number | null;
    infectiousDiseasesRisk: string | null;
    schoolLifeExpectancy: number | null;
  };

  // --- 4. ECONOMY ---
  economy: {
    overview: string | null;
    gdpPpp: number | null;
    gdpPerCapita: number | null;
    realGrowthRate: number | null;
    unemploymentRate: number | null;
    povertyRate: number | null;
    agricultureProducts: string[];
    industries: string[];
    exportPartners: Array<{ name: string; percent: number }>;
    importPartners: Array<{ name: string; percent: number }>;
    budget: {
      revenues: number | null;
      expenditures: number | null;
    };
    publicDebt: number | null;
    inflationRate: number | null;
  };

  // --- 5. GOVERNMENT & CIVICS ---
  government: {
    type: string | null;
    independenceDate: string | null;
    nationalHolidays: Array<{ name: string; date: string }>;
    civics: {
      dualCitizenship: boolean | null;
      naturalizationYears: string | number | null;
      votingAge: number | null;
    };
    executiveBranch: string | null;
    legislativeBranch: string | null;
    judicialBranch: string | null;
  };

  // --- 6. INFRASTRUCTURE ---
  infrastructure: {
    electricityAccess: number | null;
    electricitySources: {
      fossil: number | null;
      hydro: number | null;
      nuclear: number | null;
      renewable: number | null;
    };
    internetUsersPercent: number | null;
    roadwaysKm: number | null;
    waterwaysKm: number | null;
    airportsTotal: number | null;
  };

  // --- 7. MILITARY ---
  military: {
    expenditures: number | null;
    serviceAgeAndObligation: { // <--- ĐÃ SỬA: Đổi serviceAge thành Object có thêm Note
      years: number | null;
      note: string | null;
    };
    transnationalIssues: string[];
  };

  // --- 8. GEMINI CACHE ---
  historyTimeline: Array<{
    year: string;
    event: string;
    description: string;
  }>;
  
  culturalNuances: {
    communicationStyle: string;
    etiquette: {
      dos: string[];
      donts: string[];
    };
    culinaryCulture: string;
    nationalVibe: string;
  };
  
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  
  nationalDishes: Array<{
    name: string;
    description: string;
    imageUrl: string | null; // <-- Ảnh món ăn
  }>;
  
  funFacts: string[];
  
  mustVisitPlaces: Array<{
    name: string;
    location: string;
    description: string;
    imageUrl: string | null; // <-- Ảnh địa danh
  }>;

  isAiGenerated: boolean;
  lastUpdated: Date;
}

// ============================================================================
// 2. MONGOOSE SCHEMA
// ============================================================================
const CountryDetailSchema: Schema = new Schema(
  {
    iso2: { type: String, required: true, unique: true, uppercase: true, index: true },

    // --- 1. CORE & OVERVIEW ---
    coverImageUrl: { type: String, default: null }, // <-- Ảnh bìa quốc gia
    introduction: { type: String, default: null },
    etymology: { type: String, default: null },
    nationalAnthem: {
      name: { type: String, default: null },
      author: { type: String, default: null },
      audioUrl: { type: String, default: null },
    },
    nationalSymbols: [{ type: String }],
    religions: [
      {
        name: { type: String },
        percent: { type: Number },
      }
    ],

    // --- 2. GEOGRAPHY ---
    geography: {
      location: { type: String, default: null }, // MỚI
      climate: { type: String, default: null },
      terrain: { type: String, default: null },
      elevation: {
        highestPoint: { type: String, default: null },
        highestElevation: { type: Number, default: null },
        lowestPoint: { type: String, default: null },
        lowestElevation: { type: Number, default: null },
      },
      landBoundaries: { // MỚI
        totalKm: { type: Number, default: null },
        borderCountries: [{
          country: { type: String },
          borderLengthKm: { type: Number, default: null }
        }]
      },
      coastlineKm: { type: Number, default: null },
      naturalHazards: [{ type: String }],
    },

    // --- 3. DEMOGRAPHICS & SOCIETY ---
    demographics: {
      ethnicGroups: [{ name: { type: String }, percent: { type: Number } }],
      languages: { // MỚI
        language: [{ 
          name: { type: String }, 
          percent: { type: Number, default: null }, 
          note: { type: String, default: null } 
        }],
        note: { type: String, default: null }
      },
      majorUrbanAreas: [{ name: { type: String }, population: { type: Number } }],
      lifeExpectancy: { type: Number, default: null },
      literacyRate: { type: Number, default: null },
      totalFertilityRate: { // MỚI
        childrenBornPerWoman: { type: Number, default: null },
        globalRank: { type: Number, default: null }
      },
      ageStructure: {
        "0_14": { type: Number, default: null },
        "15_24": { type: Number, default: null },
        "25_54": { type: Number, default: null },
        "55_64": { type: Number, default: null },
        "65_over": { type: Number, default: null },
      },
      medianAge: { type: Number, default: null },
      populationGrowthRate: { type: Number, default: null },
      urbanizationRate: { type: Number, default: null },
      obesityRate: { type: Number, default: null },
      meanMaternalAge: { type: Number, default: null },
      sexRatioTotal: { type: Number, default: null },
      physiciansDensity: { type: Number, default: null },
      hospitalBedDensity: { type: Number, default: null },
      infectiousDiseasesRisk: { type: String, default: null },
      schoolLifeExpectancy: { type: Number, default: null },
    },

    // --- 4. ECONOMY ---
    economy: {
      overview: { type: String, default: null },
      gdpPpp: { type: Number, default: null },
      gdpPerCapita: { type: Number, default: null },
      realGrowthRate: { type: Number, default: null },
      unemploymentRate: { type: Number, default: null },
      povertyRate: { type: Number, default: null },
      agricultureProducts: [{ type: String }],
      industries: [{ type: String }],
      exportPartners: [{ name: { type: String }, percent: { type: Number } }],
      importPartners: [{ name: { type: String }, percent: { type: Number } }],
      budget: {
        revenues: { type: Number, default: null },
        expenditures: { type: Number, default: null },
      },
      publicDebt: { type: Number, default: null },
      inflationRate: { type: Number, default: null },
    },

    // --- 5. GOVERNMENT & CIVICS ---
    government: {
      type: { type: String, default: null },
      independenceDate: { type: String, default: null },
      nationalHolidays: [{ name: { type: String }, date: { type: String } }],
      civics: {
        dualCitizenship: { type: Boolean, default: null },
        naturalizationYears: { type: Schema.Types.Mixed, default: null },
        votingAge: { type: Number, default: null },
      },
      executiveBranch: { type: String, default: null },
      legislativeBranch: { type: String, default: null },
      judicialBranch: { type: String, default: null },
    },

    // --- 6. INFRASTRUCTURE ---
    infrastructure: {
      electricityAccess: { type: Number, default: null },
      electricitySources: {
        fossil: { type: Number, default: null },
        hydro: { type: Number, default: null },
        nuclear: { type: Number, default: null },
        renewable: { type: Number, default: null },
      },
      internetUsersPercent: { type: Number, default: null },
      roadwaysKm: { type: Number, default: null },
      waterwaysKm: { type: Number, default: null },
      airportsTotal: { type: Number, default: null },
    },

    // --- 7. MILITARY ---
    military: {
      expenditures: { type: Number, default: null },
      serviceAgeAndObligation: { // MỚI
        years: { type: Number, default: null },
        note: { type: String, default: null }
      },
      transnationalIssues: [{ type: String }],
    },

    // --- 8. GEMINI CACHE ---
    historyTimeline: [
      {
        year: { type: String },
        event: { type: String },
        description: { type: String }
      }
    ],
    
    culturalNuances: {
      communicationStyle: { type: String },
      etiquette: {
        dos: [{ type: String }],
        donts: [{ type: String }]
      },
      culinaryCulture: { type: String },
      nationalVibe: { type: String }
    },

    faqs: [
      {
        question: { type: String },
        answer: { type: String }
      }
    ],

    nationalDishes: [
      {
        name: { type: String },
        description: { type: String },
        imageUrl: { type: String, default: null } // <-- Ảnh món ăn
      }
    ],

    funFacts: [{ type: String }],

    mustVisitPlaces: [
      {
        name: { type: String },
        location: { type: String },
        description: { type: String },
        imageUrl: { type: String, default: null } // <-- Ảnh địa danh
      }
    ],

    isAiGenerated: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
  },
  { 
    timestamps: true, 
    versionKey: false,
    minimize: false 
  }
);

// Ngăn Mongoose build lại model gây lỗi lúc hot-reload trong môi trường Dev
const CountryDetail = mongoose.models.CountryDetail || mongoose.model<ICountryDetail>('CountryDetail', CountryDetailSchema);

export default CountryDetail;