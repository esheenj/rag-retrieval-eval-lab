import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.mjs",import.meta.url),"utf8");
test("strict offline content policy and local import",()=>{
 assert.match(html,/connect-src 'none'/);assert.match(html,/script-src 'self'/);
 assert.match(html,/src="\.\/app\.mjs"/);assert.match(app,/\.\/src\/metrics\.mjs/);
 assert.doesNotMatch(html,/<img|<iframe|<script[^>]*https?:/i);
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|innerHTML|localStorage|\beval\s*\(/);
});
test("responsive, accessible-minded browser controls",()=>{
 for(const id of ["scenarios","fixture-json","topk","scores","status","evaluate","restore","receipt"]){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/aria-live="polite"/);assert.match(html,/prefers-reduced-motion/);
 assert.match(html,/max-width:820px/);assert.match(html,/Skip to retrieval evaluation/);
});
test("no real model accuracy or production claim",()=>{
 assert.match(html,/do not validate model embeddings/i);
 assert.match(html,/cannot verify answers or a real model/i);
 assert.doesNotMatch(html,/certified LLM|independent model accuracy|guaranteed relevance/i);
});
