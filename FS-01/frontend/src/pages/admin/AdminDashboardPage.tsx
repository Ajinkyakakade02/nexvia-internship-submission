import React, { useEffect, useState } from 'react';
import {
  Users,
  Store,
  Clock,
  Package,
  ShoppingBag,
  IndianRupee,
  Percent,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { AdminDashboard } from '@/types';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { OrderStatusChart } from '@/components/dashboard/OrderStatusChart';
import { TopProductsChart } from '@/components/dashboard/TopProductsChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await adminService.getDashboard();
        setData(res);
      } catch (err: any) {
        toast.error(err.message || 'Failed to fetch admin overview');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" label="Loading admin analytics..." />
      </div>
    );
  }

  const transactionColumns: Column<any>[] = [
    {
      header: 'Payment ID',
      accessorKey: 'razorpayPaymentId',
      cell: (row) => <span className="font-mono text-xs">{row.razorpayPaymentId || row._id.slice(-8)}</span>,
    },
    {
      header: 'Amount',
      cell: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.amount)}</span>,
    },
    {
      header: 'Method',
      cell: (row) => <span className="capitalize">{row.method || 'Online'}</span>,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Date',
      cell: (row) => <span className="text-xs text-slate-500">{formatDateTime(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Analytics</h1>
        <p className="text-sm text-slate-500">
          Executive performance summary, vendor activity, and platform commission metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Customers"
          value={data?.totalCustomers || 0}
          icon={Users}
        />
        <StatsCard
          title="Active Vendors"
          value={data?.totalVendors || 0}
          icon={Store}
        />
        <StatsCard
          title="Pending Approvals"
          value={data?.pendingApplications || 0}
          icon={Clock}
        />
        <StatsCard
          title="Total Products"
          value={data?.totalProducts || 0}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Orders Processed"
          value={data?.totalOrders || 0}
          icon={Package}
        />
        <StatsCard
          title="Gross Marketplace GMV"
          value={formatCurrency(data?.grossSales || 0)}
          icon={IndianRupee}
        />
        <StatsCard
          title="Platform Commission"
          value={formatCurrency(data?.platformCommission || 0)}
          icon={Percent}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={data?.revenueData || []} title="Platform Gross Revenue & Commission" />
        </div>
        <div>
          <OrderStatusChart data={data?.orderStatusData || []} title="Fulfillment Distribution" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopProductsChart data={data?.topProducts || []} title="Best Performing Catalog Products" />

        <Card>
          <CardHeader>
            <CardTitle>Recent Gateway Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={transactionColumns}
              data={data?.recentTransactions || []}
              emptyMessage="No recent payments recorded."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

