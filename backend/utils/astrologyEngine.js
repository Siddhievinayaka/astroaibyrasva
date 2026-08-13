import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rulesPath = path.join(__dirname, '../data/astro_rules.json');

const SIGN_INDEX = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];

export async function analyzeChart(positionsData, kundaliData) {
  let rules = {};
  try {
    const rawData = await fs.readFile(rulesPath, 'utf-8');
    rules = JSON.parse(rawData);
  } catch (err) {
    console.error("Failed to load astro rules JSON:", err);
  }

  const positions = positionsData.positions || [];
  const ascendant = kundaliData.ascendant;
  const ascSignIdx = SIGN_INDEX.indexOf(ascendant);

  // 1. Detect Yogas
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

  // A. Gaja Kesari Yoga
  if (moon && jupiter) {
    const moonSign = Math.floor(moon.longitude / 30);
    const jupSign = Math.floor(jupiter.longitude / 30);
    const diff = (jupSign - moonSign + 12) % 12;
    if (diff === 0 || diff === 3 || diff === 6 || diff === 9) {
      if (rules.yogas?.["Gaja Kesari Yoga"]) {
        activeYogas.push(rules.yogas["Gaja Kesari Yoga"]);
      }
    }
  }

  // B. Budhaditya Yoga
  if (sun && mercury) {
    const sunSign = Math.floor(sun.longitude / 30);
    const mercSign = Math.floor(mercury.longitude / 30);
    if (sunSign === mercSign) {
      if (rules.yogas?.["Budhaditya Yoga"]) {
        activeYogas.push(rules.yogas["Budhaditya Yoga"]);
      }
    }
  }

  // Helper for Pancha Mahapurusha
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
    if (rules.yogas?.["Ruchaka Yoga"]) activeYogas.push(rules.yogas["Ruchaka Yoga"]);
  }
  if (isPanchaMahapurusha(mercury, ["Mithuna", "Kanya"], "Kanya")) {
    if (rules.yogas?.["Bhadra Yoga"]) activeYogas.push(rules.yogas["Bhadra Yoga"]);
  }
  if (isPanchaMahapurusha(jupiter, ["Dhanu", "Meena"], "Karka")) {
    if (rules.yogas?.["Hamsa Yoga"]) activeYogas.push(rules.yogas["Hamsa Yoga"]);
  }
  if (isPanchaMahapurusha(venus, ["Vrishabha", "Tula"], "Meena")) {
    if (rules.yogas?.["Malavya Yoga"]) activeYogas.push(rules.yogas["Malavya Yoga"]);
  }
  if (isPanchaMahapurusha(saturn, ["Makara", "Kumbha"], "Tula")) {
    if (rules.yogas?.["Sasa Yoga"]) activeYogas.push(rules.yogas["Sasa Yoga"]);
  }

  // C. Kala Sarpa Yoga
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
      if (rules.yogas?.["Kala Sarpa Yoga"]) activeYogas.push(rules.yogas["Kala Sarpa Yoga"]);
    }
  }

  // 2. Lal Kitab Placements & Remedies
  const lalKitabPlacements = [];
  const lalKitabRemedies = [];

  positions.forEach(p => {
    const lkHouse = Math.floor(p.longitude / 30) + 1;
    const houseKey = `house_${lkHouse}`;
    
    const ruleMatch = rules.lalkitab?.[p.name]?.[houseKey];
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
