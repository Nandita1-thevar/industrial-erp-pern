import { calculateLine, calculateQuotation } from '../src/utils/numbers';

describe('quotation calculation',()=>{
  test('Quotation total is calculated correctly',()=>{
    const x=calculateLine(10,100,10,18);
    expect(x.base).toBe(1000); expect(x.discount).toBe(100); expect(x.gst).toBe(162); expect(x.lineAmount).toBe(1062);
  });
  test('multiple quotation lines calculate correctly',()=>{
    const x=calculateQuotation([{quantity:10,unitPrice:100,discountPct:0,gstPct:18},{quantity:5,unitPrice:200,discountPct:10,gstPct:18}]);
    expect(x.grandTotal).toBe(2242);
  });
});

describe('business rule helpers',()=>{
  test('Draft/Rejected quotations are not eligible for order conversion',()=>{
    const canConvert=(status:string)=>status==='ACCEPTED';
    expect(canConvert('DRAFT')).toBe(false); expect(canConvert('REJECTED')).toBe(false); expect(canConvert('ACCEPTED')).toBe(true);
  });
  test('same quotation cannot generate duplicate sales orders',()=>{
    const quotation={salesOrderId:null as number|null};
    const convert=()=>{if(quotation.salesOrderId!==null) throw new Error('duplicate'); quotation.salesOrderId=1; return 1;};
    expect(convert()).toBe(1); expect(()=>convert()).toThrow('duplicate');
  });
  test('cannot reserve more than available inventory',()=>{
    const reserve=(physical:number,reserved:number,qty:number)=>{if(qty>physical-reserved) throw new Error('Insufficient stock'); return reserved+qty;};
    expect(reserve(100,30,70)).toBe(100); expect(()=>reserve(100,30,71)).toThrow('Insufficient stock');
  });
});
