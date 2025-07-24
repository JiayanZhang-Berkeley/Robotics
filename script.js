// script.js

// --- CONFIGURATION ---
// (All spreadsheet and API references removed for static deployment)

// Define the columns to show in the main leaderboard.
const COLUMNS_TO_SHOW = [
    "Logo",
    "Company Name",
    "Ranking",
    "Funding Growth Rate ($/day)",
    "Funding Stage",
    "Days Since Last Funding",
    "Last Funding Round ($)",
    "Total Funding ($)",
    "Location",
    "Industries",
    "Description"
];

// --- DOM ELEMENTS ---
const companyCounter = document.getElementById('company-counter');
const leaderboardContainer = document.getElementById('leaderboard-container');
const statisticsContainer = document.getElementById('statistics-container');

// Global Dictionary for Funding Stage Colors (Updated)
const FUNDING_STAGE_COLORS = {
    'Pre-Seed': {
        labelClasses: 'bg-teal-100 text-teal-800',
        hex: '#2dd4bf',
        identifier: 'pre_seed'
    },
    'Seed': {
        labelClasses: 'bg-lime-100 text-lime-800',
        hex: '#84cc16',
        identifier: 'seed'
    },
    'Series A': {
        labelClasses: 'bg-sky-100 text-sky-800',
        hex: '#38bdf8',
        identifier: 'series_a'
    },
    'Series B': {
        labelClasses: 'bg-emerald-100 text-emerald-800',
        hex: '#34d399',
        identifier: 'series_b'
    },
    'Series C': {
        labelClasses: 'bg-amber-100 text-amber-800',
        hex: '#fbbf24',
        identifier: 'series_c'
    },
    'Series D': {
        labelClasses: 'bg-violet-100 text-violet-800',
        hex: '#a78bfa',
        identifier: 'late_stage'
    },
    'Series E': {
        labelClasses: 'bg-violet-100 text-violet-800',
        hex: '#a78bfa',
        identifier: 'late_stage'
    },
    'Series F': {
        labelClasses: 'bg-violet-100 text-violet-800',
        hex: '#a78bfa',
        identifier: 'late_stage'
    },
    'Angel': {
        labelClasses: 'bg-rose-100 text-rose-800',
        hex: '#fb7185',
        identifier: 'early_support'
    },
    'Grant': {
        labelClasses: 'bg-rose-100 text-rose-800',
        hex: '#fb7185',
        identifier: 'early_support'
    },
    'Post-IPO Equity': {
        labelClasses: 'bg-blue-100 text-blue-800',
        hex: '#60a5fa',
        identifier: 'post_ipo'
    },
    'Post-IPO Debt': {
        labelClasses: 'bg-blue-100 text-blue-800',
        hex: '#60a5fa',
        identifier: 'post_ipo'
    },
    'Corporate Round': {
        labelClasses: 'bg-orange-100 text-orange-800',
        hex: '#fb923c',
        identifier: 'corporate'
    },
    'default': {
        labelClasses: 'bg-slate-100 text-slate-700',
        hex: '#cbd5e1',
        identifier: 'other'
    }
};
const FUNDING_STAGE_IDENTIFIERS = {
    pre_seed: 'Pre-Seed',
    seed: 'Seed',
    series_a: 'Series A',
    series_b: 'Series B',
    series_c: 'Series C',
    late_stage: 'Late Stage (D+)',
    early_support: 'Angel / Grant',
    post_ipo: 'Post-IPO',
    corporate: 'Corporate Round',
    other: 'Other and Undisclosed'
};

// --- FUNCTIONS ---
/**
 * Creates and populates a randomized, rolling stock market-style ticker.
 * @param {Array<object>} companies - The processed leaderboard data.
 * @param {number} [speedInSeconds=120] - The time for one full scroll loop. A larger number is slower.
 */
