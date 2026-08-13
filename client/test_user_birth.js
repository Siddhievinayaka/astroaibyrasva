import { getPlanetaryPositions } from 'vedic-astro';

async function test() {
  const loc = { latitude: 18.5251, longitude: 73.8696 }; // Sassoon Hospital, Pune, India
  const dateParam = { iso: "2004-09-29T16:15:00+05:30" };
  const data = await getPlanetaryPositions(dateParam, loc);
  const moon = data.positions.find(p => p.name === 'Moon');
  console.log("Moon longitude for user:", moon ? moon.longitude : "not found");
  if (moon) {
    const rashiIdx = Math.floor(moon.longitude / 30) % 12;
    const SIGN_INDEX = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];
    console.log("Calculated User Rashi Name:", SIGN_INDEX[rashiIdx]);
  }
}

test().catch(err => console.error(err));
