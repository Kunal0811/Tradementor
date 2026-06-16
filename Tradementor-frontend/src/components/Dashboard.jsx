import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BookOpen, Notebook, Activity, DollarSign, Loader, Sparkles, Trophy, CheckCircle, XCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, PieChart, Pie, Cell, BarChart, Bar, XAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, aiAPI, tradeAPI } from '../services/api';

const MISTAKE_LABELS = { FOMO:'FOMO Entry', STOP_CHASE:'Moved Stop', OVER_LEVER:'Over-Leverage', EARLY_EXIT:'Early Exit', NO_PLAN:'No Plan', REVENGE:'Revenge Trade', NEWS_TRADE:'Impulsive News' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData]           = useState(null);
  const [leaderboard, setLb]      = useState([]);
  const [loading, setLoading]     = useState(true);
  const [reco, setReco]           = useState('');
  const [recoLoading, setRecoLoading] = useState(false);
  const [apiError, setApiError]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [dRes, lbRes] = await Promise.all([dashboardAPI.summary(), dashboardAPI.leaderboard()]);
        setData(dRes.data); setLb(lbRes.data); setApiError(false);
      } catch { setApiError(true); }
      finally { setLoading(false); }
    })();
  }, []);

  const fetchReco = async () => {
    setRecoLoading(true);
    try { const res = await aiAPI.recommendations(); setReco(res.data.reply); }
    catch { setReco('AI recommendations unavailable — check backend and GEMINI_API_KEY.'); }
    finally { setRecoLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-brand-muted">
      <Loader className="w-6 h-6 animate-spin mr-2"/> Loading dashboard…
    </div>
  );

  if (apiError || !data) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]||'Trader'}</h1>
        <p className="text-brand-muted text-sm mt-1">Start the FastAPI backend to see your live dashboard.</p>
      </div>
      <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-2xl p-6 text-sm space-y-2">
        <p className="font-bold text-brand-gold">Backend required for Dashboard</p>
        <p className="text-brand-muted">1. <code className="text-brand-accent">cd Tradementor-backend</code></p>
        <p className="text-brand-muted">2. <code className="text-brand-accent">python seed.py</code></p>
        <p className="text-brand-muted">3. <code className="text-brand-accent">uvicorn app.main:app --reload</code></p>
        <p className="text-brand-muted">4. Add <code className="text-brand-accent">GEMINI_API_KEY</code> to <code className="text-brand-accent">.env</code></p>
      </div>
    </div>
  );

  const equityCurve = (data.equity_curve||[10000]).map((v,i) => ({i, v}));
  const pieData = [
    { name:'Cash',      value: data.cash_balance,    color:'#10b981' },
    { name:'Portfolio', value: data.portfolio_value, color:'#38bdf8' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]||'Trader'}</h1>
          <p className="text-brand-muted text-sm mt-1">Your complete learning and trading overview.</p>
        </div>
        <div className="flex items-center gap-2">
          {data.leaderboard_rank && (
            <div className="flex items-center gap-1.5 bg-brand-gold/10 border border-brand-gold/30 text-brand-gold px-3 py-1.5 rounded-xl text-xs font-bold">
              <Trophy className="w-3.5 h-3.5"/> Rank #{data.leaderboard_rank}
            </div>
          )}
          <button onClick={fetchReco} disabled={recoLoading}
            className="flex items-center gap-2 bg-brand-accent2/10 hover:bg-brand-accent2/20 border border-brand-accent2/30 text-brand-accent2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
            {recoLoading ? <Loader className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
            AI Learning Path
          </button>
        </div>
      </div>

      {reco && (
        <div className="bg-brand-accent2/5 border border-brand-accent2/20 rounded-2xl p-5 text-sm text-brand-text leading-relaxed fade-in">
          <p className="text-brand-accent2 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3"/> AI Personalized Learning Path</p>
          <p className="whitespace-pre-wrap">{reco}</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon:DollarSign, label:'Total Assets', value:`$${data.total_assets.toLocaleString(undefined,{minimumFractionDigits:2})}`, color:'text-white', bg:'bg-brand-accent/10 text-brand-accent' },
          { icon:data.realized_pnl>=0?TrendingUp:TrendingDown, label:'Realized P&L', value:`${data.realized_pnl>=0?'+':''}$${data.realized_pnl.toFixed(2)}`, color:data.realized_pnl>=0?'text-brand-bull':'text-brand-bear', bg:data.realized_pnl>=0?'bg-brand-bull/10 text-brand-bull':'bg-brand-bear/10 text-brand-bear' },
          { icon:BookOpen, label:'Total Trades', value:data.total_trades, sub:`${data.open_positions} positions open`, color:'text-white', bg:'bg-brand-accent2/10 text-brand-accent2' },
          { icon:Notebook, label:'Journal Win Rate', value:`${data.win_rate}%`, sub:`${data.journal_entries} entries`, color:data.win_rate>=50?'text-brand-bull':'text-brand-bear', bg:data.win_rate>=50?'bg-brand-bull/10 text-brand-bull':'bg-brand-bear/10 text-brand-bear' },
        ].map(({icon:Icon,label,value,sub,color,bg}) => (
          <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}><Icon className="w-5 h-5"/></div>
            <div>
              <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold">{label}</p>
              <p className={`text-xl font-bold font-mono mt-0.5 ${color}`}>{value}</p>
              {sub && <p className="text-xs text-brand-muted mt-0.5">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity curve */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-brand-accent"/> Equity Curve</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{backgroundColor:'#112240',borderColor:'#1e3a5f',borderRadius:'12px'}} itemStyle={{color:'#38bdf8'}} labelFormatter={()=>''} formatter={v=>[`$${v.toFixed(2)}`,'Equity']}/>
                <Area type="monotone" dataKey="v" stroke="#38bdf8" strokeWidth={2} fill="url(#eq-grad)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-brand-border text-center">
            {[
              {label:'Cash Balance', value:`$${data.cash_balance.toLocaleString(undefined,{minimumFractionDigits:0})}`},
              {label:'Portfolio Value', value:`$${data.portfolio_value.toLocaleString(undefined,{minimumFractionDigits:0})}`},
              {label:'Avg Quiz Score', value:`${data.avg_quiz_score}%`},
            ].map(({label,value}) => (
              <div key={label}>
                <p className="text-xs text-brand-muted uppercase tracking-wider">{label}</p>
                <p className="text-base font-bold font-mono text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-brand-accent"/> Allocation</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                    {pieData.map((e,i) => <Cell key={i} fill={e.color} stroke="transparent"/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2">
              {pieData.map(d => (
                <div key={d.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{background:d.color}}/><span className="text-brand-muted">{d.name}</span></div>
                  <span className="font-mono font-bold text-white">${d.value.toLocaleString(undefined,{minimumFractionDigits:0})}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Course progress + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course progress */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-brand-accent"/> Course Progress</h3>
          <div className="space-y-3">
            {(data.courses_progress||[]).map(cp => (
              <div key={cp.course_id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {cp.passed ? <CheckCircle className="w-4 h-4 text-brand-bull shrink-0"/> : <div className="w-4 h-4 rounded-full border border-brand-border shrink-0"/>}
                  <span className="text-sm text-brand-text truncate">{cp.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cp.reading_done && <span className="text-[10px] text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-1.5 py-0.5 rounded font-semibold">Read</span>}
                  {cp.best_score!=null
                    ? <span className={`text-xs font-mono font-bold ${cp.passed?'text-brand-bull':'text-brand-gold'}`}>{cp.best_score}/{cp.best_total}</span>
                    : <span className="text-xs text-brand-muted">Not started</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-brand-gold"/> Simulator Leaderboard</h3>
          {leaderboard.length===0 ? (
            <div className="flex items-center justify-center h-32 text-brand-muted text-sm">
              Complete trades to appear on the leaderboard.
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0,8).map((lb,i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${lb.user_name===user?.name?'bg-brand-accent/10 border border-brand-accent/20':i<3?'bg-brand-surface':'hover:bg-brand-surface transition-colors'}`}>
                  <span className={`text-sm font-black font-mono w-6 shrink-0 ${i===0?'text-brand-gold':i===1?'text-brand-muted':i===2?'text-amber-600':'text-brand-muted'}`}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                  </span>
                  <span className="text-sm text-white font-medium flex-1 truncate">{lb.user_name}</span>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-mono font-bold ${lb.total_roi>=0?'text-brand-bull':'text-brand-bear'}`}>{lb.total_roi>=0?'+':''}{lb.total_roi.toFixed(1)}% ROI</p>
                    <p className="text-[10px] text-brand-muted">{lb.win_rate.toFixed(0)}% win · {lb.total_trades}t</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mistake frequency */}
      {Object.keys(data.mistake_frequency||{}).length>0 && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Notebook className="w-4 h-4 text-brand-accent"/> Trading Mistake Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.mistake_frequency).sort((a,b)=>b[1]-a[1]).map(([key,count]) => {
              const max = Math.max(...Object.values(data.mistake_frequency));
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-text">{MISTAKE_LABELS[key]||key}</span>
                    <span className="text-brand-muted font-mono">{count}×</span>
                  </div>
                  <div className="w-full bg-brand-surface rounded-full h-1.5 border border-brand-border">
                    <div className="h-1.5 rounded-full bg-brand-bear transition-all" style={{width:`${(count/max)*100}%`}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}