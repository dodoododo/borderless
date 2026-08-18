const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const countries = require('i18n-iso-countries');

countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

const targetIsos = [
    "AD", "AE", "AF", "AG", "AL", "AM", "AO", "AR", "AT", "AU", "AZ", "BA", "BB", "BD", "BE", "BF",
    "BG", "BH", "BI", "BJ", "BN", "BO", "BR", "BS", "BT", "BW", "BY", "BZ", "CA", "CD", "CF", "CG",
    "CH", "CI", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO",
    "DZ", "EC", "EE", "EG", "ER", "ES", "ET", "FI", "FJ", "FM", "FR", "GA", "GB", "GD", "GE", "GH",
    "GM", "GN", "GQ", "GR", "GT", "GW", "GY", "HK", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IN",
    "IQ", "IR", "IS", "IT", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW",
    "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME",
    "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MR", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
    "NE", "NG", "NI", "NL", "NO", "NP", "NR", "NZ", "OM", "PA", "PE", "PG", "PH", "PK", "PL", "PS",
    "PT", "PW", "PY", "QA", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SI", "SK",
    "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SY", "SZ", "TD", "TG", "TH", "TJ", "TL", "TM",
    "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "US", "UY", "UZ", "VA", "VC", "VE", "VN",
    "VU", "WS", "XK", "YE", "ZA", "ZM", "ZW"
];


