
import React from 'react';
import { FinancialSummary, UserRole } from '../types';
import { DollarSign, TrendingUp, TrendingDown, Car, Users, Briefcase } from 'lucide-react';

interface SummaryCardsProps {
  summary: FinancialSummary;
  userRole: UserRole;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, userRole }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const cardClass = "bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-100 dark:border-slate-700 flex items-center transition-colors";
  const iconBaseClass = "p-4 rounded-full mr-4 flex-shrink-0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Revenue Card - Visible to All */}
      <div className={cardClass}>
        <div className={`${iconBaseClass} bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400`}>
          <DollarSign size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Revenu Total</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(summary.totalRevenue)}</h3>
        </div>
      </div>

      {/* Expenses Card - Visible to All */}
      <div className={cardClass}>
        <div className={`${iconBaseClass} bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400`}>
          <TrendingDown size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Dépenses</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(summary.totalExpenses)}</h3>
        </div>
      </div>

      {/* Volume Card - Visible to All */}
      <div className={cardClass}>
        <div className={`${iconBaseClass} bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400`}>
          <Car size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Véhicules Lavés</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{summary.totalWashes}</h3>
        </div>
      </div>

      {/* ADMIN ONLY CARDS */}
      {userRole === 'ADMIN' && (
        <>
          {/* Profit Card */}
          <div className={cardClass}>
            <div className={`${iconBaseClass} bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Bénéfice Net</p>
              <h3 className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(summary.netProfit)}
              </h3>
            </div>
          </div>

          {/* Promoter Share Card */}
          <div className={cardClass}>
            <div className={`${iconBaseClass} bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400`}>
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Part Promoteur (70%)</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(summary.totalPromoterShare)}</h3>
            </div>
          </div>

          {/* Washer Share Card */}
          <div className={cardClass}>
            <div className={`${iconBaseClass} bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400`}>
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Part Laveurs (30%)</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(summary.totalWasherShare)}</h3>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
