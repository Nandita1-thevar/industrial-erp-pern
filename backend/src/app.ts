import express from 'express'; import cors from 'cors'; import routes from './routes'; import {errorHandler} from './middleware/error'; import {env} from './config/env';
export const app=express(); app.use(cors({origin:env.clientUrl})); app.use(express.json()); app.get('/health',(_req,res)=>res.json({ok:true})); app.use('/api',routes); app.use(errorHandler);
