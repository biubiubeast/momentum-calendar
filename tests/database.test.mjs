import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDatabase} from '../lib/server-db.mjs';
test('SQLite persists records with private file mode and rolls back a failed batch',async()=>{const dir=mkdtempSync(join(tmpdir(),'momentum-db-test-')),file=join(dir,'app.sqlite');let db=openDatabase(file);try{await db.prepare('INSERT INTO journals VALUES(?,?,?,?)').bind('a','{"tasks":[]}',1,'now').run();await assert.rejects(db.batch([db.prepare('UPDATE journals SET revision=2 WHERE user_id=?').bind('a'),db.prepare('INSERT INTO journals VALUES(?,?,?,?)').bind('a','{}',3,'later')]));assert.equal((await db.prepare('SELECT revision FROM journals WHERE user_id=?').bind('a').first()).revision,1);db.close();db=openDatabase(file);assert.equal((await db.prepare('SELECT body FROM journals WHERE user_id=?').bind('a').first()).body,'{"tasks":[]}');assert.equal(statSync(file).mode&0o777,0o600);}finally{db.close();rmSync(dir,{recursive:true,force:true});}});
