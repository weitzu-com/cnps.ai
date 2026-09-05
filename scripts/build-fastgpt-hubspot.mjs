import fs from 'node:fs';
import {validateConfig} from '../site/fastgpt-assets/inquiry.mjs';

// Only these public form identifiers are copied into the static site. No API token is needed.
try { process.loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const saved = JSON.parse(fs.readFileSync('content/integrations/fastgpt-hubspot.json', 'utf8'));
const config = {
  portalId: process.env.HUBSPOT_PORTAL_ID ?? saved.portalId,
  formId: process.env.HUBSPOT_FORM_ID ?? saved.formId,
  fields: Object.fromEntries(['name', 'email', 'company', 'region', 'message', 'subject'].map(key => [key, saved.fields[key]])),
};
if (config.formId) validateConfig(config);
else console.warn('FastGPT: HUBSPOT_FORM_ID is missing; inquiries will use the email draft fallback.');
if (process.env.FASTGPT_REQUIRE_HUBSPOT === '1') validateConfig(config);
fs.writeFileSync('dist/fastgpt-assets/hubspot-config.json', JSON.stringify(config, null, 2) + '\n');
