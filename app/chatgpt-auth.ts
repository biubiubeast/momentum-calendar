// Compatibility names for the original Sites snapshot; identity now comes only
// from the server-validated local session, never from forwarded account headers.
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {session} from '@/lib/server-auth.mjs';
import {appPath} from '@/lib/app-path';
export type ChatGPTUser={userId:string;displayName:string;email:string;fullName:string|null};
export async function getChatGPTUser():Promise<ChatGPTUser|null>{const h=await headers(),user=await session(new Request(process.env.PUBLIC_ORIGIN||'http://localhost',{headers:h}));return user?{userId:user.id,displayName:user.username,email:'',fullName:user.username}:null;}
export async function requireChatGPTUser(_returnTo:string){const user=await getChatGPTUser();if(!user)redirect(appPath('/login'));return user;}
export function chatGPTSignInPath(_returnTo='/'){return appPath('/login');}
export function chatGPTSignOutPath(_returnTo='/'){return appPath('/login');}