const sourcePassports = [
    { iso: 'AD', wikiName: 'Andorran' }, { iso: 'AE', wikiName: 'Emirati' }, { iso: 'AF', wikiName: 'Afghan' },
    { iso: 'AG', wikiName: 'Antigua_and_Barbuda' }, { iso: 'AL', wikiName: 'Albanian' }, { iso: 'AM', wikiName: 'Armenian' },
    { iso: 'AO', wikiName: 'Angolan' }, { iso: 'AR', wikiName: 'Argentine' }, { iso: 'AT', wikiName: 'Austrian' },
    { iso: 'AU', wikiName: 'Australian' }, { iso: 'AZ', wikiName: 'Azerbaijani' }, { iso: 'BA', wikiName: 'Bosnia_and_Herzegovina' },
    { iso: 'BB', wikiName: 'Barbadian' }, { iso: 'BD', wikiName: 'Bangladeshi' }, { iso: 'BE', wikiName: 'Belgian' },
    { iso: 'BF', wikiName: 'Burkinabe' }, { iso: 'BG', wikiName: 'Bulgarian' }, { iso: 'BH', wikiName: 'Bahraini' },
    { iso: 'BI', wikiName: 'Burundian' }, { iso: 'BJ', wikiName: 'Beninese' }, { iso: 'BN', wikiName: 'Bruneian' },
    { iso: 'BO', wikiName: 'Bolivian' }, { iso: 'BR', wikiName: 'Brazilian' }, { iso: 'BS', wikiName: 'Bahamian' },
    { iso: 'BT', wikiName: 'Bhutanese' }, { iso: 'BW', wikiName: 'Botswana' }, { iso: 'BY', wikiName: 'Belarusian' },
    { iso: 'BZ', wikiName: 'Belizean' }, { iso: 'CA', wikiName: 'Canadian' }, { iso: 'CD', wikiName: 'Democratic_Republic_of_the_Congo' },
    { iso: 'CF', wikiName: 'Central_African' }, { iso: 'CG', wikiName: 'Republic_of_the_Congo' }, { iso: 'CH', wikiName: 'Swiss' },
    { iso: 'CI', wikiName: 'Ivorian' }, { iso: 'CL', wikiName: 'Chilean' }, { iso: 'CM', wikiName: 'Cameroonian' },
    { iso: 'CN', wikiName: 'Chinese' }, { iso: 'CO', wikiName: 'Colombian' }, { iso: 'CR', wikiName: 'Costa_Rican' },
    { iso: 'CU', wikiName: 'Cuban' }, { iso: 'CV', wikiName: 'Cape_Verdean' }, { iso: 'CY', wikiName: 'Cypriot' },
    { iso: 'CZ', wikiName: 'Czech' }, { iso: 'DE', wikiName: 'German' }, { iso: 'DJ', wikiName: 'Djiboutian' },
    { iso: 'DK', wikiName: 'Danish' }, { iso: 'DM', wikiName: 'Dominica' }, { iso: 'DO', wikiName: 'Dominican_Republic' },
    { iso: 'DZ', wikiName: 'Algerian' }, { iso: 'EC', wikiName: 'Ecuadorian' }, { iso: 'EE', wikiName: 'Estonian' },
    { iso: 'EG', wikiName: 'Egyptian' }, { iso: 'ER', wikiName: 'Eritrean' }, { iso: 'ES', wikiName: 'Spanish' },
    { iso: 'ET', wikiName: 'Ethiopian' }, { iso: 'FI', wikiName: 'Finnish' }, { iso: 'FJ', wikiName: 'Fijian' },
    { iso: 'FM', wikiName: 'Micronesian' }, { iso: 'FR', wikiName: 'French' }, { iso: 'GA', wikiName: 'Gabonese' },
    { iso: 'GB', wikiName: 'British' }, { iso: 'GD', wikiName: 'Grenadian' }, { iso: 'GE', wikiName: 'Georgian' },
    { iso: 'GH', wikiName: 'Ghanaian' }, { iso: 'GM', wikiName: 'Gambian' }, { iso: 'GN', wikiName: 'Guinean' },
    { iso: 'GQ', wikiName: 'Equatorial_Guinean' }, { iso: 'GR', wikiName: 'Greek' }, { iso: 'GT', wikiName: 'Guatemalan' },
    { iso: 'GW', wikiName: 'Guinea-Bissauan' }, { iso: 'GY', wikiName: 'Guyanese' }, { iso: 'HK', wikiName: 'Chinese_citizens_of_Hong_Kong' },
    { iso: 'HN', wikiName: 'Honduran' }, { iso: 'HR', wikiName: 'Croatian' }, { iso: 'HT', wikiName: 'Haitian' },
    { iso: 'HU', wikiName: 'Hungarian' }, { iso: 'ID', wikiName: 'Indonesian' }, { iso: 'IE', wikiName: 'Irish' },
    { iso: 'IL', wikiName: 'Israeli' }, { iso: 'IN', wikiName: 'Indian' }, { iso: 'IQ', wikiName: 'Iraqi' },
    { iso: 'IR', wikiName: 'Iranian' }, { iso: 'IS', wikiName: 'Icelandic' }, { iso: 'IT', wikiName: 'Italian' },
    { iso: 'JM', wikiName: 'Jamaican' }, { iso: 'JO', wikiName: 'Jordanian' }, { iso: 'JP', wikiName: 'Japanese' },
    { iso: 'KE', wikiName: 'Kenyan' }, { iso: 'KG', wikiName: 'Kyrgyzstani' }, { iso: 'KH', wikiName: 'Cambodian' },
    { iso: 'KI', wikiName: 'Kiribati' }, { iso: 'KM', wikiName: 'Comorian' }, { iso: 'KN', wikiName: 'Saint_Kitts_and_Nevis' },
    { iso: 'KP', wikiName: 'North_Korean' }, { iso: 'KR', wikiName: 'South_Korean' }, { iso: 'KW', wikiName: 'Kuwaiti' },
    { iso: 'KZ', wikiName: 'Kazakhstani' }, { iso: 'LA', wikiName: 'Laotian' }, { iso: 'LB', wikiName: 'Lebanese' },
    { iso: 'LC', wikiName: 'Saint_Lucian' }, { iso: 'LI', wikiName: 'Liechtenstein' }, { iso: 'LK', wikiName: 'Sri_Lankan' },
    { iso: 'LR', wikiName: 'Liberian' }, { iso: 'LS', wikiName: 'Lesotho' }, { iso: 'LT', wikiName: 'Lithuanian' },
    { iso: 'LU', wikiName: 'Luxembourgish' }, { iso: 'LV', wikiName: 'Latvian' }, { iso: 'LY', wikiName: 'Libyan' },
    { iso: 'MA', wikiName: 'Moroccan' }, { iso: 'MC', wikiName: 'Monégasque' }, { iso: 'MD', wikiName: 'Moldovan' },
    { iso: 'ME', wikiName: 'Montenegrin' }, { iso: 'MG', wikiName: 'Malagasy' }, { iso: 'MH', wikiName: 'Marshall_Islands' },
    { iso: 'MK', wikiName: 'citizens_of_North_Macedonia' }, { iso: 'ML', wikiName: 'Malian' }, { iso: 'MM', wikiName: 'Myanmar' },
    { iso: 'MN', wikiName: 'Mongolian' }, { iso: 'MO', wikiName: 'Chinese_citizens_of_Macau' }, { iso: 'MR', wikiName: 'Mauritanian' },
    { iso: 'MT', wikiName: 'Maltese' }, { iso: 'MU', wikiName: 'Mauritian' }, { iso: 'MV', wikiName: 'Maldivian' },
    { iso: 'MW', wikiName: 'Malawian' }, { iso: 'MX', wikiName: 'Mexican' }, { iso: 'MY', wikiName: 'Malaysian' },
    { iso: 'MZ', wikiName: 'Mozambican' }, { iso: 'NA', wikiName: 'Namibian' }, { iso: 'NE', wikiName: 'Nigerien' },
    { iso: 'NG', wikiName: 'Nigerian' }, { iso: 'NI', wikiName: 'Nicaraguan' }, { iso: 'NL', wikiName: 'Dutch' },
    { iso: 'NO', wikiName: 'Norwegian' }, { iso: 'NP', wikiName: 'Nepalese' }, { iso: 'NR', wikiName: 'Nauruan' },
    { iso: 'NZ', wikiName: 'New_Zealand' }, { iso: 'OM', wikiName: 'Omani' }, { iso: 'PA', wikiName: 'Panamanian' },
    { iso: 'PE', wikiName: 'Peruvian' }, { iso: 'PG', wikiName: 'Papua_New_Guinean' }, { iso: 'PH', wikiName: 'Philippine' },
    { iso: 'PK', wikiName: 'Pakistani' }, { iso: 'PL', wikiName: 'Polish' }, { iso: 'PS', wikiName: 'Palestinian' },
    { iso: 'PT', wikiName: 'Portuguese' }, { iso: 'PW', wikiName: 'Palauan' }, { iso: 'PY', wikiName: 'Paraguayan' },
    { iso: 'QA', wikiName: 'Qatari' }, { iso: 'RO', wikiName: 'Romanian' }, { iso: 'RS', wikiName: 'Serbian' },
    { iso: 'RU', wikiName: 'Russian' }, { iso: 'RW', wikiName: 'Rwandan' }, { iso: 'SA', wikiName: 'Saudi' },
    { iso: 'SB', wikiName: 'Solomon_Islands' }, { iso: 'SC', wikiName: 'Seychellois' }, { iso: 'SD', wikiName: 'Sudanese' },
    { iso: 'SE', wikiName: 'Swedish' }, { iso: 'SG', wikiName: 'Singapore' }, { iso: 'SI', wikiName: 'Slovenian' },
    { iso: 'SK', wikiName: 'Slovak' }, { iso: 'SL', wikiName: 'Sierra_Leonean' }, { iso: 'SM', wikiName: 'Sammarinese' },
    { iso: 'SN', wikiName: 'Senegalese' }, { iso: 'SO', wikiName: 'Somali' }, { iso: 'SR', wikiName: 'Surinamese' },
    { iso: 'SS', wikiName: 'South_Sudanese' }, { iso: 'ST', wikiName: 'Santomean' }, { iso: 'SV', wikiName: 'Salvadoran' },
    { iso: 'SY', wikiName: 'Syrian' }, { iso: 'SZ', wikiName: 'Swazi' }, { iso: 'TD', wikiName: 'Chadian' },
    { iso: 'TG', wikiName: 'Togolese' }, { iso: 'TH', wikiName: 'Thai' }, { iso: 'TJ', wikiName: 'Tajikistani' },
    { iso: 'TL', wikiName: 'East_Timorese' }, { iso: 'TM', wikiName: 'Turkmenistani' }, { iso: 'TN', wikiName: 'Tunisian' },
    { iso: 'TO', wikiName: 'Tongan' }, { iso: 'TR', wikiName: 'Turkish' }, { iso: 'TT', wikiName: 'Trinidad_and_Tobago' },
    { iso: 'TV', wikiName: 'Tuvaluan' }, { iso: 'TW', wikiName: 'Taiwanese' }, { iso: 'TZ', wikiName: 'Tanzanian' },
    { iso: 'UA', wikiName: 'Ukrainian' }, { iso: 'UG', wikiName: 'Ugandan' }, { iso: 'US', wikiName: 'United_States' },
    { iso: 'UY', wikiName: 'Uruguayan' }, { iso: 'UZ', wikiName: 'Uzbekistani' }, { iso: 'VA', wikiName: 'Vatican' },
    { iso: 'VC', wikiName: 'Saint_Vincent_and_the_Grenadines' }, { iso: 'VE', wikiName: 'Venezuelan' }, { iso: 'VN', wikiName: 'Vietnamese' },
    { iso: 'VU', wikiName: 'Vanuatu' }, { iso: 'WS', wikiName: 'Samoan' }, { iso: 'XK', wikiName: 'Kosovar' },
    { iso: 'YE', wikiName: 'Yemeni' }, { iso: 'ZA', wikiName: 'South_African' }, { iso: 'ZM', wikiName: 'Zambian' },
    { iso: 'ZW', wikiName: 'Zimbabwean' }
];
function getIsoCode(rawName) {
    if (!rawName) return null;
    let name = rawName.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/ and territories/i, '').trim();
    let lowerName = name.toLowerCase();

    // 🚀 Đã nâng cấp các vùng lãnh thổ tranh chấp
    const overrides = {
        "north korea": "KP", "south korea": "KR", "republic of korea": "KR", "democratic people's republic of korea": "KP",
        "china": "CN", "people's republic of china": "CN", "pr china": "CN",
        "republic of the congo": "CG", "congo": "CG",
        "democratic republic of the congo": "CD", "dr congo": "CD",
        "gambia": "GM", "the gambia": "GM",
        "ivory coast": "CI", "côte d'ivoire": "CI", "cote d'ivoire": "CI",
        "eswatini": "SZ", "swaziland": "SZ",
        "micronesia": "FM", "federated states of micronesia": "FM",
        "palestine": "PS", "state of palestine": "PS",
        "kosovo": "XK", "republic of kosovo": "XK",
        "vatican city": "VA", "holy see": "VA",
        "united states": "US", "united states of america": "US",
        "united kingdom": "GB", "united kingdom and crown dependencies": "GB",
        "são tomé and príncipe": "ST", "sao tome and principe": "ST",
        "bahamas": "BS", "the bahamas": "BS",
        "türkiye": "TR", "turkey": "TR",
        "czechia": "CZ", "czech republic": "CZ",
        "north macedonia": "MK", "macedonia": "MK",
        "brunei": "BN", "brunei darussalam": "BN",
        "cape verde": "CV", "cabo verde": "CV",
        "georgia": "GE",
        "ireland": "IE", "republic of ireland": "IE",
        "russia": "RU", "russian federation": "RU",
        "syria": "SY", "syrian arab republic": "SY",
        "venezuela": "VE",
        "bolivia": "BO",
        "vietnam": "VN", "viet nam": "VN",
        "iran": "IR", "iran (islamic republic of)": "IR",
        "tanzania": "TZ", "united republic of tanzania": "TZ",
        "moldova": "MD", "republic of moldova": "MD",
        "laos": "LA", "lao people's democratic republic": "LA",
        "taiwan": "TW", "republic of china (taiwan)": "TW", 
        "macau": "MO", "macao": "MO", 
        "hong kong": "HK", "hong kong sar": "HK",
        "netherlands": "NL", "uae": "AE", "united arab emirates": "AE",
        "antigua and barbuda": "AG", "saint kitts and nevis": "KN", "st. kitts and nevis": "KN",
        "saint lucia": "LC", "st. lucia": "LC",
        "saint vincent and the grenadines": "VC", "st. vincent and the grenadines": "VC",
        "sri lanka": "LK", "philippines": "PH", "haiti": "HT", "singapore": "SG"
    };

    if (overrides[lowerName]) return overrides[lowerName];
    let code = countries.getAlpha2Code(name, 'en');
    return code || null;
}

