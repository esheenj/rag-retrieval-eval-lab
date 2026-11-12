import test from "node:test";
import assert from "node:assert/strict";
import {validateScenario,perQueryMetrics,evaluateScenario,EXAMPLES} from "../src/metrics.mjs";
const clone=x=>JSON.parse(JSON.stringify(x));
test("three synthetic examples evaluate without model or network claims",()=>{
 for(const x of EXAMPLES){
  const r=evaluateScenario(x.scenario,3);
  assert.equal(r.queries,x.scenario.queries.length);
  assert.equal(r.retrievers.length,2);
  assert.equal(r.modelQualityVerified,false);
  assert.equal(r.relevanceJudgmentsVerified,false);
 }
});
test("recall and precision of two hits at k=3",()=>{
 const x=perQueryMetrics(["doc-a","doc-b"],["doc-a","doc-c","doc-b"],3);
 assert.equal(x.hits,2);assert.equal(x.precision,0.6667);
 assert.equal(x.recall,1);assert.equal(x.hitRate,1);
 assert.equal(x.reciprocalRank,1);assert.ok(x.ndcg<1&&x.ndcg>0.9);
});
test("no relevant items in top k has all zero scores",()=>{
 const m=perQueryMetrics(["doc-a"],["doc-x","doc-y","doc-a"],2);
 assert.equal(m.precision,0);assert.equal(m.recall,0);
 assert.equal(m.hitRate,0);assert.equal(m.reciprocalRank,0);assert.equal(m.ndcg,0);
});
test("ideal matching order yields ndcg=1",()=>{
 assert.equal(perQueryMetrics(["doc-a","doc-b"],["doc-a","doc-b","doc-c"],2).ndcg,1);
});
test("k=1 with relevant first yields all metrics 1",()=>{
 const m=perQueryMetrics(["doc-a"],["doc-a","doc-x"],1);
 assert.equal(m.precision,1);assert.equal(m.recall,1);assert.equal(m.hitRate,1);
 assert.equal(m.reciprocalRank,1);assert.equal(m.ndcg,1);
});
test("reranked fixture improves mean reciprocal rank on FAQ",()=>{
 const z=evaluateScenario(EXAMPLES[0].scenario,3);
 assert.ok(z.retrievers[1].averages.reciprocalRank>z.retrievers[0].averages.reciprocalRank);
});
test("changing k changes recall deterministically",()=>{
 const q=EXAMPLES[0].scenario;
 const lo=evaluateScenario(q,1),hi=evaluateScenario(q,5);
 assert.ok(hi.retrievers[0].averages.recall>=lo.retrievers[0].averages.recall);
});
test("reject invalid k",()=>{
 assert.throws(()=>evaluateScenario(EXAMPLES[0].scenario,0),/INVALID_K/);
 assert.throws(()=>evaluateScenario(EXAMPLES[0].scenario,6),/INVALID_K/);
});
test("reject duplicate relevant IDs",()=>{
 assert.throws(()=>perQueryMetrics(["doc-a","doc-a"],["doc-a"],1),/INVALID_METRIC_INPUT/);
});
test("reject duplicate ranked IDs",()=>{
 assert.throws(()=>perQueryMetrics(["doc-a"],["doc-a","doc-a"],2),/INVALID_METRIC_INPUT/);
});
test("unknown query in one retriever fails closed",()=>{
 const s=clone(EXAMPLES[0].scenario);s.retrievers[0].results[0].queryId="wrong";
 assert.throws(()=>validateScenario(s),/INVALID_RANKING/);
});
test("missing query result is rejected",()=>{
 const s=clone(EXAMPLES[0].scenario);s.retrievers[0].results.pop();
 assert.throws(()=>validateScenario(s),/INVALID_RETRIEVER/);
});
test("duplicate query id rejected",()=>{
 const s=clone(EXAMPLES[0].scenario);s.queries[1].id=s.queries[0].id;
 assert.throws(()=>validateScenario(s),/DUPLICATE_QUERY_ID/);
});
test("duplicate retriever id rejected",()=>{
 const s=clone(EXAMPLES[0].scenario);s.retrievers[1].id=s.retrievers[0].id;
 assert.throws(()=>validateScenario(s),/DUPLICATE_RETRIEVER/);
});
test("unexpected record keys rejected",()=>{
 const s=clone(EXAMPLES[0].scenario);s.queries[0].private=true;
 assert.throws(()=>validateScenario(s),/INVALID_QUERY/);
});
test("untrusted prototypes rejected",()=>{
 const s=Object.assign(Object.create({secret:true}),EXAMPLES[0].scenario);
 assert.throws(()=>validateScenario(s),/INVALID_SCENARIO/);
});
test("too many queries rejected",()=>{
 const s=clone(EXAMPLES[0].scenario);s.queries=Array.from({length:9},(_,i)=>({...s.queries[0],id:"qq-"+i}));
 assert.throws(()=>validateScenario(s),/INVALID_SCENARIO/);
});
test("ranking over 10 docs rejected",()=>{
 const s=clone(EXAMPLES[0].scenario);s.retrievers[0].results[0].ranked=Array.from({length:11},(_,i)=>"doc-"+i);
 assert.throws(()=>validateScenario(s),/INVALID_RANKING/);
});
test("metrics repeat identically for deterministic inputs",()=>{
 assert.deepEqual(evaluateScenario(EXAMPLES[1].scenario,3),evaluateScenario(EXAMPLES[1].scenario,3));
});
test("refuse non-numeric doc identifiers and negative indexes",()=>{
 assert.throws(()=>perQueryMetrics([1],["doc-a"],2),/INVALID_METRIC_INPUT/);
 assert.throws(()=>perQueryMetrics(["doc-a"],["doc-a"],-1),/INVALID_K/);
});
