import { readFile,writeFile,mkdir,chmod } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { createHash } from 'node:crypto';
import { Redis } from '@upstash/redis';
import { encrypt,decrypt,digest } from '../server/proposal-crypto.mjs';
import { proposalBinding } from '../server/proposal-crm.mjs';
import { createBusinessStore } from '../server/crm-business-store.mjs';
export const MIGRATION_ID='crm-access-unification-v1';
const clone=v=>structuredClone(v);
export function planProposalMigration(directory,states,phones,secret,now=Date.now()){
 const next=clone(directory),changes=[];next.proposalGrants||={};next.migrations||={};
 if(next.migrations[MIGRATION_ID])return {next:directory,changes,alreadyApplied:true};
 for(const phone of phones){
  const identityId=digest(secret,'phone',phone),grant=directory.memberGrants[identityId],assignment=directory.managerAssignments[identityId],state=states[proposalBinding.companyId],project=state?.projects[proposalBinding.projectId];
  const member=grant?.active&&grant.companyId===proposalBinding.companyId,manager=assignment?.active&&assignment.companyIds.includes(proposalBinding.companyId);
  if(directory.identities?.[identityId]?.disabled||(!member&&!manager)||!project)continue;
  if(member&&(!project.publication||(grant.projectScope!=='all'&&!grant.projectIds.includes(project.id))))continue;
  const sources=Object.values(proposalBinding.documents);
  if(sources.some(source=>{const doc=state.documents[source.documentId];return !doc||doc.projectId!==project.id||doc.activeVersionId!==source.versionId||!doc.versions.some(v=>v.id===source.versionId&&v.withdrawnAt==null&&Number.isFinite(v.publishedAt))||(member&&grant.documentScope!=='all'&&!grant.documentIds.includes(doc.id));}))continue;
  const key=identityId;
  if(Object.hasOwn(next.proposalGrants,key))continue;
  const download=manager||(grant.operations||['view','download']).includes('download');
  next.proposalGrants[key]={id:key,identityId,phoneMasked:phone.slice(0,3)+'****'+phone.slice(-4),proposalId:proposalBinding.id,assetIds:download?Object.keys(proposalBinding.documents):[],operations:download?['view','download']:['view'],active:true,version:1,legacyRestricted:true,grantedBy:'migration:'+MIGRATION_ID,updatedAt:now};
  changes.push({identityId,proposalId:proposalBinding.id,operations:next.proposalGrants[key].operations,legacyRestricted:true});
 }
 next.migrations[MIGRATION_ID]={at:now,grantsCreated:changes.length,sourceCount:phones.length};next.revision=directory.revision+1;
 next.events.push({id:'migration:'+MIGRATION_ID,actorId:'migration',action:'proposal.migrate',at:now,grantsCreated:changes.length});
 return {next,changes,alreadyApplied:false};
}
async function main(){
 const args=process.argv.slice(2),envFiles=args.filter(a=>a.startsWith('--env=')).map(a=>a.slice(6));
 for(const file of envFiles)for(const [k,v] of Object.entries(parseEnv(await readFile(file,'utf8'))))if(v!=='[SENSITIVE]')process.env[k]=v;
 const env=process.env,url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN;
 if(!url||!token||!env.CNPS_PROPOSAL_SECRET)throw Error('Backup credentials are unavailable');
 const redis=new Redis({url,token}),store=createBusinessStore(env,{redis});
 const output=resolve(args.find(a=>a.startsWith('--output='))?.slice(9)||'../output/crm-access-implementation');await mkdir(output,{recursive:true,mode:0o700});await chmod(output,0o700);
 const keys=[];let cursor=0;do{const page=await redis.scan(cursor,{match:'cnps:crm:business:v1:*',count:100});cursor=Number(page[0]);keys.push(...page[1]);}while(cursor!==0);
 const unique=[...new Set(keys)].sort(),raw=unique.length?await redis.mget(...unique):[],snapshot={at:Date.now(),entries:unique.map((key,i)=>({key,value:raw[i]}))};
 const plaintext=Buffer.from(JSON.stringify(snapshot)),bytes=encrypt(plaintext,env.CNPS_PROPOSAL_SECRET),backup=resolve(output,'access-backup-'+Date.now()+'.enc');
 await writeFile(backup,bytes,{mode:0o600,flag:'wx'});
 if(!decrypt(await readFile(backup),env.CNPS_PROPOSAL_SECRET).equals(plaintext))throw Error('Encrypted backup verification failed');
 const directory=await store.getDirectory(),states={};for(const c of Object.keys(directory.companies))states[c]=await store.getCompany(c);
 const phones=[...new Set(String(env.CNPS_PROPOSAL_ALLOWED_PHONES||'').split(',').map(p=>p.trim().replace(/^\+86/,'')).filter(p=>/^1[3-9]\d{9}$/.test(p)))];
 // Verify this recovery key also opens the deployed encrypted content before writing any grants.
 const bundle=JSON.parse(decrypt(await readFile(new URL('../private/proposal.enc',import.meta.url)),env.CNPS_PROPOSAL_SECRET));if(!bundle.html||!bundle.assets)throw Error('Proposal recovery verification failed');
 const result=planProposalMigration(directory,states,phones,env.CNPS_PROPOSAL_SECRET);
 const report={mode:args.includes('--apply')?'apply':'dry-run',backup,backupSha256:createHash('sha256').update(bytes).digest('hex'),verified:true,keyCount:unique.length,directoryRevision:directory.revision,existingMembers:Object.keys(directory.memberGrants).length,partnerGrants:Object.keys(directory.partnerGrants||{}).length,sourceCount:phones.length,changes:result.changes,alreadyApplied:result.alreadyApplied};
 if(args.includes('--apply')&&!result.alreadyApplied){if(!await store.commitDirectory(directory.revision,result.next))throw Error('Directory changed: migration did not commit');const actual=await store.getDirectory();if(JSON.stringify(actual)!==JSON.stringify(result.next))throw Error('Migration readback mismatch');report.appliedRevision=actual.revision;}
 await writeFile(resolve(output,'migration-'+report.mode+'.json'),JSON.stringify(report,null,2),{mode:0o600});
 console.log(JSON.stringify({...report,changes:report.changes.map(c=>({proposalId:c.proposalId,operations:c.operations,legacyRestricted:true}))},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(fileURLToPath(import.meta.url)))main().catch(()=>{console.error('CRM backup/migration failed; no credentials or source data logged. Check connectivity, configuration and directory revision.');process.exitCode=1;});
