import { useState, useEffect } from 'react';
import { useQuery, useMutation, useApolloClient, gql } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const GET_INVOICE_DATA = gql`
  query GetInvoiceData {
    customers { id name }
    suppliers { id name }
    items { id name sellingPrice purchasePrice }
  }
`;

const GET_NEXT_INVOICE_NUMBER = gql`
  query GetNextInvoiceNumber($type: String!) {
    nextInvoiceNumber(type: $type)
  }
`;

const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: InvoiceInput!) {
    createInvoice(input: $input) {
      id
      invoiceNumber
    }
  }
`;

export function CreateInvoice() {
  const navigate = useNavigate();
  const client = useApolloClient();
  const { loading, data } = useQuery(GET_INVOICE_DATA);
  const [createInvoice, { loading: creating }] = useMutation(CREATE_INVOICE);

  const [type, setType] = useState('sale');
  const [partyId, setPartyId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  const { data: nextNumberData } = useQuery(GET_NEXT_INVOICE_NUMBER, {
    variables: { type },
    fetchPolicy: 'network-only' // Ensure we get the latest when creating
  });

  useEffect(() => {
    if (nextNumberData?.nextInvoiceNumber) {
      setInvoiceNumber(nextNumberData.nextInvoiceNumber);
    }
  }, [nextNumberData, type]);
  
  const [items, setItems] = useState<any[]>([]);

  if (loading) return <div className="p-4">Loading resources...</div>;

  const parties = type === 'sale' ? data.customers : data.suppliers;

  const handleAddItem = () => {
    setItems([...items, { itemId: '', name: '', quantity: 1, price: 0, taxRate: 0, discount: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'itemId') {
      const selectedItem = data.items.find((i: any) => i.id === value);
      if (selectedItem) {
        newItems[index].name = selectedItem.name;
        newItems[index].price = type === 'sale' ? selectedItem.sellingPrice : selectedItem.purchasePrice;
      }
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const calculateTotals = () => {
    let sub = 0;
    let tax = 0;
    let disc = 0;
    items.forEach(i => {
      const lineTotal = i.price * i.quantity;
      sub += lineTotal;
      tax += lineTotal * (i.taxRate / 100);
      disc += i.discount;
    });
    return { subTotal: sub, taxTotal: tax, discountTotal: disc, grandTotal: sub + tax - disc };
  };

  const totals = calculateTotals();

  const handleSave = async () => {
    if (!partyId || items.length === 0) {
      toast.error('Please select a party and add at least one item.');
      return;
    }

    const partyName = parties.find((p: any) => p.id === partyId)?.name || 'Unknown';

    try {
      await createInvoice({
        variables: {
          input: {
            type,
            invoiceNumber,
            partyId,
            partyName,
            items: items.map(i => ({
              itemId: i.itemId,
              name: i.name,
              quantity: Number(i.quantity),
              price: Number(i.price),
              taxRate: Number(i.taxRate),
              discount: Number(i.discount)
            }))
          }
        }
      });
      await client.resetStore(); // Invalidate all active queries to force hard refresh of data
      toast.success('Invoice created successfully!');
      navigate('/invoices');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Create Invoice</h2>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader className='p-2'>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-2">
            <div className="flex space-x-4">
              <div className="w-1/2 space-y-2">
                <Label>Transaction Type</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                  value={type} 
                  onChange={(e) => { setType(e.target.value); setPartyId(''); }}
                >
                  <option value="sale">Sales Invoice</option>
                  <option value="purchase">Purchase Bill</option>
                </select>
              </div>
              <div className="w-1/2 space-y-2">
                <Label>Invoice Number</Label>
                <Input 
                  value={invoiceNumber || 'Generating...'} 
                  readOnly 
                  className="bg-gray-100 cursor-not-allowed font-medium text-gray-600"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{type === 'sale' ? 'Customer' : 'Supplier'}</Label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                value={partyId} 
                onChange={(e) => setPartyId(e.target.value)}
              >
                <option value="">Select {type === 'sale' ? 'Customer' : 'Supplier'}...</option>
                {parties.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-2">
          <CardTitle>Items</CardTitle>
          <Button size="sm" onClick={handleAddItem}><Plus className="h-4 w-4 mr-2"/> Add Row</Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead className="w-32">Price (₹)</TableHead>
                  <TableHead className="w-24">Tax (%)</TableHead>
                  <TableHead className="w-24">Disc (₹)</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={item.itemId} 
                        onChange={(e) => updateItem(idx, 'itemId', e.target.value)}
                      >
                        <option value="">Select Item</option>
                        {data.items.map((i: any) => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell><Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} /></TableCell>
                    <TableCell><Input type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} /></TableCell>
                    <TableCell><Input type="number" min="0" step="0.01" value={item.taxRate} onChange={(e) => updateItem(idx, 'taxRate', e.target.value)} /></TableCell>
                    <TableCell><Input type="number" min="0" step="0.01" value={item.discount} onChange={(e) => updateItem(idx, 'discount', e.target.value)} /></TableCell>
                    <TableCell className="text-right font-medium">
                      {((item.price * item.quantity) - item.discount + (item.price * item.quantity * item.taxRate / 100)).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <div className="w-72 space-y-4">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal:</span> <span>₹{totals.subTotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Tax:</span> <span>₹{totals.taxTotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Discount:</span> <span className="text-red-500">-₹{totals.discountTotal.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Grand Total:</span> <span>₹{totals.grandTotal.toFixed(2)}</span></div>
          
          <Button className="w-full mt-4" onClick={handleSave} disabled={creating || !invoiceNumber}>
            {creating ? 'Saving...' : 'Save Invoice'}
          </Button>
        </div>
      </div>
    </div>
  );
}
