import {app} from './app'; import {env} from './config/env'; import {prisma} from './config/prisma';
const server=app.listen(env.port,()=>console.log(`API running on http://localhost:${env.port}`));
process.on('SIGINT',async()=>{await prisma.$disconnect();server.close();});
