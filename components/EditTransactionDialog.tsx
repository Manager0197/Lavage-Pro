
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { X, Save } from 'lucide-react';

interface EditTransactionDialogProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Transaction>) => Promise<void>;
  isLoading?: boolean;
}

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  isOpen,
  transaction,
  onClose,
  onSave,
  isLoading
}) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || '');
      // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
      try {
        const d = new Date(transaction.date);
        // Ajuster pour le fuseau horaire local si nécessaire ou garder ISO
        const iso = d.toISOString().slice(0, 16);
        setDate(iso);
      } catch (e) {
        setDate('');
      }
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAmount = Number(amount);
    
    const updates: Partial<Transaction> = {
      amount: newAmount,
      description: description,
      date: new Date(date).toISOString(),
    };

    // Si c'est un lavage (Recette), on recalcule les parts
    if (transaction.type === TransactionType.INCOME && transaction.washerId) {
       updates.washerShare = newAmount * 0.30;
       updates.promoterShare = newAmount * 0.70;
       updates.unitPrice = newAmount / (transaction.quantity || 1); // Mise à jour approximative du prix unitaire
    }

    await onSave(transaction.id, updates);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Modifier la transaction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input 
              type="datetime-local" 
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <input 
              type="text" 
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Montant (FCFA)</label>
            <input 
              type="number" 
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white text-lg font-bold"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
            {transaction.type === TransactionType.INCOME && transaction.washerId && (
              <p className="text-xs text-slate-500 mt-2">
                Les parts (30% Laveur / 70% Promoteur) seront recalculées automatiquement sur ce nouveau montant.
              </p>
            )}
          </div>

          <div className="pt-2 flex gap-3">
             <button 
               type="button" 
               onClick={onClose}
               className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
             >
               Annuler
             </button>
             <button 
               type="submit"
               disabled={isLoading} 
               className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
             >
               {isLoading ? 'Enregistrement...' : <><Save size={18} /> Sauvegarder</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
