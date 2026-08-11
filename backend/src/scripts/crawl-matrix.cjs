const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const countries = require('i18n-iso-countries');

countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

// 🔹 199 Mã ISO đích chuẩn theo Passport Index anh yêu cầu
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

// Danh sách 199 Hộ chiếu gốc
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

function getIsoCode(countryName) {
    let name = countryName.replace(/\[.*?\]/g, '').replace(/ and territories/i, '').trim();
    const overrides = {
        "North Korea": "KP", "South Korea": "KR", "People's Republic of China": "CN",
        "China": "CN", "Republic of the Congo": "CG", "Democratic Republic of the Congo": "CD",
        "Gambia": "GM", "The Gambia": "GM", "Ivory Coast": "CI", "Côte d'Ivoire": "CI",
        "Eswatini": "SZ", "Micronesia": "FM", "Palestine": "PS", "Vatican City": "VA",
        "United States": "US", "United Kingdom": "GB", "São Tomé and Príncipe": "ST",
        "United Kingdom and Crown dependencies": "GB"
    };
    if (overrides[name]) return overrides[name];
    let code = countries.getAlpha2Code(name, 'en');
    return code || name;
}

function parsePassportIndexStatus(requirementText, durationText) {
    let text = (requirementText + ' ' + durationText).toLowerCase();
    if (text.includes('not required') || text.includes('freedom') || text.includes('free visa')) {
        let match = text.match(/(\d+)\s*(days|months|weeks)/);
        if (match) {
            if (match[2] === 'months') return (parseInt(match[1]) * 30).toString();
            if (match[2] === 'weeks') return (parseInt(match[1]) * 7).toString();
            return match[1];
        }
        return 'visa free';
    }
    if (text.includes('on arrival') || text.includes('e-voa')) return 'visa on arrival';
    if (text.includes('evisa') || text.includes('e-visa') || text.includes('electronic visa')) return 'e-visa';
    if (text.includes('eta') || text.includes('electronic travel')) return 'eta';
    if (text.includes('refused') || text.includes('banned') || text.includes('no admission')) return 'no admission';
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
        console.log(`⏳ Đang cào và phân tích Hộ chiếu: ${src.wikiName} (${src.iso})...`);
        let url = '';
        if (src.wikiName.toLowerCase().includes('citizens')) {
            url = `https://en.wikipedia.org/wiki/Visa_requirements_for_${src.wikiName}`;
        } else {
            url = `https://en.wikipedia.org/wiki/Visa_requirements_for_${src.wikiName}_citizens`;
        }

        // 🔹 Đã sửa lỗi: Khởi tạo biến lưu tạm để check trùng
        matrix[src.iso] = {};
        let seenDestinations = new Set(); 

        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(response.data);

            $('table.wikitable.sortable tbody tr').each((index, element) => {
                const tds = $(element).find('td');
                const ths = $(element).find('th');
                
                let destCountry = $(ths).text().trim().replace(/\[.*?\]/g, ''); 
                if (!destCountry && tds.length > 0) destCountry = $(tds[0]).text().trim().replace(/\[.*?\]/g, '');

                if (destCountry && tds.length >= 2) {
                    let destIso = getIsoCode(destCountry);
                    
                    // 🔹 Đã sửa lỗi: Dùng seenDestinations để chặn lặp thay vì check trực tiếp vào object ma trận chưa sinh ra
                    if (destIso && targetIsos.includes(destIso) && !seenDestinations.has(destIso)) {
                        seenDestinations.add(destIso); // Đánh dấu đã thấy mã này
                        
                        let reqText = $(tds).length >= 4 ? $(tds[1]).text() : $(tds[0]).text();
                        if($(tds[0]).text().includes(destCountry)) reqText = $(tds[1]).text();
                        
                        let durationText = $(tds).length >= 3 ? $(tds[2]).text() : '';

                        let baseStatus = parsePassportIndexStatus(reqText, durationText);

                        let noteCol = $(tds).length >= 4 ? tds[3] : null;
                        let notesArr = [];
                        if (noteCol) {
                            $(noteCol).find('li').each((i, li) => {
                                notesArr.push($(li).text().trim().replace(/\[.*?\]/g, '').replace(/\s+/g, ' '));
                            });
                            if (notesArr.length === 0) {
                                let rawNote = $(noteCol).text().trim().replace(/\[.*?\]/g, '').replace(/\s+/g, ' ');
                                if (rawNote) notesArr.push(rawNote);
                            }
                        }
                        
                        let finalNotes = notesArr.join('; ');
                        
                        let finalCellValue = baseStatus;
                        if (finalNotes.length > 0) {
                            finalCellValue = `${baseStatus} - "${finalNotes.replace(/"/g, "'")}"`;
                        }

                        matrix[src.iso][destIso] = finalCellValue;
                    }
                }
            });

            matrix[src.iso][src.iso] = '-1';
            
        } catch (error) {
            console.error(`❌ Lỗi ở hộ chiếu ${src.wikiName}: ${error.message}`);
        }
        
        console.log(`   Đã cào xong ${src.iso}. Đang nghỉ 1 giây...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
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

    fs.writeFileSync('passport_index_199.csv', csvContent, 'utf-8');
    console.log('🎉 XONG! Anh mở file "passport_index_199.csv" để xem thành quả trọn bộ 199 nước nhé!');
}

buildMatrix();