export type Category={id:string;name:string;color:string;focus:boolean};
export type Task={id:string;title:string;date:string;start:number;end:number;category:string;progress:number;actual:number;note:string;reminder:number;event?:boolean;projectId?:string};
export type Holiday={date:string;name:string;region:string;work?:boolean};
export type Habit={id:string;title:string;days:string[]};
export type ProjectEntry={id:string;date:string;text:string;kind:"progress"|"milestone"|"blocker";resolved:boolean;resolvedDate?:string};
export type Project={id:string;name:string;description:string;category:string;tags:string[];collaborators:string[];priority:number;startDate:string;endDate:string|null;createdAt:string;entries:ProjectEntry[]};
export type Review={period:"day"|"week";date:string;text:string};
export type Journal={reviews?:Review[];schemaVersion?:"2.1";projects?:Project[];tasks:Task[];categories:Category[];holidays:Holiday[];habits:Habit[];goal:number};
export const categories:Category[]=[{id:'career',name:'事业成长',color:'#50836a',focus:true},{id:'learning',name:'学习提升',color:'#7199bd',focus:true},{id:'health',name:'运动健康',color:'#c2995e',focus:false},{id:'life',name:'生活日常',color:'#a58cb4',focus:false}];
export const uid=()=>crypto.randomUUID();
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const asDate=(d:string)=>new Date(d+'T12:00:00+08:00');
export function addDays(d:string,n:number){const x=asDate(d);x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);}
export function weekStart(d:string){const day=asDate(d).getUTCDay();return addDays(d,-((day+6)%7));}
export const time=(m:number)=>`${Math.floor(m/60).toString().padStart(2,'0')}:${(m%60).toString().padStart(2,'0')}`;
export const minutes=(s:string)=>{const [a,b]=s.split(':').map(Number);return a*60+b;};
export const formatHours=(m:number)=>(m/60).toFixed(1);
export function emptyData():Journal{return {schemaVersion:"2.1",projects:[],reviews:[],tasks:[],categories:[...categories],holidays:[],habits:[{id:'deep',title:'为重要的事专注一次',days:[]},{id:'move',title:'运动 30 分钟',days:[]},{id:'review',title:'留 5 分钟回顾今天',days:[]}],goal:240};}
export function isDate(s:unknown):s is string {return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(asDate(s).getTime())&&asDate(s).toISOString().slice(0,10)===s;}
export function validData(x:any):x is Journal {
  if(!x||!Array.isArray(x.tasks)||x.tasks.length>20000||!Array.isArray(x.categories)||x.categories.length>30||!Array.isArray(x.holidays)||x.holidays.length>5000||!Array.isArray(x.habits)||x.habits.length>50||!Number.isFinite(x.goal)||x.goal<1||x.goal>1440)return false;
  if(!validProjects(x))return false;
  const date=isDate;
  return x.tasks.every((t:any)=>t&&typeof t.id==='string'&&typeof t.title==='string'&&t.title.length>0&&t.title.length<=200&&date(t.date)&&Number.isInteger(t.start)&&Number.isInteger(t.end)&&t.start>=0&&t.end<=1440&&t.end>t.start&&typeof t.category==='string'&&Number.isFinite(t.progress)&&t.progress>=0&&t.progress<=100&&Number.isFinite(t.actual)&&t.actual>=0&&t.actual<=1440&&typeof t.note==='string'&&t.note.length<=4000&&Number.isFinite(t.reminder)&&t.reminder>=-1&&t.reminder<=10080)&&x.categories.every((c:any)=>c&&typeof c.id==='string'&&typeof c.name==='string'&&c.name.length<=40&&/^#[0-9a-fA-F]{6}$/.test(c.color)&&typeof c.focus==='boolean')&&new Set(x.tasks.map((t:any)=>t.id)).size===x.tasks.length&&new Set(x.categories.map((c:any)=>c.id)).size===x.categories.length&&x.tasks.every((t:any)=>x.categories.some((c:any)=>c.id===t.category))&&x.holidays.every((h:any)=>h&&date(h.date)&&typeof h.name==='string'&&h.name.length<=100&&typeof h.region==='string')&&x.habits.every((h:any)=>h&&typeof h.id==='string'&&typeof h.title==='string'&&h.title.length<=100&&Array.isArray(h.days)&&h.days.length<20000&&h.days.every(date));
}
export function stats(tasks:Task[],cats:Category[]){const work=tasks.filter(t=>!t.event);const plan=work.reduce((s,t)=>s+t.end-t.start,0);return {plan,done:work.filter(t=>t.progress===100).length,total:work.length,rate:plan?Math.round(work.reduce((s,t)=>s+(t.end-t.start)*t.progress/100,0)/plan*100):0,focus:work.filter(t=>cats.find(c=>c.id===t.category)?.focus).reduce((s,t)=>s+t.actual,0),actual:work.reduce((s,t)=>s+t.actual,0)};}
export function range(date:string,period:string):[string,string]{if(period==='day')return[date,date];if(period==='week'){const s=weekStart(date);return[s,addDays(s,6)];}if(period==='month'){const s=date.slice(0,7)+'-01';const d=asDate(s);d.setUTCMonth(d.getUTCMonth()+1);return[s,addDays(d.toISOString().slice(0,10),-1)];}return[date.slice(0,4)+'-01-01',date.slice(0,4)+'-12-31'];}
export function streak(data:Journal,date:string){let n=0,d=date;const action=(s:string)=>data.tasks.some(t=>t.date===s&&(t.actual>0||t.progress===100))||data.habits.some(h=>h.days.includes(s));if(!action(d))d=addDays(d,-1);while(n<3660&&action(d)){n++;d=addDays(d,-1);}return n;}
export function demoData(date:string):Journal{
  const d=emptyData(),w=weekStart(date);const titles=[['一周规划与目标拆解','产品方案 · 深度工作','阅读与知识整理','力量训练'],['市场调研与竞品分析','核心项目 · 方案设计','团队同步会议','英语学习'],['产品方案 · 深度工作','用户访谈与整理','阅读与知识整理','慢跑与拉伸'],['核心项目 · 执行推进','内容创作与输出','行业研究','力量训练'],['项目复盘与交付','下周计划与整理','阅读与知识整理','散步与放松'],['个人项目探索','阅读一小时','户外运动'],['每周回顾','准备新的一周','家人时光']];
  for(let i=-35;i<7;i++){const day=addDays(w,i),j=(i%7+7)%7;const times=[[540,660],[720,840],[900,960],[1050,1110]];const cats=['career','career','learning','health'];titles[j].forEach((title,k)=>{const [start,end]=times[k];const past=day<date;const current=day===date;const p=past?(i%5===0&&k===2?50:100):current?[100,65,0,0][k]:0;d.tasks.push({id:'demo-'+i+'-'+k,title,date:day,start,end,category:cats[k],progress:p,actual:past?Math.round((end-start)*(0.78+(Math.abs(i+k)%3)*.1)):current?[110,62,0,0][k]:0,note:k===1?'把注意力放在最重要的一步，完成后记录进展。':'',reminder:10});});}
  d.tasks.push({id:'demo-event',title:'月度复盘 · 和更好的自己见面',date:addDays(date,3),start:960,end:1020,category:'career',progress:0,actual:0,note:'回顾这个月的收获，找到下一步的方向。',reminder:30,event:true});
  d.habits.forEach((h,k)=>{for(let i=-12;i<=0;i++)if((i+k)%4!==0)h.days.push(addDays(date,i));});
  d.projects=[{id:'demo-project',name:'核心产品 · 从想法到交付',description:'用持续的小步推进，把产品方案变成可交付的成果。',category:'career',tags:['开发','AI'],collaborators:['小林'],priority:4,startDate:addDays(date,-30),endDate:null,createdAt:addDays(date,-30)+'T01:00:00.000Z',entries:[{id:'demo-p1',date:addDays(date,-12),kind:'milestone',text:'完成需求梳理与首版原型',resolved:false},{id:'demo-p2',date:addDays(date,-4),kind:'blocker',text:'等待确认数据接入方式',resolved:false},{id:'demo-p3',date:addDays(date,-1),kind:'progress',text:'核心流程已跑通，开始整理交付清单',resolved:false}]}];
  d.tasks=d.tasks.map(t=>t.category==='career'&&!t.event&&t.date>=addDays(date,-30)?{...t,projectId:'demo-project'}:t);return d;
}
const unescapeICS=(s:string)=>s.replace(/\\n/gi,'\n').replace(/\\([,;\\])/g,'$1');
export function parseICS(text:string,category:string):{tasks:Task[],skipped:number}{
  const unfolded=text.replace(/\r\n/g,'\n').replace(/\n[ \t]/g,'');const blocks=unfolded.match(/BEGIN:VEVENT\n[\s\S]*?END:VEVENT/g)||[];let skipped=0;const tasks:Task[]=[];
  const parseDate=(line:string)=>{const index=line.indexOf(':');if(index<0)return null;const raw=line.slice(index+1),tz=line.slice(0,index).match(/TZID=([^:;]+)/)?.[1];if(tz&&!['Asia/Hong_Kong','Asia/Shanghai','Asia/Chongqing','UTC','Etc/UTC'].includes(tz))return null;
    if(/^\d{8}$/.test(raw)){const date=`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;return isDate(date)?{date,min:540,all:true}:null;}
    const m=raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);if(!m)return null;const date=`${m[1]}-${m[2]}-${m[3]}`;if(!isDate(date)||Number(m[4])>23||Number(m[5])>59||Number(m[6]||0)>59)return null;
    const v=new Date(`${date}T${m[4]}:${m[5]}:${m[6]||'00'}${m[7]||tz==='UTC'||tz==='Etc/UTC'?'Z':'+08:00'}`);const hk=new Date(v.getTime()+8*3600000);return{date:hk.toISOString().slice(0,10),min:hk.getUTCHours()*60+hk.getUTCMinutes(),all:false};
  };
  for(const b of blocks){const prop=(name:string)=>b.split('\n').find(l=>l.startsWith(name+':')||l.startsWith(name+';'));const rawStart=prop('DTSTART'),rawEnd=prop('DTEND');if(!rawStart||prop('RRULE')){skipped++;continue;}const start=parseDate(rawStart),end=rawEnd?parseDate(rawEnd):null;if(!start||(rawEnd&&!end)){skipped++;continue;}
    let endMinute=start.all?600:end?.min??Math.min(start.min+60,1440);if(end&&!start.all&&end.date!==start.date){if(end.date===addDays(start.date,1)&&end.min===0)endMinute=1440;else{skipped++;continue;}}if(endMinute<=start.min){skipped++;continue;}
    const summary=prop('SUMMARY'),id=prop('UID');const trigger=b.match(/BEGIN:VALARM[\s\S]*?TRIGGER(?:;[^:\n]*)?:-?PT(\d+)([MH])[\s\S]*?END:VALARM/);let reminder=-1;if(trigger)reminder=Math.min(10080,Number(trigger[1])*(trigger[2]==='H'?60:1));
    const description=unescapeICS(prop('DESCRIPTION')?.split(':').slice(1).join(':')||'')+(start.all?'\n原日历为全天事件，已安排到 09:00。':'');
    tasks.push({id:'ics-'+(id?id.slice(id.indexOf(':')+1).slice(0,150):uid()),title:unescapeICS(summary?.slice(summary.indexOf(':')+1)||'导入的事件').slice(0,200),date:start.date,start:start.min,end:endMinute,category,progress:0,actual:0,note:description.slice(0,4000),reminder,event:true});
  }return{tasks,skipped};
}
export function toICS(tasks:Task[]){const esc=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const utc=(t:Task,m:number)=>new Date(t.date+'T00:00:00+08:00').getTime()+m*60000;const stamp=(ms:number)=>new Date(ms).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Momentum//Execution Calendar//ZH','CALSCALE:GREGORIAN'];for(const t of tasks){lines.push('BEGIN:VEVENT','UID:'+esc(t.id)+'@momentum','DTSTAMP:'+stamp(Date.now()),'DTSTART:'+stamp(utc(t,t.start)),'DTEND:'+stamp(utc(t,t.end)),'SUMMARY:'+esc(t.title),'DESCRIPTION:'+esc(t.note));if(t.reminder>=0)lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+esc(t.title),'TRIGGER:-PT'+t.reminder+'M','END:VALARM');lines.push('END:VEVENT');}lines.push('END:VCALENDAR');return lines.join('\r\n');}
export function download(name:string,content:string,type='application/json'){const a=document.createElement('a');const url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

// Optional projects preserve pre-2.1 JSON backups. All new client writes include the field.
export function normalizeData(data:Journal):Journal{return {...data,schemaVersion:'2.1',projects:data.projects||[],reviews:data.reviews||[]};}
function validProjects(x:any):boolean {
 const reviews=x.reviews===undefined?[]:x.reviews;
 if(!Array.isArray(reviews)||reviews.length>20000||new Set(reviews.map((r:any)=>r?.period+':'+r?.date)).size!==reviews.length||!reviews.every((r:any)=>r&&['day','week'].includes(r.period)&&isDate(r.date)&&(r.period!=='week'||weekStart(r.date)===r.date)&&typeof r.text==='string'&&r.text.length>0&&r.text.length<=8000))return false;
 if(x.schemaVersion!==undefined&&x.schemaVersion!=='2.1')return false;
 const ps=x.projects===undefined?[]:x.projects;
 const text=(v:any,max:number)=>typeof v==='string'&&v.length>0&&v.length<=max;
 const list=(v:any)=>Array.isArray(v)&&v.length<=30&&v.every((s:any)=>text(s,60))&&new Set(v).size===v.length;
 if(!Array.isArray(ps)||ps.length>1000||new Set(ps.map((p:any)=>p?.id)).size!==ps.length)return false;
 if(!ps.every((p:any)=>p&&text(p.id,200)&&text(p.name,200)&&typeof p.description==='string'&&p.description.length<=4000&&x.categories.some((c:any)=>c?.id===p.category)&&list(p.tags)&&list(p.collaborators)&&Number.isInteger(p.priority)&&p.priority>=1&&p.priority<=5&&isDate(p.startDate)&&(p.endDate===null||(isDate(p.endDate)&&p.endDate>=p.startDate))&&typeof p.createdAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(p.createdAt)&&Number.isFinite(Date.parse(p.createdAt))&&Array.isArray(p.entries)&&p.entries.length<=2000&&new Set(p.entries.map((e:any)=>e?.id)).size===p.entries.length&&p.entries.every((e:any)=>e&&text(e.id,200)&&isDate(e.date)&&e.date>=p.startDate&&(!p.endDate||e.date<=p.endDate)&&text(e.text,4000)&&['progress','milestone','blocker'].includes(e.kind)&&typeof e.resolved==='boolean'&&(e.resolvedDate===undefined||(isDate(e.resolvedDate)&&e.kind==='blocker'&&e.resolved&&e.resolvedDate>=e.date))&&(e.kind==='blocker'||!e.resolved))))return false;
 return x.tasks.every((t:any)=>t?.projectId===undefined||(typeof t.projectId==='string'&&!t.event&&ps.some((p:any)=>p.id===t.projectId&&t.date>=p.startDate)));
}
export function projectStats(project:Project,tasks:Task[],until=today()){
 const linked=tasks.filter(t=>!t.event&&t.projectId===project.id);
 const active=linked.filter(t=>t.date<=until&&(t.actual>0||t.progress>0||t.note.trim()));
 const days=[...new Set(active.map(t=>t.date))].sort();
 const progressDates=[...active.map(t=>t.date),...project.entries.filter(e=>e.date<=until).map(e=>e.date),...project.entries.flatMap(e=>e.resolvedDate&&e.resolvedDate<=until?[e.resolvedDate]:[])].sort();
 const elapsedDays=Math.max(0,Math.floor((asDate(project.endDate||until).getTime()-asDate(project.startDate).getTime())/86400000))+1;
 return {linked,days,actual:linked.reduce((s,t)=>s+t.actual,0),plan:linked.reduce((s,t)=>s+t.end-t.start,0),elapsedDays:project.startDate>until&&!project.endDate?0:elapsedDays,lastProgress:progressDates.at(-1)||'',openBlockers:project.entries.filter(e=>e.kind==='blocker'&&!e.resolved).sort((a,b)=>b.date.localeCompare(a.date))};
}
export type ProjectSort='created-desc'|'created-asc'|'duration-desc'|'duration-asc'|'progress-desc'|'progress-asc'|'priority-desc'|'priority-asc';
export function selectProjects(data:Journal,filter:{status:string;category:string;tags:string[];query:string;sort:ProjectSort},until=today()){
 const ps=(data.projects||[]).filter(p=>(filter.status==='all'||(filter.status==='done'?!!p.endDate:!p.endDate))&&(!filter.category||p.category===filter.category)&&filter.tags.every(t=>p.tags.includes(t))&&(!filter.query||(p.name+' '+p.description+' '+p.collaborators.join(' ')).toLowerCase().includes(filter.query.toLowerCase())));
 const metrics=new Map(ps.map(p=>[p.id,projectStats(p,data.tasks,until)]));
 return ps.sort((a,b)=>{const aa=metrics.get(a.id)!,bb=metrics.get(b.id)!;let n=0;switch(filter.sort){case 'created-desc':n=b.createdAt.localeCompare(a.createdAt);break;case 'created-asc':n=a.createdAt.localeCompare(b.createdAt);break;case 'duration-desc':n=bb.elapsedDays-aa.elapsedDays;break;case 'duration-asc':n=aa.elapsedDays-bb.elapsedDays;break;case 'priority-desc':n=b.priority-a.priority;break;case 'priority-asc':n=a.priority-b.priority;break;default:if(!aa.lastProgress||!bb.lastProgress)n=Number(!aa.lastProgress)-Number(!bb.lastProgress);else n=filter.sort==='progress-desc'?bb.lastProgress.localeCompare(aa.lastProgress):aa.lastProgress.localeCompare(bb.lastProgress);}
 return n||a.id.localeCompare(b.id);});
}
