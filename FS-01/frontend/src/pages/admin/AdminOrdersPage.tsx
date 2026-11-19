import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { Order, OrderStatus } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminService.getOrders({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      setOrders(res.data);
      setTotalPages(res.pagination.pages);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch platform orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const columns: Column<Order>[] = [
    {
      header: 'Order Number',
      accessorKey: 'orderNumber',
      cell: (row) => <span className="font-mono font-medium text-xs text-slate-900">{row.orderNumber}</span>,
    },
    {
      header: 'Customer',
      cell: (row) => (
        <div>
          <div className="font-medium text-slate-800">
            {typeof row.customer === 'object' ? (row.customer as any).name : 'Customer'}
          </div>
          <div className="text-xs text-slate-400">
            {typeof row.customer === 'object' ? (row.customer as any).email : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Vendors Involved',
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.vendorOrders?.length || 1} vendor(s)
        </span>
      ),
    },
    {
      header: 'Total Paid',
      cell: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.total)}</span>,
    },
    {
      header: 'Overall Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Placed Date',
      cell: (row) => <span className="text-xs text-slate-500">{formatDateTime(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Orders</h1>
          <p className="text-sm text-slate-500">Global order history with multi-vendor sub-orders and fulfillments.</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
        >
          <option value="">All Orders</option>
          <option value={OrderStatus.PLACED}>Placed</option>
          <option value={OrderStatus.PACKED}>Packed</option>
          <option value={OrderStatus.SHIPPED}>Shipped</option>
          <option value={OrderStatus.DELIVERED}>Delivered</option>
          <option value={OrderStatus.CANCELLED}>Cancelled</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={loading}
        emptyMessage="No customer orders recorded."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