function createRankingTicker(companies, speedInSeconds = 360) {
    const tickerTrack = document.querySelector('.ticker-track');
    if (!tickerTrack) return;

    // --- 1. Set Tunable Speed ---
    // This dynamically sets the animation duration defined in your CSS.
    tickerTrack.style.animationDuration = `${speedInSeconds}s`;

    // --- 2. Randomize Company Order ---
    const topCompanies = companies.slice(0, 50);
    // Create a copy of the array to shuffle, leaving the original data intact.
    const shuffledCompanies = [...topCompanies];

    // Fisher-Yates shuffle algorithm for a true random order.
    for (let i = shuffledCompanies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledCompanies[i], shuffledCompanies[j]] = [shuffledCompanies[j], shuffledCompanies[i]];
    }

    // --- 3. Build the Ticker HTML ---
    const rankIndex = COLUMNS_TO_SHOW.indexOf('Ranking');
    const nameIndex = COLUMNS_TO_SHOW.indexOf('Company Name');
    let tickerHtml = '';

    // Loop through the NEW shuffled list of companies.
    shuffledCompanies.forEach(company => {
        const rank = company.cells[rankIndex];
        const name = company.cells[nameIndex];
        const change = parseInt(company.rankChange, 10);
        let changeHtml = '';

        if (!isNaN(change) && change !== 0) {
            if (change > 0) { // Rank GAIN
                changeHtml = `<span class="change-up">▲ ${Math.abs(change)}</span>`;
            } else { // Rank DROP
                changeHtml = `<span class="change-down">▼ ${Math.abs(change)}</span>`;
            }
        }

        tickerHtml += `
            <div class="ticker-item">
                <span class="rank">#${rank}</span>
                <span class="name">${name}</span>
                ${changeHtml}
            </div>
        `;
    });

    // Duplicate the content to create a seamless loop.
    tickerTrack.innerHTML = tickerHtml + tickerHtml;
}

/**
 * Creates a parallax scroll effect for the main title.
 */
function initParallaxTitle() {
    const titleContainer = document.getElementById('main-title-container');
    if (!titleContainer) return; // Exit if element not found

    let ticking = false;

    function onScroll() {
        const scrollY = window.scrollY;

        // This factor controls the parallax speed. 0.5 means it moves up
        // at half the scroll speed in addition to the normal scroll.
        const transformValue = -scrollY * 1;

        titleContainer.style.transform = `translateY(${transformValue}px)`;
        ticking = false;
    }

    // Use requestAnimationFrame for smooth, performant animation
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    });
}

/**
 * Loads all display data from data.json
 * @returns {Promise<object>} The loaded data object
 */
async function loadDataJson() {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Failed to load data.json');
    return await response.json();
}

/**
 * Formats a number with 'k' for thousands, 'M' for millions, and 'B' for billions.
 * Numbers below 1,000 are returned with commas.
 * @param {number | string} value - The numerical value to format.
 * @returns {string} The formatted number as a string (e.g., "2.5B", "1.5M", "120.5k", "500").
 */
function formatNumber(value) {
    // Return the original value if it's not a valid number to avoid errors
    const num = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
    if (isNaN(num)) {
        return value;
    }

    // Format for billions
    if (num >= 1000000000) {
        const formatted = (num / 1000000000).toFixed(1);
        return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'B';
    }

    // Format for millions
    if (num >= 1000000) {
        const formatted = (num / 1000000).toFixed(1);
        return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'M';
    }

    // Format for thousands
    if (num >= 1000) {
        const formatted = (num / 1000).toFixed(1);
        return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'K';
    }

    // For numbers less than 1,000, format with commas
    return num.toLocaleString('en-US');
}

/**
 * Initializes the live funding velocity calculator.
 * @param {Array<number>} allFgrs - An array of all FGR values from the leaderboard.
 */
