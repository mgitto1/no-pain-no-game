import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const from = path.join(__dirname, 'dist', 'preload.js');
const to = path.join(__dirname, 'dist', 'preload.cjs');

if (!fs.existsSync(from)) {
  console.error(`❌ preload.js does not exist at: ${from}`);
  process.exit(1);
}

// Delete preload.cjs if it already exists
if (fs.existsSync(to)) {
  try {
    fs.unlinkSync(to);
    console.log('🗑️  Removed existing preload.cjs');
  } catch (err) {
    console.error('❌ Failed to delete existing preload.cjs:', err);
    process.exit(1);
  }
}

// Rename preload.js → preload.cjs
fs.rename(from, to, (err) => {
  if (err) {
    console.error('❌ Failed to rename preload.js to preload.cjs:', err);
    process.exit(1);
  } else {
    console.log('✅ Renamed preload.js → preload.cjs');
  }
});
