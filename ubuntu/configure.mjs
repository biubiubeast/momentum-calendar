import {mkdirSync,existsSync,writeFileSync,chmodSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {homedir} from 'node:os';
import {configPath} from './config.mjs';
import {confirmedPassword} from './password-prompt.mjs';
import {openDatabase} from '../lib/server-db.mjs';
import {createUser} from '../lib/server-auth.mjs';
process.umask(0o077);
if(existsSync(configPath))throw Error('Configuration already exists; no account was changed');
const username=process.argv[2]||'bill';if(!/^[a-z][a-z0-9_-]{2,31}$/.test(username))throw Error('Invalid account name');
console.log('Create Momentum account: '+username);const value=await confirmedPassword();
const config={SQLITE_PATH:resolve(homedir(),'.local/share/momentum/app.sqlite'),PUBLIC_ORIGIN:'https://bill.spailab.com',NEXT_PUBLIC_BASE_PATH:'/Momentum',PORT:3105};
mkdirSync(dirname(configPath),{recursive:true,mode:0o700});chmodSync(dirname(configPath),0o700);
const db=openDatabase(config.SQLITE_PATH);try{await createUser(db,username,value);}finally{db.close();}
writeFileSync(configPath,JSON.stringify(config,null,2)+'\n',{mode:0o600,flag:'wx'});
console.log('Saved server configuration. Account: '+username+'. No password is printed.');
