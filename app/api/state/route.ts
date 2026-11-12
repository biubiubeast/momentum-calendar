import { getDatabase } from '@/lib/server-db.mjs';
import { requireUser,json,sameOrigin,readJson,failure,HttpError } from '@/lib/server-auth.mjs';
import { validData } from '../../model';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const user=await requireUser(request),db=getDatabase();
 const row=await db.prepare('SELECT body,revision FROM journals WHERE user_id=?').bind(user.id).first();
 return json({data:row?JSON.parse(row.body):null,revision:row?.revision??0});
}catch(error){return failure(error);}}
export async function PUT(request:Request){try{
 const user=await requireUser(request);sameOrigin(request);const payload=await readJson(request);
 if(!payload||!validData(payload.data)||!Number.isSafeInteger(payload.revision)||payload.revision<0||payload.revision>=Number.MAX_SAFE_INTEGER)throw new HttpError('记录格式无效',400);
 const db=getDatabase(),body=JSON.stringify(payload.data),now=new Date().toISOString();
 const current=await db.prepare('SELECT body FROM journals WHERE user_id=?').bind(user.id).first();
 if(current&&JSON.parse(current.body).schemaVersion==='2.1'&&payload.data.schemaVersion!=='2.1')throw new HttpError('此账号已升级到 2.1，请刷新页面后再保存，避免丢失成果记录',409);
 if(payload.revision===0){const r=await db.prepare('INSERT OR IGNORE INTO journals(user_id,body,revision,updated_at) VALUES(?,?,1,?)').bind(user.id,body,now).run();if(!r.meta.changes)throw new HttpError('记录已在其他页面更新，请先导出本页备份再刷新',409);return json({revision:1});}
 const r=await db.prepare('UPDATE journals SET body=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?').bind(body,now,user.id,payload.revision).run();
 if(!r.meta.changes)throw new HttpError('记录已在其他页面更新，请先导出本页备份再刷新',409);
 return json({revision:payload.revision+1});
}catch(error){return failure(error);}}
