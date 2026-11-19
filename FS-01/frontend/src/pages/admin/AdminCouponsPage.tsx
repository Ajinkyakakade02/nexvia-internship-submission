import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { Coupon, CouponFormData, DiscountType } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    defaultValues: {
      discountType: DiscountType.PERCENTAGE,
      isActive: true,
      usageLimit: 100,
    },
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCoupons();
      setCoupons(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const onSubmit = async (data: CouponFormData) => {
    try {
      await adminService.createCoupon({
        ...data,
        discountValue: Number(data.discountValue),
        minOrderAmount: Number(data.minOrderAmount),
        maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
        usageLimit: Number(data.usageLimit),
        code: data.code.toUpperCase(),
      });
      toast.success('Coupon code created!');
      setModalOpen(false);
      reset();
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminService.deleteCoupon(deleteId);
      toast.success('Coupon deleted');
      setDeleteId(null);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete coupon');
    }
  };

  const columns: Column<Coupon>[] = [
    {
      header: 'Code',
      accessorKey: 'code',
      cell: (row) => <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded">{row.code}</span>,
    },
    {
      header: 'Discount',
      cell: (row) => (
        <span className="font-semibold text-slate-800">
          {row.discountType === DiscountType.PERCENTAGE ? `${row.discountValue}%` : formatCurrency(row.discountValue)}
        </span>
      ),
    },
    {
      header: 'Min Cart Requirement',
      cell: (row) => <span>{formatCurrency(row.minOrderAmount)}</span>,
    },
    {
      header: 'Usage Count',
      cell: (row) => (
        <span>
          {row.usedCount} / {row.usageLimit}
        </span>
      ),
    },
    {
      header: 'Validity Period',
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {formatDate(row.validFrom)} – {formatDate(row.validUntil)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.isActive ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      header: 'Action',
      cell: (row) => (
        <Button
          size="sm"
          variant="danger"
          onClick={() => setDeleteId(row._id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Promotions & Coupons</h1>
          <p className="text-sm text-slate-500">Create discount coupons applicable to checkout carts.</p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Coupon
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        isLoading={loading}
        emptyMessage="No promotional coupons active."
      />

      {/* Create Coupon Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Coupon"
        description="Define discount percentage or fixed cash reduction."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Coupon Code"
            placeholder="e.g. WELCOME10, DIWALI20"
            required
            error={errors.code?.message}
            {...register('code', { required: 'Code is required' })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Discount Type"
              options={[
                { value: DiscountType.PERCENTAGE, label: 'Percentage (%)' },
                { value: DiscountType.FIXED, label: 'Fixed Amount (₹)' },
              ]}
              {...register('discountType')}
            />

            <Input
              label="Discount Value"
              type="number"
              step="0.01"
              required
              placeholder="e.g. 10 or 250"
              error={errors.discountValue?.message}
              {...register('discountValue', { required: true, min: 1 })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Cart Order Amount (₹)"
              type="number"
              defaultValue={500}
              {...register('minOrderAmount', { required: true, min: 0 })}
            />

            <Input
              label="Max Discount Cap (₹, optional)"
              type="number"
              placeholder="Optional"
              {...register('maxDiscount')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valid From"
              type="date"
              required
              {...register('validFrom', { required: true })}
            />

            <Input
              label="Valid Until"
              type="date"
              required
              {...register('validUntil', { required: true })}
            />
          </div>

          <Input
            label="Total Usage Limit"
            type="number"
            defaultValue={100}
            {...register('usageLimit', { required: true, min: 1 })}
          />

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Coupon
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? It will no longer be redeemable by customers."
      />
    </div>
  );
};

