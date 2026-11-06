import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,chmodSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

export function openDatabase(filename){
 if(filename!==':memory:')mkdirSync(dirname(resolve(filename)),{recursive:true,mode:0o700});
 const sqlite=new DatabaseSync(filename);
 if(filename!==':memory:')chmodSync(filename,0o600);
 sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
 const version=sqlite.prepare('PRAGMA user_version').get().user_version;
 if(version>1){sqlite.close();throw Error('Database schema is newer than this application');}
 if(version===0)sqlite.exec(`BEGIN IMMEDIATE;
 CREATE TABLE IF NOT EXISTS journals(user_id TEXT PRIMARY KEY,body TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS momentum_users(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS momentum_sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES momentum_users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS momentum_sessions_expiry ON momentum_sessions(expires_at);
 CREATE TABLE IF NOT EXISTS momentum_login_attempts(bucket TEXT PRIMARY KEY,window_start INTEGER NOT NULL,attempts INTEGER NOT NULL);
 PRAGMA user_version=1; COMMIT;`);
 function statement(sql,args=[]){return {
  bind(...values){return statement(sql,values);},
  async first(column){const row=sqlite.prepare(sql).get(...args);return row?(column?row[column]:{...row}):null;},
  async all(){return{success:true,results:sqlite.prepare(sql).all(...args).map(x=>({...x})),meta:{}};},
  async raw(){return sqlite.prepare(sql).all(...args).map(Object.values);},
  runSync(){const r=sqlite.prepare(sql).run(...args);return{success:true,results:[],meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};},
  async run(){return this.runSync();},
 };}
 return {prepare:statement,async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const results=statements.map(s=>s.runSync());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}},close(){sqlite.close();}};
}
let database;
export function getDatabase(){if(!process.env.SQLITE_PATH)throw Error('SQLITE_PATH is required');return database??=openDatabase(process.env.SQLITE_PATH);}
