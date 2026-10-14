import { randomBytes } from 'node:crypto';
import { createBusinessService } from '../../server/crm-business-service.mjs';
import { createCrmAuthHandler } from '../../server/crm-auth-handler.mjs';
import { createBusinessHandler } from '../../server/crm-business-handler.mjs';
import { createWasionPageHandler } from '../../api/crm-wasion-demo-page.js';
import { createWasionSearchHandler } from '../../server/wasion-demo.mjs';
import { wasionPreviewBinding as binding } from '../../server/crm-project-previews.mjs';

// Isolated synthetic directory and SMS provider. Never connects to production.
export function isolationFixture() {
 const phones={admin:'18700001111',wasion:'18800002222',other:'18900003333',unassigned:'18500004444',manager:'18300005555',otherManager:'18200006666'};
 const env={CNPS_PROPOSAL_SECRET:randomBytes(32).toString('hex'),CNPS_CRM_ADMIN_PHONE:phones.admin};
 let service, projectReads=0, modelCalls=0;
 const companyId=binding.companyId,projectId=binding.projectId,otherCompany='other-company';
 const directory={revision:1,companies:{[companyId]:{companyId},[otherCompany]:{companyId:otherCompany}},managerAssignments:{},memberGrants:{},events:[]};
 const project={id:projectId,companyId,title:'Wasion customer preview fixture',objective:'Review website and AI search',scope:'Synthetic isolated verification',deliverables:['Website demo'],status:'proposed',processGroup:'initiating',version:1};
 const publication={project:structuredClone(project),records:{},version:1,at:Date.now()};
 const states=new Map([[companyId,{revision:1,companyId,projects:{[projectId]:{...project,publication}},records:{},documents:{},events:[]}],[otherCompany,{revision:1,companyId:otherCompany,projects:{},records:{},documents:{},events:[]}]]);
 const store={getDirectory:async()=>structuredClone(directory),getCompany:async id=>{projectReads++;return structuredClone(states.get(id));}};
 const contacts=new Map(),managers=new Map();
 const twenty={getCompany:async id=>({id,name:id===companyId?'Wasion fixture':'Other company fixture',active:true}),getContact:async id=>structuredClone(contacts.get(id)),getManager:async id=>structuredClone(managers.get(id))};
 service=createBusinessService({env,store,twenty});
 for(const actor of ['wasion','other','unassigned']){
  const identityId=service.subjectForPhone(phones[actor]),cid=actor==='other'?otherCompany:companyId,contactId='contact-'+actor;
  contacts.set(contactId,{id:contactId,companyId:cid,identityId,active:true});
  directory.memberGrants[identityId]={active:true,companyId:cid,contactId,projectScope:'selected',projectIds:actor==='wasion'?[projectId]:['unrelated-project'],documentScope:'all',documentIds:[]};
 }
 for(const actor of ['manager','otherManager']){
  const identityId=service.subjectForPhone(phones[actor]),staffId='staff-'+actor;
  managers.set(staffId,{id:staffId,identityId,active:true});directory.managerAssignments[identityId]={active:true,staffId,companyIds:[actor==='manager'?companyId:otherCompany]};
 }
 const values=new Map();
 const get=name=>{const row=values.get(name);return row&&row.expires>Date.now()?structuredClone(row.value):null;};
 const authStore={reserve:async()=>true,reserveDetailed:async()=>({allowed:true}),set:async(name,value,ttl)=>values.set(name,{value:structuredClone(value),expires:Date.now()+ttl*1000}),get,del:async name=>values.delete(name),attempt:async(id,binding)=>{const name='challenge:'+id,c=get(name);if(!c||c.binding!==binding||c.attempts>=5)return null;values.get(name).value.attempts++;return c;},consume:async(id,binding)=>{const name='challenge:'+id,c=get(name);if(!c||c.binding!==binding)return false;values.delete(name);return true;}};
 const auth=createCrmAuthHandler({env,storeFactory:()=>authStore,smsFactory:()=>({send:async()=>{},verify:async(phone,code)=>Object.values(phones).includes(phone)&&code==='123456'}),loadMemberships:phone=>service.loadMemberships(phone),recordVisit:async()=>{},reportFailure:()=>{}});
 const runtime={auth,projectAccessService:service};
 const page=createWasionPageHandler({getRuntime:()=>runtime});
 const business=createBusinessHandler({env,authHandler:auth,service});
 const search=createWasionSearchHandler({env,auth,service,rateLimit:async()=>true,fetchImpl:async()=>{modelCalls++;throw Error('Unexpected model call');}});
 const request=async(target,url,{method='GET',body,cookie='',headers:extra={}}={})=>{
  const headers={};let output;const res={setHeader(k,v){headers[k.toLowerCase()]=v;},end(v){output=v;}};
  await target({url,method,body,headers:{origin:'https://crm.cnps.ai','content-type':'application/json','x-cnps-crm':'1',cookie,'x-real-ip':'192.0.2.1',...extra}},res);
  return {status:res.statusCode,headers,text:String(output||''),json:()=>JSON.parse(output)};
 };
 const login=async actor=>{
  const sent=await request(auth,'/api/crm',{method:'POST',body:{action:'send',phone:phones[actor],consent:true}});
  if(sent.status!==200)throw Error('Fixture send rejected: '+sent.text);
  const cookie=sent.headers['set-cookie'].split(';')[0];
  const verified=await request(auth,'/api/crm',{method:'POST',cookie,body:{action:'verify',challenge:sent.json().challenge,code:'123456'}});
  if(verified.status!==200)throw Error('Fixture verification rejected: '+verified.text);
  return verified.headers['set-cookie'][0].split(';')[0];
 };
 return {binding,phones,auth,business,page,search,service,request,login,directory,states,contacts,project,counts:()=>({projectReads,modelCalls}),revoke(actor){directory.memberGrants[service.subjectForPhone(phones[actor])].active=false;directory.revision++;},unpublish(){states.get(companyId).projects[projectId].publication=null;},removeProjectGrant(){directory.memberGrants[service.subjectForPhone(phones.wasion)].projectIds=['unrelated-project'];directory.revision++;}};
}