function parsePassportIndexStatus(reqText, stayText) {
    let req = reqText.replace(/\[.*?\]/g, '').trim().toLowerCase();
    let stay = stayText.replace(/\[.*?\]/g, '').trim().toLowerCase();
    let text = (req + ' ' + stay).replace(/\s+/g, ' ');

    if (text.includes('refused') || text.includes('banned') || text.includes('no admission') || text.includes('suspended') || text.includes('restricted') || text.includes('admission refused')) return 'no admission';

    if (req.includes('not required') || req.includes('freedom') || req.includes('free visa') || req.includes('visa-free') || req.includes('free entry') || req.includes('waiver')) {
        let match = text.match(/(\d+)\s*(day|month|week|year)/i);
        if (match) {
            let num = parseInt(match[1]);
            let unit = match[2].toLowerCase();
            if (unit === 'month') return (num * 30).toString();
            if (unit === 'week') return (num * 7).toString();
            if (unit === 'year') return (num * 365).toString();
            return num.toString();
        }
        return 'visa free';
    }

    if (req.includes('on arrival') || req.includes('voa') || req.includes('e-voa')) return 'visa on arrival';
    if (req.includes('eta') || req.includes('electronic travel') || req.includes('electronic border') || req.includes('esta') || req.includes('k-eta') || req.includes('eve')) return 'eta';
    if (req.includes('evisa') || req.includes('e-visa') || req.includes('electronic visa') || req.includes('online visa') || req.includes('apply online') || req.includes('smart service') || req.includes('e-tourist')) return 'e-visa';

    return 'visa required';
}

