import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, ExternalLink } from 'lucide-react';
import { productService } from '@/services/productService';
import { Product, ProductStatus } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const VendorProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getVendorProducts({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      setProducts(res.data);
      setTotalPages(res.pagination.pages);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await productService.deleteProduct(deleteId);
      toast.success('Product deleted successfully');
      setDeleteId(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
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
      header: 'Price',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{formatCurrency(row.price)}</span>
          {row.comparePrice && (
            <span className="ml-2 text-xs text-slate-400 line-through">
              {formatCurrency(row.comparePrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Rating',
      cell: (row) => (
        <div className="text-sm">
          ⭐ {row.avgRating.toFixed(1)} ({row.ratingCount})
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(`/products/${row._id}`, '_blank')}
            title="View Live"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/vendor/products/${row._id}/edit`)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteId(row._id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your Products</h1>
          <p className="text-sm text-slate-500">Manage catalog, inventory, and listings.</p>
        </div>
        <Button
          onClick={() => navigate('/vendor/products/new')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add New Product
        </Button>
      </div>

      <div className="flex items-center gap-4">
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
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={loading}
        emptyMessage="No products listed yet. Click 'Add New Product' to get started."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Product"
        message="Are you sure you want to delete this product? It will be removed from customer view."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

