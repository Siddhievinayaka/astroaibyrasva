import React from 'react';
import { SIGN_INDEX } from '../utils/astrologyEngine';

export function NorthIndianChart({ houses, ascendant, selectedHouse, onSelectHouse }) {
  const ascSignIdx = SIGN_INDEX.indexOf(ascendant);
  if (ascSignIdx === -1) return null;

  const getHouseSignName = (h) => SIGN_INDEX[(ascSignIdx + h - 1) % 12];
  const getHouseSignNum = (h) => ((ascSignIdx + h - 1) % 12) + 1;

  const houseTextCoords = {
    1: { x: 200, y: 80 },    // H1 (Top Diamond)
    2: { x: 100, y: 40 },    // H2 (Top Left Triangle)
    3: { x: 40, y: 100 },    // H3 (Left Top Triangle)
    4: { x: 80, y: 190 },    // H4 (Left Diamond)
    5: { x: 40, y: 300 },    // H5 (Left Bottom Triangle)
    6: { x: 100, y: 345 },   // H6 (Bottom Left Triangle)
    7: { x: 200, y: 280 },   // H7 (Bottom Diamond)
    8: { x: 300, y: 345 },   // H8 (Bottom Right Triangle)
    9: { x: 360, y: 300 },   // H9 (Right Bottom Triangle)
    10: { x: 320, y: 190 },  // H10 (Right Diamond)
    11: { x: 360, y: 100 },  // H11 (Right Top Triangle)
    12: { x: 300, y: 40 }    // H12 (Top Right Triangle)
  };

  const correctPolygons = {
    1: "200,200 100,100 200,0 300,100",
    2: "200,0 100,100 0,0",
    3: "0,0 100,100 0,200",
    4: "200,200 100,100 0,200 100,300",
    5: "0,200 100,300 0,400",
    6: "0,400 100,300 200,400",
    7: "200,200 100,300 200,400 300,300",
    8: "200,400 300,300 400,400",
    9: "400,400 300,300 400,200",
    10: "200,200 300,300 400,200 300,100",
    11: "400,200 300,100 400,0",
    12: "400,0 300,100 200,0"
  };

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full font-sans select-none drop-shadow-2xl">
      <rect width="400" height="400" fill="none" />
      
      {Object.keys(correctPolygons).map((hKey) => {
        const hNum = Number(hKey);
        const isSelected = hNum === selectedHouse;
        return (
          <polygon 
            key={hKey} 
            points={correctPolygons[hKey]} 
            fill={isSelected ? "rgba(99, 102, 241, 0.15)" : "transparent"}
            stroke={isSelected ? "rgba(192, 132, 252, 0.45)" : "transparent"}
            strokeWidth="2"
            className="cursor-pointer hover:fill-indigo-500/10 transition-all duration-200"
            onClick={() => onSelectHouse(hNum)}
          />
        );
      })}

      <rect width="400" height="400" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="2.5" />
      <line x1="0" y1="0" x2="400" y2="400" stroke="rgba(99, 102, 241, 0.35)" strokeWidth="1.5" />
      <line x1="400" y1="0" x2="0" y2="400" stroke="rgba(99, 102, 241, 0.35)" strokeWidth="1.5" />
      <polygon points="200,0 0,200 200,400 400,200" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="2" />

      {Object.keys(houseTextCoords).map((hKey) => {
        const hNum = Number(hKey);
        const coords = houseTextCoords[hKey];
        const signNum = getHouseSignNum(hNum);
        const signName = getHouseSignName(hNum);
        
        const houseData = houses.find(h => h.sign === signName);
        const housePlanets = houseData ? houseData.planets : [];

        return (
          <g key={hKey} className="pointer-events-none">
            <text 
              x={coords.x} 
              y={coords.y} 
              fill="var(--color-cosmic-gold)" 
              fontSize="11" 
              fontWeight="bold" 
              textAnchor="middle" 
              className="opacity-80"
            >
              {signNum}
            </text>
            
            {housePlanets.map((planet, pIdx) => {
              const xOffset = housePlanets.length > 2 ? (pIdx % 2 === 0 ? -16 : 16) : 0;
              const yOffset = housePlanets.length > 2 
                ? (Math.floor(pIdx / 2) * 14 + 14) 
                : (pIdx * 14 + 14);

              return (
                <text 
                  key={pIdx}
                  x={coords.x + xOffset} 
                  y={coords.y + yOffset} 
                  fill={planet === 'Rahu' || planet === 'Ketu' ? '#c084fc' : 'var(--color-planet-text)'} 
                  fontSize="10" 
                  fontWeight="bold"
                  textAnchor="middle"
                  className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                >
                  {planet}
                </text>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export function SouthIndianChart({ houses, ascendant, selectedHouse, onSelectHouse }) {
  const signToGridIndex = {
    "Mesha": 1, "Vrishabha": 2, "Mithuna": 3, "Karka": 4, 
    "Simha": 5, "Kanya": 6, "Tula": 7, "Vrishchika": 8, 
    "Dhanu": 9, "Makara": 10, "Kumbha": 11, "Meena": 0
  };

  const gridIndexToSign = {
    1: "Mesha", 2: "Vrishabha", 3: "Mithuna", 4: "Karka", 
    5: "Simha", 6: "Kanya", 7: "Tula", 8: "Vrishchika", 
    9: "Dhanu", 10: "Makara", 11: "Kumbha", 0: "Meena"
  };

  const getBoxCoords = (gridIdx) => {
    const row = Math.floor(gridIdx / 4);
    const col = gridIdx % 4;
    return { x: col * 100, y: row * 100 };
  };

  const validGridIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const ascSignIdx = SIGN_INDEX.indexOf(ascendant);
  if (ascSignIdx === -1) return null;

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full font-sans select-none drop-shadow-2xl">
      <rect width="400" height="400" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="2.5" />
      <rect x="100" y="100" width="200" height="200" fill="rgba(255, 255, 255, 0.85)" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" />
      <text x="200" y="195" fill="rgba(139, 92, 246, 0.75)" fontSize="12" fontWeight="bold" textAnchor="middle">KUNDALI</text>
      <text x="200" y="215" fill="rgba(217, 119, 6, 0.85)" fontSize="10" fontWeight="semibold" textAnchor="middle">Vimshottari D-1</text>
      
      {validGridIndices.map((gridIdx) => {
        const coords = getBoxCoords(gridIdx);
        const signName = gridIndexToSign[gridIdx];
        const signIdx = SIGN_INDEX.indexOf(signName);
        const houseNum = ((signIdx - ascSignIdx + 12) % 12) + 1;
        const isSelected = houseNum === selectedHouse;
        
        const houseData = houses.find(h => h.sign === signName);
        const housePlanets = houseData ? houseData.planets : [];
        const isAscendant = signName === ascendant;

        return (
          <g key={gridIdx} className="cursor-pointer" onClick={() => onSelectHouse(houseNum)}>
            <rect 
              x={coords.x} 
              y={coords.y} 
              width="100" 
              height="100" 
              fill={isSelected ? "rgba(99, 102, 241, 0.15)" : "transparent"} 
              stroke={isSelected ? "rgba(192, 132, 252, 0.45)" : "rgba(99, 102, 241, 0.25)"} 
              strokeWidth={isSelected ? "2" : "1"}
              className="hover:fill-indigo-500/10 transition-colors"
            />

            <text 
              x={coords.x + 8} 
              y={coords.y + 18} 
              fill="var(--color-cosmic-gold)" 
              fontSize="9.5" 
              fontWeight="bold" 
              className="opacity-70"
            >
              {signName.substring(0, 3)}
            </text>

            <text 
              x={coords.x + 92} 
              y={coords.y + 18} 
              fill="rgba(71, 85, 105, 0.6)" 
              fontSize="9" 
              fontWeight="medium" 
              textAnchor="end"
            >
              H{houseNum}
            </text>

            {isAscendant && (
              <line 
                x1={coords.x + 5} 
                y1={coords.y + 95} 
                x2={coords.x + 95} 
                y2={coords.y + 5} 
                stroke="rgba(217, 119, 6, 0.35)" 
                strokeWidth="1.5" 
              />
            )}
            {isAscendant && (
              <text 
                x={coords.x + 75} 
                y={coords.y + 90} 
                fill="var(--color-cosmic-gold)" 
                fontSize="8.5" 
                fontWeight="bold"
              >
                ASC
              </text>
            )}

            {housePlanets.map((planet, pIdx) => {
              const yOffset = pIdx * 14 + 40;
              return (
                <text 
                  key={pIdx}
                  x={coords.x + 50} 
                  y={coords.y + yOffset} 
                  fill={planet === 'Rahu' || planet === 'Ketu' ? '#c084fc' : 'var(--color-planet-text)'} 
                  fontSize="9.5" 
                  fontWeight="bold"
                  textAnchor="middle"
                  className="drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.15)]"
                >
                  {planet}
                </text>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
