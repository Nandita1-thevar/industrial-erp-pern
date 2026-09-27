-- Database-level business rules for inventory consistency

ALTER TABLE "Inventory"
ADD CONSTRAINT "Inventory_physicalQty_nonnegative"
CHECK ("physicalQty" >= 0);

ALTER TABLE "Inventory"
ADD CONSTRAINT "Inventory_reservedQty_nonnegative"
CHECK ("reservedQty" >= 0);

ALTER TABLE "Inventory"
ADD CONSTRAINT "Inventory_reserved_not_over_physical"
CHECK ("reservedQty" <= "physicalQty");

ALTER TABLE "EnquiryItem"
ADD CONSTRAINT "EnquiryItem_quantity_positive"
CHECK ("quantity" > 0);

ALTER TABLE "QuotationItem"
ADD CONSTRAINT "QuotationItem_quantity_positive"
CHECK ("quantity" > 0);

ALTER TABLE "QuotationItem"
ADD CONSTRAINT "QuotationItem_discount_valid"
CHECK ("discountPct" >= 0 AND "discountPct" <= 100);

ALTER TABLE "QuotationItem"
ADD CONSTRAINT "QuotationItem_gst_valid"
CHECK ("gstPct" >= 0 AND "gstPct" <= 100);

ALTER TABLE "SalesOrderItem"
ADD CONSTRAINT "SalesOrderItem_quantity_positive"
CHECK ("quantity" > 0);

ALTER TABLE "DispatchItem"
ADD CONSTRAINT "DispatchItem_quantity_positive"
CHECK ("quantity" > 0);