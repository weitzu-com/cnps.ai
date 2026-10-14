import {createHash} from 'node:crypto';
import {gzip as compress} from 'node:zlib';
import {promisify} from 'node:util';
const gzip=promisify(compress), representations=new WeakMap();
function acceptsGzip(header) {
  if(typeof header!=='string'||header.length>4096)return false;
  let explicit, wildcard=0;
  for(const part of header.split(',')) {
    const [coding,...parameters]=part.trim().toLowerCase().split(';');
    let q=1;
    for(const parameter of parameters)if(parameter.trim().startsWith('q=')){
      const value=parameter.trim().slice(2);q=/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value)?Number(value):0;
    }
    if(coding==='gzip')explicit=Math.max(explicit??0,q);
    if(coding==='*')wildcard=Math.max(wildcard,q);
  }
  return (explicit??wildcard)>0;
}
// Only immutable deployed asset bytes are reused; authorization is never cached.
export async function proposalAssetResponse(asset, acceptEncoding) {
  let value=representations.get(asset);
  if(!value){const raw=Buffer.from(asset.data,'base64');value={raw,contentHash:createHash('sha256').update(raw).digest('hex')};representations.set(asset,value);}
  if(!acceptsGzip(acceptEncoding)||value.raw.length<64*1024)return{bytes:value.raw,contentHash:value.contentHash};
  value.compressed??=gzip(value.raw,{level:4}).then(bytes=>bytes.length<value.raw.length*.95?bytes:null).catch(error=>{delete value.compressed;throw error;});
  const bytes=await value.compressed;
  return{bytes:bytes||value.raw,contentHash:value.contentHash,...(bytes?{encoding:'gzip'}:{})};
}
