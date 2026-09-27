# API Documentation

All protected endpoints require:
`Authorization: Bearer <JWT>`

## POST /api/auth/login
```json
{ "email": "sales@example.com", "password": "Sales@123" }
```
Returns `{ token, user }`.

## POST /api/enquiries
Sales user/admin.
```json
{
  "companyName":"ABC Engineering Pvt. Ltd.",
  "contactPerson":"Ravi Kumar",
  "mobile":"9876543210",
  "email":"ravi@abc.com",
  "city":"Mumbai",
  "requiredDate":"2026-10-10",
  "notes":"Urgent requirement",
  "items":[{"productId":1,"quantity":100}]
}
```

## POST /api/quotations
Sales user/admin.
```json
{
  "enquiryId":1,
  "validUntil":"2026-10-20",
  "items":[
    {"productId":1,"quantity":10,"unitPrice":1200,"discountPct":5,"gstPct":18}
  ]
}
```
The backend recalculates line amounts and grand total.

## PATCH /api/quotations/:id/status
```json
{ "status":"ACCEPTED" }
```

## POST /api/quotations/:id/convert
Converts an ACCEPTED quotation to one Sales Order. A unique DB constraint prevents duplicates.

## POST /api/sales-orders/:id/confirm
Admin only. Locks inventory rows, validates available stock and increments reserved quantity atomically.

## POST /api/sales-orders/:id/dispatch
Admin only.
```json
{
  "vehicleNo":"MH12AB1234",
  "driverName":"Suresh Kumar",
  "items":[{"productId":1,"quantity":10}]
}
```
The backend checks the order is confirmed, quantity is reserved, then decreases physical and reserved quantities in one transaction.
