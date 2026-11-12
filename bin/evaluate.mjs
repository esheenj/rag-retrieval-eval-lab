#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {EXAMPLES,evaluateScenario} from "../src/metrics.mjs";
try{
 if(process.argv.length>4)throw Error("USAGE: node bin/evaluate.mjs [fixture.json] [k]");
 const k=process.argv[3]===undefined?3:Number(process.argv[3]);
 let cases=EXAMPLES.map(x=>x.scenario);
 if(process.argv[2]){
  const data=readFileSync(process.argv[2]);if(data.length>65536)throw Error("INPUT_TOO_LARGE");
  cases=[JSON.parse(data.toString("utf8"))];
 }
 const reports=cases.map(s=>evaluateScenario(s,k));
 console.log(JSON.stringify({schema:"esheen-rag-retrieval-report-v1",fictional:true,reports},null,2));
}catch(error){console.error("REJECTED: "+String(error.message).slice(0,130));process.exitCode=2;}
