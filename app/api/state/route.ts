import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { validData } from '../../model';
const response = (body: unknown, status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return response({error:'请先登录以保存个人记录'},401);
  if (!env.DB) return response({error:'存储暂不可用'},503);
  const row = await env.DB.prepare('SELECT body, revision FROM journals WHERE user_id = ?').bind(user.userId).first<{body:string,revision:number}>();
  return response({data:row ? JSON.parse(row.body):null,revision:row?.revision??0});
}
export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return response({error:'请先登录'},401);
  if (!env.DB) return response({error:'存储暂不可用'},503);
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return response({error:'无效来源'},403);
  const raw = await request.text();
  if (raw.length > 1500000) return response({error:'记录过大，请先导出历史记录'},413);
  let payload;try{payload=JSON.parse(raw);}catch{return response({error:'无效数据'},400);}
  if (!payload || typeof payload !== 'object' || !validData(payload.data) || !Number.isInteger(payload.revision) || payload.revision<0) return response({error:'记录格式无效'},400);
  const body=JSON.stringify(payload.data), now=new Date().toISOString();
  if (payload.revision===0) {
    const r=await env.DB.prepare('INSERT OR IGNORE INTO journals (user_id,body,revision,updated_at) VALUES (?,?,1,?)').bind(user.userId,body,now).run();
    if (!r.meta.changes) return response({error:'记录已在其他页面更新，请刷新后再试'},409);
    return response({revision:1});
  }
  const r=await env.DB.prepare('UPDATE journals SET body=?, revision=revision+1, updated_at=? WHERE user_id=? AND revision=?').bind(body,now,user.userId,payload.revision).run();
  if (!r.meta.changes) return response({error:'记录已在其他页面更新，请先导出本页备份再刷新'},409);
  return response({revision:payload.revision+1});
}
