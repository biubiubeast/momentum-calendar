import {getDatabase} from '../lib/server-db.mjs';
import {drizzle} from 'drizzle-orm/d1';
import * as schema from './schema';
export function getDb(){return drizzle(getDatabase() as unknown as D1Database,{schema});}
