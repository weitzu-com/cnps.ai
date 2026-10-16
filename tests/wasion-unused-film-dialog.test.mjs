import test from 'node:test';
import assert from 'node:assert/strict';
import {wasionDemoPage} from '../server/wasion-demo-page.mjs';
import {REQUIREMENTS_ROUTES} from '../server/wasion-requirements/index.mjs';

test('all198 default pages omit the unreachable legacy film dialog and its unused opener',()=>{
 assert.equal(REQUIREMENTS_ROUTES.length,198);
 for(const slug of REQUIREMENTS_ROUTES){
  const html=wasionDemoPage('unused-film-dialog-fixture',{slug});
  assert.ok(!html.includes('id="wr-film-dialog"'),slug);
  assert.ok(!html.includes('data-open-dialog="wr-film-dialog"'),slug);
  for(const id of ['wr-search-dialog','wr-newsletter-dialog','wr-review-dialog'])assert.ok(html.includes('id="'+id+'"'),slug+' '+id);
 }
});
test('Media Kit retains its real user-controlled inline company film',()=>{
 const html=wasionDemoPage('unused-film-dialog-fixture',{slug:'media-kit'});
 const section=html.match(/<section\b[^>]*data-module="company-video"[^>]*>[\s\S]*?<\/section>/)?.[0];
 assert.ok(section);
 assert.match(section,/<video controls preload="none"/);
 assert.match(section,/<source src="https:\/\/en\.wasion\.com\/public\/uploads\/files\/20230718\/about\.mp4" type="video\/mp4">/);
 assert.ok(!section.includes('autoplay'));
 assert.match(section,/Open the official film/);
});
