import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,openSync,closeSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import net from 'node:net';
import {openDatabase} from '../lib/server-db.mjs';
import {createUser} from '../lib/server-auth.mjs';
import {health} from '../ubuntu/healthcheck.mjs';
const dir=mkdtempSync(join(tmpdir(),'momentum-http-test-')),dbfile=join(dir,'app.sqlite'),password=randomBytes(24).toString('base64url');let db=openDatabase(dbfile),child;
await createUser(db,'alpha',password);await createUser(db,'bravo',password);db.close();
const port=await new Promise((ok,bad)=>{const s=net.createServer();s.once('error',bad);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>ok(p));});}),origin='http://127.0.0.1:'+port;
const logpath=join(dir,'server.log'),log=openSync(logpath,'a',0o600);
function start(){child=spawn(process.execPath,[resolve('.next/standalone/server.js')],{env:{...process.env,SQLITE_PATH:dbfile,NEXT_PUBLIC_BASE_PATH:'/Momentum',PUBLIC_ORIGIN:origin,HOSTNAME:'127.0.0.1',PORT:String(port),NODE_ENV:'production'},stdio:['ignore',log,log]});}
async function stop(){const process=child;if(!process||process.exitCode!==null)return;const exited=new Promise(r=>process.once('exit',r));process.kill('SIGTERM');await Promise.race([exited,new Promise(r=>setTimeout(r,5000))]);if(process.exitCode===null){process.kill('SIGKILL');await exited;}}
const request=(path,options={})=>fetch(origin+'/Momentum'+path,{redirect:'manual',...options});
async function ready(){for(let i=0;i<60;i++){try{await health(origin);return;}catch{}if(child.exitCode!==null)throw Error('Test server exited');await new Promise(r=>setTimeout(r,250));}throw Error('Test server did not become ready');}
async function signin(username){const r=await request('/api/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username,password})});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie');assert.match(cookie,/Path=\/Momentum\/;/);assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);return cookie.split(';')[0];}
const state=(cookie,body,extra={})=>request('/api/state',{method:body?'PUT':'GET',headers:{Cookie:cookie,...(body?{Origin:origin,'Content-Type':'application/json'}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});
try{start();await ready();
 assert.equal((await request('/api/state',{headers:{'oai-authenticated-user-id':'fake','oai-authenticated-email':'owner@example.test'}})).status,401);
 assert.equal((await request('/api/session',{method:'POST',headers:{Origin:'https://evil.test','Content-Type':'application/json'},body:JSON.stringify({username:'alpha',password})})).status,403);
 assert.equal((await request('/api/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'alpha',password:'incorrect password'})})).status,401);
 const a=await signin('alpha'),b=await signin('bravo');const page=await request('/',{headers:{Cookie:a}});assert.equal(page.status,200);assert.match(await page.text(),/alpha/);assert.deepEqual(await(await state(a)).json(),{data:null,revision:0});
 const data={tasks:[{id:'real',title:'JSON 恢复验证',date:'2026-11-06',start:540,end:600,category:'work',progress:75,actual:43,note:'完整保留',reminder:10}],categories:[{id:'work',name:'工作',color:'#50836a',focus:true}],holidays:[{date:'2026-12-25',name:'圣诞节',region:'HK'}],habits:[{id:'habit',title:'习惯',days:['2026-11-06']}],goal:180};
 assert.equal((await state(a,{data,revision:0})).status,200);assert.deepEqual(await(await state(b)).json(),{data:null,revision:0});assert.deepEqual((await(await state(a)).json()).data,data);
 const races=await Promise.all([state(a,{data:{...data,goal:200},revision:1}),state(a,{data:{...data,goal:240},revision:1})]);assert.deepEqual(races.map(x=>x.status).sort(),[200,409]);const saved=await(await state(a)).json();assert.equal(saved.revision,2);
 assert.equal((await state(a,{data,revision:2},{Origin:'https://evil.test'})).status,403);assert.equal((await state(a,{data,revision:2},{Origin:''})).status,403);assert.equal((await state(a,{data:{...data,goal:0},revision:2})).status,400);
 assert.equal((await request('/api/state',{method:'PUT',headers:{Cookie:a,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({data:'x'.repeat(1500001),revision:2})})).status,413);
 await stop();start();await ready();assert.deepEqual(await(await state(a)).json(),saved);assert.deepEqual(await(await state(b)).json(),{data:null,revision:0});
 assert.equal((await request('/api/session',{method:'DELETE',headers:{Cookie:a,Origin:origin}})).status,200);assert.equal((await state(a)).status,401);assert.equal((await state(b)).status,200);
 db=openDatabase(dbfile);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM journals').first()).n,1);assert.notEqual((await db.prepare('SELECT password_hash FROM momentum_users LIMIT 1').first()).password_hash,password);db.close();
 console.log('PASS real HTTP: login, protected records, forged headers, two-account isolation, complete JSON restore, conflict protection, origin/size validation, persistence after restart and logout.');
}catch(error){console.error(readFileSync(logpath,'utf8').slice(-7000));throw error;}finally{await stop();closeSync(log);rmSync(dir,{recursive:true,force:true});}
