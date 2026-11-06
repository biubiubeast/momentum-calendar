import {spawnSync,spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,openSync,closeSync,cpSync,existsSync,symlinkSync,renameSync,readlinkSync,unlinkSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import net from 'node:net';
import {loadConfig} from './config.mjs';
process.umask(0o077);
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),appRoot=process.env.MOMENTUM_APP_ROOT||'/home/bill/apps/momentum';
const run=(command,args,options={})=>{const r=spawnSync(command,args,{cwd:root,stdio:'inherit',...options});if(r.status!==0)throw Error(`${command} failed (${r.status??r.error?.code})`);return r;};
const git=(...args)=>run('git',args,{encoding:'utf8',stdio:['ignore','pipe','inherit']}).stdout.trim();
if(git('branch','--show-current')!=='main')throw Error('Deploy from main only');
if(git('status','--porcelain'))throw Error('Checkout has local changes. Commit or review them before updating.');
if(!process.env.MOMENTUM_DEPLOY_UPDATED){git('pull','--ff-only','origin','main');const next=spawnSync(process.execPath,[fileURLToPath(import.meta.url)],{cwd:root,stdio:'inherit',env:{...process.env,MOMENTUM_DEPLOY_UPDATED:'1'}});process.exit(next.status??1);}
const config=loadConfig(),sha=git('rev-parse','HEAD'),id=new Date().toISOString().replace(/[:.]/g,'-')+'-'+sha.slice(0,12),release=resolve(appRoot,'releases',id),source=resolve(release,'source');
mkdirSync(source,{recursive:true,mode:0o700});
const archive=resolve(release,'source.tar'),fd=openSync(archive,'wx',0o600);try{run('git',['archive','--format=tar','HEAD'],{stdio:['ignore',fd,'inherit']});}finally{closeSync(fd);}run('tar',['-xf',archive,'-C',source]);unlinkSync(archive);
console.log('Building Momentum '+sha.slice(0,12));
const env={...process.env,npm_config_cache:resolve(appRoot,'cache/npm'),NEXT_PUBLIC_BASE_PATH:config.NEXT_PUBLIC_BASE_PATH,NEXT_TELEMETRY_DISABLED:'1'};
run('npm',['ci','--include=dev','--include=optional','--no-audit','--no-fund'],{cwd:source,env});
for(const task of ['test','typecheck','build','test:integration'])run('npm',['run',task],{cwd:source,env});
run(process.execPath,[resolve(source,'ubuntu/backup.mjs'),resolve(appRoot,'backups')]);
cpSync(resolve(source,'.next/standalone'),resolve(release,'app'),{recursive:true});cpSync(resolve(source,'ubuntu'),resolve(release,'ubuntu'),{recursive:true});writeFileSync(resolve(release,'COMMIT'),sha+'\n',{mode:0o600});
const candidatePort=config.PORT+1;
await new Promise((ok,bad)=>{const server=net.createServer();server.once('error',()=>bad(Error('Candidate port is already in use')));server.listen(candidatePort,'127.0.0.1',()=>server.close(ok));});
const log=openSync(resolve(release,'candidate.log'),'a',0o600),candidate=spawn(process.execPath,[resolve(release,'ubuntu/serve.mjs')],{cwd:release,env:{...process.env,MOMENTUM_CANDIDATE_PORT:String(candidatePort)},stdio:['ignore',log,log]});closeSync(log);
const {health}=await import(pathToFileURL(resolve(release,'ubuntu/healthcheck.mjs')).href);
async function waitHealthy(port,child){let last;for(let i=0;i<40;i++){if(child&&child.exitCode!==null)throw Error('Candidate exited; see '+resolve(release,'candidate.log'));try{await health('http://127.0.0.1:'+port);return;}catch(e){last=e;}await new Promise(r=>setTimeout(r,500));}throw last;}
try{await waitHealthy(candidatePort,candidate);}finally{candidate.kill('SIGTERM');await Promise.race([new Promise(r=>candidate.once('exit',r)),new Promise(r=>setTimeout(r,5000))]);if(candidate.exitCode===null)candidate.kill('SIGKILL');}
const current=resolve(appRoot,'current'),previous=existsSync(current)?readlinkSync(current):null;
function activate(target){const temporary=resolve(appRoot,'current.next');if(existsSync(temporary))unlinkSync(temporary);symlinkSync(target,temporary);renameSync(temporary,current);}
writeFileSync(resolve(appRoot,'serve.mjs'),"import './current/ubuntu/serve.mjs';\n",{mode:0o600});
const isRunning=()=>spawnSync('pm2',['describe','momentum'],{stdio:'ignore'}).status===0;
function start(){if(isRunning())run('pm2',['restart','momentum','--update-env']);else run('pm2',['start',resolve(appRoot,'serve.mjs'),'--name','momentum','--interpreter',process.execPath,'--cwd',appRoot,'--time']);}
activate(release);
try{start();await waitHealthy(config.PORT);run('pm2',['save']);}
catch(error){console.error('Release failed; restoring the previous application. Database remains intact.');if(previous){activate(previous);start();await waitHealthy(config.PORT);}else{if(isRunning())run('pm2',['delete','momentum']);unlinkSync(current);}throw error;}
console.log('DEPLOYED '+sha+'\nhttps://bill.spailab.com/Momentum/\nDatabase and account passwords preserved.');
