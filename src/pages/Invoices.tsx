import React, { useState } from 'react';
import { useQuery, useMutation, useApolloClient, gql } from '@apollo/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, IndianRupeeIcon, ChevronRight, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const GET_INVOICES = gql`
  query GetInvoices {
    invoices {
      id
      type
      invoiceNumber
      date
      partyName
      grandTotal
      amountPaid
      status
      items {
        name
        quantity
        price
        total
      }
      payments {
        id
        amount
        date
        method
        notes
      }
    }
  }
`;

const ADD_PAYMENT = gql`
  mutation AddPayment($invoiceId: ID!, $amount: Float!, $method: String!, $notes: String) {
    addPayment(invoiceId: $invoiceId, amount: $amount, method: $method, notes: $notes) {
      id
      amount
    }
  }
`;

export function Invoices() {
  const client = useApolloClient();
  const { loading, error, data } = useQuery(GET_INVOICES);
  const [addPayment, { loading: paymentLoading }] = useMutation(ADD_PAYMENT);

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({ amount: 0, method: 'cash', notes: '' });

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    
    try {
      await addPayment({
        variables: {
          invoiceId: selectedInvoice.id,
          amount: Number(paymentData.amount),
          method: paymentData.method,
          notes: paymentData.notes
        }
      });
      await client.resetStore();
      toast.success('Payment recorded successfully!');
      setPaymentData({ amount: 0, method: 'cash', notes: '' });
      setSelectedInvoice(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    }
  };

  const openSidebar = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentData({ amount: invoice.grandTotal - invoice.amountPaid, method: 'cash', notes: '' });
  };

  const handleDownloadPDF = async (invoice: any) => {
    try {
      const doc = new jsPDF();
      
      // Load logo
      const imgUrl = "/logo_with_white_bg.png";
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const base64data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // --- HEADER ---
      doc.setFontSize(24);
      doc.setTextColor(33, 33, 33);
      doc.setFont('helvetica', 'bold');
      doc.text("INVOICE", 14, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, 34);
      doc.text(`Date: ${new Date(parseInt(invoice.date)).toLocaleDateString()}`, 14, 39);
      doc.text(`Type: ${invoice.type.toUpperCase()}`, 14, 44);

      // --- BILLED TO ---
      doc.setFontSize(12);
      doc.setTextColor(33, 33, 33);
      doc.setFont('helvetica', 'bold');
      doc.text("Billed To:", 140, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      // Optional: if partyName is long, it might wrap, but we'll assume it's short
      doc.text(invoice.partyName, 140, 32);
      
      // --- TABLE ---
      const tableColumn = ["Item", "Quantity", "Price", "Total"];
      const tableRows = invoice.items.map((item: any) => [
        item.name,
        item.quantity,
        `Rs. ${item.price.toFixed(2)}`,
        `Rs. ${item.total.toFixed(2)}`
      ]);
      
      autoTable(doc, {
        startY: 55,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [19, 45, 104] }, // Matches #132d68
        styles: { fontSize: 10, cellPadding: 5 },
      });
      
      const finalY = (doc as any).lastAutoTable?.finalY || 55;
      
      // --- SUMMARY ---
      doc.setFontSize(10);
      doc.setTextColor(33, 33, 33);
      const balanceDue = invoice.grandTotal - invoice.amountPaid;
      
      doc.text("Grand Total:", 140, finalY + 12);
      doc.text(`Rs. ${invoice.grandTotal.toFixed(2)}`, 196, finalY + 12, { align: 'right' });
      
      doc.text("Amount Paid:", 140, finalY + 18);
      doc.text(`Rs. ${invoice.amountPaid.toFixed(2)}`, 196, finalY + 18, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.text("Balance Due:", 140, finalY + 26);
      doc.text(`Rs. ${balanceDue.toFixed(2)}`, 196, finalY + 26, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      // --- FOOTER (Powered By) ---
      const footerY = pageHeight - 15;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      
      const poweredText = "Powered By Munshi";
      const textWidth = doc.getTextWidth(poweredText);
      const logoSize = 6;
      const spacing = 3;
      const totalWidth = textWidth + spacing + logoSize;
      const startX = (pageWidth - totalWidth) / 2;

      doc.text(poweredText, startX, footerY);
      doc.addImage(base64data, 'PNG', startX + textWidth + spacing, footerY - 5, logoSize, logoSize);
      
      doc.save(`invoice_${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Check console for details.");
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Loading invoices...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6 relative flex h-[calc(100vh-8rem)]">
      <div className={`flex-1 transition-all duration-300 ${selectedInvoice ? 'mr-96' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
          <Link to="/invoices/new" className={buttonVariants({ variant: "default" })}>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Link>
        </div>

        <Card>
          <CardHeader className='p-2'>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-6">
                        No invoices found. Create your first invoice.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.invoices.map((invoice: any) => (
                      <TableRow key={invoice.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openSidebar(invoice)}>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            invoice.type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {invoice.type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{new Date(parseInt(invoice.date)).toLocaleDateString()}</TableCell>
                        <TableCell>{invoice.partyName}</TableCell>
                        <TableCell>₹{invoice.grandTotal.toFixed(2)}</TableCell>
                        <TableCell>₹{invoice.amountPaid.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                            invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openSidebar(invoice); }}>
                            Details <ChevronRight className="h-4 w-4 ml-1" />
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

      {/* Right Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          selectedInvoice ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedInvoice && (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Invoice Details</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handleDownloadPDF(selectedInvoice)} title="Download PDF">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Basic Info */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-500">Invoice Number</span>
                  <span className="font-semibold">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-500">Date</span>
                  <span>{new Date(parseInt(selectedInvoice.date)).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-500">Party</span>
                  <span className="font-medium text-primary">{selectedInvoice.partyName}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                    selectedInvoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedInvoice.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-3 border-b pb-2">Items</h4>
                <div className="space-y-3">
                  {selectedInvoice.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-gray-500">{item.quantity} x ₹{item.price}</p>
                      </div>
                      <span className="font-medium">₹{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t font-bold">
                    <span>Grand Total</span>
                    <span>₹{selectedInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payments History */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 border-b pb-2">Payment History</h4>
                  <div className="space-y-3">
                    {selectedInvoice.payments.map((payment: any) => (
                      <div key={payment.id} className="flex justify-between text-sm items-center p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium text-green-700">₹{payment.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{new Date(parseInt(payment.date)).toLocaleDateString()} - {payment.method}</p>
                        </div>
                        {payment.notes && <span className="text-xs text-gray-500 italic max-w-[120px] text-right truncate" title={payment.notes}>{payment.notes}</span>}
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-semibold text-sm">
                      <span>Total Paid</span>
                      <span className="text-green-600">₹{selectedInvoice.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-red-600">
                      <span>Balance Due</span>
                      <span>₹{(selectedInvoice.grandTotal - selectedInvoice.amountPaid).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Payment Form */}
              {selectedInvoice.status !== 'paid' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="font-semibold mb-3 text-blue-900 flex items-center">
                    <IndianRupeeIcon className="h-4 w-4 mr-1" /> Add Payment
                  </h4>
                  <form onSubmit={handlePaymentSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-blue-800">Amount (Max: ₹{(selectedInvoice.grandTotal - selectedInvoice.amountPaid).toFixed(2)})</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        max={(selectedInvoice.grandTotal - selectedInvoice.amountPaid).toFixed(2)}
                        required 
                        value={paymentData.amount} 
                        onChange={e => setPaymentData({...paymentData, amount: Number(e.target.value)})} 
                        className="bg-white border-blue-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-blue-800">Payment Method</Label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-blue-200 bg-white px-3 py-1 text-sm shadow-sm"
                        value={paymentData.method} 
                        onChange={e => setPaymentData({...paymentData, method: e.target.value})}
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-blue-800">Notes</Label>
                      <Input value={paymentData.notes} onChange={e => setPaymentData({...paymentData, notes: e.target.value})} className="bg-white border-blue-200" />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={paymentLoading}>
                      {paymentLoading ? 'Saving...' : 'Record Payment'}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Backdrop for mobile or just to dismiss */}
      {selectedInvoice && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300" 
          onClick={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
