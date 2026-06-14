import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart2, RefreshCw, Loader } from 'lucide-react';
import { tradeAPI } from '../services/api';

const CATALOG = {
  AAPL: { name: 'Apple Inc.',     base: 187.50, sector: 'Technology',    color: '#38bdf8' },
  TSLA: { name: 'Tesla Motors',   base: 248.20, sector: 'Automotive',    color: '#10b981' },
  NVDA: { name: 'NVIDIA Corp.',   base: 875.00, sector: 'Semiconductors',color: '#818cf8' },
  BTC:  { name: 'Bitcoin',        base: 67400,  sector: 'Crypto',        color: '#f59e0b' },
  AMZN: { name: 'Amazon.com',     base: 196.80, sector: 'E-Commerce',    color: '#f43f5e' },
  MSFT: { name: 'Microsoft Corp.',base: 415.30, sector: 'Technology',    color: '#06b6d4' },
};

const genChart = (base, n = 50) => {
  let p = base * (0.93 + Math.random() * 0.08);
  return Array.from({ length: n }, (_, i) => {
    p = Math.max(1, p + (Math.random() - 0.47) * p * 0.022);
    return { i, price: parseFloat(p.toFixed(2)) };
  });
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'text-white', bg = 'bg-brand-accent/10 text-brand-accent' }) => (
  <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}><Icon className="w-5 h-5" /></div>
    <div>
      <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold">{label}</p>
      <p className={`text-xl font-bold font-mono mt-0.5 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-brand-muted mt-0.5">{sub}</p>}
    </div>
  </div>
);

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return <div className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 shadow-xl"><p className="text-brand-accent font-mono font-bold text-sm">${payload[0].value.toFixed(2)}</p></div>;
};

export default function SimulatorDashboard() {
  const [selected, setSelected]   = useState('AAPL');
  const [prices, setPrices]       = useState(() => Object.fromEntries(Object.entries(CATALOG).map(([k,v]) => [k, { ...v, price: v.base, changePct: 0 }])));
  const [chartData, setChartData] = useState({});
  const [portfolio, setPortfolio] = useState({ balance: 10000, profit_loss: 0, positions: [] });
  const [history, setHistory]     = useState([]);
  const [qty, setQty]             = useState(1);
  const [side, setSide]           = useState('BUY');
  const [toast, setToast]         = useState(null);
  const [busy, setBusy]           = useState(false);
  const [tab, setTab]             = useState('positions');
  const [apiError, setApiError]   = useState(false);

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  // Load portfolio + history from backend
  const loadData = useCallback(async () => {
    try {
      const [portRes, histRes] = await Promise.all([tradeAPI.getPortfolio(), tradeAPI.getAll()]);
      setPortfolio(portRes.data);
      setHistory(histRes.data);
      setApiError(false);
    } catch {
      setApiError(true);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Init charts
    const charts = {};
    Object.entries(CATALOG).forEach(([sym, d]) => { charts[sym] = genChart(d.base); });
    setChartData(charts);
  }, [loadData]);

  // Price tick every 3s
  useEffect(() => {
    const id = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        Object.keys(CATALOG).forEach(sym => {
          const old = next[sym].price;
          const newP = parseFloat(Math.max(0.01, old + (Math.random() - 0.49) * old * 0.007).toFixed(2));
          next[sym] = { ...next[sym], price: newP, changePct: parseFloat(((newP - CATALOG[sym].base) / CATALOG[sym].base * 100).toFixed(2)) };
        });
        return next;
      });
      setChartData(prev => {
        const arr = [...(prev[selected] || [])];
        const last = arr[arr.length - 1]?.price || CATALOG[selected].base;
        arr.push({ i: arr.length, price: parseFloat(Math.max(0.01, last + (Math.random() - 0.49) * last * 0.007).toFixed(2)) });
        if (arr.length > 80) arr.shift();
        return { ...prev, [selected]: arr };
      });
    }, 3000);
    return () => clearInterval(id);
  }, [selected]);

  const livePrice = prices[selected]?.price || CATALOG[selected].base;
  const orderTotal = parseFloat((livePrice * qty).toFixed(2));
  const changePct = prices[selected]?.changePct || 0;
  const isUp = changePct >= 0;

  const heldPos = portfolio.positions?.find(p => p.symbol === selected);
  const livePortfolioValue = (portfolio.positions || []).reduce((s, pos) => {
    return s + pos.shares * (prices[pos.symbol]?.price || pos.avg_entry);
  }, 0);
  const livePnl = (portfolio.positions || []).reduce((s, pos) => {
    return s + (prices[pos.symbol]?.price || pos.avg_entry - pos.avg_entry) * pos.shares;
  }, 0);

  const executeOrder = async (e) => {
    e.preventDefault();
    if (qty <= 0 || busy) return;
    setBusy(true);
    try {
      await tradeAPI.execute(selected, side, livePrice, qty);
      await loadData();
      showToast(`${side} ${qty} ${selected} @ $${livePrice.toFixed(2)} executed.`, 'ok');
      setQty(1);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Order failed.', 'err');
    } finally {
      setBusy(false);
    }
  };

  const resetPortfolio = async () => {
    if (!confirm('Reset portfolio to $10,000? Cannot be undone.')) return;
    try { await tradeAPI.reset(); await loadData(); showToast('Portfolio reset.', 'ok'); }
    catch { showToast('Reset failed.', 'err'); }
  };

  const data = chartData[selected] || [];
  const chartMin = data.length ? Math.min(...data.map(d => d.price)) * 0.999 : 0;
  const chartMax = data.length ? Math.max(...data.map(d => d.price)) * 1.001 : 1;
  const chartColor = CATALOG[selected].color;

  return (
    <div className="space-y-6">
      {apiError && (
        <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-xl px-4 py-3 text-sm text-brand-gold">
          ⚠️ Backend offline — start FastAPI server at <code>localhost:8000</code>. Prices still simulate live.
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Cash Balance"    value={`$${(portfolio.balance||0).toLocaleString(undefined,{minimumFractionDigits:2})}`} bg="bg-brand-bull/10 text-brand-bull" color="text-brand-bull" />
        <StatCard icon={BarChart2}  label="Portfolio Value" value={`$${livePortfolioValue.toLocaleString(undefined,{minimumFractionDigits:2})}`} />
        <StatCard icon={livePnl>=0?TrendingUp:TrendingDown} label="Unrealized P&L" value={`${livePnl>=0?'+':''}$${livePnl.toFixed(2)}`} color={livePnl>=0?'text-brand-bull':'text-brand-bear'} bg={livePnl>=0?'bg-brand-bull/10 text-brand-bull':'bg-brand-bear/10 text-brand-bear'} />
        <StatCard icon={Activity}   label="Realized P&L"   value={`${(portfolio.profit_loss||0)>=0?'+':''}$${(portfolio.profit_loss||0).toFixed(2)}`} color={(portfolio.profit_loss||0)>=0?'text-brand-bull':'text-brand-bear'} sub={`${(portfolio.positions||[]).length} open positions`} />
      </div>

      {toast && (
        <div className={`fade-in border rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${toast.type==='err'?'bg-brand-bear/10 border-brand-bear/30 text-brand-bear':'bg-brand-bull/10 border-brand-bull/30 text-brand-bull'}`}>
          <Activity className="w-4 h-4 shrink-0" />{toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 bg-brand-card border border-brand-border rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(prices).map(([sym, d]) => (
              <button key={sym} onClick={() => setSelected(sym)}
                className={`px-3 py-2 rounded-xl border text-left transition-all ${selected===sym?'border-brand-accent bg-brand-accent/10':'border-brand-border bg-brand-surface hover:border-brand-muted'}`}>
                <span className={`font-bold text-xs block ${selected===sym?'text-brand-accent':'text-white'}`}>{sym}</span>
                <span className={`font-mono text-[10px] ${d.changePct>=0?'text-brand-bull':'text-brand-bear'}`}>{d.changePct>=0?'+':''}{d.changePct.toFixed(2)}%</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-brand-muted font-semibold tracking-widest uppercase">{CATALOG[selected].sector}</p>
              <h2 className="text-lg font-bold text-white mt-0.5">{CATALOG[selected].name}</h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-white">${livePrice.toFixed(2)}</p>
              <p className={`text-sm font-semibold flex items-center justify-end gap-1 ${isUp?'text-brand-bull':'text-brand-bear'}`}>
                {isUp ? <TrendingUp className="w-3.5 h-3.5"/> : <TrendingDown className="w-3.5 h-3.5"/>}{isUp?'+':''}{changePct.toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{top:5,right:5,bottom:0,left:0}}>
                <defs>
                  <linearGradient id={`g-${selected}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="i" hide />
                <YAxis domain={[chartMin, chartMax]} hide />
                <Tooltip content={<Tip />} />
                <Area type="monotoneX" dataKey="price" stroke={chartColor} strokeWidth={2} fill={`url(#g-${selected})`} dot={false} animationDuration={300} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-brand-muted text-center">Simulated prices refresh every 3s · Educational purposes only</p>
        </div>

        {/* Order panel */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex flex-col gap-5">
          <h3 className="text-sm font-bold text-white tracking-wider">Place Order</h3>
          <div className="flex bg-brand-surface rounded-xl p-1 border border-brand-border">
            {['BUY','SELL'].map(s => (
              <button key={s} type="button" onClick={() => setSide(s)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${side===s?(s==='BUY'?'bg-brand-bull text-brand-dark':'bg-brand-bear text-white'):'text-brand-muted hover:text-white'}`}>{s}</button>
            ))}
          </div>
          <div>
            <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Shares</label>
            <div className="flex gap-2 items-center">
              <button type="button" onClick={() => setQty(q => Math.max(1,q-1))} className="w-9 h-9 rounded-lg bg-brand-surface border border-brand-border text-white font-bold hover:bg-brand-border transition-colors">−</button>
              <input type="number" min="1" value={qty} onChange={e => setQty(Math.max(1,parseInt(e.target.value)||1))}
                className="flex-1 bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-brand-accent text-sm" />
              <button type="button" onClick={() => setQty(q => q+1)} className="w-9 h-9 rounded-lg bg-brand-surface border border-brand-border text-white font-bold hover:bg-brand-border transition-colors">+</button>
            </div>
            <div className="flex gap-2 mt-2">
              {[1,5,10,25].map(n => (
                <button key={n} type="button" onClick={() => setQty(n)} className={`flex-1 text-xs py-1 rounded-lg border transition-colors ${qty===n?'border-brand-accent text-brand-accent':'border-brand-border text-brand-muted hover:text-white'}`}>{n}</button>
              ))}
            </div>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-brand-muted"><span>Price/share</span><span className="text-white">${livePrice.toFixed(2)}</span></div>
            <div className="flex justify-between text-brand-muted"><span>Quantity</span><span className="text-white">{qty}</span></div>
            <div className="border-t border-brand-border pt-2 flex justify-between font-bold text-sm">
              <span className="text-brand-muted font-sans">Order Total</span>
              <span className={side==='BUY'?'text-brand-bull':'text-brand-bear'}>${orderTotal.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
            </div>
          </div>
          <form onSubmit={executeOrder}>
            <button type="submit" disabled={busy||apiError}
              className={`w-full py-3 rounded-xl font-bold text-sm tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${side==='BUY'?'bg-brand-bull hover:bg-emerald-400 text-brand-dark':'bg-brand-bear hover:bg-rose-400 text-white'}`}>
              {busy ? <Loader className="w-4 h-4 animate-spin" /> : null}
              Execute {side}
            </button>
          </form>
          {heldPos && (
            <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-3 text-xs space-y-1">
              <p className="text-brand-accent font-semibold">Holding {selected}</p>
              <div className="flex justify-between text-brand-muted font-mono"><span>{heldPos.shares} shares @ ${heldPos.avg_entry.toFixed(2)}</span></div>
              {(() => { const pnl = (livePrice - heldPos.avg_entry) * heldPos.shares; return (
                <div className={`flex justify-between font-bold ${pnl>=0?'text-brand-bull':'text-brand-bear'}`}><span>Unrealized P&L</span><span>{pnl>=0?'+':''}${pnl.toFixed(2)}</span></div>
              ); })()}
            </div>
          )}
        </div>
      </div>

      {/* Positions / History */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-1 bg-brand-surface rounded-xl p-1 border border-brand-border">
            {[['positions','Open Positions'],['history','Trade History']].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${tab===k?'bg-brand-card text-white shadow':'text-brand-muted hover:text-white'}`}>{l}</button>
            ))}
          </div>
          <button onClick={resetPortfolio} disabled={apiError} className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-bear transition-colors disabled:opacity-40">
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>

        {tab === 'positions' && (
          !portfolio.positions?.length ? (
            <div className="text-center py-12 text-brand-muted"><p className="text-sm">No open positions. Execute a BUY order to get started.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead><tr className="border-b border-brand-border text-brand-muted text-xs uppercase tracking-wider">
                  {['Asset','Shares','Avg Entry','Current','Market Value','P&L','Return'].map(h => <th key={h} className="py-3 px-3 font-semibold">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-brand-border">
                  {portfolio.positions.map(pos => {
                    const lp = prices[pos.symbol]?.price || pos.avg_entry;
                    const mv = lp * pos.shares;
                    const pnl = (lp - pos.avg_entry) * pos.shares;
                    const ret = ((lp - pos.avg_entry) / pos.avg_entry) * 100;
                    return (
                      <tr key={pos.symbol} className="hover:bg-brand-surface/50 transition-colors">
                        <td className="py-3.5 px-3"><span className="font-bold text-brand-accent font-mono">{pos.symbol}</span><span className="text-brand-muted text-xs block">{CATALOG[pos.symbol]?.name}</span></td>
                        <td className="py-3.5 px-3 font-mono text-white">{pos.shares}</td>
                        <td className="py-3.5 px-3 font-mono text-brand-muted">${pos.avg_entry.toFixed(2)}</td>
                        <td className="py-3.5 px-3 font-mono text-white">${lp.toFixed(2)}</td>
                        <td className="py-3.5 px-3 font-mono text-white">${mv.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                        <td className={`py-3.5 px-3 font-mono font-bold ${pnl>=0?'text-brand-bull':'text-brand-bear'}`}>{pnl>=0?'+':''}${pnl.toFixed(2)}</td>
                        <td className={`py-3.5 px-3 font-mono font-bold text-xs ${ret>=0?'text-brand-bull':'text-brand-bear'}`}>{ret>=0?'+':''}{ret.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'history' && (
          !history.length ? (
            <div className="text-center py-12 text-brand-muted"><p className="text-sm">No trades yet.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead><tr className="border-b border-brand-border text-brand-muted text-xs uppercase tracking-wider">
                  {['Type','Asset','Shares','Price','Total','Status','Date'].map(h => <th key={h} className="py-3 px-3 font-semibold">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-brand-border">
                  {history.map(t => (
                    <tr key={t.trade_id} className="hover:bg-brand-surface/50 transition-colors">
                      <td className="py-3 px-3"><span className={`text-xs font-bold px-2 py-1 rounded-lg ${t.action_type==='BUY'?'bg-brand-bull/10 text-brand-bull':'bg-brand-bear/10 text-brand-bear'}`}>{t.action_type}</span></td>
                      <td className="py-3 px-3 font-mono font-bold text-brand-accent">{t.stock_symbol}</td>
                      <td className="py-3 px-3 font-mono text-white">{t.quantity}</td>
                      <td className="py-3 px-3 font-mono text-brand-muted">${t.execution_price.toFixed(2)}</td>
                      <td className="py-3 px-3 font-mono text-white">${(t.execution_price*t.quantity).toFixed(2)}</td>
                      <td className="py-3 px-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.status==='OPEN'?'bg-brand-bull/10 text-brand-bull':'bg-brand-muted/10 text-brand-muted'}`}>{t.status}</span></td>
                      <td className="py-3 px-3 text-brand-muted text-xs">{new Date(t.trade_date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}