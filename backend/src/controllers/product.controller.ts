import {Request,Response} from 'express';
import {prisma} from '../config/prisma';
import {z} from 'zod';
export async function listProducts(_req:Request,res:Response){res.json(await prisma.product.findMany({include:{inventory:true},orderBy:{code:'asc'}}));}
export async function listInventory(_req:Request,res:Response){const rows=await prisma.inventory.findMany({include:{product:true},orderBy:{product:{code:'asc'}}}); res.json(rows.map(x=>({...x,availableQty:Number(x.physicalQty)-Number(x.reservedQty)})));}
export async function updateInventory(req:Request,res:Response){const id=Number(req.params.productId); const body=z.object({physicalQty:z.number().min(0),reservedQty:z.number().min(0)}).parse(req.body); if(body.reservedQty>body.physicalQty) return res.status(400).json({message:'Reserved quantity cannot exceed physical quantity'}); const row=await prisma.inventory.update({where:{productId:id},data:body,include:{product:true}}); res.json(row);}
