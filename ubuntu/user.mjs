import {loadConfig} from './config.mjs';
import {confirmedPassword} from './password-prompt.mjs';
import {openDatabase} from '../lib/server-db.mjs';
import {createUser} from '../lib/server-auth.mjs';
const username=process.argv[2];if(!username)throw Error('Usage: node ubuntu/user.mjs <new-account>');
const db=openDatabase(loadConfig().SQLITE_PATH);try{if(await db.prepare('SELECT id FROM momentum_users WHERE username=?').bind(username).first())throw Error('Account already exists; nothing changed');const value=await confirmedPassword();await createUser(db,username,value);console.log('Created account: '+username);}finally{db.close();}
