import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Order } from '@/types';
import { orderService } from '@/services/orderService';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowLeft, ExternalLink, Store } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      orderService
        .getTracking(id)
        .then(setOrder)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Retrieving live tracking status..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Order not found</h2>
        <Link to="/orders" className="text-primary-600 underline text-sm mt-2 block">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          to={`/orders/${order._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Order #{order.orderNumber}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Track Order #{order.orderNumber}</h1>
        <p className="text-xs text-slate-500 mt-1">Multi-vendor fulfillment progress</p>
      </div>

      {/* Main Order Overall Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Overall Order Status</h3>
          <StatusBadge status={order.status} />
        </div>
        <OrderTimeline currentStatus={order.status} history={order.statusHistory} />
      </div>

      {/* Suborder tracking per vendor */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Fulfillment by Vendors</h3>
        {order.vendorOrders?.map((vo) => {
          const vendorName =
            typeof vo.vendor === 'object' && vo.vendor !== null
              ? vo.vendor.businessName
              : 'Vendor';

          return (
            <div key={vo._id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-bold text-slate-800">{vendorName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={vo.status} />
                  {vo.trackingUrl && (
                    <a
                      href={vo.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                    >
                      Courier Link
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {vo.trackingNumber && (
                <p className="text-xs text-slate-500 font-mono">
                  Tracking / AWB Number: <strong>{vo.trackingNumber}</strong>
                </p>
              )}

              <OrderTimeline currentStatus={vo.status} history={vo.statusHistory} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default OrderTrackingPage;
