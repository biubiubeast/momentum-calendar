import {NextResponse} from 'next/server';
import {session,json,failure} from './lib/server-auth.mjs';
import {appPath,localPath} from './lib/app-path';
export async function proxy(request:Request){
 const path=localPath(new URL(request.url).pathname).replace(/\/+$/,'')||'/';
 const asset=!path.includes('%')&&!path.includes('\\')&&!path.split('/').some(x=>x==='.'||x==='..')&&(path.startsWith('/_next/static/')||['/favicon.svg','/favicon.ico','/robots.txt'].includes(path));
 if(asset||path==='/login'||path==='/api/session')return NextResponse.next();
 try{const user=await session(request);if(!user){if(path.startsWith('/api/')||request.headers.has('RSC'))return json({error:'请先登录'},401);return NextResponse.redirect(new URL(appPath('/login'),process.env.PUBLIC_ORIGIN||request.url),303);}
  const response=NextResponse.next();response.headers.set('Cache-Control','private, no-store');response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('X-Frame-Options','DENY');return response;
 }catch(error){return failure(error);}
}
export const config={matcher:['/:path*']};
