
import React, { useState, useEffect } from 'react';
import { Automaton, Transition, ConversionResult } from './types';
import { convertNfaToDfa } from './services/automataLogic';
import { getExplanation } from './services/geminiService';
import Visualizer from './components/Visualizer';
import { 
  Plus, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Info, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  Cpu,
  RefreshCw,
  LayoutGrid,
  Rows,
  Network,
  Settings2
} from 'lucide-react';

const App: React.FC = () => {
  const [epsilonSymbol, setEpsilonSymbol] = useState('ε');
  const [vocabularyInput, setVocabularyInput] = useState('0, 1');
  
  const [nfa, setNfa] = useState<Automaton>({
    states: ['q0', 'q1', 'q2'],
    alphabet: ['0', '1'],
    startState: 'q0',
    finalStates: ['q2'],
    transitions: [
      { from: 'q0', to: 'q1', symbol: 'ε' },
      { from: 'q1', to: 'q1', symbol: '0' },
      { from: 'q1', to: 'q2', symbol: '1' },
      { from: 'q0', to: 'q2', symbol: '0' }
    ]
  });

  // Keep alphabet in sync with manual input
  useEffect(() => {
    const symbols = vocabularyInput.split(',').map(s => s.trim()).filter(s => s !== '');
    setNfa(prev => ({ ...prev, alphabet: symbols }));
  }, [vocabularyInput]);

  const [newTransition, setNewTransition] = useState<Transition>({ from: '', to: '', symbol: '' });
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'stack'>('stack');

  const addTransition = () => {
    // Determine the symbol: if input is empty, use the current epsilon symbol
    const symbolToUse = newTransition.symbol.trim() === '' ? epsilonSymbol : newTransition.symbol.trim();
    
    if (!newTransition.from || !newTransition.to) return;
    
    const transitionToAdd = { ...newTransition, symbol: symbolToUse };
    const updatedTransitions = [...nfa.transitions, transitionToAdd];
    const updatedStates = Array.from(new Set([...nfa.states, newTransition.from, newTransition.to]));
    
    setNfa({ ...nfa, states: updatedStates, transitions: updatedTransitions });
    setNewTransition({ from: '', to: '', symbol: '' });
    setResult(null);
    setExplanation('');
  };

  const removeTransition = (index: number) => {
    setNfa({ ...nfa, transitions: nfa.transitions.filter((_, i) => i !== index) });
    setResult(null);
    setExplanation('');
  };

  const handleConvert = () => {
    const res = convertNfaToDfa(nfa, epsilonSymbol);
    setResult(res);
    setExplanation('');
  };

  const handleExplain = async () => {
    if (!result) return;
    setIsExplaining(true);
    const exp = await getExplanation(nfa, result);
    setExplanation(exp);
    setIsExplaining(false);
  };

  const resetAll = () => {
    setNfa({ states: [], alphabet: ['0', '1'], startState: '', finalStates: [], transitions: [] });
    setVocabularyInput('0, 1');
    setEpsilonSymbol('ε');
    setResult(null);
    setExplanation('');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-xl shadow-indigo-100">
            <Network className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-violet-700">
              AUTOMATA STUDIO
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Finite State Engineering</p>
          </div>
        </div>
        <div className="flex gap-4">
            <button onClick={resetAll} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all text-xs font-bold uppercase tracking-wider">
                <RefreshCw className="w-3.5 h-3.5" /> Clear All
            </button>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-8 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left column: Configuration */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Symbols & Vocabulary Config */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
            <h2 className="text-sm font-black mb-6 flex items-center gap-3 text-slate-800 uppercase tracking-widest">
              <div className="p-1.5 bg-violet-50 rounded-xl"><Settings2 className="w-5 h-5 text-violet-600" /></div>
              System Symbols
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Epsilon Char</label>
                  <input 
                    type="text" 
                    value={epsilonSymbol}
                    onChange={(e) => setEpsilonSymbol(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-mono text-sm text-center font-bold"
                    placeholder="ε"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vocabulary</label>
                  <input 
                    type="text" 
                    value={vocabularyInput}
                    onChange={(e) => setVocabularyInput(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                    placeholder="0, 1, a, b"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
            <h2 className="text-sm font-black mb-8 flex items-center gap-3 text-slate-800 uppercase tracking-widest">
              <div className="p-1.5 bg-indigo-50 rounded-xl"><Cpu className="w-5 h-5 text-indigo-600" /></div>
              NFA Definition
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Initial State</label>
                  <input 
                    type="text" 
                    value={nfa.startState}
                    onChange={(e) => setNfa({...nfa, startState: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                    placeholder="q0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-indigo-600">Acceptance States</label>
                <input 
                  type="text" 
                  value={nfa.finalStates.join(', ')}
                  onChange={(e) => setNfa({...nfa, finalStates: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm shadow-inner"
                  placeholder="e.g. q2, q3"
                />
              </div>

              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Transition Builder</p>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 px-2 uppercase">From</span>
                    <input value={newTransition.from} onChange={e => setNewTransition({...newTransition, from: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"/>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 px-2 uppercase text-indigo-500">Char (Opt)</span>
                    <input 
                      value={newTransition.symbol} 
                      onChange={e => setNewTransition({...newTransition, symbol: e.target.value})} 
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                      placeholder={epsilonSymbol}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 px-2 uppercase">To</span>
                    <input value={newTransition.to} onChange={e => setNewTransition({...newTransition, to: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"/>
                  </div>
                </div>
                <button onClick={addTransition} className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl">
                  <Plus className="w-4 h-4" /> Commit Link
                </button>
              </div>
            </div>

            <div className="mt-10">
              <div className="flex justify-between items-center mb-5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Links</span>
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{nfa.transitions.length} total</span>
              </div>
              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-3 custom-scrollbar">
                {nfa.transitions.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Awaiting Definition</p>
                    </div>
                )}
                {nfa.transitions.map((t, i) => (
                  <div key={i} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 group hover:border-indigo-500 hover:shadow-lg transition-all">
                    <span className="text-sm font-mono flex items-center gap-3">
                      <span className="text-indigo-600 font-bold w-12 truncate">{t.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-200" />
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${t.symbol === epsilonSymbol ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>{t.symbol}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-200" />
                      <span className="text-indigo-600 font-bold w-12 text-right truncate">{t.to}</span>
                    </span>
                    <button onClick={() => removeTransition(i)} className="text-slate-200 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleConvert}
              className="w-full mt-10 bg-indigo-600 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-[0.3em] hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-indigo-100"
            >
              EXECUTE LOGIC <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right column: Diagrams & Analysis */}
        <div className="lg:col-span-8 space-y-10">
          
          <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Diagrams Workspace</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Full visualization of automata states</p>
            </div>
            <div className="flex bg-white p-1.5 rounded-[1.25rem] border border-slate-200 shadow-sm">
                <button 
                    onClick={() => setLayoutMode('stack')}
                    className={`p-2 rounded-xl transition-all ${layoutMode === 'stack' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                    <Rows className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setLayoutMode('grid')}
                    className={`p-2 rounded-xl transition-all ${layoutMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                    <LayoutGrid className="w-5 h-5" />
                </button>
            </div>
          </div>

          <div className={`grid gap-8 ${layoutMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            <Visualizer automaton={nfa} title="ε-NFA Input Model" />
            {result ? (
              <Visualizer automaton={result.dfa} title="Determinized DFA Model" />
            ) : (
              <div className="bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100 flex items-center justify-center p-12 text-slate-400 h-[500px] group hover:border-indigo-100 transition-colors">
                <div className="text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-indigo-50 transition-colors">
                    <Network className="w-10 h-10 opacity-10 group-hover:opacity-30 transition-opacity" />
                  </div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Model Awaiting Execution</h3>
                  <p className="max-w-[280px] mx-auto text-xs text-slate-300 font-bold leading-relaxed uppercase tracking-wider">Configure symbols and NFA structure, then click 'Execute Logic' to generate the DFA diagram.</p>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
                <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-4">
                    <div className="p-2 bg-violet-50 rounded-2xl shadow-inner"><Sparkles className="w-6 h-6 text-violet-600" /></div>
                    Conversion Intelligence
                  </h2>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowSteps(!showSteps)}
                      className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-600 transition-all text-xs font-black uppercase tracking-widest border border-slate-100"
                    >
                      {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {showSteps ? 'Hide Logic' : 'View Trace'}
                    </button>
                    <button 
                      onClick={handleExplain}
                      disabled={isExplaining}
                      className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl transition-all disabled:opacity-50 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-[0.98]"
                    >
                      {isExplaining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                      Synthesize Analysis
                    </button>
                  </div>
                </div>

                {showSteps && (
                  <div className="mb-10 overflow-hidden rounded-[2rem] border border-indigo-100 bg-indigo-50/10 shadow-inner">
                    <div className="bg-white/60 px-8 py-4 border-b border-indigo-50 flex justify-between items-center">
                      <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Subset Construction Execution Trace</h3>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-200"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-100"></div>
                      </div>
                    </div>
                    <div className="p-8 font-mono text-xs text-slate-600 space-y-3 overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                      {result.steps.map((step, i) => (
                        <div key={i} className="flex gap-6 p-4 rounded-2xl hover:bg-white transition-all border border-transparent hover:border-indigo-50 hover:shadow-sm">
                          <span className="text-indigo-300 font-black">{String(i+1).padStart(2, '0')}</span>
                          <span className="leading-relaxed font-medium">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {explanation && (
                  <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-indigo-600 pointer-events-none">
                        <Sparkles className="w-64 h-64" />
                    </div>
                    <div className="relative text-slate-700 leading-relaxed text-sm prose prose-indigo max-w-none prose-p:font-medium prose-p:text-slate-600">
                      {explanation}
                    </div>
                  </div>
                )}

                {!explanation && !isExplaining && (
                  <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                    <BookOpen className="w-16 h-16 mb-6 opacity-[0.05]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Knowledge Synthesis</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10 overflow-hidden">
                 <h2 className="text-sm font-black mb-8 text-slate-800 uppercase tracking-[0.3em]">State Set Mappings</h2>
                 <div className="overflow-x-auto custom-scrollbar">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b border-slate-100">
                         <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target DFA Entity</th>
                         <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source NFA Subsets</th>
                         <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Attributes</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm">
                       {result.mappings.map((m, i) => (
                         <tr key={i} className="border-b border-slate-50 group hover:bg-indigo-50/30 transition-all">
                           <td className="py-6 px-6 font-mono font-black text-indigo-600 text-xs">{m.dfaStateName}</td>
                           <td className="py-6 px-6 font-mono">
                                {m.nfaStates.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {m.nfaStates.map((s, si) => <span key={si} className="bg-white px-2.5 py-1 rounded-xl border border-slate-100 shadow-sm text-[10px] font-bold text-slate-500">{s}</span>)}
                                    </div>
                                ) : (
                                    <span className="text-slate-200 italic font-mono">∅ NULL_SET</span>
                                )}
                           </td>
                           <td className="py-6 px-6 text-right space-x-2">
                             {m.dfaStateName === result.dfa.startState && (
                               <span className="inline-block px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">ENTRY_POINT</span>
                             )}
                             {result.dfa.finalStates.includes(m.dfaStateName) && (
                               <span className="inline-block px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">ACCEPT_STATE</span>
                             )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-32 border-t border-slate-200 py-16 text-center bg-white">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 grayscale opacity-20">
                <Network className="w-6 h-6" />
                <span className="text-lg font-black tracking-tighter">AUTOMATA STUDIO</span>
            </div>
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.5em]">System Engineering & Computational Visualization</p>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 2px solid #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-from-bottom { from { transform: translateY(1rem); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;
