import React from 'react';
import { Link } from 'react-router-dom';
import { Order } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';
import { ChevronRight, Package } from 'lucide-react';

export interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 hover:shadow-sm transition-shadow">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold text-slate-400">Order #{order.orderNumber}</span>
          <p className="text-xs text-slate-500 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <span className="text-base font-bold text-slate-900">{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Items preview */}
      <div className="space-y-2">
        {order.items?.slice(0, 3).map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-5 h-5 text-slate-400 m-2.5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">{item.name}</p>
              <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
            </div>
          </div>
        ))}
        {order.items?.length > 3 && (
          <p className="text-xs text-slate-500 font-medium">+{order.items.length - 3} more items</p>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <Link
          to={`/orders/${order._id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
        >
          View Order Details
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
