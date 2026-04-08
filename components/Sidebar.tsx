
import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  Droplets, 
  Settings, 
  Users, 
  Tags, 
  PlusCircle, 
  TrendingDown,
  Shield,
  User,
  LogOut
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: UserRole;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, userRole, onLogout }) => {
  // Base items available to everyone
  const baseItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'registration', label: 'Enregistrement', icon: PlusCircle },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'expenses', label: 'Dépenses', icon: TrendingDown },
  ];

  // Admin only items
  const adminItems = [
    { id: 'services', label: 'Services (Prix)', icon: Tags },
    { id: 'washer', label: 'Équipe Laveurs', icon: Users },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const navItems = userRole === 'ADMIN' ? [...baseItems, ...adminItems] : baseItems;

  // Reorder specifically to put registration high up for usability
  const orderedItems = [
    navItems.find(i => i.id === 'dashboard'),
    navItems.find(i => i.id === 'registration'),
    navItems.find(i => i.id === 'history'),
    navItems.find(i => i.id === 'expenses'),
    navItems.find(i => i.id === 'services'),
    navItems.find(i => i.id === 'washer'),
    navItems.find(i => i.id === 'settings'),
  ].filter(Boolean) as typeof baseItems;

  return (
    <div className="w-64 bg-slate-900 dark:bg-slate-950 text-white h-screen flex-shrink-0 fixed left-0 top-0 hidden md:flex flex-col border-r border-slate-800 dark:border-slate-900 z-20">
      <div className="p-6 flex items-center border-b border-slate-800 dark:border-slate-900">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20">
          <Droplets size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Lavage Pro</h1>
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded text-xs font-bold border ${
            userRole === 'ADMIN' 
              ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' 
              : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
          }`}>
             {userRole === 'ADMIN' ? <Shield size={10} /> : <User size={10} />}
             <span>Espace {userRole === 'ADMIN' ? 'Admin' : 'Gérant'}</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {orderedItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <Icon size={20} className="mr-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 dark:border-slate-900">
        <button 
          onClick={onLogout}
          className="w-full flex items-center px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          <span className="font-medium">Déconnexion</span>
        </button>
        <div className="mt-4 text-xs text-slate-600 text-center">
          v3.0 &copy; 2025
        </div>
      </div>
    </div>
  );
};
