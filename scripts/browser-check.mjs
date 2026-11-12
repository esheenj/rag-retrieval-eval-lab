import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {spawn} from "node:child_process";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(fileURLToPath(new URL("../dist/pages/",import.meta.url)));
const allow=new Map([["/","index.html"],["/index.html","index.html"],["/app.mjs","app.mjs"],["/src/metrics.mjs","src/metrics.mjs"]]);
const server=createServer((req,res)=>{
 const file=allow.get(new URL(req.url,"http://127.0.0.1").pathname);
 if(!file){res.writeHead(404).end();return;}
 try{res.writeHead(200,{"Content-Type":file.endsWith(".mjs")?"text/javascript; charset=utf-8":"text/html; charset=utf-8","Cache-Control":"no-store"}).end(readFileSync(resolve(root,file)));}
 catch{res.writeHead(500).end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const port=server.address().port;
async function check(scenario){
 const url="http://127.0.0.1:"+port+"/?scenario="+scenario;
 const args=["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--no-first-run","--no-default-browser-check","--window-size=375,850","--virtual-time-budget=2200","--dump-dom",url];
 const html=await new Promise((ok,fail)=>{
  const c=spawn(process.env.CHROME_BIN||"google-chrome",args,{stdio:["ignore","pipe","pipe"]});
  let out="",err="";
  const timeout=setTimeout(()=>{c.kill("SIGKILL");fail(Error("BROWSER_TIMEOUT:"+scenario));},30000);
  c.stdout.on("data",data=>{out+=data.toString();if(out.length>400000)c.kill("SIGKILL");});
  c.stderr.on("data",data=>{err+=data.toString();if(err.length>9000)err=err.slice(-9000);});
  c.on("error",e=>{clearTimeout(timeout);fail(e);});
  c.on("close",code=>{clearTimeout(timeout);code===0?ok(out):fail(Error("BROWSER_EXIT_"+code+":"+err.slice(-300)));});
 });
 if(!html.includes('data-scenario="'+scenario+'"')||!html.includes('data-ready="true"')||
  !html.includes('id="strategy-0"')||!html.includes('id="strategy-1"')||
  !html.includes("Precision@k")||!html.includes("nDCG@k"))throw Error("BROWSER_SCENARIO_FAILED:"+scenario);
 console.log("CHROME_PASS "+scenario+" / 2 ranking cards");
}
try{for(const s of ["faq","runbooks","hard-negatives"])await check(s);}finally{server.close();}
