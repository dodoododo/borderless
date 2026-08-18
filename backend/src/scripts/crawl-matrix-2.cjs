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
    { iso: 'CA', wikiName: 'Canadian' },
];

function getIsoCode(rawName) {
    if (!rawName) return null;
    let name = rawName.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/ and territories/i, '').trim();
    let lowerName = name.toLowerCase();

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
        "taiwan": "TW", "macau": "MO", "hong kong": "HK",
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

                // 🚀 QUÉT 3 DÒNG ĐẦU TIÊN ĐỂ TÌM HEADER (Phòng hờ bảng có dòng Title hoặc đổi tên cột)
                $(table).find('tr').slice(0, 3).each((rowIndex, tr) => {
                    if (countryIdx !== -1 && visaIdx !== -1) return; // Đã tìm thấy thì dừng
                    
                    $(tr).find('th, td').each((i, th) => {
                        let txt = $(th).text().toLowerCase().trim();
                        // Mở rộng bộ từ khóa nhận diện Cột
                        if (txt.includes('country') || txt.includes('territory') || txt.includes('region') || txt.includes('destination')) countryIdx = i;
                        else if (txt.includes('visa') || txt.includes('entry') || txt.includes('requirement')) visaIdx = i;
                        else if (txt.includes('stay') || txt.includes('time') || txt.includes('duration') || txt.includes('period')) stayIdx = i;
                        else if (txt.includes('note') || txt.includes('condition')) noteIdx = i;
                    });
                });

                // Nếu không tìm thấy cột Tên nước hoặc Trạng thái -> Bỏ qua bảng rác
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

                    // Xử lý lệch cột nếu Wikipedia chèn Cờ vào cột đầu tiên
                    if (!destIso && row[countryIdx + 1]) {
                        destCountry = row[countryIdx + 1].replace(/\[.*?\]/g, '').trim();
                        destIso = getIsoCode(destCountry);
                    }

                    if (destIso && targetIsos.includes(destIso) && !seenDestinations.has(destIso)) {
                        seenDestinations.add(destIso);

                        let reqText = row[visaIdx] || "";
                        let stayText = stayIdx !== -1 ? (row[stayIdx] || "") : "";
                        let noteText = noteIdx !== -1 ? (row[noteIdx] || "") : "";

                        // Làm sạch các dấu ✓, ✔, Yes, No
                        let cleanStay = stayText.replace(/[✓✔√]/g, '').trim();
                        let cleanNote = noteText.replace(/[✓✔√]/g, '').trim();
                        if (['yes', 'no', 'x', 'none'].includes(cleanNote.toLowerCase())) cleanNote = "";

                        // Bóc tách Base Status
                        let baseStatus = parsePassportIndexStatus(reqText, cleanStay);

                        // Gộp Chuỗi Note không trùng lặp
                        let combinedNote = "";
                        
                        // Nếu là Visa Free (trả về số) -> Cất nguyên cái Note
                        if (!isNaN(parseInt(baseStatus))) {
                            combinedNote = cleanNote;
                        } 
                        // Nếu là e-Visa/ETA/VOA -> Nhét thêm cột Stay vào Note
                        else {
                            if (cleanStay && cleanNote && cleanStay.toLowerCase() !== cleanNote.toLowerCase()) {
                                combinedNote = `${cleanStay}; ${cleanNote}`;
                            } else if (cleanNote) {
                                combinedNote = cleanNote;
                            } else if (cleanStay) {
                                combinedNote = cleanStay;
                            }
                        }

                        // Chống lặp Note bị lọt vào cột trạng thái
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

    console.log(`\n⚙️ Đang ráp ma trận CSV...`);
    
    let csvContent = 'Passport,' + targetIsos.join(',') + '\n';

    for (let src of sourcePassports) {
        let row = [src.iso];
        for (let dest of targetIsos) {
            let status = matrix[src.iso][dest];
            row.push(escapeCSV(status ? status : 'visa required')); 
        }
        csvContent += row.join(',') + '\n';
    }

    fs.writeFileSync('passport_index_199_v3.csv', csvContent, 'utf-8');
    console.log('🎉 XONG BẢN V3 TỐI THƯỢNG! Hãy test lại bằng file này nhé anh!');
}

buildMatrix();