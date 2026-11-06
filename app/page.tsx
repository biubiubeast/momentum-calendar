import Dashboard from './dashboard';
import {today} from './model';
import {requireChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Home(){const user=await requireChatGPTUser('/');return <Dashboard initialDate={today()} initialNow={Date.now()} userId={user.userId} userName={user.displayName}/>;}
