import * as julian from 'astronomia/julian';
import ASTRO_RULES from '../data/astro_rules.json';

export const SIGN_INDEX = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];

export const SIGN_DETAILS = {
  "Mesha": { english: "Aries", symbol: "♈", lord: "Mars", element: "Fire" },
  "Vrishabha": { english: "Taurus", symbol: "♉", lord: "Venus", element: "Earth" },
  "Mithuna": { english: "Gemini", symbol: "♊", lord: "Mercury", element: "Air" },
  "Karka": { english: "Cancer", symbol: "♋", lord: "Moon", element: "Water" },
  "Simha": { english: "Leo", symbol: "♌", lord: "Sun", element: "Fire" },
  "Kanya": { english: "Virgo", symbol: "♍", lord: "Mercury", element: "Earth" },
  "Tula": { english: "Libra", symbol: "♎", lord: "Venus", element: "Air" },
  "Vrishchika": { english: "Scorpio", symbol: "♏", lord: "Mars", element: "Water" },
  "Dhanu": { english: "Sagittarius", symbol: "♐", lord: "Jupiter", element: "Fire" },
  "Makara": { english: "Capricorn", symbol: "♑", lord: "Saturn", element: "Earth" },
  "Kumbha": { english: "Aquarius", symbol: "♒", lord: "Saturn", element: "Air" },
  "Meena": { english: "Pisces", symbol: "♓", lord: "Jupiter", element: "Water" }
};

export const PLANET_NAMES_PRETTY = {
  "Sun": "Sun (Surya)",
  "Moon": "Moon (Chandra)",
  "Mars": "Mars (Mangal)",
  "Mercury": "Mercury (Budha)",
  "Jupiter": "Jupiter (Guru)",
  "Venus": "Venus (Shukra)",
  "Saturn": "Saturn (Shani)",
  "Rahu": "Rahu (North Node)",
  "Ketu": "Ketu (South Node)"
};

export const PLANET_GLYPHS = {
  "Sun": "☉", "Moon": "☽", "Mars": "♂", "Mercury": "☿", "Jupiter": "♃", "Venus": "♀", "Saturn": "♄", "Rahu": "☊", "Ketu": "☋"
};

export const CITY_PRESETS = [
  { name: "New Delhi, India", lat: 28.6139, lng: 77.2090, tz: 5.5 },
  { name: "Mumbai, India", lat: 19.0760, lng: 72.8777, tz: 5.5 },
  { name: "Bengaluru, India", lat: 12.9716, lng: 77.5946, tz: 5.5 },
  { name: "New York, USA", lat: 40.7128, lng: -74.0060, tz: -5 },
  { name: "London, UK", lat: 51.5074, lng: -0.1278, tz: 0 },
  { name: "San Francisco, USA", lat: 37.7749, lng: -122.4194, tz: -8 },
  { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503, tz: 9 },
  { name: "Sydney, Australia", lat: -33.8688, lng: 151.2093, tz: 10 }
];

export const DASHA_RULERS = [
  { name: "Ketu", years: 7 },
  { name: "Venus", years: 20 },
  { name: "Sun", years: 6 },
  { name: "Moon", years: 10 },
  { name: "Mars", years: 7 },
  { name: "Rahu", years: 18 },
  { name: "Jupiter", years: 16 },
  { name: "Saturn", years: 19 },
  { name: "Mercury", years: 17 }
];

