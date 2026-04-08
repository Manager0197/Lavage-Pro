
import React from 'react';
import { Transaction, TransactionType, UserRole } from '../types';
import { ArrowUpRight, ArrowDownLeft, Trash2, Edit } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
  limit?: number;
  userRole?: UserRole;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onEdit, limit, userRole = 'USER' }) => {
  const displayData = limit ? transactions.slice(0, limit) : transactions;
  const isAdmin = userRole === 'ADMIN';

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('fr-FR', { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Historique des Opérations</h3>
        {!limit && <span className="text-sm text-slate-500 dark:text-slate-400">{transactions.length} opérations</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
            <tr>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Catégorie</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Montant</th>
              {isAdmin && <th className="px-6 py-4 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  Aucune transaction enregistrée
                </td>
              </tr>
            ) : (
              displayData.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      t.type === TransactionType.INCOME 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {t.type === TransactionType.INCOME ? (
                        <ArrowUpRight size={14} className="mr-1" />
                      ) : (
                        <ArrowDownLeft size={14} className="mr-1" />
                      )}
                      {t.type === TransactionType.INCOME ? 'Recette' : 'Dépense'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{t.description}</div>
                    {t.vehiclePlate && <div className="text-xs text-slate-500 dark:text-slate-400">Plate: {t.vehiclePlate}</div>}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{t.category}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDate(t.date)}</td>
                  <td className={`px-6 py-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {t.type === TransactionType.EXPENSE && '- '}
                    {t.amount.toLocaleString('fr-FR')} FCFA
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(t)}
                            className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1"
                            title="Modifier"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={() => onDelete(t.id)}
                            className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
