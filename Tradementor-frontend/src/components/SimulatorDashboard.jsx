import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Search, TrendingUp, TrendingDown, ShieldAlert, ShoppingBag } from 'lucide-react';

// Generates simulated historical chart data for standard technical validation
const generateMockChartData = (symbol, basePrice) => {
  let currentPrice = basePrice;
  return Array.from({ length: 30 }, (_, i) => {
    const change = (Math.random() - 0.48) * (basePrice * 0.03);
    currentPrice = Math.max(1, currentPrice + change);
    return {
      time: `Day ${i + 1}`,
      price: parseFloat(currentPrice.toFixed(2))
    };
  });
};

const STOCK_CATALOG = {
  AAPL: { name: 'Apple Inc.', price: 175.50 },
  TSLA: { name: 'Tesla Motors', price: 182.20 },
  NVDA: { name: 'NVIDIA Corp.', price: 875.00 },
  BTC: { name: 'Bitcoin (Mock)', price: 64200.00 }
};

export default function SimulatorDashboard() {
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [stockPrices, setStockPrices] = useState(STOCK_CATALOG);
  const [chartData, setChartData] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [tradeType, setTradeType] = useState('BUY');
  
  // Virtual Portfolio Core State definitions
  const [balance, setBalance] = useState(10000.00);
  const [positions, setPositions] = useState([
    { symbol: 'AAPL', averageEntry: 170.20, shares: 10, totalCost: 1702.00 }
  ]);

  // Sync historical chart array updates whenever active stock asset flips
  useEffect(() => {
    setChartData(generateMockChartData(selectedStock, stockPrices[selectedStock].price));
  }, [selectedStock]);

  // Real-time market tick simulation loop updates price points every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStockPrices(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(sym => {
          const delta = (Math.random() - 0.5) * (updated[sym].price * 0.01);
          updated[sym].price = parseFloat(Math.max(1, updated[sym].price + delta).toFixed(2));
        });
        return updated;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const activePrice = stockPrices[selectedStock].price;
  const totalOrderValue = (activePrice * quantity).toFixed(2);

  const handleExecuteOrder = (e) => {
    e.preventDefault();
    if (quantity <= 0) return;

    if (tradeType === 'BUY') {
      if (parseFloat(totalOrderValue) > balance) {
        alert("Insufficient simulated funds for this request.");
        return;
      }
      setBalance(prev => prev - parseFloat(totalOrderValue));
      setPositions(prev => {
        const existing = prev.find(p => p.symbol === selectedStock);
        if (existing) {
          const nextShares = existing.shares + parseInt(quantity);
          const nextCost = existing.totalCost + parseFloat(totalOrderValue);
          return prev.map(p => p.symbol === selectedStock 
            ? { ...p, shares: nextShares, totalCost: nextCost, averageEntry: parseFloat((nextCost / nextShares).toFixed(2)) }
            : p
          );
        }
        return [...prev, { symbol: selectedStock, averageEntry: activePrice, shares: parseInt(quantity), totalCost: parseFloat(totalOrderValue) }];
      });
    } else {
      const existing = positions.find(p => p.symbol === selectedStock);
      if (!existing || existing.shares < quantity) {
        alert("You do not hold sufficient open shares to execute this transaction.");
        return;
      }
      setBalance(prev => prev + parseFloat(totalOrderValue));
      setPositions(prev => prev.map(p => {
        if (p.symbol === selectedStock) {
          const nextShares = p.shares - parseInt(quantity);
          const nextCost = p.totalCost - (p.averageEntry * quantity);
          return { ...p, shares: nextShares, totalCost: nextCost };
        }
        return p;
      }).filter(p => p.shares > 0));
    }
    setQuantity(1);
  };

  return (
    <div className="space-y-6">
      {/* Upper Status Ribbon Layout */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-brand-card p-6 rounded-xl border border-slate-800 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Workstation Terminal</h1>
          <p className="text-sm text-slate-400">Interact with continuous real-time execution loops risk-free.</p>
        </div>
        <div className="flex gap-4 font-mono">
          <div className="bg-brand-dark/50 px-4 py-2 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400 block">Available Capital</span>
            <span className="text-xl font-bold text-brand-bull">${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>

      {/* Main Structural Interface Splitting (Terminal Grid) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Primary Interactive Chart Area */}
        <div className="xl:col-span-2 bg-brand-card p-6 rounded-xl border border-slate-800 flex flex-col justify-between h-112.5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-xs font-bold text-brand-accent uppercase tracking-widest">{selectedStock}</span>
              <h2 className="text-xl font-bold text-slate-100">{STOCK_CATALOG[selectedStock].name}</h2>
            </div>
            <div className="text-right font-mono">
              <span className="text-2xl font-bold block">${activePrice.toFixed(2)}</span>
              <span className="text-xs text-brand-bull flex items-center justify-end gap-1"><TrendingUp className="w-3 h-3"/> Live Stream</span>
            </div>
          </div>
          
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Area type="monotone" dataKey="price" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#chartColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tactical Order Matrix Execution Window */}
        <div className="bg-brand-card p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
          <h3 className="text-md font-bold tracking-wider text-slate-300 border-b border-slate-800 pb-3">Execution Panel</h3>
          
          <div className="my-4">
            <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Asset Select</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(stockPrices).map(sym => (
                <button key={sym} type="button" onClick={() => setSelectedStock(sym)} className={`p-3 rounded-lg border text-left transition-all ${selectedStock === sym ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' : 'bg-brand-dark/40 border-slate-700 hover:border-slate-500 text-slate-300'}`}>
                  <span className="font-bold block text-sm">{sym}</span>
                  <span className="font-mono text-xs opacity-80">${stockPrices[sym].price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleExecuteOrder} className="space-y-4">
            <div className="flex bg-brand-dark p-1 rounded-lg border border-slate-700">
              <button type="button" onClick={() => setTradeType('BUY')} className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all ${tradeType === 'BUY' ? 'bg-brand-bull text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>BUY</button>
              <button type="button" onClick={() => setTradeType('SELL')} className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all ${tradeType === 'SELL' ? 'bg-brand-bear text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>SELL</button>
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Quantity (Shares)</label>
              <input type="number" min="1" required value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 0))} className="w-full font-mono bg-brand-dark border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-accent" />
            </div>

            <div className="bg-brand-dark/40 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-xs text-slate-400">
              <div className="flex justify-between"><span>Est. Stock Cost:</span><span className="text-slate-200">${activePrice.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5 font-sans font-bold text-sm">
                <span className="text-slate-300">Total Order Cost:</span>
                <span className={tradeType === 'BUY' ? 'text-brand-bull' : 'text-brand-bear'}>${parseFloat(totalOrderValue).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            <button type="submit" className={`w-full py-3 rounded-xl font-bold tracking-wider text-sm transition-all shadow-lg ${tradeType === 'BUY' ? 'bg-brand-bull hover:bg-emerald-400 text-slate-900' : 'bg-brand-bear hover:bg-rose-400 text-white'}`}>
              Submit {tradeType} Transaction
            </button>
          </form>
        </div>
      </div>

      {/* Asset Positions Ledger List View */}
      <div className="bg-brand-card p-6 rounded-xl border border-slate-800 shadow-md">
        <h3 className="text-md font-bold text-slate-300 tracking-wider mb-4 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-brand-accent"/> Open Ledger Positions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Shares</th>
                <th className="py-3 px-4">Avg Entry Price</th>
                <th className="py-3 px-4">Current Price</th>
                <th className="py-3 px-4 text-right">Unrealized P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-500 font-sans italic">No open market positions matching current session.</td>
                </tr>
              ) : (
                positions.map((pos) => {
                  const livePrice = stockPrices[pos.symbol]?.price || pos.averageEntry;
                  const currentVal = pos.shares * livePrice;
                  const originalCost = pos.shares * pos.averageEntry;
                  const pnl = currentVal - originalCost;
                  const isGain = pnl >= 0;

                  return (
                    <tr key={pos.symbol} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-bold text-brand-accent">{pos.symbol}</td>
                      <td className="py-3.5 px-4 text-slate-200">{pos.shares}</td>
                      <td className="py-3.5 px-4 text-slate-400">${pos.averageEntry.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-slate-200">${livePrice.toFixed(2)}</td>
                      <td className={`py-3.5 px-4 text-right font-bold ${isGain ? 'text-brand-bull' : 'text-brand-bear'}`}>
                        {isGain ? '+' : ''}${pnl.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}