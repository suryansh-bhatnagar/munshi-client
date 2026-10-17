import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const GET_ITEMS = gql`
  query GetItems {
    items {
      id
      name
      category
      sku
      purchasePrice
      sellingPrice
      stockQuantity
      primaryUnit
    }
  }
`;

const CREATE_ITEM = gql`
  mutation CreateItem($name: String!, $category: String!, $sku: String!, $purchasePrice: Float!, $sellingPrice: Float!, $primaryUnit: String!, $secondaryUnit: String, $conversionRate: Float) {
    createItem(name: $name, category: $category, sku: $sku, purchasePrice: $purchasePrice, sellingPrice: $sellingPrice, primaryUnit: $primaryUnit, secondaryUnit: $secondaryUnit, conversionRate: $conversionRate) {
      id
      name
    }
  }
`;

export function Items() {
  const { loading, error, data } = useQuery(GET_ITEMS);
  const [createItem] = useMutation(CREATE_ITEM, { refetchQueries: ['GetItems'] });
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: '', sku: '', purchasePrice: 0, sellingPrice: 0, primaryUnit: 'pcs', secondaryUnit: '', conversionRate: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem({
        variables: {
          ...formData,
          purchasePrice: Number(formData.purchasePrice),
          sellingPrice: Number(formData.sellingPrice),
          conversionRate: Number(formData.conversionRate)
        }
      });
      toast.success('Item created successfully!');
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExport = () => {
    if (!data?.items) return;
    const exportData = data.items.map((i: any) => ({
      Name: i.name,
      SKU: i.sku || '',
      Category: i.category || '',
      'Purchase Price': i.purchasePrice,
      'Selling Price': i.sellingPrice,
      'Stock Quantity': i.stockQuantity,
      'Primary Unit': i.primaryUnit
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Items");
    XLSX.writeFile(wb, "inventory_items.xlsx");
  };

  if (loading) return <div className="p-4 text-gray-500">Loading items...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Inventory Items</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-[600px] shadow-xl overflow-y-auto max-h-[90vh]">
            <CardHeader className="flex flex-row items-center justify-between p-6">
              <CardTitle>Add New Item</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="space-y-2"><Label>SKU (Optional)</Label><Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Category (Optional)</Label><Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} /></div>
                  
                  <div className="space-y-2">
                    <Label>Primary Unit</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required value={formData.primaryUnit} onChange={e => setFormData({...formData, primaryUnit: e.target.value})}>
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="ltr">Liters (ltr)</option>
                      <option value="box">Box</option>
                      <option value="dozen">Dozen</option>
                      <option value="bag">Bag</option>
                      <option value="packet">Packet</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Secondary Unit (Optional)</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={formData.secondaryUnit} onChange={e => setFormData({...formData, secondaryUnit: e.target.value})}>
                      <option value="">None</option>
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="ltr">Liters (ltr)</option>
                      <option value="box">Box</option>
                      <option value="dozen">Dozen</option>
                      <option value="bag">Bag</option>
                      <option value="packet">Packet</option>
                    </select>
                  </div>
                  
                  {formData.secondaryUnit && (
                    <div className="space-y-2">
                      <Label>Conversion (1 {formData.primaryUnit} = ? {formData.secondaryUnit})</Label>
                      <Input type="number" step="0.01" required value={formData.conversionRate} onChange={e => setFormData({...formData, conversionRate: Number(e.target.value)})} />
                    </div>
                  )}

                  <div className="space-y-2"><Label>Purchase Price</Label><Input type="number" required value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} /></div>
                  <div className="space-y-2"><Label>Selling Price</Label><Input type="number" required value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} /></div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit">Save Item</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className='p-2'>
          <CardTitle>All Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Selling Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-6">
                    No items found. Add your first item.
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      {item.stockQuantity} {item.primaryUnit}
                    </TableCell>
                    <TableCell>₹{item.purchasePrice}</TableCell>
                    <TableCell>₹{item.sellingPrice}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
