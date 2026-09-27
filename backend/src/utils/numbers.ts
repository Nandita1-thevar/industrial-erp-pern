export function round2(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }
export function calculateLine(quantity:number, unitPrice:number, discountPct:number, gstPct:number) {
  const base = quantity * unitPrice;
  const discount = base * discountPct / 100;
  const taxable = base - discount;
  const gst = taxable * gstPct / 100;
  return { base: round2(base), discount: round2(discount), gst: round2(gst), lineAmount: round2(taxable + gst) };
}
export function calculateQuotation(items:{quantity:number;unitPrice:number;discountPct:number;gstPct:number}[]) {
  return items.reduce((a,i)=>{ const x=calculateLine(i.quantity,i.unitPrice,i.discountPct,i.gstPct); a.subtotal+=x.base; a.discount+=x.discount; a.gst+=x.gst; a.grandTotal+=x.lineAmount; return a; },{subtotal:0,discount:0,gst:0,grandTotal:0});
}