function initLiveCalculator(allFgrs) {
    const fundingAmountInput = document.getElementById('fundingAmount');
    const timeSinceInput = document.getElementById('timeSince');
    const resultDiv = document.getElementById('result');
    const resultText = document.getElementById('resultText');
    const preciseRankText = document.getElementById('preciseRankText'); // Get new precise rank element
    const rankText = document.getElementById('rankText');
    const errorDiv = document.getElementById('error');

    // Check if all elements exist before adding listeners
    if (!fundingAmountInput || !timeSinceInput || !resultDiv || !resultText || !preciseRankText || !rankText || !errorDiv) {
        console.warn("Calculator elements not found. Skipping initialization.");
        return;
    }

    const calculateAndDisplay = () => {
        const fundingAmount = parseFloat(fundingAmountInput.value);
        const timeSince = parseFloat(timeSinceInput.value);
        errorDiv.classList.add('hidden');
        if (isNaN(fundingAmount) || isNaN(timeSince) || fundingAmount <= 0 || timeSince <= 0) {
            resultDiv.classList.add('hidden');
            return;
        }
        const timeInDays = timeSince * (365.25 / 12);
        const velocityPerDay = fundingAmount * 1e6 / timeInDays;
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        });
        resultText.textContent = `${formatter.format(velocityPerDay)} / day`;

        // --- Calculate and display rank information ---
        if (allFgrs && allFgrs.length > 0) {
            const totalCompanies = allFgrs.length;

            // 1. Calculate Precise Rank
            const companiesWithHigherFgr = allFgrs.filter(fgr => fgr > velocityPerDay).length;
            const preciseRank = companiesWithHigherFgr + 1;
            preciseRankText.textContent = `Rank ${preciseRank.toLocaleString()}`;

            // 2. Calculate Top % Rank
            const companiesBeaten = allFgrs.filter(fgr => velocityPerDay > fgr).length;
            const percentile = (companiesBeaten / totalCompanies) * 100;
            const rankPercentage = 100 - percentile;

            if (rankPercentage <= 0) {
                rankText.textContent = `(Top 0%)`;
            } else {
                rankText.textContent = `(Top ${rankPercentage.toFixed(1)}%)`;
            }
        } else {
            preciseRankText.textContent = '';
            rankText.textContent = '';
        }

        resultDiv.classList.remove('hidden');
    };

    fundingAmountInput.addEventListener('input', calculateAndDisplay);
    timeSinceInput.addEventListener('input', calculateAndDisplay);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


/**
 * Sets up the live search functionality for the leaderboard.
 */
function setupSearch() {
    const searchBox = document.getElementById('search-box');
    const tableBody = document.querySelector('#leaderboard-container tbody');

    // Wait until the table is populated before getting the rows
    if (!tableBody) return;
    const tableRows = tableBody.querySelectorAll('tr');

    searchBox.addEventListener('input', () => {
        const query = searchBox.value.toLowerCase().trim();

        tableRows.forEach(row => {
            // Find the company name cell within this row
            const companyNameCell = row.querySelector('.company-name-cell');
            const companyName = companyNameCell ? companyNameCell.textContent.toLowerCase() : '';

            // Show or hide the row based on whether the name includes the query
            const isVisible = companyName.includes(query);
            row.style.display = isVisible ? '' : 'none';
        });
    });
}

/**
 * Creates a logo.dev URL and logs the success or failure for debugging.
 * @param {string | null} url - The full website URL.
 * @param {string | null} name - The company's name.
 * @returns {string | null} The logo.dev URL or null.
 */
function getLogoUrl(url, name) {
    // 1. Prioritize the website URL first (most reliable)
    if (url) {
        let fullUrl = url.trim();
        if (!/^https?:\/\//i.test(fullUrl)) {
            fullUrl = `https://${fullUrl}`;
        }

        try {
            const domain = new URL(fullUrl).hostname;
            const cleanDomain = domain.replace(/^www\./, '');
            const apiLink = `https://img.logo.dev/${cleanDomain}?token=${LOGO_DEV_API_KEY}`;

            console.log(`✅ Success (from URL) | Input: "${url}" | API Link: "${apiLink}"`);
            return apiLink;
        } catch (error) {
            console.warn(`- Fallback: URL processing failed for "${url}". Error: ${error.message}. Trying name...`);
        }
    }

    // 2. Fallback: If no valid URL, guess the domain from the name
    if (name) {
        const guessedDomain = name
            .toLowerCase()
            .replace(/ inc\.?| llc\.?| ltd\.?|,/g, '') // Remove common suffixes
            .replace(/\s+/g, '') // Remove spaces
            .trim();

        if (guessedDomain) {
            const finalGuessedDomain = `${guessedDomain}.com`;
            const apiLink = `https://img.logo.dev/${finalGuessedDomain}?token=${LOGO_DEV_API_KEY}`;

            console.log(`✅ Success (from Name) | Input: "${name}" | API Link: "${apiLink}"`);
            return apiLink;
        }
    }

    // 3. If both methods fail
    console.log(`❌ Fail | Could not generate a domain. | Input URL: "${url || 'N/A'}" | Input Name: "${name || 'N/A'}"`);
    return null;
}

