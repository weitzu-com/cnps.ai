import test from 'node:test';import assert from 'node:assert/strict';import{EventEmitter}from'node:events';import{completedResponseAudit}from'../server/crm-response-audit.mjs';
test('served-file audit waits for finish and durable recording; early disconnect never claims a file response',async()=>{
 let count=0,release;const res=new EventEmitter(),pending=completedResponseAudit({method:'GET'},res,async()=>{count++;await new Promise(r=>{release=r})});
 assert.equal(count,0);res.emit('finish');await new Promise(r=>setImmediate(r));assert.equal(count,1);
 let done=false;pending.then(()=>{done=true});await new Promise(r=>setImmediate(r));assert.equal(done,false);release();await pending;assert.equal(done,true);
 const closed=new EventEmitter(),p=completedResponseAudit({method:'GET'},closed,async()=>{count++});closed.emit('close');await p;closed.emit('finish');await new Promise(r=>setImmediate(r));assert.equal(count,1);
 await completedResponseAudit({method:'HEAD'},new EventEmitter(),async()=>{count++});assert.equal(count,1);
});
