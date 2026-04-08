
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SummaryCards } from './components/SummaryCards';
import { SalesChart } from './components/SalesChart';
import { TransactionList } from './components/TransactionList';
import { AuthForm } from './components/AuthForm';
import { EditTransactionDialog } from './components/EditTransactionDialog';
import { Transaction, FinancialSummary, TransactionType, ServiceItem, Washer, UserRole } from './types';
import { 
  subscribeToTransactions, addTransaction, deleteTransaction, updateTransaction, getSummary,
  subscribeToServices, addService, deleteService,
  subscribeToWashers, addWasher, deleteWasher
} from './services/storageService';
import { subscribeToAuthChanges, subscribeToUserProfile, logoutUser } from './services/firebase';
import { ConfirmDialog } from './components/ConfirmDialog';
import { 
  Menu, X, User,
  LayoutDashboard, Tags, PlusCircle, Trash2, Calendar, Save,
  Moon, Sun, Shield, Lock, CheckCircle, AlertCircle, LogOut, Loader2,
  Car, Filter
} from 'lucide-react';
import { VEHICLE_TYPES, CAR_CATEGORIES, WASH_TYPES } from './constants';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('USER');

  // Navigation State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('lavage_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [washers, setWashers] = useState<Washer[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0, totalExpenses: 0, netProfit: 0, totalWashes: 0, totalWasherShare: 0, totalPromoterShare: 0
  });

  // Form States (Admin Services)
  const [newServiceName, setNewServiceName] = useState(''); // Type de lavage (Dropdown selection)
  const [customNewServiceName, setCustomNewServiceName] = useState(''); // Manual input if 'Autre'
  
  const [newServiceCategory, setNewServiceCategory] = useState(''); // Category (Dropdown selection)
  const [customNewServiceCategory, setCustomNewServiceCategory] = useState(''); // Manual input if 'Autre'

  const [newServicePrice, setNewServicePrice] = useState('');
  const [newWasherName, setNewWasherName] = useState('');
  
  // Expenses Form
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Produits de nettoyage');
  const [expenseDesc, setExpenseDesc] = useState('');

  // Registration Form
  const [regVehicleType, setRegVehicleType] = useState('Voiture');
  const [regCarCategory, setRegCarCategory] = useState('Berline'); // Pour voiture uniquement
  const [regWashType, setRegWashType] = useState(''); // Le nom du service (Lavage simple...) ou 'custom'
  const [customServiceName, setCustomServiceName] = useState(''); // Si custom

  const [regServiceId, setRegServiceId] = useState('');
  const [regUnitPrice, setRegUnitPrice] = useState<number>(0);
  const [regQty, setRegQty] = useState<number>(1);
  const [regWasherId, setRegWasherId] = useState('');
  const [regBrand, setRegBrand] = useState('');
  const [regPlate, setRegPlate] = useState('');
  const [regFinancials, setRegFinancials] = useState({ total: 0, washerShare: 0, promoterShare: 0 });

  // History Filter
  const [historyFilter, setHistoryFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Confirm & Edit Dialog States
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // --- Effects ---

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lavage_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lavage_theme', 'light');
    }
  }, [isDarkMode]);

  // Auth & Profile Listener
  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;
    const authUnsubscribe = subscribeToAuthChanges((currentUser) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        profileUnsubscribe = subscribeToUserProfile(currentUser.uid, (profile) => {
          if (profile) setUserRole(profile.role);
          else setUserRole('USER');
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserRole('USER');
        setLoading(false);
      }
    });
    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  // Data Subscriptions
  useEffect(() => {
    if (!user) return;
    const unsubscribeTransactions = subscribeToTransactions((data) => {
      // 1. Stocker TOUTES les transactions pour l'historique et les graphiques
      setTransactions(data);

      // 2. Calculer le résumé uniquement pour AUJOURD'HUI
      const today = new Date();
      // On utilise toLocaleDateString pour s'assurer qu'on compare la date locale (pas UTC)
      // Format 'en-CA' donne YYYY-MM-DD qui est facile à comparer
      const todayStr = today.toLocaleDateString('en-CA');

      const todaysTransactions = data.filter(t => {
        if (!t.date) return false;
        const tDate = new Date(t.date).toLocaleDateString('en-CA');
        return tDate === todayStr;
      });

      // Le résumé affiché en haut de page ne concerne que la journée en cours
      setSummary(getSummary(todaysTransactions));
    });

    const unsubscribeServices = subscribeToServices((data) => {
      setServices(data);
    });
    const unsubscribeWashers = subscribeToWashers((data) => {
      setWashers(data);
    });
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    return () => {
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeServices) unsubscribeServices();
      if (unsubscribeWashers) unsubscribeWashers();
    };
  }, [user]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Calculate Financials
  useEffect(() => {
    const total = regUnitPrice * regQty;
    setRegFinancials({
      total,
      washerShare: total * 0.30,
      promoterShare: total * 0.70
    });
  }, [regUnitPrice, regQty]);

  // --- Logic for Registration Service Lookup ---
  useEffect(() => {
    // Skip auto-lookup if we are in custom mode
    if (regWashType === 'custom') return;

    // Determine the target category based on Vehicle Type
    let targetCategory = '';
    if (regVehicleType === 'Voiture') {
      targetCategory = regCarCategory; // Berline, 4x4...
    } else {
      targetCategory = regVehicleType; // Moto, Camion...
    }

    if (!regWashType || !targetCategory) {
      setRegServiceId('');
      setRegUnitPrice(0);
      return;
    }

    // Find the service that matches Category AND Wash Name
    const matchingService = services.find(s => 
      (s.category === targetCategory) && (s.name === regWashType)
    );

    if (matchingService) {
      setRegServiceId(matchingService.id);
      setRegUnitPrice(matchingService.price);
    } else {
      // Reset if combination not found
      setRegServiceId('');
      setRegUnitPrice(0);
    }
  }, [regVehicleType, regCarCategory, regWashType, services]);


  // --- Helper: Notification ---
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    if (type === 'success' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification("Lavage Manager Pro", { body: message });
    }
  };

  // --- Handlers ---

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setUserRole('USER');
      setCurrentPage('dashboard');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  const executeConfirm = async () => {
    setIsProcessingAction(true);
    try {
      await confirmDialog.onConfirm();
      closeConfirm();
      showNotification("Opération effectuée avec succès", 'success');
    } catch (error) {
      console.error("Action failed", error);
      showNotification("Une erreur est survenue", 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDelete = (id: string) => {
    if (userRole !== 'ADMIN') {
      showNotification("Accès refusé : Admin requis.", 'error');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer l'opération",
      message: "Voulez-vous vraiment supprimer cette opération ?",
      onConfirm: async () => await deleteTransaction(id)
    });
  };

  // Open Edit Modal
  const handleEdit = (transaction: Transaction) => {
    if (userRole !== 'ADMIN') return;
    setEditingTransaction(transaction);
  };

  // Execute Update
  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setIsProcessingAction(true);
    try {
      await updateTransaction(id, updates);
      setEditingTransaction(null);
      showNotification("Transaction modifiée avec succès", 'success');
    } catch (error) {
      console.error("Update failed", error);
      showNotification("Erreur lors de la modification", 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'ADMIN') return;

    const finalCategory = newServiceCategory === 'Autre' ? customNewServiceCategory : newServiceCategory;
    const finalName = newServiceName === 'Autre' ? customNewServiceName : newServiceName;

    if (!finalName || !finalCategory || !newServicePrice) {
      showNotification("Veuillez remplir tous les champs (Catégorie, Type, Prix).", 'error');
      return;
    }
    try {
      await addService({ 
        category: finalCategory,
        name: finalName, 
        price: Number(newServicePrice) 
      });
      setNewServicePrice('');
      setCustomNewServiceName('');
      setCustomNewServiceCategory('');
      
      // Reset dropdowns to default if desired, or keep logic
      setNewServiceName('');
      setNewServiceCategory('');
      
      showNotification("Service ajouté !", 'success');
    } catch (error) {
      console.error("Erreur ajout service:", error);
      showNotification("Erreur lors de l'ajout.", 'error');
    }
  };

  const handleDeleteService = (id: string) => {
    if (userRole !== 'ADMIN') return;
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer le service",
      message: "Êtes-vous sûr de vouloir supprimer ce tarif ?",
      onConfirm: async () => await deleteService(id)
    });
  };

  const handleAddWasher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'ADMIN') return;
    if (!newWasherName) return;
    try {
      await addWasher({ name: newWasherName, active: true });
      setNewWasherName('');
      showNotification("Laveur ajouté !", 'success');
    } catch (error) {
      console.error("Erreur ajout laveur:", error);
      showNotification("Erreur: Permission refusée.", 'error');
    }
  };

  const handleDeleteWasher = (id: string) => {
    if (userRole !== 'ADMIN') return;
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer le laveur",
      message: "Voulez-vous vraiment supprimer ce membre de l'équipe ?",
      onConfirm: async () => await deleteWasher(id)
    });
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseCategory) return;
    try {
      await addTransaction({
        type: TransactionType.EXPENSE,
        amount: Number(expenseAmount),
        category: expenseCategory,
        description: expenseDesc || expenseCategory,
        date: new Date().toISOString()
      });
      setExpenseAmount('');
      setExpenseDesc('');
      showNotification('Dépense enregistrée !', 'success');
    } catch (error) {
      console.error("Erreur ajout dépense:", error);
      showNotification("Erreur lors de l'enregistrement.", 'error');
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const isCustom = regWashType === 'custom';
    
    if (isCustom) {
      if (!customServiceName || regUnitPrice === 0) {
        showNotification("Veuillez saisir un nom et un prix pour le service personnalisé.", 'error');
        return;
      }
    } else {
      if (!regWashType || regUnitPrice === 0) {
         showNotification("Ce type de lavage n'est pas configuré pour ce véhicule.", 'error');
         return;
      }
    }
    
    const washer = washers.find(w => w.id === regWasherId);
    if (!washer) {
      showNotification("Sélectionnez un laveur.", 'error');
      return;
    }

    try {
      const finalServiceName = isCustom ? customServiceName : regWashType;
      const categoryLabel = regVehicleType === 'Voiture' ? regCarCategory : regVehicleType;
      const description = `${finalServiceName} (${categoryLabel})`;

      await addTransaction({
        type: TransactionType.INCOME,
        date: new Date().toISOString(),
        amount: regFinancials.total,
        description: description,
        category: finalServiceName,
        serviceId: isCustom ? 'custom' : (regServiceId || 'custom'),
        unitPrice: regUnitPrice,
        quantity: regQty,
        vehicleType: regVehicleType, // Voiture, Moto...
        vehicleBrand: regBrand,
        vehiclePlate: regPlate,
        washerId: washer.id,
        washerName: washer.name,
        washerShare: regFinancials.washerShare,
        promoterShare: regFinancials.promoterShare
      });

      showNotification(`Enregistré : ${description} - ${regFinancials.total.toLocaleString()} F`, 'success');

      setRegBrand('');
      setRegPlate('');
      setRegQty(1);
      if (isCustom) setCustomServiceName('');
      // Keep wash type selection to facilitate next entry or reset? 
      // Resetting might be safer to avoid accidental custom entries.
      if (isCustom) setRegWashType('');
      
    } catch (error) {
      console.error("Erreur enregistrement:", error);
      showNotification("Erreur lors de l'enregistrement.", 'error');
    }
  };

  // --- UI Vars ---
  const inputClass = "w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors";
  const cardClass = "bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
  const titleClass = "text-lg font-bold text-slate-800 dark:text-white mb-4";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" size={48} />
          <p className="text-slate-500 text-sm animate-pulse">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // --- Render Views ---
  const renderContent = () => {
    if (userRole === 'USER' && ['services', 'washer', 'settings'].includes(currentPage)) {
       return (
         <div className="flex flex-col items-center justify-center h-96 text-center p-6">
           <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4 text-red-600 dark:text-red-400">
             <Lock size={32} />
           </div>
           <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Accès Restreint</h2>
           <p className="text-slate-500 dark:text-slate-400 max-w-md">
             Cette section est réservée aux administrateurs.
           </p>
         </div>
       );
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Tableau de Bord</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-sm font-bold border ${
                    userRole === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                      : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                  }`}>
                    {userRole === 'ADMIN' ? 'Admin' : 'Gérant'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Données en temps réel (Aujourd'hui)</p>
                </div>
              </div>
            </div>

            <SummaryCards summary={summary} userRole={userRole} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><SalesChart transactions={transactions} /></div>
              <div className="lg:col-span-1"><TransactionList transactions={transactions} onDelete={handleDelete} onEdit={handleEdit} limit={5} userRole={userRole} /></div>
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className={`${cardClass} sticky top-6`}>
                  <h3 className={titleClass}>Ajouter un Service</h3>
                  <form onSubmit={handleAddService} className="space-y-4">
                    
                    {/* 1. Sélection de la catégorie */}
                    <div>
                      <label className={labelClass}>Catégorie Véhicule</label>
                      <select 
                        required
                        className={inputClass}
                        value={newServiceCategory}
                        onChange={e => setNewServiceCategory(e.target.value)}
                      >
                        <option value="">Choisir...</option>
                        <optgroup label="Voitures">
                          {CAR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </optgroup>
                        <optgroup label="Autres">
                          {VEHICLE_TYPES.filter(t => t !== 'Voiture').map(t => <option key={t} value={t}>{t}</option>)}
                        </optgroup>
                        <option value="Autre" className="text-blue-600 font-bold">+ Nouvelle Catégorie</option>
                      </select>
                      
                      {newServiceCategory === 'Autre' && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                           <input 
                             type="text" 
                             required 
                             placeholder="Nom de la catégorie (ex: Bus, Tracteur)"
                             className={inputClass}
                             value={customNewServiceCategory}
                             onChange={e => setCustomNewServiceCategory(e.target.value)}
                           />
                        </div>
                      )}
                    </div>

                    {/* 2. Sélection du type de lavage */}
                    <div>
                      <label className={labelClass}>Type de Lavage</label>
                      <select 
                        required
                        className={inputClass}
                        value={newServiceName}
                        onChange={e => setNewServiceName(e.target.value)}
                      >
                        <option value="">Choisir...</option>
                        {WASH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        <option value="Autre" className="text-blue-600 font-bold">+ Nouveau Service</option>
                      </select>

                      {newServiceName === 'Autre' && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                           <input 
                             type="text" 
                             required 
                             placeholder="Nom du service (ex: Moteur, Tapis)"
                             className={inputClass}
                             value={customNewServiceName}
                             onChange={e => setCustomNewServiceName(e.target.value)}
                           />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Prix (XAF)</label>
                      <input 
                        type="number" 
                        required
                        className={inputClass}
                        value={newServicePrice}
                        onChange={e => setNewServicePrice(e.target.value)}
                        placeholder="ex: 2000"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/20">
                      Enregistrer
                    </button>
                  </form>
                </div>
              </div>

              <div className="md:w-2/3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Liste des Prix Configurés</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {services.map(service => (
                    <div key={service.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex justify-between items-center transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                            {service.category || 'Standard'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{service.name}</h4>
                        <p className="text-blue-600 dark:text-blue-400 font-bold">{service.price.toLocaleString()} FCFA</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <p className="text-slate-500 dark:text-slate-400 italic">Aucun service configuré.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'registration':
        return (
          <div className="max-w-4xl mx-auto">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
               <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-white">Nouvel Enregistrement</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Enregistrer une prestation de lavage</p>
               </div>
               
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Form Column */}
                 <form id="reg-form" onSubmit={handleRegistration} className="space-y-6">
                    
                    {/* Etape 1 : Type de Véhicule */}
                    <div>
                      <label className={labelClass}>1. Type de véhicule</label>
                      <div className="grid grid-cols-2 gap-2">
                        {VEHICLE_TYPES.map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => { setRegVehicleType(type); setRegWashType(''); setRegUnitPrice(0); }}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                              regVehicleType === type
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Etape 2 : Catégorie (SEULEMENT SI VOITURE) */}
                    {regVehicleType === 'Voiture' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className={labelClass}>2. Catégorie Voiture</label>
                        <select 
                          className={inputClass}
                          value={regCarCategory}
                          onChange={e => { setRegCarCategory(e.target.value); setRegWashType(''); setRegUnitPrice(0); }}
                        >
                          {CAR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Etape 3 : Type de Lavage (Dépendant de la catégorie) */}
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className={labelClass}>
                        {regVehicleType === 'Voiture' ? '3. Type de Lavage' : '2. Type de Lavage'}
                      </label>
                      <select 
                        required
                        className={inputClass}
                        value={regWashType}
                        onChange={e => {
                          setRegWashType(e.target.value);
                          if (e.target.value === 'custom') {
                            setRegUnitPrice(0);
                            setCustomServiceName('');
                          }
                        }}
                      >
                        <option value="">Sélectionner...</option>
                        {/* 
                            On fusionne la liste par défaut WASH_TYPES avec les noms de services 
                            qui existent déjà en base de données pour cette catégorie.
                            Cela permet d'afficher les services personnalisés créés dans l'admin.
                        */}
                        {(() => {
                          const categoryToCheck = regVehicleType === 'Voiture' ? regCarCategory : regVehicleType;
                          
                          // Créer une liste unique de tous les noms de services disponibles pour cette catégorie
                          const availableServicesInDB = services
                            .filter(s => s.category === categoryToCheck)
                            .map(s => s.name);
                            
                          // Combiner les types par défaut et ceux de la DB, sans doublons
                          const allWashTypes = Array.from(new Set([...WASH_TYPES, ...availableServicesInDB]));

                          return allWashTypes.map(w => {
                             const exists = services.some(s => s.category === categoryToCheck && s.name === w);
                             return (
                               <option key={w} value={w} disabled={!exists}>
                                 {w} {exists ? '' : '(Non tarifé)'}
                               </option>
                             );
                          });
                        })()}
                        
                        <option value="custom" className="font-bold text-blue-600">⚡ Autre / Personnalisé</option>
                      </select>
                      
                      {regWashType === 'custom' && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                           <label className={labelClass}>Nom du service spécial</label>
                           <input 
                             type="text" 
                             required 
                             className={inputClass} 
                             placeholder="ex: Lavage Tapis, Moteur..."
                             value={customServiceName}
                             onChange={e => setCustomServiceName(e.target.value)}
                           />
                        </div>
                      )}

                      {regWashType && regWashType !== 'custom' && regUnitPrice === 0 && (
                        <p className="text-xs text-red-500 mt-1">Aucun tarif configuré pour cette combinaison.</p>
                      )}
                    </div>

                    {/* Autres infos */}
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className={labelClass}>Prix Unitaire</label>
                          <input 
                            type="number" 
                            className={inputClass}
                            value={regUnitPrice}
                            onChange={(e) => setRegUnitPrice(Number(e.target.value))}
                            placeholder="0"
                          />
                       </div>
                       <div>
                          <label className={labelClass}>Quantité</label>
                          <input 
                            type="number" 
                            min="1"
                            className={inputClass}
                            value={regQty}
                            onChange={e => setRegQty(parseInt(e.target.value) || 1)}
                          />
                       </div>
                    </div>

                    <div>
                      <label className={labelClass}>Laveur Assigné</label>
                      <select 
                        required
                        className={inputClass}
                        value={regWasherId}
                        onChange={e => setRegWasherId(e.target.value)}
                      >
                        <option value="">Sélectionner un laveur...</option>
                        {washers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className={labelClass}>Marque/Modèle</label>
                          <input 
                            type="text" 
                            className={inputClass}
                            placeholder="ex: Toyota"
                            value={regBrand}
                            onChange={e => setRegBrand(e.target.value)}
                          />
                       </div>
                       <div>
                          <label className={labelClass}>Immatriculation</label>
                          <input 
                            type="text" 
                            className={inputClass}
                            placeholder="AB-123-CD"
                            value={regPlate}
                            onChange={e => setRegPlate(e.target.value)}
                          />
                       </div>
                    </div>
                 </form>

                 {/* Financial Summary Column */}
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                        <Tags size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
                        Résumé Financier
                      </h3>
                      <div className="space-y-3 text-sm">
                         <div className="flex justify-between">
                           <span className="text-slate-500 dark:text-slate-400">Prix unitaire</span>
                           <span className="font-medium dark:text-slate-200">{regUnitPrice.toLocaleString()} XAF</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-slate-500 dark:text-slate-400">Quantité</span>
                           <span className="font-medium dark:text-slate-200">x {regQty}</span>
                         </div>
                         <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                         <div className="flex justify-between text-lg font-bold text-slate-800 dark:text-white">
                           <span>A PAYER</span>
                           <span>{regFinancials.total.toLocaleString()} XAF</span>
                         </div>
                         
                         {userRole === 'ADMIN' && (
                           <div className="mt-6 space-y-2 animate-in fade-in duration-300">
                             <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                               <span className="text-slate-500 dark:text-slate-400 text-xs">Part Laveur (30%)</span>
                               <span className="font-bold text-green-600 dark:text-green-400">{regFinancials.washerShare.toLocaleString()} XAF</span>
                             </div>
                             <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                               <span className="text-slate-500 dark:text-slate-400 text-xs">Part Promoteur (70%)</span>
                               <span className="font-bold text-blue-600 dark:text-blue-400">{regFinancials.promoterShare.toLocaleString()} XAF</span>
                             </div>
                           </div>
                         )}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      form="reg-form"
                      className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center"
                    >
                      <Save size={20} className="mr-2" />
                      Valider
                    </button>
                 </div>
               </div>
             </div>
          </div>
        );

      case 'washer':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className={`${cardClass} sticky top-6`}>
                  <h3 className={titleClass}>Ajouter un Laveur</h3>
                  <form onSubmit={handleAddWasher} className="space-y-4">
                    <div>
                      <label className={labelClass}>Nom complet</label>
                      <input 
                        type="text" 
                        required
                        className={inputClass}
                        value={newWasherName}
                        onChange={e => setNewWasherName(e.target.value)}
                        placeholder="ex: Amadou Diallo"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/20">
                      Ajouter
                    </button>
                  </form>
                </div>
              </div>

              <div className="md:w-2/3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className={titleClass}>Équipe de Lavage</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {washers.map(washer => {
                     const washerTxs = transactions.filter(t => t.washerId === washer.id);
                     const todayTxs = washerTxs.filter(t => t.date.startsWith(new Date().toISOString().split('T')[0]));
                     
                     return (
                      <div key={washer.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <User size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">{washer.name}</h4>
                            <div className="flex items-center text-sm mt-1 gap-3">
                              <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full text-xs font-medium">Actif</span>
                              <span className="text-slate-500 dark:text-slate-400">{todayTxs.length} lavages aujourd'hui</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteWasher(washer.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                  {washers.length === 0 && (
                    <p className="text-slate-500 dark:text-slate-400 italic">Aucun laveur enregistré.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'history':
        // Filtrage par période
        const filteredTransactions = transactions.filter(t => {
           if (!historyFilter.start && !historyFilter.end) return true;
           
           const tDate = new Date(t.date).getTime();
           
           // Début de la journée pour la date de début
           const startDate = historyFilter.start ? new Date(historyFilter.start) : null;
           if (startDate) startDate.setHours(0, 0, 0, 0);

           // Fin de la journée pour la date de fin
           const endDate = historyFilter.end ? new Date(historyFilter.end) : null;
           if (endDate) endDate.setHours(23, 59, 59, 999);

           if (startDate && tDate < startDate.getTime()) return false;
           if (endDate && tDate > endDate.getTime()) return false;
           
           return true;
        });

        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Historique des Ventes</h2>
                <p className="text-slate-500 dark:text-slate-400">Consultez toutes les opérations passées</p>
              </div>
              
              {/* Filtre par période */}
              <div className="w-full md:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-500 uppercase">Du</span>
                  <input 
                    type="date" 
                    className="outline-none text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1 text-sm border border-slate-200 dark:border-slate-700"
                    value={historyFilter.start}
                    onChange={e => setHistoryFilter({...historyFilter, start: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-500 uppercase">Au</span>
                  <input 
                    type="date" 
                    className="outline-none text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1 text-sm border border-slate-200 dark:border-slate-700"
                    value={historyFilter.end}
                    onChange={e => setHistoryFilter({...historyFilter, end: e.target.value})}
                  />
                </div>
                {(historyFilter.start || historyFilter.end) && (
                  <button 
                    onClick={() => setHistoryFilter({ start: '', end: '' })}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors ml-auto"
                    title="Réinitialiser le filtre"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <TransactionList 
               transactions={filteredTransactions} 
               onDelete={handleDelete} 
               onEdit={handleEdit}
               userRole={userRole} 
            />
          </div>
        );

      case 'expenses':
        const expensesList = transactions.filter(t => t.type === TransactionType.EXPENSE);
        const expenseCategories = ["Produits de nettoyage", "Eau & Électricité", "Salaires", "Maintenance", "Loyer", "Autre"];
        return (
           <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                   <div className={`${cardClass} sticky top-6`}>
                      <h3 className={titleClass}>Nouvelle Dépense</h3>
                      <form onSubmit={handleAddExpense} className="space-y-4">
                        <div>
                          <label className={labelClass}>Montant (XAF)</label>
                          <input type="number" required className={inputClass} value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>Catégorie</label>
                          <select className={inputClass} value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)}>
                            {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Description (Facultatif)</label>
                          <textarea className={inputClass} rows={3} value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} placeholder="Détails supplémentaires..." />
                        </div>
                        <button type="submit" className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-lg shadow-red-500/20">Enregistrer la dépense</button>
                      </form>
                   </div>
                </div>
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Historique des Dépenses</h3>
                    <div className="bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded text-red-800 dark:text-red-300 font-bold text-sm">
                      Total: {expensesList.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} XAF
                    </div>
                  </div>
                  <TransactionList transactions={expensesList} onDelete={handleDelete} onEdit={handleEdit} userRole={userRole} />
                </div>
             </div>
           </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Paramètres</h2>
              <p className="text-slate-500 dark:text-slate-400">Configuration de l'application</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 transition-colors">
              <div className="p-6 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"><Shield size={20}/></div>
                   <div>
                     <h3 className="font-medium text-slate-900 dark:text-white">Sécurité</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400">Gérer les accès et permissions</p>
                   </div>
                 </div>
                 <button className="text-blue-600 font-medium text-sm hover:underline">Modifier</button>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
              Version de l'application: 3.1 (Cloud Connected)
            </div>
          </div>
        );

      default:
        return <div>Page non trouvée</div>;
    }
  };

  const mobileMenuOptions = [
    { id: 'dashboard', label: 'Tableau de bord', roles: ['ADMIN', 'USER'] },
    { id: 'services', label: 'Services', roles: ['ADMIN'] },
    { id: 'registration', label: 'Enregistrement', roles: ['ADMIN', 'USER'] },
    { id: 'washer', label: 'Laveur', roles: ['ADMIN'] },
    { id: 'history', label: 'Historique', roles: ['ADMIN', 'USER'] },
    { id: 'expenses', label: 'Dépenses', roles: ['ADMIN', 'USER'] },
    { id: 'settings', label: 'Paramètres', roles: ['ADMIN'] },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} userRole={userRole} onLogout={handleLogout} />
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] max-w-sm w-full p-4 rounded-xl shadow-lg border animate-in fade-in slide-in-from-top-5 duration-300 flex items-start gap-3 ${
          notification.type === 'success' ? 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300' : 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'
        }`}>
          <div className={`mt-0.5 ${notification.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}</div>
          <div><h4 className="font-bold text-sm mb-0.5">{notification.type === 'success' ? 'Succès' : 'Erreur'}</h4><p className="text-sm opacity-90">{notification.message}</p></div>
          <button onClick={() => setNotification(null)} className="ml-auto opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>
      )}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="font-bold text-lg text-blue-600 dark:text-blue-400 flex items-center gap-2">Lavage Pro</div>
        <div className="flex items-center gap-3">
           <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'}`}>
             {userRole === 'ADMIN' ? <Shield size={14} /> : <User size={14} />}
             <span>{userRole === 'ADMIN' ? 'Admin' : 'Gérant'}</span>
           </div>
           <button onClick={toggleTheme} className="text-slate-600 dark:text-slate-300 p-1">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 dark:text-slate-300 p-1"><Menu size={24} /></button>
        </div>
      </div>
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around items-center h-16 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-safe">
         <button onClick={() => setCurrentPage('dashboard')} className={`flex flex-col items-center justify-center w-full h-full ${currentPage === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}><LayoutDashboard size={24} /><span className="text-[10px] font-medium mt-1">Accueil</span></button>
         {userRole === 'ADMIN' && <button onClick={() => setCurrentPage('services')} className={`flex flex-col items-center justify-center w-full h-full ${currentPage === 'services' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}><Tags size={24} /><span className="text-[10px] font-medium mt-1">Config</span></button>}
         <button onClick={() => setCurrentPage('registration')} className={`flex flex-col items-center justify-center w-full h-full ${currentPage === 'registration' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}><PlusCircle size={24} /><span className="text-[10px] font-medium mt-1">Enreg.</span></button>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/95 text-white p-6 overflow-y-auto">
           <div className="flex justify-between mb-8 items-center"><h2 className="text-xl font-bold">Menu</h2><button onClick={() => setIsMobileMenuOpen(false)}><X size={28} /></button></div>
           <nav className="space-y-4 text-lg text-center">
             {mobileMenuOptions.filter(opt => opt.roles.includes(userRole)).map(option => (
               <button key={option.id} onClick={() => { setCurrentPage(option.id); setIsMobileMenuOpen(false); }} className={`block w-full py-3 rounded-lg ${currentPage === option.id ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>{option.label}</button>
             ))}
             <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="block w-full py-3 rounded-lg text-red-400 hover:bg-red-900/20 mt-8 border border-red-900/50">Déconnexion</button>
           </nav>
        </div>
      )}
      <main className="flex-1 md:ml-64 p-4 md:p-8 mt-14 md:mt-0 mb-20 md:mb-0 overflow-y-auto h-[calc(100vh-3.5rem)] md:h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="hidden md:flex justify-end gap-3 mb-4">
          <button onClick={toggleTheme} className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title={isDarkMode ? "Mode clair" : "Mode sombre"}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
        </div>
        <div className="max-w-6xl mx-auto">{renderContent()}</div>
      </main>
      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={executeConfirm} onCancel={closeConfirm} isLoading={isProcessingAction} />
      
      {/* Modal d'édition */}
      <EditTransactionDialog 
        isOpen={!!editingTransaction} 
        transaction={editingTransaction} 
        onClose={() => setEditingTransaction(null)} 
        onSave={handleUpdateTransaction}
        isLoading={isProcessingAction}
      />
    </div>
  );
};

export default App;
