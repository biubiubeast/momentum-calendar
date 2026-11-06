import {session,json,login,logout,failure} from '@/lib/server-auth.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{return json({user:await session(request)});}catch(error){return failure(error);}}
export async function POST(request:Request){try{return await login(request);}catch(error){return failure(error);}}
export async function DELETE(request:Request){try{return await logout(request);}catch(error){return failure(error);}}