export const HOUSE_SIGNIFICATIONS_LOCAL = [
  { house: 1, name: "Tanu Bhava", english: "House of Self", details: "Personality, physical appearance, health, ego, life path." },
  { house: 2, name: "Dhana Bhava", english: "House of Wealth", details: "Finances, speech, family, food, values, self-worth." },
  { house: 3, name: "Sahaja Bhava", english: "House of Siblings", details: "Courage, effort, communication, writing, short travels, siblings." },
  { house: 4, name: "Bandhu Bhava", english: "House of Home", details: "Mother, home, inner peace, happiness, real estate, vehicles." },
  { house: 5, name: "Putra Bhava", english: "House of Intellect", details: "Children, creativity, romance, speculation, intelligence, past life merits." },
  { house: 6, name: "Ari Bhava", english: "House of Obstacles", details: "Health issues, enemies, daily job, debt, obstacles, service." },
  { house: 7, name: "Yuvati Bhava", english: "House of Partnership", details: "Spouse, business partners, legal contracts, public dealings." },
  { house: 8, name: "Randhra Bhava", english: "House of Transformation", details: "Longevity, secrets, inheritance, occult, sudden events, deep science." },
  { house: 9, name: "Dharma Bhava", english: "House of Luck", details: "Father, fortune, spirituality, higher education, long travels, destiny." },
  { house: 10, name: "Karma Bhava", english: "House of Career", details: "Profession, social status, fame, authority, achievements." },
  { house: 11, name: "Labha Bhava", english: "House of Gains", details: "Income, elder siblings, social circle, desires fulfilled, cash flow." },
  { house: 12, name: "Vyaya Bhava", english: "House of Loss", details: "Expenses, spiritual liberation, subconscious, sleep, isolation, foreign land." }
];

export function getDignity(planet, sign) {
  const dignities = {
    "Sun": { exalted: "Mesha", debilitated: "Tula", own: ["Simha"] },
    "Moon": { exalted: "Vrishabha", debilitated: "Vrishchika", own: ["Karka"] },
    "Mars": { exalted: "Makara", debilitated: "Karka", own: ["Mesha", "Vrishchika"] },
    "Mercury": { exalted: "Kanya", debilitated: "Meena", own: ["Mithuna", "Kanya"] },
    "Jupiter": { exalted: "Karka", debilitated: "Makara", own: ["Dhanu", "Meena"] },
    "Venus": { exalted: "Meena", debilitated: "Kanya", own: ["Vrishabha", "Tula"] },
    "Saturn": { exalted: "Tula", debilitated: "Mesha", own: ["Makara", "Kumbha"] }
  };

  if (!dignities[planet]) return "";
  const d = dignities[planet];
  if (d.exalted === sign) return "Exalted 🌟";
  if (d.debilitated === sign) return "Debilitated ⚠️";
  if (d.own.includes(sign)) return "Own Sign 🏠";
  return "Neutral";
}

export function calculateVimshottari(moonLongitude, birthDateString) {
  const nakshatraLength = 360 / 27; // 13.333333 degrees
  const nakshatraIndex = Math.floor(moonLongitude / nakshatraLength);
  const elapsedInNakshatra = moonLongitude % nakshatraLength;
  const elapsedFraction = elapsedInNakshatra / nakshatraLength;
  const remainingFraction = 1 - elapsedFraction;

  const startRulerIndex = nakshatraIndex % 9;
  const firstRuler = DASHA_RULERS[startRulerIndex];
  const remainingYears = remainingFraction * firstRuler.years;

  const birthDate = new Date(birthDateString);
  const dashas = [];
  let currentDate = new Date(birthDate);

  // First Mahadasha (partial)
  const firstDashaEnd = new Date(currentDate);
  const fractionalDays = Math.floor(remainingYears * 365.25);
  firstDashaEnd.setDate(firstDashaEnd.getDate() + fractionalDays);

  dashas.push({
    ruler: firstRuler.name,
    years: firstRuler.years,
    start: new Date(birthDate),
    end: new Date(firstDashaEnd),
    isActive: false
  });

  currentDate = new Date(firstDashaEnd);

  // Next 8 Mahadashas (completing the 120 year cycle)
  for (let i = 1; i < 9; i++) {
    const nextRulerIndex = (startRulerIndex + i) % 9;
    const ruler = DASHA_RULERS[nextRulerIndex];
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);
    endDate.setFullYear(endDate.getFullYear() + ruler.years);

    dashas.push({
      ruler: ruler.name,
      years: ruler.years,
      start: startDate,
      end: new Date(endDate),
      isActive: false
    });

    currentDate = new Date(endDate);
  }

  // Determine active dasha
  const now = new Date();
  dashas.forEach(d => {
    if (now >= d.start && now <= d.end) {
      d.isActive = true;
    }
  });

  return dashas;
}

