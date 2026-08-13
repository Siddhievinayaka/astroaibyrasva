import { getPlanetaryPositions } from 'vedic-astro';

async function test() {
  const loc = { latitude: 46.0569, longitude: 14.5058 }; // Ljubljana, Slovenia
  const dateParam = { iso: "2009-05-31T12:49:00+02:00" };
  const data = await getPlanetaryPositions(dateParam, loc);
  const moon = data.positions.find(p => p.name === 'Moon');
  console.log("Moon position details:", moon);
  if (moon) {
    console.log("Moon longitude:", moon.longitude);
    const rashiIdx = Math.floor(moon.longitude / 30) % 12;
    console.log("Calculated Rashi Index:", rashiIdx);
    const SIGN_INDEX = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];
    console.log("Calculated Rashi Name:", SIGN_INDEX[rashiIdx]);
  }
}

test().catch(err => console.error(err));
