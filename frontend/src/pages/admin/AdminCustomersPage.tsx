import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { User, UserRole } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const AdminCustomersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        page,
        limit: 10,
        role: UserRole.CUSTOMER,
        search: search || undefined,
      });
      setUsers(res.data);
      setTotalPages(res.pagination.pages);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch registered customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const columns: Column<User>[] = [
    {
      header: 'Customer',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Phone',
      cell: (row) => <span>{row.phone || '—'}</span>,
    },
    {
      header: 'Saved Addresses',
      cell: (row) => <span>{row.addresses?.length || 0} saved</span>,
    },
    {
      header: 'Status',
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {row.isActive ? 'Active' : 'Suspended'}
        </span>
      ),
    },
    {
      header: 'Registered On',
      cell: (row) => <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registered Customers</h1>
          <p className="text-sm text-slate-500">View and oversee customer accounts on the marketplace.</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </form>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        emptyMessage="No customer accounts registered yet."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