// Replace getLogoUrl with a function that returns the local logo path
function getLocalLogoPath(companyName) {
    if (!companyName) return null;
    // Sanitize filename: keep alphanumeric, space, _, -; replace spaces with _
    let filename = companyName.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/ /g, '_') + '.png';
    return `logos/${filename}`;
}

function createIndustryTags(industryString) {
    if (!industryString || typeof industryString !== 'string') return '';

    const tagsHtml = industryString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)
        .map(tag => `<span class="bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap">${tag}</span>`)
        .join('');

    // Key change: Remove 'flex-wrap' to prevent wrapping
    return `<div class="flex gap-2">${tagsHtml}</div>`;
}

/**
 * Creates and displays the main leaderboard table.
 * @param {Array<string>} headers - The filtered column headers.
 * @param {Array<object>} data - An array of objects, each with 'cells', 'url', and 'rankChange' properties.
 */
function createTable(headers, data) {
    let tableHtml = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0">
                <tr>`;
    headers.forEach(header => {
        const extraClass = header === 'Logo' ? 'w-16' : '';
        tableHtml += `<th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider ${extraClass}">${header}</th>`;
    });
    tableHtml += `</tr></thead><tbody class="bg-white divide-y divide-gray-200">`;

    data.forEach(rowObject => {
        tableHtml += `<tr>`;
        rowObject.cells.forEach((cell, index) => {
            const headerName = headers[index];
            let cellContent = cell || ''; // Get the raw content
            let cellClass = '';
            let cellDataLabel = `data-label="${headerName}"`;

            let cellHtml = `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${cell || ''}</td>`; // Default cell

            if (headerName === "Logo") {
                const logoUrl = cell;
                if (logoUrl) {
                    cellHtml = `
                            <td class="px-6 py-4 flex items-center">
                                <img loading="lazy" src="${logoUrl}" alt="${rowObject.cells[1] || 'Company'} Logo" class="h-8 w-auto rounded-lg" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
                                <div class="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400" style="display:none">?</div>
                            </td>`;
                } else {
                    cellHtml = `
                            <td class="px-6 py-4">
                                <div class="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">?</div>
                            </td>`;
                }
            } else if (headerName === "Company Name") {
                const linkContent = rowObject.url ? `<a href="${rowObject.url}" target="_blank" rel="noopener noreferrer" class="hover:underline">${cell || ''}</a>` : (cell || '');
                // Add the 'company-name-cell' class here
                cellHtml = `<td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium company-name-cell">${linkContent}</td>`;
            } else if (headerName === "Ranking") {
                let indicatorHtml = '';
                const change = parseInt(rowObject.rankChange, 10);
                if (!isNaN(change) && change !== 0) {
                    if (change >= 0) { // Rank GAIN
                        indicatorHtml = `<span class="ml-2 text-green-500 font-bold">▲ ${Math.abs(change)}</span>`;
                    } else { // Rank DROP
                        indicatorHtml = `<span class="ml-2 text-red-500 font-bold">▼ ${change}</span>`;
                    }
                }
                cellHtml = `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700"><div class="flex items-center">${cell || ''}${indicatorHtml}</div></td>`;
            } else if (headerName === "Funding Stage") {
                const labelHtml = getFundingLabel(cell);
                cellHtml = `<td class="px-6 py-4 whitespace-nowrap">${labelHtml}</td>`;
            } else if (headerName === "Days Since Last Funding") {
                const num = parseFloat(cell);
                const roundedValue = !isNaN(num) ? Math.ceil(num) : cell;
                cellHtml = `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${roundedValue || ''}</td>`;
            } else if (
                headerName === "Funding Growth Rate ($/day)" ||
                headerName === "Last Funding Round ($)" ||
                headerName === "Total Funding ($)"
            ) {
                const isCurrency = headerName.includes('($)');
                const formattedCell = formatNumber(cell);
                // Prepend '$' only if it's a currency value and was successfully formatted
                const displayValue = (isCurrency && !isNaN(parseFloat(cell))) ? `$${formattedCell}` : formattedCell;
                const extraClass = headerName === "Funding Growth Rate ($/day)" ? "font-bold" : "";
                cellHtml = `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 ${extraClass}">${displayValue}</td>`;
            } else if (headerName === "Industries") {
                const tagsHtml = createIndustryTags(cell);
                // The cell allows content to wrap, unlike a default cell
                cellHtml = `<td class="px-6 py-4 text-sm">${tagsHtml}</td>`;
            }
            tableHtml += cellHtml;
        });
        tableHtml += `</tr>`;
    });

    tableHtml += `</tbody></table>`;
    leaderboardContainer.innerHTML = tableHtml;
}

