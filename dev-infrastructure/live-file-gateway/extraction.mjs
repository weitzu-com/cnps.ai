import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import * as fs from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash,createCipheriv,createDecipheriv,randomBytes,randomUUID} from 'node:crypto';
import {GatewayError} from './errors.mjs';
const flights=new Map();let workers=0;let workerTail=Promise.resolve();
export async function extractText({content,meta,dataDir,encryptionKey}){
 const aad=Buffer.from(JSON.stringify({schema:2,id:meta.id,companyId:meta.companyId,projectId:meta.projectId}));
 const key=createHash('sha256').update('CNPS_KB_INDEX_V2').update(Buffer.from(encryptionKey,'hex')).digest();
 const file=path.join(dataDir,meta.id+'.kb2.enc');
 try{
  const h=await fs.open(file,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{const s=await h.stat();if(!s.isFile()||(s.mode&0o077)||s.size>2500000)throw Error();const b=await h.readFile();const d=createDecipheriv('aes-256-gcm',key,b.subarray(8,20));d.setAAD(aad);d.setAuthTag(b.subarray(20,36));if(b.subarray(0,8).toString()!=='CNPSKBI2')throw Error();return JSON.parse(Buffer.concat([d.update(b.subarray(36)),d.final()]));}finally{await h.close();}
 }catch(e){if(e.code!=='ENOENT')throw new GatewayError(503,'index_unavailable');}
 if(flights.has(meta.id))return flights.get(meta.id);
 if(workers>=2)throw new GatewayError(503,'extractor_busy');
 const job=(async()=>{workers++;try{
  const ocrMimes=new Set(['application/pdf','image/png','image/jpeg','application/msword','application/vnd.ms-powerpoint']);
  const worker=async()=>{let release;const previous=workerTail;workerTail=new Promise(resolve=>release=resolve);await previous;try{const r=await fetch('http://ocr-worker:3300/extract',{method:'POST',redirect:'error',signal:AbortSignal.timeout(90000),headers:{Authorization:'Bearer '+process.env.CRM_OCR_WORKER_KEY,'Content-Type':meta.mimeType},body:content});if(!r.ok)throw new GatewayError(503,'extractor_busy');const text=await r.text();if(text.length>2400000)throw new GatewayError(413,'text_too_large');const value=JSON.parse(text);if(!Array.isArray(value.segments))throw new GatewayError(503,'extraction_failed');return value;}finally{release();}};
  const result=ocrMimes.has(meta.mimeType)?await worker():await new Promise((resolve,reject)=>{
   const child=spawn(process.env.CRM_EXTRACT_PYTHON||'python3',[path.join(path.dirname(fileURLToPath(import.meta.url)),'extract.py'),meta.mimeType],{stdio:['pipe','pipe','ignore'],env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8'}});
   const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new GatewayError(503,'extraction_timeout'));},12000);const buffers=[];let count=0;
   child.stdout.on('data',b=>{count+=b.length;if(count>2400000){child.kill('SIGKILL');reject(new GatewayError(413,'text_too_large'));}else buffers.push(b);});
   child.on('error',()=>{clearTimeout(timer);reject(new GatewayError(503,'extractor_unavailable'));});child.stdin.on('error',()=>{});
   child.on('close',code=>{clearTimeout(timer);try{const value=JSON.parse(Buffer.concat(buffers));if(![0,2].includes(code)||!Array.isArray(value.segments))throw Error();resolve(value);}catch{reject(new GatewayError(503,'extraction_failed'));}});child.stdin.end(content);
  });
  const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);c.setAAD(aad);const body=Buffer.concat([c.update(JSON.stringify(result)),c.final()]);
  const temporary=file+'.'+randomUUID()+'.tmp';let handle;try{handle=await fs.open(temporary,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);await handle.writeFile(Buffer.concat([Buffer.from('CNPSKBI2'),iv,c.getAuthTag(),body]));await handle.sync();await handle.close();handle=null;await fs.rename(temporary,file);}finally{if(handle)await handle.close();await fs.unlink(temporary).catch(()=>{});}return result;
 }finally{workers--;}})();flights.set(meta.id,job);try{return await job;}finally{flights.delete(meta.id);}
}
