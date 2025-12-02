import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType } from './types';
import { generateBio } from './services/geminiService';
import { Card, Button, Input, Layout } from './components/UI';
import { Recharts, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'; // Imported but not used in this specific logical flow as requested, sticking to core requirements but available if needed. Using simple lists instead for cleaner DB view.

// --- Auth Context Setup ---
// We define the context here in App.tsx to keep it self-contained for this specific file structure requirement
// In a larger app, this would be in context/AuthContext.tsx

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load data from "Database" (LocalStorage)
  useEffect(() => {
    const storedUsers = localStorage.getItem('auth_db_users');
    const storedSession = localStorage.getItem('auth_session');
    
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }

    if (storedSession) {
      setUser(JSON.parse(storedSession));
    }
    
    setIsLoading(false);
  }, []);

  // Sync "Database" when users change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('auth_db_users', JSON.stringify(users));
    }
  }, [users]);

  const login = async (email: string, pass: string) => {
    return new Promise<void>((resolve, reject) => {
      setIsLoading(true);
      setTimeout(() => { // Simulate network delay
        const foundUser = users.find(u => u.email === email && u.password === pass);
        if (foundUser) {
          setUser(foundUser);
          localStorage.setItem('auth_session', JSON.stringify(foundUser));
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error('Credenciais inválidas.'));
        }
      }, 800);
    });
  };

  const register = async (data: Omit<User, 'id' | 'createdAt' | 'role'>) => {
    return new Promise<void>((resolve, reject) => {
      setIsLoading(true);
      setTimeout(() => {
        if (users.some(u => u.email === data.email)) {
          setIsLoading(false);
          reject(new Error('Este email já está cadastrado.'));
          return;
        }

        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          role: 'user',
          ...data
        };

        setUsers(prev => [...prev, newUser]);
        setUser(newUser);
        localStorage.setItem('auth_session', JSON.stringify(newUser));
        setIsLoading(false);
        resolve();
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_session');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, users }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- View: Login ---
const LoginView: React.FC<{ onNavigate: (view: 'login' | 'register') => void }> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Bem-vindo</h2>
          <p className="text-gray-500 mt-2">Entre na sua conta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Email" 
            type="email" 
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>}
          />
          <Input 
            label="Senha" 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
          />

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={loading}>
            Entrar no Sistema
          </Button>

          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">Não tem conta? </span>
            <button 
              type="button"
              onClick={() => onNavigate('register')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Criar conta gratuita
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// --- View: Register ---
const RegisterView: React.FC<{ onNavigate: (view: 'login' | 'register') => void }> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState('');
  const [bio, setBio] = useState('');
  
  // UI State
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateBio = async () => {
    if (!name || !interests) {
      setError("Preencha nome e interesses para gerar a bio.");
      return;
    }
    setError('');
    setIsGeneratingBio(true);
    try {
      const generated = await generateBio(name, interests);
      setBio(generated);
    } catch {
      setError("Falha ao gerar bio. Tente escrever manualmente.");
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsRegistering(true);
    try {
      await register({ name, email, password, bio });
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-8">
      <Card className="w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Criar Nova Conta</h2>
          <div className="mt-4 flex justify-center space-x-2">
            <div className={`h-2 w-16 rounded-full transition-colors ${step === 1 ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
            <div className={`h-2 w-16 rounded-full transition-colors ${step === 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <Input label="Nome Completo" value={name} onChange={e => setName(e.target.value)} placeholder="João Silva" required />
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@exemplo.com" required />
              <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
              
              <Button type="button" className="w-full mt-4" onClick={() => {
                if(name && email && password.length >= 6) setStep(2);
                else setError("Preencha todos os campos corretamente.");
              }}>
                Continuar &rarr;
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
               <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                <h4 className="font-semibold text-indigo-900 text-sm mb-2 flex items-center">
                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                   Assistente de Perfil IA
                </h4>
                <p className="text-xs text-indigo-700 mb-3">
                  Conte-nos o que você faz e nossa IA criará uma bio profissional para você.
                </p>
                <Input 
                  label="Interesses ou Profissão" 
                  value={interests} 
                  onChange={e => setInterests(e.target.value)} 
                  placeholder="Ex: Desenvolvedor Front-end, amante de café e React" 
                />
                 <Button 
                  type="button" 
                  variant="secondary" 
                  className="w-full text-sm py-1 mt-2"
                  onClick={handleGenerateBio}
                  isLoading={isGeneratingBio}
                  disabled={!interests}
                >
                  ✨ Gerar Bio com IA
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sua Bio</label>
                <textarea 
                  className="w-full rounded-lg border border-gray-300 p-3 focus:ring-indigo-500 focus:border-indigo-500 h-24"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Sua bio aparecerá aqui..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="w-1/3">Voltar</Button>
                <Button type="submit" className="w-2/3" isLoading={isRegistering}>Finalizar Cadastro</Button>
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm text-center mt-2">{error}</p>}
          
          <div className="text-center mt-2">
            <button type="button" onClick={() => onNavigate('login')} className="text-sm text-gray-500 hover:text-gray-900">
              Já tenho conta
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// --- View: Dashboard ---
const Dashboard: React.FC = () => {
  const { user, users, logout } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-indigo-700 to-violet-700 rounded-2xl p-8 text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-bold mb-2">Olá, {user?.name}! 👋</h1>
          <p className="text-indigo-100 max-w-xl">{user?.bio}</p>
        </div>
        <Button onClick={logout} variant="secondary" className="mt-4 md:mt-0 bg-white/10 text-white border-white/20 hover:bg-white/20">
          Sair do Sistema
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info Card */}
        <Card className="p-6 col-span-1 border-t-4 border-t-indigo-500">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Seus Dados</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">ID do Usuário</label>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1 text-gray-600 truncate">{user?.id}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">Email</label>
              <p className="text-gray-800 font-medium">{user?.email}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">Membro Desde</label>
              <p className="text-gray-800">{new Date(user?.createdAt || '').toLocaleDateString('pt-BR')}</p>
            </div>
             <div className="pt-4 mt-4 border-t border-gray-100">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                  Online
                </span>
             </div>
          </div>
        </Card>

        {/* Database View (Simulated) */}
        <div className="col-span-1 lg:col-span-2">
           <Card className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Banco de Dados de Usuários</h3>
                <p className="text-sm text-gray-500">Total de registros: {users.length}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
            </div>
            <div className="overflow-x-auto flex-grow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bio (Preview)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id} className={u.id === user?.id ? "bg-indigo-50/60" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-xs uppercase">
                            {u.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                            {u.id === user?.id && <span className="text-xs text-indigo-600 font-semibold">(Você)</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{u.bio}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [view, setView] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      {!isAuthenticated ? (
        view === 'login' ? <LoginView onNavigate={setView} /> : <RegisterView onNavigate={setView} />
      ) : (
        <Dashboard />
      )}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