function escapeCSV(str) {
    if (!str) return '';
    let stringValue = String(str);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    return stringValue;
}

async function buildMatrix() {
    let matrix = {};

    for (let src of sourcePassports) {
        console.log(`⏳ Đang cào Hộ chiếu: ${src.wikiName} (${src.iso})...`);
        let url = src.wikiName.toLowerCase().includes('citizens') 
            ? `https://en.wikipedia.org/wiki/Visa_requirements_for_${src.wikiName}` 
            : `https://en.wikipedia.org/wiki/Visa_requirements_for_${src.wikiName}_citizens`;

        matrix[src.iso] = {};
        let seenDestinations = new Set(); 

        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            const $ = cheerio.load(response.data);

            $('table.wikitable').each((tableIdx, table) => {
                let countryIdx = -1;
                let visaIdx = -1;
                let stayIdx = -1;
                let noteIdx = -1;

                // 🚀 Quét 3 dòng đầu để bắt dính mọi loại từ vựng Header
                $(table).find('tr').slice(0, 3).each((rowIndex, tr) => {
                    if (countryIdx !== -1 && visaIdx !== -1) return;
                    
                    $(tr).find('th, td').each((i, th) => {
                        let txt = $(th).text().toLowerCase().trim();
                        // 🔹 Đã bổ sung chữ "Visitor to" để "vợt" trọn Bảng Territories
                        if (txt.includes('country') || txt.includes('territory') || txt.includes('region') || txt.includes('destination') || txt.includes('visitor to')) countryIdx = i;
                        else if (txt.includes('visa') || txt.includes('entry') || txt.includes('requirement')) visaIdx = i;
                        else if (txt.includes('stay') || txt.includes('time') || txt.includes('duration') || txt.includes('period')) stayIdx = i;
                        else if (txt.includes('note') || txt.includes('condition')) noteIdx = i;
                    });
                });

                if (countryIdx === -1 || visaIdx === -1) return;

                let grid = [];
                $(table).find('tbody tr').each((rowIndex, tr) => {
                    grid[rowIndex] = grid[rowIndex] || [];
                    let colIndex = 0;
                    
                    $(tr).find('th, td').each((i, cell) => {
                        while (grid[rowIndex][colIndex] !== undefined) colIndex++;
                        
                        let $cell = $(cell);
                        $cell.find('span[style*="display:none"], span[style*="display: none"]').remove();
                        $cell.find('sup.reference').remove();
                        
                        let text = "";
                        let lis = $cell.find('li');
                        if (lis.length > 0) {
                            let notesArr = [];
                            lis.each((_, li) => {
                                let t = $(li).text().trim().replace(/\s+/g, ' ');
                                if (t) notesArr.push(t);
                            });
                            text = notesArr.join('; ').replace(/"/g, "'");
                        } else {
                            text = $cell.text().trim().replace(/\s+/g, ' ').replace(/"/g, "'");
                        }
                        
                        let rowspan = parseInt($cell.attr('rowspan')) || 1;
                        let colspan = parseInt($cell.attr('colspan')) || 1;
                        
                        for (let r = 0; r < rowspan; r++) {
                            for (let c = 0; c < colspan; c++) {
                                grid[rowIndex + r] = grid[rowIndex + r] || [];
                                grid[rowIndex + r][colIndex + c] = text;
                            }
                        }
                    });
                });

                grid.forEach(row => {
                    if (!row || row.length < 2) return;
                    
                    let destCountry = row[countryIdx] ? row[countryIdx].replace(/\[.*?\]/g, '').trim() : "";
                    let destIso = getIsoCode(destCountry);

                    if (!destIso && row[countryIdx + 1]) {
                        destCountry = row[countryIdx + 1].replace(/\[.*?\]/g, '').trim();
                        destIso = getIsoCode(destCountry);
                    }

                    if (destIso && targetIsos.includes(destIso) && !seenDestinations.has(destIso)) {
                        seenDestinations.add(destIso);

                        let reqText = row[visaIdx] || "";
                        let stayText = stayIdx !== -1 ? (row[stayIdx] || "") : "";
                        let noteText = noteIdx !== -1 ? (row[noteIdx] || "") : "";

                        let cleanStay = stayText.replace(/[✓✔√]/g, '').trim();
                        let cleanNote = noteText.replace(/[✓✔√]/g, '').trim();
                        if (['yes', 'no', 'x', 'none'].includes(cleanNote.toLowerCase())) cleanNote = "";

                        let baseStatus = parsePassportIndexStatus(reqText, cleanStay);

                        let combinedNote = "";
                        if (!isNaN(parseInt(baseStatus))) {
                            combinedNote = cleanNote;
                        } else {
                            if (cleanStay && cleanNote && cleanStay.toLowerCase() !== cleanNote.toLowerCase()) {
                                combinedNote = `${cleanStay}; ${cleanNote}`;
                            } else if (cleanNote) {
                                combinedNote = cleanNote;
                            } else if (cleanStay) {
                                combinedNote = cleanStay;
                            }
                        }

                        if (combinedNote.toLowerCase() === reqText.toLowerCase()) combinedNote = "";

                        let finalCellValue = baseStatus;
                        if (combinedNote.length > 0) {
                            finalCellValue = `${baseStatus} - "${combinedNote}"`;
                        }

                        matrix[src.iso][destIso] = finalCellValue;
                    }
                });
            });

            matrix[src.iso][src.iso] = '-1';
            
        } catch (error) {
            console.error(`❌ Lỗi ở hộ chiếu ${src.wikiName}: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n⚙️ Đang ráp ma trận CSV... (Những nước không có trong bảng sẽ mặc định là "visa required")`);
    
    let csvContent = 'Passport,' + targetIsos.join(',') + '\n';

    for (let src of sourcePassports) {
        let row = [src.iso];
        for (let dest of targetIsos) {
            let status = matrix[src.iso][dest];
            // 🚀 Bất kỳ vùng lãnh thổ nào không cào được từ Wiki sẽ rơi thẳng vào "visa required"
            row.push(escapeCSV(status ? status : 'visa required')); 
        }
        csvContent += row.join(',') + '\n';
    }

    fs.writeFileSync('passport_index_my_test.csv', csvContent, 'utf-8');
    console.log('🎉 XONG! Vùng lãnh thổ tranh chấp đã bị càn quét sạch sẽ!');
}

buildMatrix();