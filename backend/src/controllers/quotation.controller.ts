import {Request,Response} from 'express'; import {prisma} from '../config/prisma'; import {z} from 'zod'; import {createQuotation} from '../services/quotation.service'; import {convertQuotation} from '../services/order.service';
const item=z.object({productId:z.number().int().positive(),quantity:z.number().positive(),unitPrice:z.number().positive(),discountPct:z.number().min(0).max(100),gstPct:z.number().min(0).max(100)});
export async function listQuotations(_req:Request,res:Response){res.json(await prisma.quotation.findMany({include:{enquiry:{include:{customer:true}},items:{include:{product:true}},salesOrder:true},orderBy:{createdAt:'desc'}}));}
export async function createQ(req:Request,res:Response){const b=z.object({enquiryId:z.number().int().positive(),validUntil:z.coerce.date(),items:z.array(item).min(1)}).parse(req.body);res.status(201).json(await createQuotation(b));}
export async function updateStatus(req:Request,res:Response){const status=z.enum(['DRAFT','SENT','ACCEPTED','REJECTED']).parse(req.body.status);const q=await prisma.quotation.findUnique({where:{id:Number(req.params.id)}});if(!q)return res.status(404).json({message:'Quotation not found'});const allowed:Record<string,string[]>={DRAFT:['SENT','REJECTED'],SENT:['ACCEPTED','REJECTED'],ACCEPTED:[],REJECTED:[]}; if(status!==q.status && !allowed[q.status]?.includes(status)) return res.status(400).json({message:`Invalid quotation status transition: ${q.status} -> ${status}`});res.json(await prisma.quotation.update({where:{id:q.id},data:{status}}));}
export async function convert(req:Request,res:Response){
  return res.status(501).json({
    message: 'Sales Order conversion is not implemented in this version.'
  });
}