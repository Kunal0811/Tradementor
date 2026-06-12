import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingBag, Activity, DollarSign, BarChart2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STOCK_CATALOG = {
  AAPL: { name: 'Apple Inc.', basePrice: 187.50, sector: 'Technology', color: '#38bdf8' },
  TSLA: { name: 'Tesla Motors', basePrice: 248.20, sector: 'Automotive', color: '#10b981' },
  NVDA: { name: 'NVIDIA Corp.', basePrice: 875.00, sector: 'Semiconductors', color: '#818cf8' },
  BTC:  { name: 'Bitcoin', basePrice: 67400.00, sector: 'Crypto', color: '#f59e0b' },
  AMZN: { name: 'Amazon.com', basePrice: 196.80, sector: 'E-Commerce', color: '#f43f5e' },
  MSFT: { name: 'Microsoft Corp.', basePrice: 415.30, sector: 'Technology', color: '#06b6d4' },
};

const genChartData = (basePrice, count = 50) => {
  let price = basePrice * (0.92 + Math.random() * 0.1);
  return Array.from({ length: count }, (_, i) => {
    const change = (Math.random() - 0.47) * (price * 0.025);
    price = Math.max(1, price + change);
    return { i, price: parseFloat(price.toFixed(2)) };
  });
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'text-white', iconBg = 'bg-brand-accent/10 text-brand-accent' }) => (
  <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold">{label}</p>
      <p className={`text-xl font-bold font-mono mt-0.5 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-brand-muted mt-0.5">{sub}</p>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 shadow-xl">
      <p className="text-brand-accent font-mono font-bold text-sm">${payload[0].value.toFixed(2)}</p>
    </div>
  );
};

export default function SimulatorDashboard() {
  const { user, updateBalance } = useAuth();

  const [selected, setSelected] = useState('AAPL');
  const [prices, setPrices] = useState(() => {
    const stored = localStorage.getItem('tm_prices');
    return stored ? JSON.parse(stored) : Object.fromEntries(
      Object.entries(STOCK_CATALOG).map(([k, v]) => [k, { ...v, price: v.basePrice, change: 0, changePct: 0 }])
    );
  });
  const [chartData, setChartData] = useState({});
  const [positions, setPositions] = useState(() => {
    const stored = localStorage.getItem('tm_positions');
    return stored ? JSON.parse(stored) : [];
  });
  const [tradeHistory, setTradeHistory] = useState(() => {
    const stored = localStorage.getItem('tm_trade_history');
    return stored ? JSON.parse(stored) : [];
  });
  const [qty, setQty] = useState(1);
  const [tradeType, setTradeType] = useState('BUY');
  const [orderFeedback, setOrderFeedback] = useState(null);
  const [tab, setTab] = useState('positions'); // 'positions' | 'history'

  // Init chart data
  useEffect(() => {
    const initial = {};
    Object.entries(STOCK_CATALOG).forEach(([sym, data]) => {
      initial[sym] = genChartData(data.basePrice);
    });
    setChartData(initial);
  }, []);

  // Live price ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(sym => {
          const base = STOCK_CATALOG[sym].basePrice;
          const oldPrice = next[sym].price;
          const delta = (Math.random() - 0.49) * (base * 0.008);
          const newPrice = parseFloat(Math.max(0.01, oldPrice + delta).toFixed(2));
          const change = parseFloat((newPrice - base).toFixed(2));
          const changePct = parseFloat(((change / base) * 100).toFixed(2));
          next[sym] = { ...next[sym], price: newPrice, change, changePct };
        });
        localStorage.setItem('tm_prices', JSON.stringify(next));
        return next;
      });

      // Append to selected stock chart
      setChartData(prev => {
        const sym = selected;
        const arr = [...(prev[sym] || [])];
        const lastPrice = arr[arr.length - 1]?.price || STOCK_CATALOG[sym].basePrice;
        const delta = (Math.random() - 0.49) * (lastPrice * 0.008);
        arr.push({ i: arr.length, price: parseFloat(Math.max(0.01, lastPrice + delta).toFixed(2)) });
        if (arr.length > 80) arr.shift();
        return { ...prev, [sym]: arr };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [selected]);

  const activePrice = prices[selected]?.price || STOCK_CATALOG[selected].basePrice;
  const orderTotal = parseFloat((activePrice * qty).toFixed(2));

  const portfolioValue = positions.reduce((sum, pos) => {
    const livePrice = prices[pos.symbol]?.price || pos.avgEntry;
    return sum + pos.shares * livePrice;
  }, 0);

  const totalPnl = positions.reduce((sum, pos) => {
    const livePrice = prices[pos.symbol]?.price || pos.avgEntry;
    return sum + (livePrice - pos.avgEntry) * pos.shares;
  }, 0);

  const totalDeposited = 10000 - (user?.balance || 10000) + portfolioValue;

  const showFeedback = (msg, type = 'success') => {
    setOrderFeedback({ msg, type });
    setTimeout(() => setOrderFeedback(null), 3000);
  };

  const executeOrder = (e) => {
    e.preventDefault();
    if (qty <= 0) return;

    if (tradeType === 'BUY') {
      if (orderTotal > (user?.balance || 0)) {
        showFeedback('Insufficient funds for this order.', 'error');
        return;
      }
      const newBalance = parseFloat(((user?.balance || 0) - orderTotal).toFixed(2));
      updateBalance(newBalance);

      setPositions(prev => {
        const exists = prev.find(p => p.symbol === selected);
        let next;
        if (exists) {
          next = prev.map(p => {
            if (p.symbol !== selected) return p;
            const newShares = p.shares + qty;
            const newCost = p.avgEntry * p.shares + orderTotal;
            return { ...p, shares: newShares, avgEntry: parseFloat((newCost / newShares).toFixed(2)) };
          });
        } else {
          next = [...prev, { symbol: selected, shares: qty, avgEntry: activePrice }];
        }
        localStorage.setItem('tm_positions', JSON.stringify(next));
        return next;
      });

      const record = { id: Date.now(), type: 'BUY', symbol: selected, shares: qty, price: activePrice, total: orderTotal, date: new Date().toLocaleString() };
      setTradeHistory(prev => { const n = [record, ...prev].slice(0, 50); localStorage.setItem('tm_trade_history', JSON.stringify(n)); return n; });
      showFeedback(`Bought ${qty} share${qty > 1 ? 's' : ''} of ${selected} at $${activePrice.toFixed(2)}`);

    } else {
      const pos = positions.find(p => p.symbol === selected);
      if (!pos || pos.shares < qty) {
        showFeedback('Not enough shares to sell.', 'error');
        return;
      }
      const proceeds = parseFloat((activePrice * qty).toFixed(2));
      const pnl = parseFloat(((activePrice - pos.avgEntry) * qty).toFixed(2));
      updateBalance(parseFloat(((user?.balance || 0) + proceeds).toFixed(2)));

      setPositions(prev => {
        const next = prev.map(p => {
          if (p.symbol !== selected) return p;
          return { ...p, shares: p.shares - qty };
        }).filter(p => p.shares > 0);
        localStorage.setItem('tm_positions', JSON.stringify(next));
        return next;
      });

      const record = { id: Date.now(), type: 'SELL', symbol: selected, shares: qty, price: activePrice, total: proceeds, pnl, date: new Date().toLocaleString() };
      setTradeHistory(prev => { const n = [record, ...prev].slice(0, 50); localStorage.setItem('tm_trade_history', JSON.stringify(n)); return n; });
      showFeedback(`Sold ${qty} share${qty > 1 ? 's' : ''} of ${selected} · P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, pnl >= 0 ? 'success' : 'warn');
    }
    setQty(1);
  };

  const resetPortfolio = () => {
    if (!confirm('Reset your virtual portfolio to $10,000? This cannot be undone.')) return;
    setPositions([]); setTradeHistory([]);
    localStorage.removeItem('tm_positions'); localStorage.removeItem('tm_trade_history'); localStorage.removeItem('tm_prices');
    updateBalance(10000);
  };

  const chartColor = STOCK_CATALOG[selected].color;
  const selectedChange = prices[selected]?.changePct || 0;
  const isUp = selectedChange >= 0;

  const data = chartData[selected] || [];
  const chartMin = Math.min(...data.map(d => d.price)) * 0.999;
  const chartMax = Math.max(...data.map(d => d.price)) * 1.001;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Cash Balance" value={`$${(user?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} iconBg="bg-brand-bull/10 text-brand-bull" color="text-brand-bull" />
        <StatCard icon={BarChart2} label="Portfolio Value" value={`$${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} iconBg="bg-brand-accent/10 text-brand-accent" />
        <StatCard icon={TrendingUp} label="Total P&L" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`} color={totalPnl >= 0 ? 'text-brand-bull' : 'text-brand-bear'} iconBg={totalPnl >= 0 ? 'bg-brand-bull/10 text-brand-bull' : 'bg-brand-bear/10 text-brand-bear'} icon={totalPnl >= 0 ? TrendingUp : TrendingDown} />
        <StatCard icon={Activity} label="Open Positions" value={positions.length} sub={`${tradeHistory.length} trades executed`} iconBg="bg-brand-accent2/10 text-brand-accent2" />
      </div>

      {/* Feedback toast */}
      {orderFeedback && (
        <div className={`fade-in border rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${orderFeedback.type === 'error' ? 'bg-brand-bear/10 border-brand-bear/30 text-brand-bear' : orderFeedback.type === 'warn' ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold' : 'bg-brand-bull/10 border-brand-bull/30 text-brand-bull'}`}>
          <Activity className="w-4 h-4 shrink-0" />
          {orderFeedback.msg}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart panel */}
        <div className="xl:col-span-2 bg-brand-card border border-brand-border rounded-2xl p-6 flex flex-col gap-4">
          {/* Asset selector */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(prices).map(([sym, data]) => {
              const pct = data.changePct || 0;
              const up = pct >= 0;
              return (
                <button key={sym} onClick={() => setSelected(sym)}
                  className={`px-3 py-2 rounded-xl border text-left transition-all ${selected === sym ? 'border-brand-accent bg-brand-accent/10' : 'border-brand-border bg-brand-surface hover:border-brand-muted'}`}>
                  <span className={`font-bold text-xs block ${selected === sym ? 'text-brand-accent' : 'text-white'}`}>{sym}</span>
                  <span className={`font-mono text-[10px] ${up ? 'text-brand-bull' : 'text-brand-bear'}`}>{up ? '+' : ''}{pct.toFixed(2)}%</span>
                </button>
              );
            })}
          </div>

          {/* Selected stock header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-brand-muted font-semibold tracking-widest uppercase">{STOCK_CATALOG[selected].sector}</p>
              <h2 className="text-lg font-bold text-white mt-0.5">{STOCK_CATALOG[selected].name}</h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-white">${activePrice.toFixed(2)}</p>
              <p className={`text-sm font-semibold ${isUp ? 'text-brand-bull' : 'text-brand-bear'} flex items-center justify-end gap-1`}>
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isUp ? '+' : ''}{selectedChange.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`grad-${selected}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="i" hide />
                <YAxis domain={[chartMin, chartMax]} hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotoneX" dataKey="price" stroke={chartColor} strokeWidth={2} fillOpacity={1} fill={`url(#grad-${selected})`} dot={false} animationDuration={300} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-brand-muted text-center">Prices update every 3 seconds · Simulated data for educational purposes</p>
        </div>

        {/* Order panel */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex flex-col gap-5">
          <h3 className="text-sm font-bold text-white tracking-wider">Place Order</h3>

          {/* BUY / SELL toggle */}
          <div className="flex bg-brand-surface rounded-xl p-1 border border-brand-border">
            {['BUY', 'SELL'].map(type => (
              <button key={type} type="button" onClick={() => setTradeType(type)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tradeType === type ? (type === 'BUY' ? 'bg-brand-bull text-brand-dark shadow' : 'bg-brand-bear text-white shadow') : 'text-brand-muted hover:text-white'}`}>
                {type}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Shares</label>
            <div className="flex gap-2 items-center">
              <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg bg-brand-surface border border-brand-border text-white font-bold hover:bg-brand-border transition-colors">−</button>
              <input type="number" min="1" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-brand-accent text-sm" />
              <button type="button" onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-lg bg-brand-surface border border-brand-border text-white font-bold hover:bg-brand-border transition-colors">+</button>
            </div>
            <div className="flex gap-2 mt-2">
              {[1, 5, 10, 25].map(n => (
                <button key={n} type="button" onClick={() => setQty(n)} className={`flex-1 text-xs py-1 rounded-lg border transition-colors ${qty === n ? 'border-brand-accent text-brand-accent' : 'border-brand-border text-brand-muted hover:text-white hover:border-brand-muted'}`}>{n}</button>
              ))}
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-brand-muted"><span>Price per share</span><span className="text-white">${activePrice.toFixed(2)}</span></div>
            <div className="flex justify-between text-brand-muted"><span>Quantity</span><span className="text-white">{qty}</span></div>
            <div className="border-t border-brand-border pt-2 flex justify-between font-bold text-sm">
              <span className="text-brand-muted font-sans">Order Total</span>
              <span className={tradeType === 'BUY' ? 'text-brand-bull' : 'text-brand-bear'}>${orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {tradeType === 'BUY' && (
              <div className="flex justify-between text-[10px] text-brand-muted border-t border-brand-border pt-2">
                <span>After purchase</span>
                <span>${Math.max(0, (user?.balance || 0) - orderTotal).toFixed(2)} remaining</span>
              </div>
            )}
          </div>

          <form onSubmit={executeOrder}>
            <button type="submit"
              className={`w-full py-3 rounded-xl font-bold text-sm tracking-wider transition-all cursor-pointer ${tradeType === 'BUY' ? 'bg-brand-bull hover:bg-emerald-400 text-brand-dark' : 'bg-brand-bear hover:bg-rose-400 text-white'}`}>
              {tradeType === 'BUY' ? '🟢' : '🔴'} Execute {tradeType}
            </button>
          </form>

          {/* Held position indicator */}
          {positions.find(p => p.symbol === selected) && (
            <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-3 text-xs space-y-1">
              <p className="text-brand-accent font-semibold">You hold {selected}</p>
              {(() => {
                const pos = positions.find(p => p.symbol === selected);
                const lp = prices[selected]?.price || pos.avgEntry;
                const pnl = (lp - pos.avgEntry) * pos.shares;
                return (
                  <>
                    <div className="flex justify-between text-brand-muted font-mono"><span>{pos.shares} shares @ ${pos.avgEntry.toFixed(2)}</span></div>
                    <div className={`flex justify-between font-bold ${pnl >= 0 ? 'text-brand-bull' : 'text-brand-bear'}`}><span>Unrealized P&L</span><span>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</span></div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Positions / History */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-1 bg-brand-surface rounded-xl p-1 border border-brand-border">
            {[['positions', 'Open Positions'], ['history', 'Trade History']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${tab === key ? 'bg-brand-card text-white shadow' : 'text-brand-muted hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={resetPortfolio} className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-bear transition-colors">
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>

        {tab === 'positions' && (
          positions.length === 0 ? (
            <div className="text-center py-12 text-brand-muted">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No open positions. Execute a BUY order to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead><tr className="border-b border-brand-border text-brand-muted text-xs uppercase tracking-wider">
                  {['Asset', 'Shares', 'Avg Entry', 'Current', 'Market Value', 'P&L', 'Return'].map(h => (
                    <th key={h} className="py-3 px-3 font-semibold">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-brand-border">
                  {positions.map(pos => {
                    const lp = prices[pos.symbol]?.price || pos.avgEntry;
                    const mv = lp * pos.shares;
                    const pnl = (lp - pos.avgEntry) * pos.shares;
                    const ret = ((lp - pos.avgEntry) / pos.avgEntry) * 100;
                    const up = pnl >= 0;
                    return (
                      <tr key={pos.symbol} className="hover:bg-brand-surface/50 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-brand-accent font-mono">{pos.symbol}</span>
                          <span className="text-brand-muted text-xs block">{STOCK_CATALOG[pos.symbol]?.name}</span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-white">{pos.shares}</td>
                        <td className="py-3.5 px-3 font-mono text-brand-muted">${pos.avgEntry.toFixed(2)}</td>
                        <td className="py-3.5 px-3 font-mono text-white">${lp.toFixed(2)}</td>
                        <td className="py-3.5 px-3 font-mono text-white">${mv.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3.5 px-3 font-mono font-bold ${up ? 'text-brand-bull' : 'text-brand-bear'}`}>{up ? '+' : ''}${pnl.toFixed(2)}</td>
                        <td className={`py-3.5 px-3 font-mono font-bold text-xs ${up ? 'text-brand-bull' : 'text-brand-bear'}`}>{up ? '+' : ''}{ret.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'history' && (
          tradeHistory.length === 0 ? (
            <div className="text-center py-12 text-brand-muted">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No trades yet. Your trade history will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead><tr className="border-b border-brand-border text-brand-muted text-xs uppercase tracking-wider">
                  {['Type', 'Asset', 'Shares', 'Price', 'Total', 'P&L', 'Date'].map(h => (
                    <th key={h} className="py-3 px-3 font-semibold">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-brand-border">
                  {tradeHistory.map(t => (
                    <tr key={t.id} className="hover:bg-brand-surface/50 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${t.type === 'BUY' ? 'bg-brand-bull/10 text-brand-bull' : 'bg-brand-bear/10 text-brand-bear'}`}>{t.type}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-brand-accent">{t.symbol}</td>
                      <td className="py-3 px-3 font-mono text-white">{t.shares}</td>
                      <td className="py-3 px-3 font-mono text-brand-muted">${t.price.toFixed(2)}</td>
                      <td className="py-3 px-3 font-mono text-white">${t.total.toFixed(2)}</td>
                      <td className={`py-3 px-3 font-mono font-bold ${t.pnl == null ? 'text-brand-muted' : t.pnl >= 0 ? 'text-brand-bull' : 'text-brand-bear'}`}>
                        {t.pnl != null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-brand-muted text-xs">{t.date}</td>
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