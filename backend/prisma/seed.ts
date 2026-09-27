import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const salesHash = await bcrypt.hash('Sales@123', 10);
  await prisma.user.upsert({ where:{email:'admin@example.com'}, update:{}, create:{email:'admin@example.com',passwordHash:adminHash,role:Role.ADMIN} });
  await prisma.user.upsert({ where:{email:'sales@example.com'}, update:{}, create:{email:'sales@example.com',passwordHash:salesHash,role:Role.SALES_USER} });
  const products = [
    ['IND-001','Industrial Product A','Bearings','PCS',1200,200],
    ['IND-002','Industrial Product B','Motors','PCS',2500,150],
    ['IND-003','Industrial Product C','Valves','PCS',1750,300],
    ['IND-004','Industrial Product D','Pumps','PCS',4200,100],
    ['IND-005','Industrial Product E','Couplings','PCS',950,250],
    ['IND-006','Industrial Product F','Gaskets','PCS',300,500]
  ] as const;
  for (const [code,name,category,unit,basePrice,qty] of products) {
    const p = await prisma.product.upsert({where:{code},update:{},create:{code,name,category,unit,basePrice}});
    await prisma.inventory.upsert({where:{productId:p.id},update:{},create:{productId:p.id,physicalQty:qty,reservedQty:0}});
  }
  console.log('Seed complete');
}
main().finally(()=>prisma.$disconnect());
