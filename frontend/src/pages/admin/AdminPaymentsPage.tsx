import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { Payment } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await adminService.getPayments({ page, limit: 10 });
      setPayments(res.data);
      setTotalPages(res.pagination.pages);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch gateway payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const columns: Column<Payment>[] = [
    {
      header: 'Payment ID',
      accessorKey: 'razorpayPaymentId',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          {row.razorpayPaymentId || 'sim_pay_' + row._id.slice(-8)}
        </span>
      ),
    },
    {
      header: 'Order Reference',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {typeof row.order === 'object' ? (row.order as any).orderNumber : row.razorpayOrderId}
        </span>
      ),
    },
    {
      header: 'Amount Captured',
      cell: (row) => <span className="font-bold text-slate-900">{formatCurrency(row.amount)}</span>,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Method',
      cell: (row) => <span className="capitalize text-xs font-medium">{row.method || 'Card / UPI'}</span>,
    },
    {
      header: 'Date & Time',
      cell: (row) => <span className="text-xs text-slate-500">{formatDateTime(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payment Transactions</h1>
        <p className="text-sm text-slate-500">Audit Razorpay test payments, receipts, and capture events.</p>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        isLoading={loading}
        emptyMessage="No payment transactions logged."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

