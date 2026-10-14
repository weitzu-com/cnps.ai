import { createInterface } from 'node:readline';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const cwd = fileURLToPath(new URL('../', import.meta.url));
const projectId = 'prj_QxCNPtwoD0d7XCFGQiOqceP0Qoso';
const teamId = 'team_NeVMsoOye9JK4gzGEmmRlL2X';
const supportedVersions = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
let initialized = false;
const tools = [
  ['development_status', 'Inspect checkout branch, Node version and GitHub authentication readiness.'],
  ['github_repository', 'Read the CNPS repository and main branch from GitHub.'],
  ['vercel_project', 'Read CNPS Vercel project, Git integration and deployment status using existing local CLI authentication.'],
  ['vercel_environment_names', 'List environment variable names and target environments; never returns values.']
].map(([name, description]) => ({name, description, inputSchema: {type:'object', properties:{}, additionalProperties:false}, annotations:{readOnlyHint:true, destructiveHint:false}}));

async function request(url, headers = {}) {
  const r = await fetch(url, {headers, signal:AbortSignal.timeout(20000), redirect:'error'});
  if (!r.ok) throw new Error(`Service returned HTTP ${r.status}. Check the existing account connection.`);
  return r.json();
}
async function vercel(path) {
  const auth = JSON.parse(await readFile(homedir()+'/Library/Application Support/com.vercel.cli/auth.json','utf8'));
  if (!auth.token) throw new Error('Run vercel login to reconnect the existing Vercel account.');
  return request('https://api.vercel.com'+path+'?teamId='+teamId, {Authorization:'Bearer '+auth.token});
}
async function call(name, args) {
  if (args !== undefined && (!args || typeof args !== 'object' || Array.isArray(args) || Object.keys(args).length)) throw new Error('This tool accepts an empty object only.');
  if (name === 'development_status') {
    const [branch, remote, auth] = await Promise.allSettled([
      run('/usr/bin/git',['branch','--show-current'],{cwd,timeout:10000}),
      run('/usr/bin/git',['remote','get-url','origin'],{cwd,timeout:10000}),
      run(homedir()+'/.local/bin/gh',['auth','status','--hostname','github.com'],{timeout:10000})
    ]);
    return {directory:cwd, node:process.version, branch:branch.status==='fulfilled'?branch.value.stdout.trim():null,
      repository:remote.status==='fulfilled'?remote.value.stdout.trim():null, githubAuthenticated:auth.status==='fulfilled',
      localCrm:'http://localhost:4174/crm', command:'npm run dev:crm', data:'Synthetic in-memory data; resets on restart.'};
  }
  if (name === 'github_repository') {
    const [r,b] = await Promise.all([request('https://api.github.com/repos/weitzu-com/cnps.ai'),request('https://api.github.com/repos/weitzu-com/cnps.ai/branches/main')]);
    return {name:r.full_name,url:r.html_url,defaultBranch:r.default_branch,mainCommit:b.commit.sha};
  }
  if (name === 'vercel_project') {
    const p = await vercel('/v9/projects/'+projectId);
    return {id:p.id,name:p.name,teamId,productionBranch:p.link?.productionBranch,repository:p.link?.org+'/'+p.link?.repo,
      nodeVersion:p.nodeVersion,deployments:p.latestDeployments?.map(x=>({id:x.id,url:x.url,readyState:x.readyState,target:x.target}))};
  }
  if (name === 'vercel_environment_names') {
    const p = await vercel('/v9/projects/'+projectId+'/env');
    return {projectId,variables:p.envs?.map(x=>({name:x.key,targets:x.target,branch:x.gitBranch||null})),valuesReturned:false};
  }
  throw new Error('Unknown tool.');
}
const respond = message => process.stdout.write(JSON.stringify(message)+'\n');
for await (const line of createInterface({input:process.stdin,crlfDelay:Infinity})) {
  let m;
  try {m=JSON.parse(line);} catch {respond({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid JSON'}});continue;}
  if (!m || Array.isArray(m) || m.jsonrpc!=='2.0' || typeof m.method!=='string') {respond({jsonrpc:'2.0',id:m?.id??null,error:{code:-32600,message:'Invalid JSON-RPC request'}});continue;}
  if (!Object.hasOwn(m,'id')) continue;
  try {
    let result;
    if (m.method==='initialize') {initialized=true;result={protocolVersion:supportedVersions.includes(m.params?.protocolVersion)?m.params.protocolVersion:supportedVersions[0],capabilities:{tools:{}},serverInfo:{name:'cnps-development',version:'1.0.0'}};}
    else if (m.method==='ping') result={};
    else if (!initialized) {respond({jsonrpc:'2.0',id:m.id,error:{code:-32002,message:'Initialize this MCP server first'}});continue;}
    else if (m.method==='tools/list') result={tools};
    else if (m.method==='tools/call') {
      try {result={content:[{type:'text',text:JSON.stringify(await call(m.params?.name,m.params?.arguments))}]};}
      catch(e) {result={isError:true,content:[{type:'text',text:e.message}]};}
    } else {respond({jsonrpc:'2.0',id:m.id,error:{code:-32601,message:'Method not supported'}});continue;}
    respond({jsonrpc:'2.0',id:m.id,result});
  } catch {respond({jsonrpc:'2.0',id:m.id,error:{code:-32603,message:'Request failed'}});}
}
