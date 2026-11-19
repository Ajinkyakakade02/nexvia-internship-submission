import React, { useEffect, useState } from 'react';
import { ShoppingBag, Package, IndianRupee, Percent } from 'lucide-react';
import { vendorService } from '@/services/vendorService';
import { DashboardStats, VendorOrder } from '@/types';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export const VendorDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await vendorService.getDashboard();
        setStats(data);
        const ordersRes = await vendorService.getOrders({ page: 1, limit: 5 });
        setRecentOrders(ordersRes?.data || []);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load vendor dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" label="Loading vendor dashboard..." />
      </div>
    );
  }

  const columns: Column<VendorOrder>[] = [
    {
      header: 'Order ID',
      accessorKey: '_id',
      cell: (row) => <span className="font-mono text-xs">{row._id.slice(-8).toUpperCase()}</span>,
    },
    {
      header: 'Items',
      cell: (row) => <span>{row.items.reduce((acc, item) => acc + item.quantity, 0)} items</span>,
    },
    {
      header: 'Subtotal',
      cell: (row) => <span className="font-semibold">{formatCurrency(row.subtotal)}</span>,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Tracking',
      cell: (row) => <span>{row.trackingNumber || 'Not shipped'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Overview</h1>
        <p className="text-sm text-slate-500">Track your product performance, sales, and fulfillments.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Orders Assigned"
          value={stats?.totalOrders || 0}
          icon={Package}
        />
        <StatsCard
          title="Gross Sales"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={IndianRupee}
        />
        <StatsCard
          title="Commission Paid"
          value={formatCurrency(stats?.totalCommission || 0)}
          icon={Percent}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RevenueChart data={stats?.revenueData || []} title="Sales Trend (Last 7 Days)" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders for Your Products</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={recentOrders}
            emptyMessage="No orders received yet."
          />
        </CardContent>
      </Card>
    </div>
  );
};

