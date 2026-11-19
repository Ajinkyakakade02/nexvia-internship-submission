import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { OnboardingStatus, VendorProfile } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const AdminVendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  // Action State
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await adminService.getVendors({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      setVendors(res.data);
      setTotalPages(res.pagination.pages);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [page, statusFilter]);

  const handleAction = async () => {
    if (!selectedVendor || !actionType) return;
    try {
      setSubmitting(true);
      if (actionType === 'approve') {
        await adminService.approveVendor(selectedVendor._id, notes);
        toast.success(`Vendor ${selectedVendor.businessName} approved!`);
      } else {
        await adminService.rejectVendor(selectedVendor._id, notes);
        toast.success(`Vendor ${selectedVendor.businessName} rejected.`);
      }
      setSelectedVendor(null);
      setActionType(null);
      setNotes('');
      fetchVendors();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<VendorProfile>[] = [
    {
      header: 'Business Info',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.businessName}</div>
          <div className="text-xs text-slate-400">{row.businessEmail} • {row.businessPhone}</div>
          {row.gstNumber && <div className="text-xs text-slate-500 font-mono">GST: {row.gstNumber}</div>}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.onboardingStatus} />,
    },
    {
      header: 'Applied On',
      cell: (row) => <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Linked Account ID',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {row.razorpayLinkedAccountId || 'None (Simulated Route)'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.onboardingStatus === OnboardingStatus.PENDING && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setSelectedVendor(row);
                  setActionType('approve');
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  setSelectedVendor(row);
                  setActionType('reject');
                }}
              >
                Reject
              </Button>
            </>
          )}
          {row.onboardingStatus !== OnboardingStatus.PENDING && (
            <span className="text-xs text-slate-400 italic">No action needed</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Management</h1>
          <p className="text-sm text-slate-500">Review vendor onboarding requests, approval statuses, and accounts.</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
        >
          <option value="">All Applications</option>
          <option value={OnboardingStatus.PENDING}>Pending Review</option>
          <option value={OnboardingStatus.APPROVED}>Approved</option>
          <option value={OnboardingStatus.REJECTED}>Rejected</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={vendors}
        isLoading={loading}
        emptyMessage="No vendor records found."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <Modal
        isOpen={Boolean(selectedVendor && actionType)}
        onClose={() => {
          setSelectedVendor(null);
          setActionType(null);
          setNotes('');
        }}
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Vendor Application`}
        description={`Vendor: ${selectedVendor?.businessName}`}
      >
        <div className="space-y-4">
          <Textarea
            label="Admin Review Note (Optional)"
            placeholder="Feedback, onboarding instructions, or decline reason..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedVendor(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'primary' : 'danger'}
              isLoading={submitting}
              onClick={handleAction}
            >
              Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

