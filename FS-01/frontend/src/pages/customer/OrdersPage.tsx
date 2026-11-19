import React, { useEffect, useState } from 'react';
import { Order } from '@/types';
import { orderService } from '@/services/orderService';
import { OrderCard } from '@/components/orders/OrderCard';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Package, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    orderService
      .getOrders({ page, limit: 10 })
      .then((res) => {
        setOrders(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="text-xs text-slate-500 mt-1">View and track all your past marketplace orders</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 py-12 text-center">Loading orders...</p>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="You haven't placed any orders on NexMart. Start exploring great deals!"
          actionLabel="Shop Products"
          onAction={() => navigate('/products')}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <OrderCard key={ord._id} order={ord} />
          ))}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};
export default OrdersPage;
