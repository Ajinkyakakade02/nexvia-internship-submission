import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export interface OrderStatusChartProps {
  data: { status: string; count: number }[];
  title?: string;
}

const COLORS = ['#2563eb', '#38bdf8', '#f59e0b', '#22c55e', '#ef4444'];

export const OrderStatusChart: React.FC<OrderStatusChartProps> = ({
  data,
  title = 'Order Status Distribution',
}) => {
  const chartData = data && data.length > 0
    ? data
    : [
        { status: 'Placed', count: 12 },
        { status: 'Packed', count: 8 },
        { status: 'Shipped', count: 18 },
        { status: 'Delivered', count: 45 },
        { status: 'Cancelled', count: 4 },
      ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="count"
                nameKey="status"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
