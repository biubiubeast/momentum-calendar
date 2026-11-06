import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {loadConfig} from './config.mjs';
const directory=dirname(fileURLToPath(import.meta.url)),releaseServer=resolve(directory,'../app/server.js'),server=process.argv[2]||(existsSync(releaseServer)?releaseServer:resolve(directory,'../.next/standalone/server.js')),config=loadConfig();
const child=spawn(process.execPath,[server],{cwd:dirname(server),stdio:'inherit',env:{...process.env,...Object.fromEntries(Object.entries(config).map(([k,v])=>[k,String(v)])),NODE_ENV:'production',HOSTNAME:'127.0.0.1',PORT:process.env.MOMENTUM_CANDIDATE_PORT||String(config.PORT)}});
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>child.kill(signal));child.once('error',()=>{console.error('Unable to start Momentum');process.exitCode=1;});child.once('exit',code=>{process.exitCode=code??1;});
