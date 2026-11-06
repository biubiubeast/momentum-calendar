import {readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {resolve,isAbsolute} from 'node:path';
export const configPath=process.env.MOMENTUM_CONFIG||resolve(homedir(),'.config/momentum/runtime.json');
export function loadConfig(){const c=JSON.parse(readFileSync(configPath,'utf8'));if(typeof c.SQLITE_PATH!=='string'||!isAbsolute(c.SQLITE_PATH))throw Error('An absolute SQLITE_PATH is required');if(c.NEXT_PUBLIC_BASE_PATH!=='/Momentum')throw Error('Expected /Momentum');if(!Number.isInteger(c.PORT)||c.PORT<1024||c.PORT>65534)throw Error('Invalid port');if(new URL(c.PUBLIC_ORIGIN).origin!==c.PUBLIC_ORIGIN)throw Error('PUBLIC_ORIGIN must be an origin');return c;}
