import React, { useEffect, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { Product, ProductStatus } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await adminService.getProducts({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setProducts(res.data);
      setTotalPages(res.pagination.pages);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load platform products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const columns: Column<Product>[] = [
    {
      header: 'Product',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.images?.[0] || 'https://via.placeholder.com/60'}
            alt={row.name}
            className="h-10 w-10 rounded-lg object-cover border border-slate-200"
          />
          <div>
            <div className="font-medium text-slate-900">{row.name}</div>
            <div className="text-xs text-slate-400">Stock: {row.stock}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Vendor',
      cell: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {typeof row.vendor === 'object' ? (row.vendor as any).businessName : 'Vendor'}
        </span>
      ),
    },
    {
      header: 'Price',
      cell: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.price)}</span>,
    },
    {
      header: 'Units Sold',
      cell: (row) => <span>{row.soldCount || 0}</span>,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Created On',
      cell: (row) => <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Preview',
      cell: (row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => window.open(`/products/${row._id}`, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Marketplace Catalog</h1>
          <p className="text-sm text-slate-500">Oversee all vendor-submitted products and inventory status.</p>
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value={ProductStatus.ACTIVE}>Active</option>
            <option value={ProductStatus.DRAFT}>Draft</option>
            <option value={ProductStatus.INACTIVE}>Inactive</option>
          </select>

          <form onSubmit={handleSearch}>
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
          </form>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={loading}
        emptyMessage="No catalog products found."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

