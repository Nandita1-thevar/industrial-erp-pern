import {requireRole} from '../src/middleware/auth';
import {Role} from '@prisma/client';
function run(role:any,allowed:Role[]){const req:any={user:{id:1,email:'x',role}};let status=200,body:any;const res:any={status:(n:number)=>{status=n;return res},json:(x:any)=>{body=x;return res}};let next=false;requireRole(...allowed)(req,res,()=>{next=true});return {status,body,next};}
test('Unauthorized user cannot perform a restricted operation',()=>{const result=run(Role.SALES_USER,[Role.ADMIN]);expect(result.status).toBe(403);expect(result.next).toBe(false);expect(result.body.message).toBe('Forbidden');});
test('Admin can perform an admin operation',()=>{const result=run(Role.ADMIN,[Role.ADMIN]);expect(result.status).toBe(200);expect(result.next).toBe(true);});