/**
 * Initializes a Leaflet map and plots the top companies, offsetting any with the same coordinates.
 * @param {Array<object>} companies - An array of company objects, each with lat and lon properties.
 */
function initMap(companies) {
    const numCompaniesDisplayed = 50;
    const mapPlaceholder = document.getElementById('map-placeholder');
    if (!mapPlaceholder) return;

    mapPlaceholder.innerHTML = '';
    mapPlaceholder.style.padding = '0';
    mapPlaceholder.style.minHeight = '450px';

    const southWest = L.latLng(-90, -180);
    const northEast = L.latLng(90, 180);
    const worldBounds = L.latLngBounds(southWest, northEast);

    const map = L.map('map-placeholder', {
        attributionControl: false,
        maxBounds: worldBounds,
        minZoom: 2,
        maxZoom: 18,
    }).setView([37.87, -122.27], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    const titleControl = L.control({position: 'topright'});

    titleControl.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'map-title-overlay');
        div.innerHTML = `<h3>Top ${numCompaniesDisplayed} Companies Location</h3>`;
        return div;
    };

    titleControl.addTo(map);

    const nameIndex = COLUMNS_TO_SHOW.indexOf('Company Name');
    const logoIndex = COLUMNS_TO_SHOW.indexOf('Logo');
    const topCompanies = companies.slice(0, numCompaniesDisplayed);

    const processedLocations = {}; // To track markers at the same coordinates
    const longitudeOffset = 0.01;  // The spacing for spread-out markers

    topCompanies.forEach(company => {
        const {lat, lon} = company;
        const name = company.cells[nameIndex];
        const logoUrl = company.cells[logoIndex];

        if (!isNaN(lat) && !isNaN(lon)) {
            let finalLon = lon;
            const locationKey = `${lat},${lon}`;

            // Check if we've already placed a marker at this exact spot
            if (processedLocations[locationKey]) {
                // This is a duplicate location, so we apply an offset
                const offsetIndex = processedLocations[locationKey].count;
                finalLon = lon + (offsetIndex * longitudeOffset);

                // Increment the count for the next duplicate at this location
                processedLocations[locationKey].count++;
            } else {
                // First time seeing this location, initialize it
                processedLocations[locationKey] = {count: 1};
            }

            const customIcon = L.divIcon({
                html: `<img loading="lazy" src="${logoUrl}" alt="${name} Logo" class="w-10 h-10 object-contain bg-white p-1 rounded-lg shadow-lg border-2 border-white">`,
                className: '',
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            });

            // Use the potentially modified longitude for the marker
            const marker = L.marker([lat, finalLon], {icon: customIcon}).addTo(map);
            marker.bindPopup(`<b>${name}</b>`);
        }
    });
}

/**
 * Returns a hex color code for a given funding type for chart use.
 * @param {string} fundingType - The type of funding (e.g., "Series A").
 * @returns {string} The hex color code.
 */
