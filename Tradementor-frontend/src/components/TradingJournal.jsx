import React, { useState } from 'react';
import { Notebook, Calendar, Tag, FileText, AlertTriangle, Plus } from 'lucide-react';

export default function TradingJournal() {
  const [notes, setNotes] = useState('');
  const [mistakeTag, setMistakeTag] = useState('NONE');
  const [assetSymbol, setAssetSymbol] = useState('');
  const [journals, setJournals] = useState([
    {
      id: 1,
      date: '2026-06-10',
      symbol: 'TSLA',
      mistake: 'FOMO ENTRY',
      notes: 'Entered on an aggressive breakout candle without waiting for closing confirmation. The asset reversed immediately, hitting my exit stops. Need to practice proper confirmation patience.'
    }
  ]);

  const handleSaveEntry = (e) => {
    e.preventDefault();
    if (!notes.trim() || !assetSymbol.trim()) return;

    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      symbol: assetSymbol.toUpperCase(),
      mistake: mistakeTag,
      notes: notes
    };

    setJournals([newEntry, ...journals]);
    setNotes('');
    setAssetSymbol('');
    setMistakeTag('NONE');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* JOURNAL ENTRY INPUT CREATOR FORM */}
        <div className="lg:col-span-1 bg-brand-card p-5 rounded-xl border border-slate-800 h-fit">
          <h3 className="text-md font-bold tracking-wider text-slate-200 border-b border-slate-800 pb-2.5 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-accent"/> Document Trade Setup
          </h3>
          <form onSubmit={handleSaveEntry} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Stock/Asset Symbol</label>
              <input type="text" placeholder="e.g. NVDA" required value={assetSymbol} onChange={e => setAssetSymbol(e.target.value)} className="w-full bg-brand-dark border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 font-mono uppercase focus:outline-none focus:border-brand-accent text-sm" />
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Technical / Psychological Tag</label>
              <select value={mistakeTag} onChange={e => setMistakeTag(e.target.value)} className="w-full bg-brand-dark border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-accent text-sm">
                <option value="NONE">No Mechanical Mistakes Made</option>
                <option value="FOMO ENTRY">FOMO Entry (Fear of Missing Out)</option>
                <option value="STOP CHASE">Improper Stop Loss Adjustment</option>
                <option value="OVER LEVERAGE">Over-Leveraging Capital Size</option>
                <option value="EARLY EXIT">Early Profit Liquidation (Fear)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Execution Observations & Notes</label>
              <textarea rows="4" placeholder="Detail strategy setups, emotional state, or structural errors observed during execution..." required value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-brand-dark border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-brand-accent text-sm leading-relaxed" />
            </div>

            <button type="submit" className="w-full bg-brand-accent hover:bg-sky-400 text-slate-900 font-bold py-2.5 rounded-lg text-sm tracking-wide transition-colors cursor-pointer shadow-md">
              Save Ledger Entry
            </button>
          </form>
        </div>

        {/* FEED DIALOGUE STREAM DISPLAY */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-md font-bold tracking-wider text-slate-300 px-1 flex items-center gap-2"><Notebook className="w-4 h-4 text-brand-accent" /> Completed Observations Log</h3>
          
          {journals.length === 0 ? (
            <div className="bg-brand-card border border-slate-800 rounded-xl p-8 text-center italic text-slate-500 text-sm font-sans">
              No historical journal records preserved in current session ledger.
            </div>
          ) : (
            journals.map((log) => (
              <div key={log.id} className="bg-brand-card border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-brand-accent bg-brand-dark/60 border border-slate-700 px-2.5 py-0.5 rounded text-sm">{log.symbol}</span>
                    {log.mistake !== 'NONE' && (
                      <span className="bg-brand-bear/10 border border-brand-bear/30 text-brand-bear text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3"/> {log.mistake}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-mono flex items-center gap-1"><Calendar className="w-3 h-3"/> {log.date}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed font-sans flex items-start gap-2">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>{log.notes}</span>
                </p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}