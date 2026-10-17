import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, ChevronRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const GET_SUPPLIERS = gql`
  query GetSuppliers {
    suppliers {
      id
      name
      phone
      email
      outstandingBalance
      invoices {
        id
        invoiceNumber
        date
        grandTotal
        amountPaid
        status
      }
    }
  }
`;

const CREATE_SUPPLIER = gql`
  mutation CreateSupplier($name: String!, $phone: String!, $email: String, $outstandingBalance: Float) {
    createSupplier(name: $name, phone: $phone, email: $email, outstandingBalance: $outstandingBalance) {
      id
      name
    }
  }
`;

export function Suppliers() {
  const { loading, error, data } = useQuery(GET_SUPPLIERS);
  const [createSupplier] = useMutation(CREATE_SUPPLIER, { refetchQueries: ['GetSuppliers'] });
  
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', outstandingBalance: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSupplier({
        variables: {
          ...formData,
          outstandingBalance: Number(formData.outstandingBalance)
        }
      });
      toast.success('Supplier added successfully!');
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExport = () => {
    if (!data?.suppliers) return;
    const exportData = data.suppliers.map((s: any) => ({
      Name: s.name,
      Phone: s.phone,
      Email: s.email || '',
      'Outstanding Balance': s.outstandingBalance
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
    XLSX.writeFile(wb, "suppliers.xlsx");
  };

  if (loading) return <div className="p-4 text-gray-500">Loading suppliers...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6 relative flex h-[calc(100vh-8rem)]">
      <div className={`flex-1 transition-all duration-300 ${selectedSupplier ? 'mr-96' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Suppliers</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Supplier
            </Button>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-[400px] shadow-xl overflow-y-auto max-h-[90vh]">
              <CardHeader className="flex flex-row items-center justify-between p-6">
                <CardTitle>Add New Supplier</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2"><Label>Name</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Opening Balance</Label><Input type="number" value={formData.outstandingBalance} onChange={e => setFormData({...formData, outstandingBalance: Number(e.target.value)})} /></div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit">Save Supplier</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
           <CardHeader className='p-2'>
            <CardTitle>All Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Outstanding Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                        No suppliers found. Add your first supplier.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.suppliers.map((supplier: any) => (
                      <TableRow key={supplier.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedSupplier(supplier)}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>{supplier.email || '-'}</TableCell>
                        <TableCell className={supplier.outstandingBalance > 0 ? "text-red-600 font-semibold" : ""}>
                          ₹{supplier.outstandingBalance.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedSupplier(supplier); }}>
                            View Purchases <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar for Supplier Details */}
      <div 
        className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          selectedSupplier ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedSupplier && (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Supplier Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSupplier(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Basic Info */}
              <div>
                <h4 className="font-semibold mb-3 border-b pb-2">Profile</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Name</span>
                    <span className="font-semibold">{selectedSupplier.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Phone</span>
                    <span>{selectedSupplier.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Email</span>
                    <span>{selectedSupplier.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 font-bold text-red-600">
                    <span>Outstanding Balance</span>
                    <span>₹{selectedSupplier.outstandingBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Invoices */}
              <div>
                <h4 className="font-semibold mb-3 border-b pb-2">Purchase History</h4>
                {selectedSupplier.invoices && selectedSupplier.invoices.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSupplier.invoices.map((invoice: any) => (
                      <div key={invoice.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-sm">{invoice.invoiceNumber}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                            invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span>{new Date(parseInt(invoice.date)).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total: ₹{invoice.grandTotal.toFixed(2)}</span>
                          <span className="text-green-600">Paid: ₹{invoice.amountPaid.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No purchase history found for this supplier.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Backdrop */}
      {selectedSupplier && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300" 
          onClick={() => setSelectedSupplier(null)}
        />
      )}
    </div>
  );
}
