import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Order } from '@/types';
import { orderService } from '@/services/orderService';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { InvoiceButton } from '@/components/orders/InvoiceButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { MapPin, ArrowLeft, Package, Store } from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      orderService
        .getOrderById(id)
        .then(setOrder)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading order details..." />
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Order #{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/orders/${order._id}/tracking`}
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100"
          >
            Live Tracking
          </Link>
          <InvoiceButton orderId={order._id} orderNumber={order.orderNumber} />
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Delivery Progression</h3>
        <OrderTimeline currentStatus={order.status} history={order.statusHistory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items breakdown per vendor suborder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-base font-semibold text-slate-900">Order Items</h3>

            {order.vendorOrders && order.vendorOrders.length > 0 ? (
              order.vendorOrders.map((vo) => {
                const vendorName =
                  typeof vo.vendor === 'object' && vo.vendor !== null
                    ? vo.vendor.businessName
                    : 'Vendor';

                return (
                  <div key={vo._id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-slate-200">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Store className="w-3.5 h-3.5 text-primary-600" />
                        Dispatched by: <strong>{vendorName}</strong>
                      </span>
                      <StatusBadge status={vo.status} />
                    </div>

                    <div className="space-y-3">
                      {vo.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                              {it.image ? (
                                <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-slate-400 m-3" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{it.name}</p>
                              <p className="text-xs text-slate-500">
                                {formatCurrency(it.price)} × {it.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-slate-900">
                            {formatCurrency(it.price * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="space-y-3">
                {order.items?.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{it.name}</p>
                      <p className="text-xs text-slate-500">Qty: {it.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(it.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address & Cost Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" />
              Delivery Address
            </h3>
            <p className="text-sm font-semibold text-slate-800">{order.shippingAddress?.fullName}</p>
            <p className="text-xs text-slate-500">{order.shippingAddress?.phone}</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {order.shippingAddress?.addressLine1}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-sm text-slate-600">
            <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
              Payment Summary
            </h3>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.shippingCharge)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-bold text-slate-900 text-base">
              <span>Total Paid</span>
              <span className="text-primary-600 text-lg">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OrderDetailPage;
