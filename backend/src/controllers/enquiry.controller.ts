import {Request,Response} from 'express';
import {prisma} from '../config/prisma';
import {z} from 'zod';
const schema=z.object({companyName:z.string().min(2),contactPerson:z.string().min(2),mobile:z.string().min(7),email:z.string().email(),city:z.string().min(2),requiredDate:z.coerce.date(),notes:z.string().optional(),items:z.array(z.object({productId:z.number().int().positive(),quantity:z.number().positive()})).min(1)});
function enquiryNo(){return `ENQ-${Date.now()}`}
export async function listEnquiries(_req:Request,res:Response){res.json(await prisma.enquiry.findMany({include:{customer:true,items:{include:{product:true}},quotation:true},orderBy:{createdAt:'desc'}}));}
export async function createEnquiry(req:Request,res:Response){const b=schema.parse(req.body); const result=await prisma.$transaction(async tx=>{const c=await tx.customer.create({data:{companyName:b.companyName,contactPerson:b.contactPerson,mobile:b.mobile,email:b.email,city:b.city}}); return tx.enquiry.create({data:{enquiryNo:enquiryNo(),customerId:c.id,createdById:req.user!.id,requiredDate:b.requiredDate,notes:b.notes,items:{create:b.items.map(i=>({productId:i.productId,quantity:i.quantity}))}},include:{customer:true,items:true}})});res.status(201).json(result);}
