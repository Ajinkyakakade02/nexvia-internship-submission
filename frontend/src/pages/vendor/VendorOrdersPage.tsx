import React, { useEffect, useState } from 'react';
import { vendorService } from '@/services/vendorService';
import { OrderStatus, VendorOrder } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const VendorOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Update Status Modal
  const [activeOrder, setActiveOrder] = useState<VendorOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>(OrderStatus.PACKED);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await vendorService.getOrders({
        page,
        limit: 10,
        status: (statusFilter as OrderStatus) || undefined,
      });
      setOrders(res.data);
      setTotalPages(res.pagination.pages);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch vendor orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleUpdateStatus = async () => {
    if (!activeOrder) return;
    try {
      setUpdating(true);
      await vendorService.updateOrderStatus(
        activeOrder._id,
        newStatus,
        trackingNumber || undefined,
        trackingUrl || undefined
      );
      toast.success('Order fulfillment status updated');
      setActiveOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (order: VendorOrder) => {
    setActiveOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || '');
    setTrackingUrl(order.trackingUrl || '');
  };

  const columns: Column<VendorOrder>[] = [
    {
      header: 'Sub-Order ID',
      accessorKey: '_id',
      cell: (row) => <span className="font-mono text-xs">{row._id.slice(-8).toUpperCase()}</span>,
    },
    {
      header: 'Products',
      cell: (row) => (
        <div className="space-y-1">
          {row.items.map((item, idx) => (
            <div key={idx} className="text-xs">
              <span className="font-medium text-slate-800">{item.name}</span>
              <span className="text-slate-400"> × {item.quantity}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: 'Subtotal',
      cell: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.subtotal)}</span>,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Tracking Details',
      cell: (row) => (
        <div className="text-xs">
          {row.trackingNumber ? (
            <div>
              <p className="font-medium text-slate-800">#{row.trackingNumber}</p>
              {row.trackingUrl && (
                <a
                  href={row.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 underline"
                >
                  Track Package
                </a>
              )}
            </div>
          ) : (
            <span className="text-slate-400 italic">No tracking info</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => openUpdateModal(row)}
        >
          Update Status
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order Fulfillment</h1>
          <p className="text-sm text-slate-500">Track and fulfill customer orders containing your products.</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
        >
          <option value="">All Statuses</option>
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
        emptyMessage="No assigned orders found."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Status Update Modal */}
      <Modal
        isOpen={Boolean(activeOrder)}
        onClose={() => setActiveOrder(null)}
        title="Update Fulfillment Status"
        description="Update your sub-order status and provide package tracking details."
      >
        <div className="space-y-4">
          <Select
            label="Order Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
            options={[
              { value: OrderStatus.PLACED, label: 'Placed' },
              { value: OrderStatus.PACKED, label: 'Packed' },
              { value: OrderStatus.SHIPPED, label: 'Shipped' },
              { value: OrderStatus.DELIVERED, label: 'Delivered' },
              { value: OrderStatus.CANCELLED, label: 'Cancelled' },
            ]}
          />

          <Input
            label="Tracking Number / AWB"
            placeholder="e.g. DTDC987213421"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />

          <Input
            label="Tracking URL"
            placeholder="https://track.courier.com/DTDC987213421"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
          />

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setActiveOrder(null)}>
              Cancel
            </Button>
            <Button isLoading={updating} onClick={handleUpdateStatus}>
              Save Updates
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

