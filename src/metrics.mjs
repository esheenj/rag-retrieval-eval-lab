// Original synthetic ranked retrieval reference; no embeddings, model calls or live search.
// All reported metrics describe supplied fictional relevance judgements only.
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&
 (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const exact=(x,keys)=>obj(x)&&Object.keys(x).length===keys.length&&keys.every(k=>own(x,k));
const ID=/^[a-z][a-z0-9-]{1,39}$/;
const validId=x=>typeof x==="string"&&ID.test(x);
const txt=x=>typeof x==="string"&&x.length>=2&&x.length<=180&&!/[\u0000-\u001f]/.test(x);
const unique=a=>new Set(a).size===a.length;
const round=n=>Math.round(n*10000)/10000;
export function validateScenario(s){
 if(!exact(s,["id","title","queries","retrievers"])||!validId(s.id)||!txt(s.title)||
   !Array.isArray(s.queries)||s.queries.length<2||s.queries.length>8||
   !Array.isArray(s.retrievers)||s.retrievers.length<2||s.retrievers.length>4)throw Error("INVALID_SCENARIO");
 const ids=[];
 for(const q of s.queries){
  if(!exact(q,["id","text","relevant"])||!validId(q.id)||!txt(q.text)||
    !Array.isArray(q.relevant)||q.relevant.length<1||q.relevant.length>8||
    !q.relevant.every(validId)||!unique(q.relevant))throw Error("INVALID_QUERY");
  ids.push(q.id);
 }
 if(!unique(ids))throw Error("DUPLICATE_QUERY_ID");
 const retrieverIds=[];
 for(const r of s.retrievers){
  if(!exact(r,["id","label","results"])||!validId(r.id)||!txt(r.label)||
    !Array.isArray(r.results)||r.results.length!==s.queries.length)throw Error("INVALID_RETRIEVER");
  retrieverIds.push(r.id);
  const queryIds=[];
  for(const entry of r.results){
   if(!exact(entry,["queryId","ranked"])||!ids.includes(entry.queryId)||
      !Array.isArray(entry.ranked)||entry.ranked.length<1||entry.ranked.length>10||
      !entry.ranked.every(validId)||!unique(entry.ranked))throw Error("INVALID_RANKING");
   queryIds.push(entry.queryId);
  }
  if(!unique(queryIds)||queryIds.length!==ids.length)throw Error("MISSING_OR_DUPLICATE_QUERY_RESULTS");
 }
 if(!unique(retrieverIds))throw Error("DUPLICATE_RETRIEVER");
 return true;
}
export function perQueryMetrics(relevant,ranked,k){
 if(!Number.isInteger(k)||k<1||k>5)throw Error("INVALID_K");
 if(!Array.isArray(relevant)||relevant.length===0||!relevant.every(validId)||!unique(relevant)||
    !Array.isArray(ranked)||!ranked.every(validId)||!unique(ranked))throw Error("INVALID_METRIC_INPUT");
 const truth=new Set(relevant),top=ranked.slice(0,k);
 const hits=top.filter(id=>truth.has(id)).length;
 const first=top.findIndex(id=>truth.has(id));
 let dcg=0;
 top.forEach((id,i)=>{if(truth.has(id))dcg+=1/Math.log2(i+2);});
 let ideal=0;
 for(let i=0;i<Math.min(k,relevant.length);i++)ideal+=1/Math.log2(i+2);
 return {
  hits,precision:round(hits/k),recall:round(hits/relevant.length),hitRate:hits?1:0,
  reciprocalRank:first<0?0:round(1/(first+1)),ndcg:round(ideal?dcg/ideal:0)
 };
}
export function evaluateScenario(s,k=3){
 validateScenario(s);
 if(!Number.isInteger(k)||k<1||k>5)throw Error("INVALID_K");
 const metrics=["precision","recall","hitRate","reciprocalRank","ndcg"];
 const retrievers=s.retrievers.map(r=>{
  const perQuery=s.queries.map(q=>{
   const entry=r.results.find(x=>x.queryId===q.id);
   return {queryId:q.id,relevantCount:q.relevant.length,...perQueryMetrics(q.relevant,entry.ranked,k)};
  });
  const averages={};
  for(const name of metrics)averages[name]=round(perQuery.reduce((sum,m)=>sum+m[name],0)/perQuery.length);
  return {id:r.id,label:r.label,averages,perQuery};
 });
 return {schema:"esheen-rag-retrieval-eval-v1",scenarioId:s.id,queries:s.queries.length,k,
  retrievers,modelQualityVerified:false,relevanceJudgmentsVerified:false,contextQualityVerified:false,
  note:"Scores compare supplied fictional document IDs only; ranking metrics do not verify answer quality, document authenticity, factual correctness or real retrieval performance."};
}
const make=(id,text,relevant)=>({id,text,relevant});
const rank=(queryId,...ranked)=>({queryId,ranked});
export const EXAMPLES=Object.freeze([
 {id:"faq",title:"Customer FAQ search",
  description:"Compare a keyword baseline with a reranked ordering for three fictional customer questions.",
  scenario:{id:"faq",title:"Fictional customer FAQ retrieval",queries:[
   make("q-refund","What is the fictional refund window?",["doc-refund","doc-terms"]),
   make("q-login","How do I change my account password?",["doc-security"]),
   make("q-shipping","Where is the shipping policy?",["doc-shipping"])
  ],retrievers:[
   {id:"keyword",label:"Keyword baseline",results:[
    rank("q-refund","doc-home","doc-pricing","doc-refund","doc-terms","doc-news"),
    rank("q-login","doc-home","doc-security","doc-faq","doc-terms","doc-pricing"),
    rank("q-shipping","doc-shipping","doc-home","doc-news","doc-pricing","doc-about")
   ]},
   {id:"reranked",label:"Fictional reranker",results:[
    rank("q-refund","doc-refund","doc-terms","doc-home","doc-pricing","doc-news"),
    rank("q-login","doc-security","doc-faq","doc-home","doc-terms","doc-pricing"),
    rank("q-shipping","doc-shipping","doc-about","doc-home","doc-news","doc-pricing")
   ]}
  ]}},
 {id:"runbooks",title:"Incident runbook retrieval",
  description:"See how a specialized ordering can improve recall for fictional incident knowledge.",
  scenario:{id:"runbooks",title:"Fictional incident runbook search",queries:[
   make("q-queue","What do we check when job queues stall?",["doc-queue","doc-worker"]),
   make("q-alert","How do we triage an alert spike?",["doc-alert","doc-metrics"]),
   make("q-oncall","Where is the on-call handover?",["doc-oncall"])
  ],retrievers:[
   {id:"baseline",label:"Simple keyword search",results:[
    rank("q-queue","doc-home","doc-status","doc-worker","doc-queue","doc-alert"),
    rank("q-alert","doc-status","doc-home","doc-alert","doc-oncall","doc-metrics"),
    rank("q-oncall","doc-alert","doc-queue","doc-oncall","doc-home","doc-status")
   ]},
   {id:"reranked",label:"Runbook-first ordering",results:[
    rank("q-queue","doc-queue","doc-worker","doc-home","doc-status","doc-alert"),
    rank("q-alert","doc-alert","doc-metrics","doc-status","doc-home","doc-oncall"),
    rank("q-oncall","doc-oncall","doc-alert","doc-home","doc-status","doc-queue")
   ]}
  ]}},
 {id:"hard-negatives",title:"Hard-negative search",
  description:"Inspect two poor retrieval strategies, including missing relevant documents and misleading top ranks.",
  scenario:{id:"hard-negatives",title:"Fictional hard-negative evaluation",queries:[
   make("q-contract","Which sample document explains renewal?",["doc-renewal"]),
   make("q-pricing","Where is the price exception policy?",["doc-price-exception"])
  ],retrievers:[
   {id:"lexical",label:"Literal overlap",results:[
    rank("q-contract","doc-contract-title","doc-home","doc-pricing","doc-renewal","doc-exception"),
    rank("q-pricing","doc-pricing","doc-terms","doc-home","doc-exception","doc-faq")
   ]},
   {id:"generic",label:"Generic embeddings (illustrative)",results:[
    rank("q-contract","doc-home","doc-faq","doc-pricing","doc-contract-title","doc-metrics"),
    rank("q-pricing","doc-home","doc-pricing","doc-faq","doc-terms","doc-about")
   ]}
  ]}}
]);