export const parseSecondPerson = (text) => {
  if (!text) return null;

  // Regex for Date: matches DD-MM-YYYY or YYYY-MM-DD or DD/MM/YYYY etc.
  const dateRegex = /\b(\d{1,2}|\d{4})[-\/.]([a-zA-Z]+|\d{1,2})[-\/.](\d{1,2}|\d{4})\b/;
  // Regex for Time: matches HH:MM with optional AM/PM
  const timeRegex = /\b(\d{1,2}):(\d{2})(?:\s*([aApP][mM]))?\b/;

  const dateMatch = text.match(dateRegex);
  const timeMatch = text.match(timeRegex);

  if (dateMatch && timeMatch) {
    const dateStr = dateMatch[0];
    const timeStr = timeMatch[0];

    const dateStart = dateMatch.index;
    const dateEnd = dateStart + dateStr.length;

    const timeStart = timeMatch.index;
    const timeEnd = timeStart + timeStr.length;

    const firstStart = Math.min(dateStart, timeStart);
    const secondEnd = Math.max(dateEnd, timeEnd);

    // Extract Name (before the first of date/time)
    let name = text.slice(0, firstStart).trim();
    // Strip trailing commas, dashes, colons, semicolons
    name = name.replace(/[,;:\-\s]+$/, "").trim();

    // Extract Location (after the second of date/time)
    let location = text.slice(secondEnd).trim();
    // Strip leading commas, dashes, colons, semicolons
    location = location.replace(/^[,;:\-\s]+/, "").trim();

    // If name or location is empty, fallback/invalid
    if (!name || !location) return null;

    // Format Date to YYYY-MM-DD
    const parts = dateStr.split(/[-\/.]/);
    let formattedDate = "";
    if (parts[2] && parts[2].length === 4) {
      let day = parts[0].padStart(2, '0');
      let month = parts[1].padStart(2, '0');
      if (isNaN(parts[1])) {
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const mIdx = months.findIndex(m => parts[1].toLowerCase().startsWith(m));
        if (mIdx !== -1) {
          month = String(mIdx + 1).padStart(2, '0');
        }
      }
      
      // Auto-detect and swap if it's MM/DD/YYYY format (e.g. 05/31/2009)
      if (!isNaN(day) && !isNaN(month)) {
        const dVal = parseInt(day);
        const mVal = parseInt(month);
        if (mVal > 12 && dVal <= 12) {
          // Swap them
          const temp = day;
          day = month;
          month = temp;
        }
      }

      formattedDate = `${parts[2]}-${month}-${day}`;
    } else if (parts[0] && parts[0].length === 4) {
      let month = parts[1].padStart(2, '0');
      let day = parts[2].padStart(2, '0');
      if (isNaN(parts[1])) {
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const mIdx = months.findIndex(m => parts[1].toLowerCase().startsWith(m));
        if (mIdx !== -1) {
          month = String(mIdx + 1).padStart(2, '0');
        }
      }
      
      // Auto-detect and swap if it's YYYY-DD-MM format
      if (!isNaN(day) && !isNaN(month)) {
        const dVal = parseInt(day);
        const mVal = parseInt(month);
        if (mVal > 12 && dVal <= 12) {
          // Swap them
          const temp = day;
          day = month;
          month = temp;
        }
      }

      formattedDate = `${parts[0]}-${month}-${day}`;
    }

    // Format Time to HH:MM (24-hour format)
    let formattedTime = "";
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2];
    const ampm = timeMatch[3];
    if (ampm) {
      if (ampm.toLowerCase() === "pm" && hours < 12) hours += 12;
      if (ampm.toLowerCase() === "am" && hours === 12) hours = 0;
    }
    formattedTime = `${String(hours).padStart(2, '0')}:${minutes}`;

    return { name, formattedDate, formattedTime, location };
  }

  return null;
};