function getFundingColor(fundingType) {
    if (!fundingType) return FUNDING_STAGE_COLORS.default.hex;
    const stage = fundingType.trim();
    // Look up colors in the dictionary, use 'default' if not found
    const colors = FUNDING_STAGE_COLORS[stage] || FUNDING_STAGE_COLORS.default;
    return colors.hex;
}

/**
 * Creates a single scatter plot with a legend and custom axis ticks.
 * @param {Array<object>} companies - The processed leaderboard data.
 */
// Make sure this variable is declared at the top of your script.js file
let fundingChartInstance = null;

function createFundingCharts(companies) {
    const chartFontSize = 16;
    const ctx = document.getElementById('fundingAnalysisChart').getContext('2d');
    if (!ctx) return;

    // --- FIX 1: Destroy the old chart instance before creating a new one ---
    if (fundingChartInstance) {
        fundingChartInstance.destroy();
    }

    // --- Data preparation logic (your existing code is fine) ---
    const totalFundingIndex = COLUMNS_TO_SHOW.indexOf('Total Funding ($)');
    const fgrIndex = COLUMNS_TO_SHOW.indexOf('Funding Growth Rate ($/day)');
    const stageIndex = COLUMNS_TO_SHOW.indexOf('Funding Stage');
    const nameIndex = COLUMNS_TO_SHOW.indexOf('Company Name');
    const parseValue = (cell) => parseFloat(String(cell).replace(/[^0-9.-]+/g, '')) || 0;

    const scatterData = companies.map(c => ({
        x: parseValue(c.cells[totalFundingIndex]),
        y: parseValue(c.cells[fgrIndex]),
        name: c.cells[nameIndex],
        stage: c.cells[stageIndex]
    })).filter(d => d.x > 0 && d.y > 0);

    const groupedData = {};
    scatterData.forEach(point => {
        const stage = point.stage.trim();
        const colors = FUNDING_STAGE_COLORS[stage] || FUNDING_STAGE_COLORS.default;
        const identifier = colors.identifier;
        if (!groupedData[identifier]) {
            groupedData[identifier] = [];
        }
        groupedData[identifier].push(point);
    });

    const datasets = [
      'early_support', 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c',
      'late_stage', 'corporate', 'post_ipo', 'other'
    ].filter(id => groupedData[id])
    .sort((a, b) => (a === 'other' ? 1 : b === 'other' ? -1 : 0))
    .map(identifier => {
        const group = groupedData[identifier];
        const color = getFundingColor(group[0].stage);
        const label = FUNDING_STAGE_IDENTIFIERS[identifier];
        return {
            label: label,
            data: group,
            backgroundColor: color,
            pointRadius: 5,
            pointBorderWidth: 0,
            pointHoverRadius: 8
        };
    });

    // --- Create the new chart instance ---
    fundingChartInstance = new Chart(ctx, { // Store the new instance
        type: 'scatter',
        data: {datasets: datasets},
        options: {
            responsive: true,
            // --- FIX 2: Tell the chart to fill its container's aspect ratio ---
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { font: { size: chartFontSize } }
                },
                title: {
                    display: true,
                    text: 'Funding Growth Rate vs. Total Funding',
                    padding: {bottom: 20},
                    font: { size: chartFontSize, weight: 'normal' }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const dataPoint = context.raw;
                            return `${dataPoint.name} | Total Funding: $${formatNumber(dataPoint.x)} | FGR: $${formatNumber(dataPoint.y)}/day`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'logarithmic',
                    title: { display: true, text: 'Total Funding ($)', font: { size: chartFontSize } },
                    grid: {display: false},
                    ticks: {
                        font: { size: chartFontSize },
                        callback: function (value) {
                            const log = Math.log10(value);
                            if (log === Math.floor(log)) { return '$' + formatNumber(value); }
                        }
                    }
                },
                y: {
                    type: 'logarithmic',
                    title: { display: true, text: 'Funding Growth Rate ($/day)', font: { size: chartFontSize } },
                    grid: {display: false},
                    ticks: {
                        font: { size: chartFontSize },
                        callback: function (value) {
                            const log = Math.log10(value);
                            if (log === Math.floor(log)) { return '$' + formatNumber(value); }
                        }
                    }
                }
            }
        }
    });
}
/**
 * Creates a styled HTML label for a given funding type.
 * @param {string} fundingType - The type of funding (e.g., "Series A").
 * @returns {string} The HTML string for the label.
 */
