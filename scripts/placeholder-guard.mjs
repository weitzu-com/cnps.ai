// Placeholder guard for the build output.
// Copy that is still waiting on owner facts is written as [[PLACEHOLDER: ...]] (for example the website-building
// service page skeleton). A production build (VERCEL_ENV=production) fails while any marker remains in the output;
// preview and local builds succeed and only print a warning, so drafts can still be reviewed on a preview URL.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const PLACEHOLDER_MARKER = '[[PLACEHOLDER';
const TEXT_FILE = /\.(?:html|xml|txt|json|md|mjs|js|css|webmanifest)$/i;

export function findPlaceholders(dir) {
  const hits = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, {withFileTypes: true})) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (TEXT_FILE.test(entry.name)) {
        const text = fs.readFileSync(file, 'utf8');
        const at = text.indexOf(PLACEHOLDER_MARKER);
        if (at < 0) continue;
        const end = text.indexOf(']]', at);
        hits.push({file: path.relative(dir, file), sample: text.slice(at, end >= 0 ? end + 2 : at + 80)});
      }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return hits;
}

export function enforcePlaceholderGuard({dir = 'dist', env = process.env} = {}) {
  const hits = findPlaceholders(dir);
  const production = env.VERCEL_ENV === 'production';
  if (hits.length && production) {
    throw new Error(`Placeholder guard: ${hits.length} file(s) in ${dir} still contain ${PLACEHOLDER_MARKER}; production build blocked. First: ${hits[0].file} ${hits[0].sample}`);
  }
  return {production, placeholders: hits.length, files: hits.map(h => h.file)};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const flag = process.argv.indexOf('--dir');
  const dir = flag > 0 ? process.argv[flag + 1] : 'dist';
  try {
    const result = enforcePlaceholderGuard({dir});
    if (result.placeholders) console.warn(`Placeholder guard: ${result.placeholders} file(s) contain ${PLACEHOLDER_MARKER} (allowed outside production): ${result.files.join(', ')}`);
    console.log(JSON.stringify({placeholderGuard: result.placeholders ? 'warn' : 'clean', placeholders: result.placeholders, production: result.production}));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
