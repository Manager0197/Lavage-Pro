import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Transaction, TransactionType } from '../types';

interface SalesChartProps {
  transactions: Transaction[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ transactions }) => {
  // Process data for the last 7 days
  const getLast7DaysData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    return days.map(day => {
      const dailyRevenue = transactions
        .filter(t => t.type === TransactionType.INCOME && t.date.startsWith(day))
        .reduce((sum, t) => sum + t.amount, 0);
      
      const dateObj = new Date(day);
      return {
        name: dateObj.toLocaleDateString('fr-FR', { weekday: 'short' }), // Mon, Tue
        revenue: dailyRevenue,
        fullDate: day
      };
    });
  };

  const data = getLast7DaysData();

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-96 transition-colors">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Performance de la Semaine</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              color: '#1e293b'
            }}
            itemStyle={{ color: '#2563eb' }}
            formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Revenu']}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#2563eb' : '#cbd5e1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};