export function analyzeChartData(positions, ascendant) {
  if (!positions || !ascendant) return { activeYogas: [], lalKitabPlacements: [], lalKitabRemedies: [] };
  const ascSignIdx = SIGN_INDEX.indexOf(ascendant);
  const activeYogas = [];
  
  const findPlanet = (name) => positions.find(p => p.name === name);
  
  const moon = findPlanet("Moon");
  const jupiter = findPlanet("Jupiter");
  const sun = findPlanet("Sun");
  const mercury = findPlanet("Mercury");
  const mars = findPlanet("Mars");
  const venus = findPlanet("Venus");
  const saturn = findPlanet("Saturn");
  const rahu = findPlanet("Rahu");
  const ketu = findPlanet("Ketu");

  // Gaja Kesari
  if (moon && jupiter) {
    const moonSign = Math.floor(moon.longitude / 30);
    const jupSign = Math.floor(jupiter.longitude / 30);
    const diff = (jupSign - moonSign + 12) % 12;
    if (diff === 0 || diff === 3 || diff === 6 || diff === 9) {
      if (ASTRO_RULES.yogas?.["Gaja Kesari Yoga"]) {
        activeYogas.push(ASTRO_RULES.yogas["Gaja Kesari Yoga"]);
      }
    }
  }

  // Budhaditya
  if (sun && mercury) {
    const sunSign = Math.floor(sun.longitude / 30);
    const mercSign = Math.floor(mercury.longitude / 30);
    if (sunSign === mercSign) {
      if (ASTRO_RULES.yogas?.["Budhaditya Yoga"]) {
        activeYogas.push(ASTRO_RULES.yogas["Budhaditya Yoga"]);
      }
    }
  }

  // Pancha Mahapurusha Yogas
  const isPanchaMahapurusha = (planet, ownSigns, exaltedSign) => {
    if (!planet || ascSignIdx === -1) return false;
    const signIdx = Math.floor(planet.longitude / 30);
    const signName = SIGN_INDEX[signIdx];
    const houseIdx = (signIdx - ascSignIdx + 12) % 12;
    const isKendra = (houseIdx === 0 || houseIdx === 3 || houseIdx === 6 || houseIdx === 9);
    const isStrong = ownSigns.includes(signName) || signName === exaltedSign;
    return isKendra && isStrong;
  };

  if (isPanchaMahapurusha(mars, ["Mesha", "Vrishchika"], "Makara")) {
    if (ASTRO_RULES.yogas?.["Ruchaka Yoga"]) activeYogas.push(ASTRO_RULES.yogas["Ruchaka Yoga"]);
  }
  if (isPanchaMahapurusha(mercury, ["Mithuna", "Kanya"], "Kanya")) {
    if (ASTRO_RULES.yogas?.["Bhadra Yoga"]) activeYogas.push(ASTRO_RULES.yogas["Bhadra Yoga"]);
  }
  if (isPanchaMahapurusha(jupiter, ["Dhanu", "Meena"], "Karka")) {
    if (ASTRO_RULES.yogas?.["Hamsa Yoga"]) activeYogas.push(ASTRO_RULES.yogas["Hamsa Yoga"]);
  }
  if (isPanchaMahapurusha(venus, ["Vrishabha", "Tula"], "Meena")) {
    if (ASTRO_RULES.yogas?.["Malavya Yoga"]) activeYogas.push(ASTRO_RULES.yogas["Malavya Yoga"]);
  }
  if (isPanchaMahapurusha(saturn, ["Makara", "Kumbha"], "Tula")) {
    if (ASTRO_RULES.yogas?.["Sasa Yoga"]) activeYogas.push(ASTRO_RULES.yogas["Sasa Yoga"]);
  }

  // Kala Sarpa Yoga
  if (rahu && ketu) {
    const rahuLong = rahu.longitude;
    const ketuLong = ketu.longitude;
    const minLong = Math.min(rahuLong, ketuLong);
    const maxLong = Math.max(rahuLong, ketuLong);
    
    let sideA = true;
    let sideB = true;
    
    const planetsToCheck = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
    for (const pName of planetsToCheck) {
      const p = findPlanet(pName);
      if (p) {
        if (!(p.longitude >= minLong && p.longitude <= maxLong)) {
          sideA = false;
        }
        if (!((p.longitude >= maxLong && p.longitude <= 360) || (p.longitude >= 0 && p.longitude <= minLong))) {
          sideB = false;
        }
      }
    }
    if (sideA || sideB) {
      if (ASTRO_RULES.yogas?.["Kala Sarpa Yoga"]) activeYogas.push(ASTRO_RULES.yogas["Kala Sarpa Yoga"]);
    }
  }

  // Lal Kitab placements & remedies
  const lalKitabPlacements = [];
  const lalKitabRemedies = [];

  positions.forEach(p => {
    const lkHouse = Math.floor(p.longitude / 30) + 1;
    const houseKey = `house_${lkHouse}`;
    
    const ruleMatch = ASTRO_RULES.lalkitab?.[p.name]?.[houseKey];
    if (ruleMatch) {
      lalKitabPlacements.push({
        planet: p.name,
        house: lkHouse,
        prediction: ruleMatch.prediction
      });
      if (ruleMatch.remedies && Array.isArray(ruleMatch.remedies)) {
        ruleMatch.remedies.forEach(rem => {
          lalKitabRemedies.push({
            planet: p.name,
            house: lkHouse,
            remedy: rem
          });
        });
      }
    }
  });

  return {
    activeYogas,
    lalKitabPlacements,
    lalKitabRemedies
  };
}

