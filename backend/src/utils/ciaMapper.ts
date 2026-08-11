import { ICountryDetail } from '../models/countryDetail.model.js'; // Nhớ check lại đường dẫn import nhé bác

/**
 * Hàm tiện ích lấy giá trị mới nhất từ mảng annual_values của CIA Factbook
 */
const getLatestValue = (arr: any[] | undefined) => {
  return arr && arr.length > 0 ? arr[0].value : null;
};

/**
 * HÀM MAPPER: Chuyển Raw JSON CIA -> Mongoose Model Format (Partial)
 * 
 * @param iso2 Mã ISO2 của quốc gia (VD: "VN", "JP")
 * @param ciaData Toàn bộ object JSON thô của một quốc gia từ file factbook.json
 * @returns Object khớp với schema CountryDetail (phần core)
 */
export function transformCiaToCountryDetail(iso2: string, ciaData: any): Partial<ICountryDetail> {
  // BÓC LỚP VỎ: Hỗ trợ cả 2 trường hợp JSON (Có bọc trong key "data" hoặc không)
  const data = ciaData?.data || ciaData || {};

  return {
    iso2: iso2.toUpperCase(),

    // ========================================================================
    // 1. CORE & OVERVIEW
    // ========================================================================
    introduction: data.introduction?.background || null,
    etymology: data.government?.country_name?.etymology || null,
    nationalAnthem: {
      name: data.government?.national_anthem?.name || null,
      author: data.government?.national_anthem?.lyrics_music || null,
      audioUrl: data.government?.national_anthem?.audio_url || null,
    },
    nationalSymbols: data.government?.national_symbol?.symbols?.map((s: any) => s.symbol) || [],
    religions: data.people?.religions?.religion?.map((r: any) => ({
      name: r.name || "",
      percent: r.percent || 0
    })) || [],

    // ========================================================================
    // 2. GEOGRAPHY
    // ========================================================================
    geography: {
      location: data.geography?.location || null, // <--- MỚI
      climate: data.geography?.climate || null,
      terrain: data.geography?.terrain || null,
      elevation: {
        highestPoint: data.geography?.elevation?.highest_point?.name || null,
        highestElevation: data.geography?.elevation?.highest_point?.elevation?.value || null,
        lowestPoint: data.geography?.elevation?.lowest_point?.name || null,
        lowestElevation: data.geography?.elevation?.lowest_point?.elevation?.value || null,
      },
      landBoundaries: { // <--- MỚI
        totalKm: data.geography?.land_boundaries?.total?.value || null,
        borderCountries: data.geography?.land_boundaries?.border_countries?.map((bc: any) => ({
          country: bc.country || "",
          borderLengthKm: bc.border_length?.value || null
        })) || []
      },
      coastlineKm: data.geography?.coastline?.value || null,
      naturalHazards: data.geography?.natural_hazards?.map((h: any) => h.description) || [],
    },

    // ========================================================================
    // 3. DEMOGRAPHICS & SOCIETY
    // ========================================================================
    demographics: {
      ethnicGroups: data.people?.ethnic_groups?.ethnicity?.map((e: any) => ({
        name: e.name || "",
        percent: e.percent || 0
      })) || [],
      languages: { // <--- MỚI
        language: data.people?.languages?.language?.map((lang: any) => ({
          name: lang.name || "",
          percent: lang.percent || null,
          note: lang.note || null
        })) || [],
        note: data.people?.languages?.note || null
      },
      majorUrbanAreas: data.people?.major_urban_areas?.places?.map((p: any) => ({
        name: p.place || "",
        population: p.population || 0
      })) || [],
      lifeExpectancy: data.people?.life_expectancy_at_birth?.total_population?.value || null,
      literacyRate: data.people?.literacy?.total_population?.value || null,
      
      totalFertilityRate: { // <--- MỚI
        childrenBornPerWoman: data.people?.total_fertility_rate?.children_born_per_woman || null,
        globalRank: data.people?.total_fertility_rate?.global_rank || null
      },

      ageStructure: {
        "0_14": data.people?.age_structure?.["0_to_14"]?.percent || null,
        "15_24": data.people?.age_structure?.["15_to_24"]?.percent || null,
        "25_54": data.people?.age_structure?.["25_to_54"]?.percent || null,
        "55_64": data.people?.age_structure?.["55_to_64"]?.percent || null,
        "65_over": data.people?.age_structure?.["65_and_over"]?.percent || null,
      },
      medianAge: data.people?.median_age?.total?.value || null,
      populationGrowthRate: data.people?.population_growth_rate?.growth_rate || null,
      urbanizationRate: data.people?.urbanization?.urban_population?.value || null,
      
      obesityRate: data.people?.adult_obesity?.percent_of_adults || null,
      meanMaternalAge: data.people?.mothers_mean_age_at_first_birth?.age || null,
      sexRatioTotal: data.people?.sex_ratio?.total_population?.value || null,
      physiciansDensity: data.people?.physicians_density?.physicians_per_1000_population || null,
      hospitalBedDensity: data.people?.hospital_bed_density?.beds_per_1000_population || null,
      infectiousDiseasesRisk: data.people?.major_infectious_diseases?.degree_of_risk || null,
      schoolLifeExpectancy: data.people?.school_life_expectancy?.total?.value || null,
    },

    // ========================================================================
    // 4. ECONOMY
    // ========================================================================
    economy: {
      overview: data.economy?.overview || null,
      gdpPpp: getLatestValue(data.economy?.gdp?.purchasing_power_parity?.annual_values),
      gdpPerCapita: getLatestValue(data.economy?.gdp?.per_capita_purchasing_power_parity?.annual_values),
      realGrowthRate: getLatestValue(data.economy?.gdp?.real_growth_rate?.annual_values),
      unemploymentRate: getLatestValue(data.economy?.unemployment_rate?.annual_values),
      povertyRate: data.economy?.population_below_poverty_line?.value || null,
      
      agricultureProducts: data.economy?.agriculture_products?.products || [],
      industries: data.economy?.industries?.industries || [],
      
      exportPartners: data.economy?.exports?.partners?.by_country?.map((c: any) => ({
        name: c.name || "", percent: c.percent || 0
      })) || [],
      importPartners: data.economy?.imports?.partners?.by_country?.map((c: any) => ({
        name: c.name || "", percent: c.percent || 0
      })) || [],
      
      budget: {
        revenues: data.economy?.budget?.revenues?.value || null,
        expenditures: data.economy?.budget?.expenditures?.value || null,
      },
      publicDebt: getLatestValue(data.economy?.public_debt?.annual_values),
      inflationRate: getLatestValue(data.economy?.inflation_rate?.annual_values),
    },

    // ========================================================================
    // 5. GOVERNMENT & CIVICS
    // ========================================================================
    government: {
      type: data.government?.government_type || null,
      independenceDate: data.government?.independence?.date || null,
      nationalHolidays: data.government?.national_holidays?.map((h: any) => ({
        name: h.name || "", date: h.day || ""
      })) || [],
      
      civics: {
        dualCitizenship: data.government?.citizenship?.dual_citizenship_recognized === "yes" ? true : data.government?.citizenship?.dual_citizenship_recognized === "no" ? false : null,
        naturalizationYears: data.government?.citizenship?.residency_requirement_for_naturalization || null,
        votingAge: data.government?.suffrage?.age || null,
      },
      executiveBranch: data.government?.executive_branch?.chief_of_state || null,
      legislativeBranch: data.government?.legislative_branch?.description || null,
      judicialBranch: data.government?.judicial_branch?.highest_courts || null,
    },

    // ========================================================================
    // 6. INFRASTRUCTURE & MILITARY
    // ========================================================================
    infrastructure: {
      electricityAccess: data.energy?.electricity?.access?.total_electrification?.value || null,
      electricitySources: {
        fossil: data.energy?.electricity?.by_source?.fossil_fuels?.percent || null,
        hydro: data.energy?.electricity?.by_source?.hydroelectric_plants?.percent || null,
        nuclear: data.energy?.electricity?.by_source?.nuclear_fuels?.percent || null,
        renewable: data.energy?.electricity?.by_source?.other_renewable_sources?.percent || null,
      },
      internetUsersPercent: data.communications?.internet?.users?.percent_of_population || null,
      roadwaysKm: data.transportation?.roadways?.total?.value || null,
      waterwaysKm: data.transportation?.waterways?.value || null,
      airportsTotal: data.transportation?.air_transport?.airports?.total?.airports || null,
    },

    military: {
      expenditures: getLatestValue(data.military_and_security?.expenditures?.annual_values),
      serviceAgeAndObligation: { // <--- ĐÃ SỬA: Lấy cả year và note
        years: data.military_and_security?.service_age_and_obligation?.years_of_age || null,
        note: data.military_and_security?.service_age_and_obligation?.note || null
      },
      transnationalIssues: data.transnational_issues?.disputes || [],
    },

    // ========================================================================
    // 7. GEMINI CACHE (Khởi tạo rỗng để tránh lỗi missing props)
    // ========================================================================
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
    mustVisitPlaces: [],

    isAiGenerated: false
  };
}

