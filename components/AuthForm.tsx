import React, { useState } from 'react';
import { loginUser, registerUser, updateUserRole } from '../services/firebase';
import { UserRole } from '../types';
import { Droplets, Shield, User, Mail, Lock, UserCheck, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Connexion standard
        const userCredential = await loginUser(email, password);
        
        // --- CORRECTIF DE RÔLE ---
        // Si c'est l'email de l'admin, on force le rôle ADMIN dans la base de données
        // pour corriger les erreurs passées.
        if (email.toLowerCase() === 'admin@lavage.com') {
          await updateUserRole(userCredential.user.uid, 'ADMIN');
        } 
        // Si c'est l'email du gérant de test, on force USER
        else if (email.toLowerCase() === 'gerant@lavage.com') {
          await updateUserRole(userCredential.user.uid, 'USER');
        }
        
      } else {
        // Inscription avec le rôle sélectionné
        await registerUser(email, password, role, name);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError("Email ou mot de passe incorrect.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Ce compte existe déjà. Veuillez vous connecter.");
        setIsLogin(true);
      } else if (err.code === 'auth/weak-password') {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
      } else {
        setError("Une erreur est survenue (" + err.code + ").");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-75"></div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30 transform rotate-3">
              <Droplets className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Lavage Pro</h1>
            <p className="text-blue-200 text-sm">Gestion intelligente de station de lavage</p>
          </div>

          <div className="flex bg-slate-900/50 p-1 rounded-xl mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                !isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Le sélecteur de rôle n'est affiché QUE pour l'inscription */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4 mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                      role === 'ADMIN' 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <Shield size={20} />
                    <span className="text-xs font-bold">Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('USER')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                      role === 'USER' 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <User size={20} />
                    <span className="text-xs font-bold">Gérant</span>
                  </button>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="relative">
                  <UserCheck className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Nom complet"
                    required={!isLogin}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="Email professionnel"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2 text-blue-200 text-sm animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Se connecter' : 'Créer un compte'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-xs">
              &copy; 2025 Lavage Pro Manager
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};