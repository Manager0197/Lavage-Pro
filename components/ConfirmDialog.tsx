import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, onConfirm, onCancel, isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 dark:border-slate-700 transform transition-all animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">{title}</h3>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {message}
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-colors focus:ring-2 focus:ring-slate-400 outline-none"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-lg shadow-red-500/30 transition-colors flex items-center justify-center focus:ring-2 focus:ring-red-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Confirmer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
