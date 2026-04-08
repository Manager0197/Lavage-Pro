import React, { useState } from 'react';
import { TransactionType } from '../types';
import { SERVICE_PRICES, EXPENSE_CATEGORIES } from '../constants';
import { X } from 'lucide-react';

interface TransactionFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, onSubmit }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
  const [amount, setAmount] = useState<string>('');
  
  const defaultService = Object.keys(SERVICE_PRICES)[0];
  const [category, setCategory] = useState<string>(defaultService);
  
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCategory(val);
    if (type === TransactionType.INCOME && val in SERVICE_PRICES) {
      setAmount(SERVICE_PRICES[val].toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      amount: Number(amount),
      category,
      description: description || (type === TransactionType.INCOME ? category : 'Dépense'),
      clientName,
      vehiclePlate,
      date: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold">Nouvelle Transaction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === TransactionType.INCOME ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              onClick={() => {
                setType(TransactionType.INCOME);
                setCategory(defaultService);
                setAmount(SERVICE_PRICES[defaultService].toString());
              }}
            >
              Encaissement (Lavage)
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
              onClick={() => {
                setType(TransactionType.EXPENSE);
                setCategory(EXPENSE_CATEGORIES[0]);
                setAmount('');
              }}
            >
              Dépense
            </button>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
            <select 
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={category}
              onChange={handleCategoryChange}
            >
              {type === TransactionType.INCOME ? (
                Object.keys(SERVICE_PRICES).map(s => <option key={s} value={s}>{s}</option>)
              ) : (
                EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
              )}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Montant (FCFA)</label>
            <input 
              type="number" 
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Extra fields for Income */}
          {type === TransactionType.INCOME && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Immatriculation</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="AB-123-CD"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client (Optionnel)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nom du client"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description / Note</label>
            <textarea 
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails supplémentaires..."
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className={`w-full py-3 rounded-lg text-white font-medium shadow-lg transition-all transform active:scale-95 ${type === TransactionType.INCOME ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};