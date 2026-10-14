#!/usr/bin/env node
/** Fixed read-only production diagnostics. No arbitrary SQL or SSH commands. */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const pythonCommand = (source) => `python3 -c '${source.replaceAll("'", "'\\''")}'`;

const STATUS_SOURCE = `import json,subprocess
names=["cnps-crm-server-1","cnps-crm-worker-1","cnps-crm-db-1","cnps-crm-redis-1","cnps-crm-file-gateway-1","cnps-crm-ocr-worker-1"]
items=json.loads(subprocess.check_output(["docker","inspect"]+names))
print(json.dumps({"containers":[{"name":x["Name"].lstrip("/"),"image":x["Config"]["Image"],"running":x["State"]["Running"],"status":x["State"]["Status"],"health":x["State"].get("Health",{}).get("Status"),"started_at":x["State"]["StartedAt"],"ports":x["HostConfig"].get("PortBindings")} for x in items]}))`;

const SCHEMA_SQL = `SELECT json_build_object(
  'database', current_database(),
  'server_version', current_setting('server_version'),
  'read_only', current_setting('transaction_read_only'),
  'tables', COALESCE((SELECT json_agg(row_to_json(t)) FROM (
    SELECT table_schema AS schema, table_name AS name,
      json_agg(json_build_object('name',column_name,'type',data_type,'nullable',is_nullable='YES') ORDER BY ordinal_position) AS columns
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog','information_schema')
    GROUP BY table_schema, table_name ORDER BY table_schema, table_name
  ) t), '[]'::json)
);`;

const DATABASE_SOURCE = `import subprocess
sql=${JSON.stringify(SCHEMA_SQL)}
result=subprocess.run(["docker","exec","-e","PGOPTIONS=-c default_transaction_read_only=on -c statement_timeout=5000","cnps-crm-db-1","psql","-U","cnps","-d","cnps","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",sql],text=True,capture_output=True)
if result.returncode:
    raise SystemExit(result.stderr)
print(result.stdout.strip())`;

const BACKUP_SOURCE = `import json,pathlib,subprocess
root=pathlib.Path("/var/backups/cnps-crm")
verified=sorted(root.glob("*.enc.verified.json"),key=lambda p:p.stat().st_mtime,reverse=True)
latest=verified[0] if verified else None
status=subprocess.check_output(["systemctl","show","cnps-crm-backup.service","-p","Result","-p","ExecMainStatus"],text=True)
timer=subprocess.check_output(["systemctl","is-active","cnps-crm-backup.timer"],text=True).strip()
print(json.dumps({"timer":timer,"service_status":dict(line.split("=",1) for line in status.splitlines() if "=" in line),"verified_backup_count":len(verified),"latest_verified_sidecar":latest.name if latest else None,"latest_verified_at_epoch":latest.stat().st_mtime if latest else None}))`;

export const productionTools = [
  { name: 'server_status', description: 'Read CNPS production container status and published ports through the configured SSH alias.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
  { name: 'database_schema', description: 'Read table and column definitions only from PostgreSQL. The database session enforces read-only transactions and a five second statement timeout.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
  { name: 'backup_status', description: 'Read backup timer/service status and verified backup filenames and timestamps. Does not read backup contents or encryption keys.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
];

const commands = Object.freeze({ server_status: pythonCommand(STATUS_SOURCE), database_schema: pythonCommand(DATABASE_SOURCE), backup_status: pythonCommand(BACKUP_SOURCE) });

export async function runProductionTool(name, args = {}) {
  if (!Object.hasOwn(commands, name)) throw new Error('Unknown read-only diagnostic');
  if (!args || typeof args !== 'object' || Array.isArray(args) || Object.keys(args).length !== 0) throw new Error('This diagnostic accepts no arguments');
  const host = process.env.CNPS_CRM_SSH_HOST || 'cnps-crm-hk';
  if (!/^[A-Za-z0-9][A-Za-z0-9_.@-]*$/.test(host)) throw new Error('Invalid configured SSH host');
  const { stdout } = await execFileAsync('ssh', ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=10', host, commands[name]], { timeout: 30000, maxBuffer: 1024 * 1024 });
  return JSON.parse(stdout);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const name = process.argv[2];
  if (!Object.hasOwn(commands, name)) {
    console.error('Usage: node dev-infrastructure/ops.mjs server_status|database_schema|backup_status');
    process.exitCode = 2;
  } else {
    try { console.log(JSON.stringify(await runProductionTool(name), null, 2)); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
