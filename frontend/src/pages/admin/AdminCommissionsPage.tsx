import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { Commission } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const AdminCommissionsPage: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCommissions({ page, limit: 10 });
      setCommissions(res.data);
      setTotalPages(res.pagination.pages);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch commissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [page]);

  const columns: Column<Commission>[] = [
    {
      header: 'Vendor Business',
      cell: (row) => (
        <span className="font-semibold text-slate-900">
          {typeof row.vendor === 'object' ? (row.vendor as any).businessName : 'Vendor'}
        </span>
      ),
    },
    {
      header: 'Sub-Order Gross',
      cell: (row) => <span>{formatCurrency(row.grossAmount)}</span>,
    },
    {
      header: 'Rate',
      cell: (row) => <span className="font-mono text-xs">{row.commissionRate}%</span>,
    },
    {
      header: 'Platform Fee (Retained)',
      cell: (row) => <span className="font-bold text-primary-700">{formatCurrency(row.commissionAmount)}</span>,
    },
    {
      header: 'Vendor Net Payout',
      cell: (row) => <span className="font-bold text-emerald-700">{formatCurrency(row.vendorNetAmount)}</span>,
    },
    {
      header: 'Route Transfer Status',
      cell: (row) => <StatusBadge status={row.transferStatus} />,
    },
    {
      header: 'Timestamp',
      cell: (row) => <span className="text-xs text-slate-500">{formatDateTime(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Commissions & Route Transfers</h1>
        <p className="text-sm text-slate-500">
          Automated multi-vendor split calculation and Razorpay Route linked account disbursements.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={commissions}
        isLoading={loading}
        emptyMessage="No vendor commission records computed."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

