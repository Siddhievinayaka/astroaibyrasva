import { getPlanetaryPositions } from 'vedic-astro';
import { getKundali } from './src/utils/astrologyEngine.js';

async function test() {
  const lat = 46.0569;
  const lon = 14.5058;
  const date = "2009-05-31";
  const time = "12:49";
  
  let estimatedTz = Math.round((lon / 15) * 2) / 2; // 1.0
  const absTz = Math.abs(estimatedTz);
  const offsetHours = Math.floor(absTz);
  const offsetMins = Math.round((absTz % 1) * 60);
  const sign = estimatedTz >= 0 ? "+" : "-";
  const offsetStr = `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
  const formattedIso = `${date}T${time}:00${offsetStr}`;

  const loc = { latitude: lat, longitude: lon };
  const dateParam = { iso: formattedIso };

  const data = await getPlanetaryPositions(dateParam, loc);
  const customKundali = getKundali(data, { system: 'whole-sign' });
  
  const moon = data.positions.find(p => p.name === 'Moon');
  console.log("Moon Longitude:", moon.longitude);
  const rashiIdx = Math.floor(moon.longitude / 30) % 12;
  const SIGN_INDEX = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];
  console.log("Moon Rashi:", SIGN_INDEX[rashiIdx]);
  console.log("Lagna Ascendant:", customKundali.ascendant);
}

test().catch(err => console.error(err));
