import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export interface TopProductsChartProps {
  data: { name: string; sales: number }[];
  title?: string;
}

export const TopProductsChart: React.FC<TopProductsChartProps> = ({
  data,
  title = 'Top Selling Products',
}) => {
  const chartData = data && data.length > 0
    ? data
    : [
        { name: 'Wireless Headphones', sales: 120 },
        { name: 'Smart Fitness Watch', sales: 98 },
        { name: 'Mechanical Keyboard', sales: 86 },
        { name: 'Ergonomic Mouse', sales: 64 },
        { name: 'USB-C Fast Charger', sales: 52 },
      ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              />
              <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
