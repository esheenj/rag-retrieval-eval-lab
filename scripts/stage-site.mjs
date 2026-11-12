import {readFileSync,writeFileSync,mkdirSync,lstatSync,existsSync} from "node:fs";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const dest=join(root,"dist/pages");
const allowed=["index.html","app.mjs","src/metrics.mjs"];
const read=p=>{const full=join(root,p);if(lstatSync(full).isSymbolicLink())throw Error("SYMLINK_SOURCE");return readFileSync(full);};
const html=read("index.html").toString("utf8"),app=read("app.mjs").toString("utf8");
if(!html.includes("connect-src 'none'")||!html.includes("script-src 'self'")||!html.includes('src="./app.mjs"')||
 html.includes("<iframe")||html.includes("<img"))throw Error("SOURCE_SAFETY_CONTRACT");
if(/fetch\s*\(|XMLHttpRequest|innerHTML|localStorage|\beval\s*\(/.test(app))throw Error("UNSAFE_APP_FEATURE");
if(existsSync(dest))throw Error("STAGE_ALREADY_EXISTS");
mkdirSync(dest,{recursive:true});const hashes={};
for(const path of allowed){
 const bytes=read(path);if(bytes.length>85000)throw Error("SOURCE_TOO_LARGE");
 mkdirSync(dirname(join(dest,path)),{recursive:true});
 writeFileSync(join(dest,path),bytes,{flag:"wx"});
 hashes[path]=createHash("sha256").update(bytes).digest("hex");
}
writeFileSync(join(dest,".nojekyll"),"",{flag:"wx"});
console.log(JSON.stringify({status:"STAGED_ONLY",files:[...allowed,".nojekyll"],hashes,externalRequests:false}));
