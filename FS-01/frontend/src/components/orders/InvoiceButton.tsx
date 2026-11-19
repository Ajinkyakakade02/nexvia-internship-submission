import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { orderService } from '@/services/orderService';
import toast from 'react-hot-toast';

export interface InvoiceButtonProps {
  orderId: string;
  orderNumber: string;
}

export const InvoiceButton: React.FC<InvoiceButtonProps> = ({ orderId, orderNumber }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await orderService.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded');
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      leftIcon={<Download className="w-4 h-4" />}
      onClick={handleDownload}
      isLoading={downloading}
    >
      Download Invoice
    </Button>
  );
};
