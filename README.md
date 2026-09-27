# Industrial ERP – PERN Technical Case Study

A small ERP workflow for industrial products: **Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch**.

## Tech Stack
- PostgreSQL
- Node.js + Express.js + TypeScript
- React + Vite + TypeScript
- Prisma ORM
- JWT authentication + bcrypt password hashing
- Jest + Supertest

## Project Structure
```
backend/   Express API, Prisma schema, seed and tests
frontend/  React/Vite application
```

## Requirements
- Node.js 20+
- PostgreSQL 14+

## Database Setup
Create a PostgreSQL database, then copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL`.

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Or from the root:
```bash
npm install
npm run install:all
npm run dev
```

## Environment Variables
Backend:
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `CLIENT_URL`

Frontend:
- `VITE_API_URL`

## Demo Credentials
- Admin: `admin@example.com` / `Admin@123`
- Sales User: `sales@example.com` / `Sales@123`

## Tests
```bash
cd backend
npm test
```
The test suite covers quotation calculation, quotation status restrictions, duplicate order prevention, inventory reservation limits and RBAC. A concurrency test is also included for the inventory reservation service.

## API Documentation
Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/login`

### Enquiries
- `GET /enquiries`
- `POST /enquiries`

### Products / Inventory
- `GET /products`
- `GET /inventory`
- `PATCH /inventory/:productId`

### Quotations
- `GET /quotations`
- `POST /quotations`
- `PATCH /quotations/:id/status`
- `POST /quotations/:id/convert`

### Sales Orders
- `GET /sales-orders`
- `POST /sales-orders/:id/confirm`
- `POST /sales-orders/:id/dispatch`

## Business Rules Implemented
- Backend JWT authentication and ADMIN/SALES_USER RBAC.
- Enquiries can contain multiple products.
- Enquiry statuses: NEW → QUOTED → WON/LOST.
- Quotation totals are calculated on the backend; client totals are ignored.
- Only ACCEPTED quotations can become orders.
- A quotation can generate only one order.
- Confirmation reserves stock inside a database transaction using row locks.
- Reservation never reduces physical stock.
- Dispatch reduces both physical and reserved stock inside a transaction.
- Dispatch cannot exceed reserved quantity or repeat dispatched quantity.
- Database foreign keys, unique constraints and check constraints protect relational consistency.

## ER Diagram
See `docs/ER-DIAGRAM.md`.

## Demo Flow (5 minutes)
1. Login as Sales User.
2. Create/view an enquiry.
3. Create a quotation and accept it.
4. Convert quotation to Sales Order.
5. Login as Admin, confirm order and show reserved/available stock.
6. Dispatch order and show physical/reserved/available quantities changing.
7. Briefly show backend RBAC and tests.
