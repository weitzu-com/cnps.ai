import { getCrmRuntime } from '../server/crm-runtime.mjs';
export default function handler(req, res) { return getCrmRuntime().auth(req, res); }
