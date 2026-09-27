# Architecture Notes

The backend is intentionally split into routes, controllers and services. Controllers validate request shapes and return HTTP responses; services contain workflow rules and transactions.

## Reservation concurrency
`confirmOrder()` runs in a PostgreSQL transaction at `SERIALIZABLE` isolation and locks each required inventory row with `SELECT ... FOR UPDATE`. It then re-checks `physicalQty - reservedQty` while the row is locked and updates `reservedQty`. Therefore two concurrent confirmations cannot both consume the same available quantity.

## Dispatch
Dispatch uses the same transactional pattern. It locks inventory, checks the remaining order quantity and reserved stock, creates the dispatch record, then decrements both physical and reserved stock.

## Why relational tables
Enquiry items, quotation items, sales order items and dispatch items are separate tables with foreign keys and uniqueness rules. The business workflow is not hidden inside JSON fields.