function getFundingLabel(fundingType) {
    if (!fundingType) return '';
    const stage = fundingType.trim();
    // Look up colors in the dictionary, use 'default' if not found
    const colors = FUNDING_STAGE_COLORS[stage] || FUNDING_STAGE_COLORS.default;
    return `<span class="px-2.5 py-1 text-xs font-medium rounded-lg ${colors.labelClasses}">${stage}</span>`;
}

/**
 * Fetches and displays the summary statistics.
 */
async function displayStatistics(statsData) {
    // The container is cleared here, ready for all stats to be populated.
    statisticsContainer.innerHTML = '';

    if (!statsData || statsData.length < 2) {
        statisticsContainer.innerHTML = `<p class="text-gray-500 text-center col-span-4">Statistics data is not available.</p>`;
        return;
    }

    const headers = statsData[0];
    const values = statsData[1];
    const statsMap = new Map();
    headers.forEach((header, index) => {
        statsMap.set(header, values[index]);
    });

    const getStat = (key, isCurrency = false) => {
        const value = statsMap.get(key);
        if (value === undefined) return 'N/A';
        if (isCurrency) {
            return `$${formatNumber(value)}`;
        }
        return value;
    };

    statisticsContainer.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-sm font-medium text-gray-500 truncate">Companies Tracked</h3>
            <p class="mt-1 text-3xl font-semibold text-gray-900">${getStat('Number of Companies Tracked')}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-sm font-medium text-gray-500 truncate">Avg FGR (daily)</h3>
            <p class="mt-1 text-3xl font-semibold text-gray-900">${getStat('Average Funding Growth Rate (daily)', true)}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-sm font-medium text-gray-500 truncate">Max Funding Gain</h3>
            <p class="mt-1 text-3xl font-semibold text-gray-900">${getStat('Max Funding Gain Since Last Round', true)}</p>
            <p class="text-sm text-gray-500 truncate">by ${getStat('By (Max Funding Gain Since Last Round)')}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-sm font-medium text-gray-500 truncate">Max Total Funding</h3>
            <p class="mt-1 text-3xl font-semibold text-gray-900">${getStat('Max Funding', true)}</p>
            <p class="text-sm text-gray-500 truncate">by ${getStat('By (Max Funding)')}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-sm font-medium text-gray-500 truncate">Avg Total Funding</h3>
            <p class="mt-1 text-3xl font-semibold text-gray-900">${getStat('Average Funding', true)}</p>
        </div>
    `;
}

/**
 * Creates an animated, data-driven word cloud from company data.
 * @param {Array<object>} companies - The processed leaderboard data.
 */
function initWordCloud(companies) {
    const container = document.getElementById('word-cloud-background');
    if (!container) return;

    // --- 1. Prepare the Data ---
    const topCompanies = companies
    const fgrIndex = COLUMNS_TO_SHOW.indexOf('Funding Growth Rate ($/day)');
    const nameIndex = COLUMNS_TO_SHOW.indexOf('Company Name');

    // Find min/max FGR to scale font sizes
    const fgrValues = topCompanies.map(c => parseFloat(c.cells[fgrIndex]) || 0);
    const minFgr = Math.min(...fgrValues);
    const maxFgr = Math.max(...fgrValues);

    // Create the word data array required by d3-cloud
    const wordData = topCompanies.map(company => {
        const fgr = parseFloat(company.cells[fgrIndex]) || 0;
        const fontSize = 10 + Math.sqrt((fgr - minFgr) / (maxFgr - minFgr)) * 110;
        return {
            text: company.cells[nameIndex],
            size: fontSize
        };
    });

    // --- 2. Configure and Run the Layout Algorithm ---
    const parent = container.parentElement;
    const layout = d3.layout.cloud()
        .size([parent.clientWidth, parent.clientHeight])
        .words(wordData)
        .padding(2.5)
        .rotate(() => (Math.random() > 0.5 ? 90 : 0)) // Randomly rotate some words
        .font('Inter')
        .fontSize(d => d.size)
        .on("end", draw); // When layout is calculated, call the 'draw' function

    layout.start();

    // --- 3. Draw the Word Cloud and Animate It ---
    function draw(words) {
        // Clear previous content
        d3.select(container).html('');

        // Create the SVG container for the words
        const svg = d3.select(container).append("svg")
            .attr("width", layout.size()[0])
            .attr("height", layout.size()[1]);

        // Create a group element to center the cloud
        const g = svg.append("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")");

        // Bind the data and create the text elements
        const textElements = g.selectAll("text")
            .data(words)
            .enter().append("text")
            .attr("class", "word") // Add our base class for styling
            .style("font-size", d => d.size + "px")
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
            .text(d => d.text);

        // --- 4. Staggered Animation ---
        // Animate each word to appear one by one, based on its rank (index)
        textElements.transition()
            .delay((d, i) => i * 50) // 100ms delay between each word
            .on("start", function() { d3.select(this).classed("visible", true); });
    }

    // Re-create the cloud on window resize
    const debouncedInitWordCloud = debounce(() => initWordCloud(companies), 250); // 250ms delay
    window.addEventListener('resize', debouncedInitWordCloud);
}

/**
 * Main function to initialize the leaderboard and statistics.
 */
async function main() {
    const data = await loadDataJson();
    const headerData = data.headerData;
    const companyData = data.companyData;
    const rankChangesData = data.rankChangesData;
    // statsData is used in displayStatistics

    const allHeaders = headerData[0];
    const rankChanges = rankChangesData ? rankChangesData.flat() : [];

    const websiteColumnIndex = allHeaders.indexOf("Website");
    const latIndex = allHeaders.indexOf("Latitude");
    const lonIndex = allHeaders.indexOf("Longitude");

    const displayedData = companyData.map((row, rowIndex) => {
        const websiteUrl = (websiteColumnIndex !== -1) ? row[websiteColumnIndex] : null;
        const nameIndex = allHeaders.indexOf("Company Name");
        const companyName = nameIndex !== -1 ? row[nameIndex] : null;
        const finalCells = COLUMNS_TO_SHOW.map(columnName => {
            if (columnName === 'Logo') {
                // Use local logo path
                return getLocalLogoPath(companyName);
            }
            const colIndex = allHeaders.indexOf(columnName);
            return colIndex !== -1 ? (row[colIndex] || '') : '';
        });
        const rankChange = rankChanges[rowIndex] || '0';

        // --- MODIFICATION: Add lat/lon to the object ---
        return {
            cells: finalCells,
            url: websiteUrl,
            rankChange: rankChange,
            lat: latIndex !== -1 ? parseFloat(row[latIndex]) : NaN,
            lon: lonIndex !== -1 ? parseFloat(row[lonIndex]) : NaN
        };
    });

    createTable(COLUMNS_TO_SHOW, displayedData);
    createRankingTicker(displayedData);
    setupSearch();
    createFundingCharts(displayedData);
    await displayStatistics(data.statsData); // Pass statsData directly
    initMap(displayedData);

    const fgrIndex = COLUMNS_TO_SHOW.indexOf('Funding Growth Rate ($/day)');
    const allFgrs = displayedData.map(d => {
        const rawValue = d.cells[fgrIndex];
        return parseFloat(String(rawValue).replace(/[^0-9.-]+/g, '')) || 0;
    }).filter(fgr => fgr > 0);

    initLiveCalculator(allFgrs);
    initWordCloud(displayedData);
}

// At the very end of your script.js file
document.addEventListener('DOMContentLoaded', () => {
    main(); // This runs your existing leaderboard and word cloud code
    initParallaxTitle(); // This activates the new parallax effect
});