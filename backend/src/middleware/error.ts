import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
export function errorHandler(err:any,_req:Request,res:Response,_next:NextFunction){
  if(err instanceof ZodError) return res.status(400).json({message:'Validation failed',errors:err.issues});
  if(err?.code==='P2002') return res.status(409).json({message:'Duplicate record',target:err.meta?.target});
  if(err?.code==='P2003') return res.status(400).json({message:'Related record does not exist'});
  console.error(err);
  return res.status(err.status || 500).json({message:err.message || 'Internal server error'});
}
