// Build a separate Sites checkout from the company app. Never mutates company runtime files.
import {cpSync,existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
const root=resolve(import.meta.dirname,'..'),target=resolve(process.argv[2]||'');
if(!process.argv[2]||target===root||(existsSync(target)&&readdirSync(target).length))throw Error('Provide a new empty absolute destination directory');
mkdirSync(target,{recursive:true});
for(const name of ['app','components','db','drizzle','hooks','lib','scripts','public','vendor','worker','.gitignore','.npmrc','components.json','cloudflare-env.d.ts','drizzle.config.ts','postcss.config.mjs','tsconfig.json','vite.config.ts','package-lock.json'])cpSync(join(root,name),join(target,name),{recursive:true,filter:p=>!p.endsWith('/server-db.mjs')&&!p.endsWith('/server-auth.mjs')&&!p.endsWith('/app/login')&&!p.endsWith('/app/api/session')});
cpSync(join(root,'sites-adapter'),target,{recursive:true});
mkdirSync(join(target,'.openai'),{recursive:true});writeFileSync(join(target,'.openai/hosting.json'),JSON.stringify({d1:'DB',r2:null})+'\n');
const path=join(target,'app/dashboard.tsx');let ui=readFileSync(path,'utf8');const start=ui.indexOf('  async function logout()'),end=ui.indexOf('\n  const filter=',start);if(start<0||end<0)throw Error('Dashboard logout adapter needs updating');ui=ui.slice(0,start)+"  async function logout(){window.location.assign('/signout-with-chatgpt?return_to=/');}"+ui.slice(end);ui=ui.replaceAll("appPath('/login')","'/signin-with-chatgpt?return_to=/'");writeFileSync(path,ui);
// Lock dependency graph remains shared; only the root package scripts differ.
const lock=JSON.parse(readFileSync(join(target,'package-lock.json'),'utf8')),pkg=JSON.parse(readFileSync(join(target,'package.json'),'utf8'));lock.packages[''].version=pkg.version;writeFileSync(join(target,'package-lock.json'),JSON.stringify(lock,null,2)+'\n');
console.log('Prepared Sites source:',target);
