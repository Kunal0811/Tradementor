import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { LayoutDashboard, BookOpen, LogOut, TrendingUp, Notebook, Activity, ChevronLeft, ChevronRight, User } from 'lucide-react';
import SimulatorDashboard from '../components/SimulatorDashboard';
import AiAssistantDrawer from '../components/AiAssistantDrawer';
import LearningModule from '../components/LearningModule';
import TradingJournal from '../components/TradingJournal';
import Dashboard from '../components/Dashboard';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    login(email, password);
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-brand-dark px-4 grid-bg">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-card border border-brand-border mb-4 shadow-xl">
            <TrendingUp className="w-8 h-8 text-brand-accent" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">TradeMentor <span className="text-brand-accent">AI</span></h1>
          <p className="text-brand-muted text-sm mt-2">Learn trading risk-free with AI-powered guidance</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3">
          {[['📊', 'Live Simulator'], ['🧠', 'AI Coach'], ['📚', '5 Modules']].map(([e, l]) => (
            <div key={l} className="bg-brand-card border border-brand-border rounded-xl p-3 text-center">
              <div className="text-lg mb-1">{e}</div>
              <p className="text-[11px] text-brand-muted font-semibold">{l}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6">Sign In</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider block mb-1.5">Email Address</label>
              <input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-white placeholder-brand-muted focus:outline-none focus:border-brand-accent transition-colors font-sans text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider block mb-1.5">Password</label>
              <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-white placeholder-brand-muted focus:outline-none focus:border-brand-accent transition-colors font-sans text-sm" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full mt-2 bg-brand-accent hover:bg-sky-300 disabled:opacity-70 text-brand-dark py-3 rounded-xl font-bold tracking-wide transition-colors text-sm cursor-pointer">
              {loading ? 'Signing in…' : 'Access Platform'}
            </button>
          </form>
          <p className="text-xs text-brand-muted text-center mt-4">Demo platform · Any credentials work · No real money involved</p>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Simulator', path: '/', icon: Activity },
  { name: 'Learn & Quiz', path: '/learn', icon: BookOpen },
  { name: 'Trade Journal', path: '/journal', icon: Notebook },
];

export default function AppRoutes() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="flex h-screen w-screen overflow-hidden bg-brand-dark text-brand-text">
            {/* Sidebar */}
            <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-brand-surface border-r border-brand-border flex flex-col justify-between shrink-0 transition-all duration-200`}>
              <div>
                {/* Logo */}
                <div className={`flex items-center gap-2.5 p-4 border-b border-brand-border ${collapsed ? 'justify-center' : ''}`}>
                  <div className="w-8 h-8 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-brand-accent" />
                  </div>
                  {!collapsed && <span className="text-base font-black text-white tracking-tight">TradeMentor<span className="text-brand-accent">AI</span></span>}
                </div>

                {/* Nav */}
                <nav className="p-3 space-y-1 mt-2">
                  {navItems.map(({ name, path, icon: Icon }) => {
                    const active = location.pathname === path;
                    return (
                      <Link key={name} to={path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20' : 'text-brand-muted hover:bg-brand-card hover:text-white border border-transparent'} ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? name : undefined}>
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{name}</span>}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-3 space-y-2 border-t border-brand-border">
                {/* User info */}
                {!collapsed && (
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-accent/20 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-brand-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                      <p className="text-[10px] text-brand-muted truncate">{user?.email}</p>
                    </div>
                  </div>
                )}
                {/* Collapse toggle */}
                <button onClick={() => setCollapsed(c => !c)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-brand-muted hover:text-white hover:bg-brand-card transition-colors w-full ${collapsed ? 'justify-center' : ''}`}>
                  {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
                </button>
                <button onClick={logout}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-brand-bear hover:bg-brand-bear/10 transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? 'Sign Out' : undefined}>
                  <LogOut className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Sign Out</span>}
                </button>
              </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto">
              <div className="p-6 max-w-7xl mx-auto">
                <Routes>
                  <Route path="/" element={<SimulatorDashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/learn" element={<LearningModule />} />
                  <Route path="/journal" element={<TradingJournal />} />
                </Routes>
              </div>
              <AiAssistantDrawer />
            </main>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}