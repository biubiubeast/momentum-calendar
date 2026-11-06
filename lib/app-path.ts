export const basePath=process.env.NEXT_PUBLIC_BASE_PATH||'';
export function appPath(path:string){return path.startsWith('/')&&!path.startsWith('//')?basePath+path:path;}
export function localPath(path:string){return basePath&&path.startsWith(basePath+'/')?path.slice(basePath.length):path===basePath?'/':path;}
