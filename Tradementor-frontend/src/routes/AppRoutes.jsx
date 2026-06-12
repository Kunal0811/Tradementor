import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { LayoutDashboard, BookOpen, LogOut, TrendingUp, Notebook } from 'lucide-react';
import SimulatorDashboard from '../components/SimulatorDashboard';
import AiAssistantDrawer from '../components/AiAssistantDrawer';
import LearningModule from '../components/LearningModule';
import TradingJournal from '../components/TradingJournal';

const LoginMock = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) login(email, password);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-brand-dark px-4">
      <div className="w-full max-w-md space-y-8 bg-brand-card p-8 rounded-2xl border border-slate-700 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-brand-accent">TradeMentor AI</h2>
          <p className="mt-2 text-sm text-slate-400">Risk-free interactive market simulation</p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">Email Address</label>
                <input 
                type="email" 
                required 
                autoComplete="username" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-brand-dark border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-accent font-sans"
                />
            </div>
            <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">Password</label>
                <input 
                type="password" 
                required 
                autoComplete="current-password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-brand-dark border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-accent font-sans"
                />
            </div>
            <button type="submit" className="w-full mt-6 bg-brand-accent hover:bg-sky-400 text-slate-900 py-2.5 rounded-lg font-bold transition-colors">
                Access Platform
            </button>
        </form>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

export default function AppRoutes() {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Simulator', path: '/', icon: LayoutDashboard },
    { name: 'Learn & Quiz', path: '/learn', icon: BookOpen },
    { name: 'Trading Journal', path: '/journal', icon: Notebook }
  ];

  return (
    <Routes>
      <Route path="/login" element={<LoginMock />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="flex h-screen w-screen overflow-hidden bg-brand-dark text-slate-100">
            {/* Main Platform Sidebar Layout Shell */}
            <aside className="w-64 bg-brand-card border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 px-2 py-4 mb-6 border-b border-slate-800">
                  <TrendingUp className="text-brand-accent w-6 h-6" />
                  <span className="text-xl font-bold tracking-wider text-slate-100">TradeMentor</span>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link key={item.name} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-accent/10 text-brand-accent' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}>
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-brand-bear hover:bg-rose-500/10 transition-colors mt-auto">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </aside>

            {/* Application Main Body Content Window Workspace */}
            <main className="flex-1 overflow-y-auto p-8 relative">
              <Routes>
                <Route path="/" element={<SimulatorDashboard />} />
                <Route path="/learn" element={<LearningModule />} />
                <Route path="/journal" element={<TradingJournal />} />
              </Routes>
              
              {/* Floating Global Persistent Coach Assistant Overlay Panel */}
              <AiAssistantDrawer />
            </main>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}