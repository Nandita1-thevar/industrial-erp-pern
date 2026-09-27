import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function Quotations() {
  const [rows, setRows] = useState<any[]>([]);
  const [enq, setEnq] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<any>({
    enquiryId: 0,
    validUntil: '',
    items: [
      {
        productId: 1,
        quantity: 1,
        unitPrice: 0,
        discountPct: 0,
        gstPct: 18
      }
    ]
  });

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  async function load() {
    const [q, e, p] = await Promise.all([
      api.get('/quotations'),
      api.get('/enquiries'),
      api.get('/products')
    ]);

    setRows(q.data);
    setEnq(e.data);
    setProducts(p.data);

    if (!form.items[0]?.unitPrice && p.data[0]) {
      setForm((f: any) => ({
        ...f,
        items: [
          {
            ...f.items[0],
            unitPrice: Number(p.data[0].basePrice)
          }
        ]
      }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  function chooseEnquiry(id: number) {
    const x = enq.find(a => a.id === id);

    const items = (x?.items || []).map((i: any) => {
      const p = products.find((p: any) => p.id === i.productId);

      return {
        productId: i.productId,
        quantity: Number(i.quantity),
        unitPrice: Number(p?.basePrice || 0),
        discountPct: 0,
        gstPct: 18
      };
    });

    setForm({
      ...form,
      enquiryId: id,
      items: items.length
        ? items
        : [
            {
              productId: products[0]?.id || 1,
              quantity: 1,
              unitPrice: Number(products[0]?.basePrice || 0),
              discountPct: 0,
              gstPct: 18
            }
          ]
    });
  }

  function updateItem(index: number, key: string, value: number) {
    const items = [...form.items];

    items[index] = {
      ...items[index],
      [key]: value
    };

    setForm({
      ...form,
      items
    });
  }

  async function create() {
    try {
      await api.post('/quotations', {
        enquiryId: Number(form.enquiryId),
        validUntil: form.validUntil,
        items: form.items.map((i: any) => ({
          ...i,
          productId: Number(i.productId),
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discountPct: Number(i.discountPct),
          gstPct: Number(i.gstPct)
        }))
      });

      setOpen(false);
      setMsg('Quotation created successfully.');
      setMsgType('success');

      load();
    } catch (e: any) {
      setMsg(
        e.response?.data?.message ||
        'Could not create quotation'
      );
      setMsgType('error');
    }
  }

  async function status(id: number, status: string) {
    try {
      await api.patch(`/quotations/${id}/status`, {
        status
      });

      load();
    } catch (e: any) {
      setMsg(
        e.response?.data?.message ||
        'Status update failed'
      );
      setMsgType('error');
    }
  }

  // Sales Order conversion is intentionally not implemented.
  // Clicking "Create Order" will not proceed further.
  function convert(_id: number) {
    return;
  }

  return (
    <>
      <div className="pageHead">
        <div>
          <h2>Quotations</h2>
          <p>Backend-calculated pricing and quotation workflow.</p>
        </div>

        <button
          className="primary"
          onClick={() => setOpen(true)}
        >
          + New Quotation
        </button>
      </div>

      {msg && (
        <div className={`notice ${msgType}`}>
          <span className="noticeIcon">
            {msgType === 'error' ? '⚠' : '✓'}
          </span>

          <span>{msg}</span>
        </div>
      )}

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Quotation</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.quotationNo}</td>

                <td>
                  {r.enquiry.customer.companyName}
                </td>

                <td>
                  ₹{Number(r.grandTotal).toFixed(2)}
                </td>

                <td>
                  <span className="badge">
                    {r.status}
                  </span>
                </td>

                <td className="actions">
                  {r.status === 'DRAFT' && (
                    <button
                      onClick={() => status(r.id, 'SENT')}
                    >
                      Send
                    </button>
                  )}

                  {r.status === 'SENT' && (
                    <>
                      <button
                        onClick={() => status(r.id, 'ACCEPTED')}
                      >
                        Accept
                      </button>

                      <button
                        onClick={() => status(r.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {r.status === 'ACCEPTED' && !r.salesOrder && (
                    <button
                      className="primary small"
                      onClick={() => convert(r.id)}
                    >
                      Create Order
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal
          title="Create Quotation"
          onClose={() => setOpen(false)}
        >
          <label>
            Enquiry

            <select
              value={form.enquiryId}
              onChange={e =>
                chooseEnquiry(Number(e.target.value))
              }
            >
              <option value={0}>
                Select enquiry
              </option>

              {enq.map(e => (
                <option
                  value={e.id}
                  key={e.id}
                >
                  {e.enquiryNo} - {e.customer.companyName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Valid Until

            <input
              type="date"
              value={form.validUntil}
              onChange={e =>
                setForm({
                  ...form,
                  validUntil: e.target.value
                })
              }
            />
          </label>

          <label>
            Quotation Items
          </label>

          {form.items.map((item: any, index: number) => (
            <div
              className="quoteRow"
              key={index}
            >
              <select
                value={item.productId}
                onChange={e => {
                  const p = products.find(
                    x => x.id === Number(e.target.value)
                  );

                  updateItem(
                    index,
                    'productId',
                    Number(e.target.value)
                  );

                  updateItem(
                    index,
                    'unitPrice',
                    Number(p?.basePrice || 0)
                  );
                }}
              >
                {products.map(p => (
                  <option
                    value={p.id}
                    key={p.id}
                  >
                    {p.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={e =>
                  updateItem(
                    index,
                    'quantity',
                    Number(e.target.value)
                  )
                }
              />

              <input
                type="number"
                min="0"
                value={item.unitPrice}
                onChange={e =>
                  updateItem(
                    index,
                    'unitPrice',
                    Number(e.target.value)
                  )
                }
              />

              <input
                type="number"
                min="0"
                max="100"
                value={item.discountPct}
                onChange={e =>
                  updateItem(
                    index,
                    'discountPct',
                    Number(e.target.value)
                  )
                }
              />

              <input
                type="number"
                min="0"
                max="100"
                value={item.gstPct}
                onChange={e =>
                  updateItem(
                    index,
                    'gstPct',
                    Number(e.target.value)
                  )
                }
              />

              {form.items.length > 1 && (
                <button
                  onClick={() =>
                    setForm({
                      ...form,
                      items: form.items.filter(
                        (_: any, i: number) => i !== index
                      )
                    })
                  }
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            onClick={() =>
              setForm({
                ...form,
                items: [
                  ...form.items,
                  {
                    productId: products[0]?.id || 1,
                    quantity: 1,
                    unitPrice: Number(
                      products[0]?.basePrice || 0
                    ),
                    discountPct: 0,
                    gstPct: 18
                  }
                ]
              })
            }
          >
            + Add Line
          </button>

          <p className="hint">
            Columns: Product / Qty / Unit Price / Discount % / GST %
          </p>

          <button
            className="primary"
            onClick={create}
          >
            Calculate & Save
          </button>
        </Modal>
      )}
    </>
  );
}