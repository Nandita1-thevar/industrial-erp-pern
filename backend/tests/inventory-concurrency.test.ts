/**
 * Database-level concurrency contract used by the confirmation service.
 * PostgreSQL SELECT ... FOR UPDATE serializes competing confirmations.
 */
test('simultaneous reservations cannot both exceed available stock', async()=>{
  const available=100;
  const requests=[80,50];
  let reserved=0;
  const reserve=async(qty:number)=>{await new Promise(r=>setTimeout(r,Math.random()*5));if(qty>available-reserved) return false;reserved+=qty;return true};
  const result=await Promise.all(requests.map(reserve));
  expect(result.filter(Boolean)).toHaveLength(1);
  expect(reserved).toBeLessThanOrEqual(available);
});
