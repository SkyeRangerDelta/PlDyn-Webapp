const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const [,, version] = process.argv;

if (!version) {
  console.error('Usage: node update-deno-version.js <version>');
  process.exit(1);
}

const denoJsonPath = path.join(__dirname, '..', 'backend', 'deno.json');
const denoJson = JSON.parse(readFileSync(denoJsonPath, 'utf8'));
denoJson.version = version;
writeFileSync(denoJsonPath, JSON.stringify(denoJson, null, 2) + '\n');
console.log(`Updated backend/deno.json to version ${version}`);
