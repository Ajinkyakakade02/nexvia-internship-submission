import React from 'react';
import { OrderStatus } from '@/types';
import { CheckCircle2, Clock, Truck, Package, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface OrderTimelineProps {
  currentStatus: OrderStatus;
  history?: { status: OrderStatus; timestamp: string; note?: string }[];
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ currentStatus, history = [] }) => {
  const steps = [
    { status: OrderStatus.PLACED, label: 'Order Placed', icon: Clock },
    { status: OrderStatus.PACKED, label: 'Packed & Ready', icon: Package },
    { status: OrderStatus.SHIPPED, label: 'Shipped', icon: Truck },
    { status: OrderStatus.DELIVERED, label: 'Delivered', icon: CheckCircle2 },
  ];

  if (currentStatus === OrderStatus.CANCELLED) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800">
        <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold">Order Cancelled</p>
          <p className="text-xs text-rose-600">This order has been cancelled.</p>
        </div>
      </div>
    );
  }

  const getStatusIndex = (st: OrderStatus) => {
    switch (st) {
      case OrderStatus.PLACED:
        return 0;
      case OrderStatus.PACKED:
        return 1;
      case OrderStatus.SHIPPED:
        return 2;
      case OrderStatus.DELIVERED:
        return 3;
      default:
        return -1;
    }
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Progress bar line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0">
          <div
            className="h-full bg-primary-600 transition-all duration-500"
            style={{
              width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                  isCompleted
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-slate-300 text-slate-400',
                  isCurrent && 'ring-4 ring-primary-100'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <p
                className={cn(
                  'text-xs font-medium mt-2 whitespace-nowrap',
                  isCompleted ? 'text-slate-900 font-semibold' : 'text-slate-400'
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
