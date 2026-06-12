import React from 'react';
import { TrendingUp, TrendingDown, BookOpen, Notebook, Activity, Award, Target, DollarSign } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const positions = JSON.parse(localStorage.getItem('tm_positions') || '[]');
  const trades = JSON.parse(localStorage.getItem('tm_trade_history') || '[]');
  const journal = JSON.parse(localStorage.getItem('tm_journal') || '[]');
  const progress = JSON.parse(localStorage.getItem('tm_progress') || '{}');
  const prices = JSON.parse(localStorage.getItem('tm_prices') || '{}');

  const coursesCompleted = Object.values(progress).filter(p => p.passed).length;
  const totalCourses = 5;

  const wins = journal.filter(j => j.outcome === 'WIN').length;
  const losses = journal.filter(j => j.outcome === 'LOSS').length;
  const winRate = journal.length > 0 ? Math.round((wins / journal.length) * 100) : 0;

  const portfolioValue = positions.reduce((sum, pos) => {
    const lp = prices[pos.symbol]?.price || pos.avgEntry;
    return sum + pos.shares * lp;
  }, 0);

  const totalPnl = positions.reduce((sum, pos) => {
    const lp = prices[pos.symbol]?.price || pos.avgEntry;
    return sum + (lp - pos.avgEntry) * pos.shares;
  }, 0);

  const totalAssets = (user?.balance || 10000) + portfolioValue;

  // Equity curve from trade history
  let equity = 10000;
  const equityCurve = [{ v: equity }];
  [...trades].reverse().forEach(t => {
    equity += t.type === 'SELL' ? (t.pnl || 0) : 0;
    equityCurve.push({ v: parseFloat(equity.toFixed(2)) });
  });

  const pieData = [
    { name: 'Cash', value: user?.balance || 10000, color: '#10b981' },
    { name: 'Portfolio', value: portfolioValue, color: '#38bdf8' },
  ];

  const journalMistakes = {};
  journal.forEach(j => { if (j.mistake !== 'NONE') journalMistakes[j.mistake] = (journalMistakes[j.mistake] || 0) + 1; });

  const MISTAKE_LABELS = { FOMO: 'FOMO Entry', STOP_CHASE: 'Moved Stop', OVER_LEVER: 'Over-Leverage', EARLY_EXIT: 'Early Exit', NO_PLAN: 'No Plan', REVENGE: 'Revenge Trade', NEWS_TRADE: 'Impulsive News' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0] || 'Trader'}</h1>
        <p className="text-brand-muted text-sm mt-1">Here's your learning and trading summary.</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Total Assets', value: `$${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'text-white', bg: 'bg-brand-accent/10 text-brand-accent' },
          { icon: totalPnl >= 0 ? TrendingUp : TrendingDown, label: 'Unrealized P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? 'text-brand-bull' : 'text-brand-bear', bg: totalPnl >= 0 ? 'bg-brand-bull/10 text-brand-bull' : 'bg-brand-bear/10 text-brand-bear' },
          { icon: BookOpen, label: 'Courses Passed', value: `${coursesCompleted} / ${totalCourses}`, color: 'text-white', bg: 'bg-brand-accent2/10 text-brand-accent2' },
          { icon: Target, label: 'Journal Win Rate', value: `${winRate}%`, color: winRate >= 50 ? 'text-brand-bull' : 'text-brand-bear', bg: winRate >= 50 ? 'bg-brand-bull/10 text-brand-bull' : 'bg-brand-bear/10 text-brand-bear' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold">{label}</p>
              <p className={`text-xl font-bold font-mono mt-0.5 ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity curve */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-brand-accent" /> Equity Curve</h3>
          {equityCurve.length < 2 ? (
            <div className="h-48 flex items-center justify-center text-brand-muted text-sm">
              Make trades in the Simulator to see your equity curve.
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve}>
                  <defs>
                    <linearGradient id="equity-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ backgroundColor: '#112240', borderColor: '#1e3a5f', borderRadius: '12px' }} itemStyle={{ color: '#38bdf8' }} labelFormatter={() => ''} formatter={(v) => [`$${v.toFixed(2)}`, 'Equity']} />
                  <Area type="monotone" dataKey="v" stroke="#38bdf8" strokeWidth={2} fill="url(#equity-grad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Portfolio allocation */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-brand-accent" /> Allocation</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2">
              {pieData.map(d => (
                <div key={d.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-brand-muted">{d.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">${d.value.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning progress */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-brand-accent" /> Learning Progress</h3>
          <div className="space-y-3">
            {[
              { id: 'intro', label: '📈 Introduction to Trading' },
              { id: 'candlesticks', label: '🕯️ Candlestick Patterns' },
              { id: 'technical', label: '📊 Technical Indicators' },
              { id: 'risk', label: '🛡️ Risk Management' },
              { id: 'psychology', label: '🧠 Trading Psychology' },
            ].map(({ id, label }) => {
              const p = progress[id];
              return (
                <div key={id} className="flex items-center justify-between">
                  <span className="text-sm text-brand-text">{label}</span>
                  {p?.passed ? (
                    <span className="text-xs text-brand-bull flex items-center gap-1 font-semibold"><Award className="w-3 h-3" /> Passed {p.score}/{p.total}</span>
                  ) : p ? (
                    <span className="text-xs text-brand-gold">{p.score}/{p.total} — Retry</span>
                  ) : (
                    <span className="text-xs text-brand-muted">Not started</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mistake analysis */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Notebook className="w-4 h-4 text-brand-accent" /> Common Mistakes</h3>
          {Object.keys(journalMistakes).length === 0 ? (
            <div className="flex items-center justify-center h-32 text-brand-muted text-sm">Log trades with mistake tags to see patterns.</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(journalMistakes).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([key, count]) => {
                const max = Math.max(...Object.values(journalMistakes));
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-brand-text">{MISTAKE_LABELS[key] || key}</span>
                      <span className="text-brand-muted font-mono">{count}×</span>
                    </div>
                    <div className="w-full bg-brand-surface rounded-full h-1.5 border border-brand-border">
                      <div className="h-1.5 rounded-full bg-brand-bear" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}