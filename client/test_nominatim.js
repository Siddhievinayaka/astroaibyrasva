async function test() {
  const query = "Slovenia Russia";
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
    headers: {
      "User-Agent": "AuraAiAstrologyTestClient/1.0 (khara@example.com)"
    }
  });
  const data = await res.json();
  console.log("Nominatim data:", data);
}

test().catch(err => console.error(err));
