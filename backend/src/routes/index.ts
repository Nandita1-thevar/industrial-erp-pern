import {Router} from 'express'; import {login} from '../controllers/auth.controller'; import {auth,requireRole} from '../middleware/auth'; import {Role} from '@prisma/client'; import {listProducts,listInventory,updateInventory} from '../controllers/product.controller'; import {listEnquiries,createEnquiry} from '../controllers/enquiry.controller'; import {listQuotations,createQ,updateStatus,convert} from '../controllers/quotation.controller'; import {listOrders,confirm,dispatch} from '../controllers/order.controller';
const r=Router();
r.post('/auth/login',login);
r.use(auth);
r.get('/products',listProducts); r.get('/inventory',listInventory); r.patch('/inventory/:productId',requireRole(Role.ADMIN),updateInventory);
r.get('/enquiries',listEnquiries); r.post('/enquiries',requireRole(Role.ADMIN,Role.SALES_USER),createEnquiry);
r.get('/quotations',listQuotations); r.post('/quotations',requireRole(Role.ADMIN,Role.SALES_USER),createQ); r.patch('/quotations/:id/status',requireRole(Role.ADMIN,Role.SALES_USER),updateStatus); r.post('/quotations/:id/convert',requireRole(Role.ADMIN,Role.SALES_USER),convert);
r.get('/sales-orders',listOrders); r.post('/sales-orders/:id/confirm',requireRole(Role.ADMIN),confirm); r.post('/sales-orders/:id/dispatch',requireRole(Role.ADMIN),dispatch);
export default r;
