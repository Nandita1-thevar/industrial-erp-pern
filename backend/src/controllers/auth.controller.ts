import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { z } from 'zod';
const schema=z.object({email:z.string().email(),password:z.string().min(6)});
export async function login(req:Request,res:Response){ const {email,password}=schema.parse(req.body); const user=await prisma.user.findUnique({where:{email}}); if(!user || !(await bcrypt.compare(password,user.passwordHash))) return res.status(401).json({message:'Invalid credentials'}); const token=jwt.sign({id:user.id,email:user.email,role:user.role},env.jwtSecret,{expiresIn:'8h'}); res.json({token,user:{id:user.id,email:user.email,role:user.role}}); }
