const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, 'node_modules/astronomia/lib');
const pkgPath = path.join(__dirname, 'node_modules/astronomia/package.json');
const cachePath = path.join(__dirname, 'node_modules/.cache');

// Recursive helper to find files
function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else {
      files.push(name);
    }
  }
  return files;
}

try {
  // 1. Process and rename all .cjs files in the lib/ folder to .js (CommonJS files)
  if (fs.existsSync(libDir)) {
    console.log('Renaming and patching all .cjs files to .js inside astronomia/lib...');
    const allFiles = getFiles(libDir);
    
    allFiles.forEach(file => {
      if (file.endsWith('.cjs')) {
        let content = fs.readFileSync(file, 'utf8');
        
        // Replace relative requires to point to .js instead of .cjs
        content = content.replace(/\.cjs/g, '.js');
        
        // Patch exports to expose namespace object if default export is missing (Idempotent check)
        content = content.replace(/exports\.([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\["default"\]\s*(?!\|\|);?/g, (match, p1, p2) => {
          if (p1 === p2) {
            return `exports.${p1} = ${p1}["default"] || ${p1};`;
          }
          return match;
        });
        
        const newPath = file.slice(0, -4) + '.js';
        fs.writeFileSync(newPath, content, 'utf8');
        
        // Delete original .cjs file
        fs.unlinkSync(file);
      }
    });
    console.log('Finished renaming lib files.');

    // Write a sub-package.json to force Webpack/Node to parse lib/ folder as CommonJS
    // instead of ES Modules, resolving "exports is not defined" ReferenceError.
    const libPkgPath = path.join(libDir, 'package.json');
    console.log('Writing lib/package.json type specifier...');
    fs.writeFileSync(libPkgPath, JSON.stringify({ type: 'commonjs' }, null, 2), 'utf8');
    console.log('lib/package.json type set to commonjs.');
  }

  // 2. Patch package.json exports to point to .js files inside lib/ (CommonJS) 
  // and src/ (ES Modules) to maintain proper Webpack/CommonJS interop resolution.
  if (fs.existsSync(pkgPath)) {
    console.log('Updating astronomia package.json targets...');
    let content = fs.readFileSync(pkgPath, 'utf8');
    
    // Replace all ".cjs" extension targets with ".js" extension targets
    content = content.replace(/\.cjs/g, '.js');
    
    // Force all "require" paths to point to "./lib/..." (CommonJS)
    // rather than "./src/..." (ES Modules) to resolve Webpack interop issues.
    content = content.replace(/"require":\s*"\.\/src\/([a-zA-Z0-9_\/]+)\.js"/g, '"require": "./lib/$1.js"');
    
    fs.writeFileSync(pkgPath, content, 'utf8');
    console.log('package.json targets updated successfully.');
  }

  // 4. Patch vedic-astro's ephemeris.js to fix Moon's longitude calculations
  const ephemerisPath = path.join(__dirname, 'node_modules/vedic-astro/dist/modules/ephemeris.js');
  if (fs.existsSync(ephemerisPath)) {
    console.log('Patching vedic-astro Moon longitude bug...');
    let content = fs.readFileSync(ephemerisPath, 'utf8');
    const targetText = `    const moonPos = astronomia_1.moonposition.position(jd);
    const moonEcl = moonPos.lon;
    positions.push({
        name: 'Moon',
        longitude: applyAyanamsha(moonEcl, options.ayanamsha ?? 'lahiri'),`;
    const replacementText = `    const moonPos = astronomia_1.moonposition.position(jd);
    const epsilon = astronomia_1.nutation.meanObliquity(jd);
    const eq = new astronomia_1.coord.Equatorial(moonPos.ra, moonPos.dec);
    const ecl = eq.toEcliptic(epsilon);
    const moonEclDeg = ecl.lon * 180 / Math.PI;
    positions.push({
        name: 'Moon',
        longitude: applyAyanamsha(moonEclDeg, options.ayanamsha ?? 'lahiri'),`;
    if (content.includes(targetText)) {
      content = content.replace(targetText, replacementText);
      fs.writeFileSync(ephemerisPath, content, 'utf8');
      console.log('vedic-astro Moon longitude patched successfully!');
    } else {
      console.log('vedic-astro target text not found, check if already patched.');
    }
  }
  
  console.log('Astronomia compatibility patches applied successfully!');
} catch (err) {
  console.error('Error applying patch:', err);
}
