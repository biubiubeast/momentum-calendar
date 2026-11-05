import Dashboard from './dashboard';
import {today} from './model';
export const dynamic = 'force-dynamic';
export default function Home() { return <Dashboard initialDate={today()} initialNow={Date.now()}/>; }
