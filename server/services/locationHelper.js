const countriesData = require('./countries.json');

// Bölgeleri ve o bölgelerdeki ülkelerin ISO kodlarını tanımla
const regions = {
    europe: ['ALB', 'AND', 'AUT', 'BLR', 'BEL', 'BIH', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA', 'DEU', 'GIB', 'GRC', 'HUN', 'ISL', 'IRL', 'ITA', 'LVA', 'LIE', 'LTU', 'LUX', 'MKD', 'MLT', 'MDA', 'MCO', 'NLD', 'NOR', 'POL', 'PRT', 'ROU', 'RUS', 'SMR', 'SRB', 'SVK', 'SVN', 'ESP', 'SWE', 'CHE', 'UKR', 'GBR'],
    asia: ['AFG', 'ARM', 'AZE', 'BHR', 'BGD', 'BTN', 'BRN', 'KHM', 'CHN', 'GEO', 'HKG', 'IND', 'IDN', 'IRN', 'IRQ', 'ISR', 'JPN', 'JOR', 'KAZ', 'KWT', 'KGZ', 'LAO', 'LBN', 'MAC', 'MYS', 'MNG', 'MMR', 'NPL', 'OMN', 'PAK', 'PHL', 'QAT', 'SAU', 'SGP', 'KOR', 'LKA', 'SYR', 'TWN', 'TJK', 'THA', 'TUR', 'TKM', 'ARE', 'UZB', 'VNM', 'YEM'],
    africa: ['DZA', 'AGO', 'BEN', 'BWA', 'BFA', 'BDI', 'CMR', 'CPV', 'CAF', 'TCD', 'COM', 'COD', 'COG', 'CIV', 'DJI', 'EGY', 'GNQ', 'ERI', 'ETH', 'GAB', 'GMB', 'GHA', 'GIN', 'GNB', 'KEN', 'LSO', 'LBR', 'LBY', 'MDG', 'MWI', 'MLI', 'MRT', 'MUS', 'MAR', 'MOZ', 'NAM', 'NER', 'NGA', 'RWA', 'STP', 'SEN', 'SLE', 'SOM', 'ZAF', 'SSD', 'SDN', 'SWZ', 'TZA', 'TGO', 'TUN', 'UGA', 'ZMB', 'ZWE'],
    north_america: ['AIA', 'ATG', 'ABW', 'BHS', 'BRB', 'BLZ', 'BMU', 'CAN', 'CYM', 'CRI', 'CUB', 'CUW', 'DMA', 'DOM', 'SLV', 'GRL', 'GRD', 'GLP', 'GTM', 'HTI', 'HND', 'JAM', 'MTQ', 'MEX', 'SPM', 'NIC', 'PAN', 'PRI', 'KNA', 'LCA', 'VCT', 'SXM', 'TTO', 'USA', 'VGB'],
    south_america: ['ARG', 'BOL', 'BRA', 'CHL', 'COL', 'ECU', 'FLK', 'GUF', 'GUY', 'PRY', 'PER', 'SUR', 'URY', 'VEN'],
    oceania: ['ASM', 'AUS', 'FJI', 'PYF', 'GUM', 'KIR', 'MHL', 'FSM', 'NRU', 'NZL', 'MNP', 'PLW', 'PNG', 'WSM', 'SLB', 'TON', 'TUV', 'VUT'],
};

// Her bölge için sınır kutusu verilerini önceden işle
const regionBounds = {};
for (const region in regions) {
    regionBounds[region] = regions[region].map(code => {
        const country = countriesData.find(c => c.country === code);
        return country ? country.bounds : null;
    }).filter(b => b !== null); // Bulunamayanları filtrele
}
const worldBounds = countriesData.map(c => c.bounds);

/**
 * Belirtilen bir bölge veya dünya için rastgele bir coğrafi nokta üretir.
 * @param {string} region - 'world', 'europe' gibi bir bölge adı.
 * @returns {object} Rastgele bir { lat, lng } nesnesi.
 */
const getRandomCoordinate = (region = 'world') => {
    const targetBounds = region === 'world' ? worldBounds : (regionBounds[region] || worldBounds);

    if (targetBounds.length === 0) {
        return { lat: 0, lng: 0 }; // Fallback
    }

    // Bölgeden rastgele bir ülkenin sınır kutusunu seç
    const randomBounds = targetBounds[Math.floor(Math.random() * targetBounds.length)];
    
    // Ülkenin sınır kutusu içinde rastgele bir nokta üret
    // bounds formatı: [[minLat, minLng], [maxLat, maxLng]]
    const [minLat, minLng] = randomBounds[0];
    const [maxLat, maxLng] = randomBounds[1];

    const lat = minLat + (Math.random() * (maxLat - minLat));
    const lng = minLng + (Math.random() * (maxLng - minLng));

    return { lat, lng };
};

module.exports = { getRandomCoordinate };
