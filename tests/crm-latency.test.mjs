import test from 'node:test';
import assert from 'node:assert/strict';
import {createBusinessStore,emptyDirectory,emptyCompany} from '../server/crm-business-store.mjs';
import {mapConcurrent} from '../server/crm-concurrency.mjs';
import {createRequestTiming} from '../server/crm-request-timing.mjs';
test('atomic live snapshots make exactly one Redis observation on every invocation',async()=>{
 let revision=0;const calls=[],redis={async get(k){calls.push(['get',k]);return {...emptyDirectory(),revision};},async mget(...keys){calls.push(['mget',...keys]);return [{...emptyDirectory(),revision},{...emptyCompany('A'),revision}];}};
 const s=createBusinessStore({},{redis});assert.equal((await s.getSnapshot('A')).directory.revision,0);revision++;
 const next=await s.getSnapshot('A');assert.equal(next.directory.revision,1);assert.equal(next.state.revision,1);
 assert.equal((await s.getSnapshot()).state,null);assert.deepEqual(calls.map(c=>c[0]),['mget','mget','get']);
 assert.deepEqual(calls[0].slice(1),['cnps:crm:business:v1:directory','cnps:crm:business:v1:company:QQ']);
 const missing=createBusinessStore({},{redis:{mget:async()=>[null,null]}});assert.equal((await missing.getSnapshot('A')).state.companyId,'A');
});
test('directory lookup concurrency is bounded, stable and fails closed',async()=>{
 let active=0,maximum=0;const result=await mapConcurrent(Array.from({length:13},(_,i)=>i),async v=>{active++;maximum=Math.max(active,maximum);await new Promise(r=>setImmediate(r));active--;return v*2;});
 assert.deepEqual(result,Array.from({length:13},(_,i)=>i*2));assert.equal(maximum,4);
 await assert.rejects(mapConcurrent([0,1,2],async v=>{if(v===1)throw Error('unavailable');return v;}),/unavailable/);
 assert.deepEqual(await mapConcurrent([],()=>assert.fail()),[]);
});
test('response timing contains only fixed phase durations and never writes after headers',async()=>{
 const headers={},res={setHeader:(k,v)=>headers[k]=v},timed=createRequestTiming(res);
 assert.equal(await timed('auth',async()=>42),42);
 await assert.rejects(timed('operation',async()=>{throw Error('private subject')}),/private subject/);
 assert.match(headers['Server-Timing'],/^auth;dur=[\d.]+, operation;dur=[\d.]+, total;dur=[\d.]+$/);assert.ok(!headers['Server-Timing'].includes('private'));
 res.headersSent=true;const old=headers['Server-Timing'];await timed('audit',async()=>{});assert.equal(headers['Server-Timing'],old);
});