export function mergePalestineCiaData(wbMapped: Partial<ICountryDetail>, gzMapped: Partial<ICountryDetail>): Partial<ICountryDetail> {
  // Lấy West Bank làm gốc (vì Ramallah là trung tâm hành chính)
  const merged: Partial<ICountryDetail> = { ...wbMapped, iso2: 'PS' };

  // 1. Gộp Core
  merged.introduction = `The State of Palestine comprises two distinct territories.\n\nWest Bank: ${wbMapped.introduction || 'No data.'}\n\nGaza Strip: ${gzMapped.introduction || 'No data.'}`;

  // 2. Gộp Địa lý (Cộng dồn số liệu)
  if (merged.geography) {
    merged.geography.coastlineKm = (wbMapped.geography?.coastlineKm || 0) + (gzMapped.geography?.coastlineKm || 0);
    
    if (merged.geography.landBoundaries) {
      merged.geography.landBoundaries.totalKm = (wbMapped.geography?.landBoundaries?.totalKm || 0) + (gzMapped.geography?.landBoundaries?.totalKm || 0);
      merged.geography.landBoundaries.borderCountries = [
        ...(wbMapped.geography?.landBoundaries?.borderCountries || []),
        ...(gzMapped.geography?.landBoundaries?.borderCountries || [])
      ];
    }
  }

  // 3. Gộp Dân cư (Gộp các thành phố lớn)
  if (merged.demographics) {
    merged.demographics.majorUrbanAreas = [
      ...(wbMapped.demographics?.majorUrbanAreas || []),
      ...(gzMapped.demographics?.majorUrbanAreas || [])
    ].sort((a, b) => b.population - a.population); // Sắp xếp từ đông dân nhất
  }

  // 4. Gộp Kinh tế
  if (merged.economy) {
    merged.economy.overview = `The economy is divided into two separate regions.\n\nWest Bank: ${wbMapped.economy?.overview || 'No data.'}\n\nGaza Strip: ${gzMapped.economy?.overview || 'No data.'}`;
  }

  return merged;
}