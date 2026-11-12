import {EXAMPLES,evaluateScenario} from "./src/metrics.mjs";
const $=id=>document.getElementById(id);
const tabs=$("scenarios"),data=$("fixture-json"),scores=$("scores");
const names=[["precision","Precision@k"],["recall","Recall@k"],["hitRate","Hit@k"],["reciprocalRank","MRR@k"],["ndcg","nDCG@k"]];
let current=EXAMPLES[0];
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function evaluate(){
 scores.replaceChildren();
 try{
  if(data.value.length>48000)throw Error("INPUT_TOO_LARGE");
  const fixture=JSON.parse(data.value),k=Number($("topk").value);
  const report=evaluateScenario(fixture,k);
  document.body.dataset.ready="true";
  $("status").textContent=report.queries+" fictional queries · k="+k+" · "+report.retrievers.length+" strategies compared";
  report.retrievers.forEach((r,i)=>{
   const card=node("article",undefined,"scorecard");card.id="strategy-"+i;
   const head=node("div",undefined,"scorehead");head.append(node("strong",r.label),node("span",r.id.toUpperCase()));
   card.append(head);
   for(const [key,label] of names){
    const line=node("div",undefined,"scoreline"),bar=node("span",undefined,"bar"),inner=node("span");
    inner.style.width=(r.averages[key]*100).toFixed(1)+"%";bar.append(inner);
    line.append(node("span",label),bar,node("b",(r.averages[key]*100).toFixed(1)+"%"));
    card.append(line);
   }
   scores.append(card);
  });
  $("meaning").textContent=report.note;
  $("receipt").textContent=JSON.stringify(report,null,2);
 }catch(error){
  document.body.dataset.ready="false";
  $("status").textContent="Invalid local input: "+String(error.message).slice(0,90);
  $("receipt").textContent="No valid report";
  $("meaning").textContent="Restore a fictional sample and try again.";
 }
}
function choose(id){
 const found=EXAMPLES.find(x=>x.id===id);if(!found)return;
 current=found;
 for(const b of tabs.querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.example===id));
 document.body.dataset.scenario=id;
 $("scenario-description").textContent=found.description;
 data.value=JSON.stringify(found.scenario,null,2);
 evaluate();
}
for(const item of EXAMPLES){
 const button=node("button",item.title,"tab");button.type="button";button.dataset.example=item.id;button.setAttribute("aria-pressed","false");button.addEventListener("click",()=>choose(item.id));tabs.append(button);
}
$("evaluate").addEventListener("click",evaluate);
$("restore").addEventListener("click",()=>choose(current.id));
$("topk").addEventListener("change",evaluate);
const initial=new URLSearchParams(location.search).get("scenario");
choose(EXAMPLES.some(x=>x.id===initial)?initial:EXAMPLES[0].id);