export function getKundali(positions, options = { system: 'whole-sign' }) {
  const lon = positions.location?.longitude ?? 0;
  const lat = positions.location?.latitude ?? 0;
  
  const dt = new Date(positions.datetime);
  const jd = julian.DateToJD(dt);
  
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
  gmst = (gmst % 360 + 360) % 360;
  
  const lst = (gmst + lon) % 360;
  const eps = 23.4392911;
  
  const toRad = (d) => d * Math.PI / 180;
  const toDeg = (r) => r * 180 / Math.PI;
  
  const y = Math.cos(toRad(lst));
  const x = -(Math.sin(toRad(lst)) * Math.cos(toRad(eps)) + Math.tan(toRad(lat)) * Math.sin(toRad(eps)));
  
  let ascTropical = toDeg(Math.atan2(y, x));
  ascTropical = (ascTropical % 360 + 360) % 360;
  
  // Subtract Ayanamsha (matching the 24 degrees offset used by the library for planets)
  const ayanamshaOffset = 24.0;
  const ascSidereal = (ascTropical - ayanamshaOffset + 360) % 360;
  const ascSignIndex = Math.floor(ascSidereal / 30) % 12;
  
  const RASHIS = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
  const houses = Array.from({ length: 12 }).map((_, i) => ({ 
    sign: RASHIS[(ascSignIndex + i) % 12], 
    planets: [] 
  }));
  
  positions.positions.forEach(p => {
    const signIdx = Math.floor(p.longitude / 30) % 12;
    const houseIdx = (signIdx - ascSignIndex + 12) % 12;
    houses[houseIdx].planets.push(p.name);
  });
  
  return {
    ascendant: RASHIS[ascSignIndex],
    houses,
    aspects: [],
    shadbala: {}
  };
}
