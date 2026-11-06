import {DatabaseSync} from 'node:sqlite';
import {existsSync,mkdirSync,chmodSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadConfig} from './config.mjs';
process.umask(0o077);const target=process.argv[2],source=loadConfig().SQLITE_PATH;if(!target)throw Error('Specify backup directory');if(existsSync(source)){mkdirSync(target,{recursive:true,mode:0o700});const file=resolve(target,new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite'),db=new DatabaseSync(source);try{db.prepare('VACUUM INTO ?').run(file);}finally{db.close();}chmodSync(file,0o600);console.log('Database backup saved: '+file);}
