import React, { useState, useEffect } from 'react';
import { Pokemon, Rarity } from './types';
import { GachaMachine } from './components/GachaMachine';
import { PokemonCard } from './components/PokemonCard';
import { Modal } from './components/Modal';
import { PokemonDetail } from './components/PokemonDetail';
import { FusionChamber } from './components/FusionChamber';
import { Circle, Wallet, Trophy, Grid, LayoutGrid, Sparkles, ArrowUpDown, Trash2, AlertTriangle, Atom, Medal } from 'lucide-react';
import { getResellValue, calculateCollectionScore, getTrainerRank } from './services/pokemonService';

type SortOption = 'newest' | 'oldest' | 'id_asc' | 'id_desc' | 'rarity_desc' | 'rarity_asc' | 'type_asc';

const App: React.FC = () => {
  // State
  const [inventory, setInventory] = useState<Pokemon[]>([]);
  const [credits, setCredits] = useState(2000);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [recentPulls, setRecentPulls] = useState<Pokemon[] | null>(null);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [fusionResult, setFusionResult] = useState<Pokemon | null>(null);
  
  // Navigation & Filter State
  const [currentView, setCurrentView] = useState<'summon' | 'collection' | 'fusion'>('summon');
  const [filterRarity, setFilterRarity] = useState<Rarity | 'ALL'>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Load from local storage
  useEffect(() => {
    const savedInv = localStorage.getItem('pokegen_inventory');
    const savedCreds = localStorage.getItem('pokegen_credits');
    
    if (savedInv) {
      try {
        setInventory(JSON.parse(savedInv));
      } catch (e) {
        console.error("Failed to parse inventory", e);
      }
    }
    
    if (savedCreds) {
      setCredits(parseInt(savedCreds, 10));
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('pokegen_inventory', JSON.stringify(inventory));
    localStorage.setItem('pokegen_credits', credits.toString());
  }, [inventory, credits]);

  const handlePullComplete = (newMons: Pokemon[]) => {
    setInventory(prev => [...newMons, ...prev]);
    setRecentPulls(newMons);
    setShowRecentModal(true);
  };

  const handleSpend = (amount: number) => {
    setCredits(prev => Math.max(0, prev - amount));
  };

  const handleUpdatePokemon = (updated: Pokemon) => {
    setInventory(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (selectedPokemon?.id === updated.id) {
      setSelectedPokemon(updated);
    }
  };

  const handleReleasePokemon = (pokemon: Pokemon) => {
    const value = getResellValue(pokemon);
    setCredits(prev => prev + value);
    setInventory(prev => prev.filter(p => p.id !== pokemon.id));
    setSelectedPokemon(null);
  };

  const handleReleaseAll = () => {
    // Release all visible pokemon
    const visibleIds = new Set(displayedInventory.map(p => p.id));
    
    const totalValue = displayedInventory.reduce((acc, p) => acc + getResellValue(p), 0);
    
    setCredits(prev => prev + totalValue);
    setInventory(prev => prev.filter(p => !visibleIds.has(p.id)));
    setShowReleaseConfirm(false);
  };

  const handleFusion = (consumedIds: string[], result: Pokemon) => {
    setInventory(prev => {
      const remaining = prev.filter(p => !consumedIds.includes(p.id));
      return [result, ...remaining];
    });
    setFusionResult(result);
  };

  // Add free daily credits (mock)
  const addCredits = () => {
    setCredits(prev => prev + 500);
  };

  // Filter & Sort logic
  const displayedInventory = React.useMemo(() => {
    // 1. Filter
    const filtered = inventory.filter(p => 
      filterRarity === 'ALL' ? true : p.rarity === filterRarity
    );

    // 2. Sort
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'newest': return b.obtainedAt - a.obtainedAt;
        case 'oldest': return a.obtainedAt - b.obtainedAt;
        case 'id_asc': return a.pokedexId - b.pokedexId;
        case 'id_desc': return b.pokedexId - a.pokedexId;
        case 'rarity_desc': return getResellValue(b) - getResellValue(a);
        case 'rarity_asc': return getResellValue(a) - getResellValue(b);
        case 'type_asc': return a.types[0].localeCompare(b.types[0]);
        default: return 0;
      }
    });
  }, [inventory, filterRarity, sortOption]);

  const releaseValue = displayedInventory.reduce((acc, p) => acc + getResellValue(p), 0);

  // Stats Logic
  const collectionScore = React.useMemo(() => calculateCollectionScore(inventory), [inventory]);
  const trainerRank = getTrainerRank(collectionScore);
  const rankProgress = trainerRank.nextScore === Infinity 
    ? 100 
    : Math.min(100, Math.max(0, ((collectionScore - trainerRank.minScore) / (trainerRank.nextScore - trainerRank.minScore)) * 100));

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-red-400 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                <div className="w-3 h-3 bg-white rounded-full"></div>
             </div>
             <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent hidden sm:block">
               PokéGen AI
             </h1>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-full border border-gray-700">
             <button 
               onClick={() => setCurrentView('summon')}
               className={`px-3 py-1.5 md:px-4 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-2 ${currentView === 'summon' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
             >
               <Sparkles size={14} /> <span className="hidden sm:inline">Summon</span>
             </button>
             <button 
               onClick={() => setCurrentView('collection')}
               className={`px-3 py-1.5 md:px-4 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-2 ${currentView === 'collection' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
             >
               <Grid size={14} /> <span className="hidden sm:inline">Collection</span>
             </button>
             <button 
               onClick={() => setCurrentView('fusion')}
               className={`px-3 py-1.5 md:px-4 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-2 ${currentView === 'fusion' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
             >
               <Atom size={14} /> <span className="hidden sm:inline">Fusion</span>
             </button>
          </div>

          <div className="flex items-center gap-4">
             <button 
               onClick={addCredits}
               className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-gray-700 transition-colors group"
             >
               <Wallet size={16} className="text-green-400 group-hover:scale-110 transition-transform" />
               <span className="font-bold font-mono text-sm md:text-base">{credits}</span>
               <Circle size={10} className="fill-yellow-400 text-yellow-400" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {currentView === 'summon' ? (
          /* Gacha Section */
          <section className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">Summon Companions</h2>
              <p className="text-gray-400">Use your credits to pull new Pokémon from the multiverse.</p>
            </div>
            <GachaMachine 
              credits={credits} 
              onSpendCredits={handleSpend} 
              onPullComplete={handlePullComplete} 
            />
          </section>
        ) : currentView === 'fusion' ? (
           /* Fusion Section */
           <section>
              <FusionChamber inventory={inventory} onFuse={handleFusion} />
           </section>
        ) : (
          /* Inventory Section */
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Rank Dashboard */}
            <div className="bg-gray-800/80 rounded-2xl p-6 mb-8 border border-gray-700 shadow-xl backdrop-blur-sm relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-200%] group-hover:animate-shine pointer-events-none"></div>
               <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
                  <div className="flex-1 text-center md:text-left">
                     <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <span className="text-4xl">{trainerRank.icon}</span>
                        <div>
                           <h2 className={`text-3xl font-black uppercase tracking-tight ${trainerRank.color} drop-shadow-sm`}>
                              {trainerRank.title}
                           </h2>
                           <p className="text-xs font-bold text-gray-500 tracking-widest uppercase">Trainer Rank</p>
                        </div>
                     </div>
                  </div>

                  <div className="w-full md:w-1/2 lg:w-1/3">
                     <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-gray-400">Progress to Next Rank</span>
                        <span className="font-mono font-bold text-white">{trainerRank.nextScore === Infinity ? 'MAX' : `${Math.floor(rankProgress)}%`}</span>
                     </div>
                     <div className="h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
                        <div 
                           className={`h-full transition-all duration-1000 ease-out ${trainerRank.title === 'Legend' ? 'bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500 animate-pulse' : 'bg-blue-500'}`} 
                           style={{width: `${rankProgress}%`}}
                        >
                           <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                     </div>
                     <div className="flex justify-between text-xs text-gray-500 mt-1 font-mono">
                        <span>{collectionScore} pts</span>
                        <span>{trainerRank.nextScore === Infinity ? '∞' : `${trainerRank.nextScore} pts`}</span>
                     </div>
                  </div>

                  <div className="hidden md:block w-px h-16 bg-gray-700"></div>

                  <div className="text-center md:text-right">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Collection Value</p>
                     <p className="text-2xl font-black text-white font-mono flex items-center justify-center md:justify-end gap-2">
                        {collectionScore} <Medal size={20} className="text-yellow-500" />
                     </p>
                  </div>
               </div>
            </div>

            {/* Collection Controls */}
            <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/20 rounded-xl">
                  <Trophy className="text-blue-400" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Your Collection</h2>
                  <p className="text-gray-400 text-sm">Total: {inventory.length} / 1025</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center w-full xl:w-auto">
                {/* Sort */}
                <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
                   <ArrowUpDown size={16} className="text-gray-400" />
                   <select 
                      value={sortOption} 
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      className="bg-transparent text-white text-xs font-bold uppercase focus:outline-none cursor-pointer"
                   >
                      <option value="newest" className="bg-gray-800">Date (Newest)</option>
                      <option value="oldest" className="bg-gray-800">Date (Oldest)</option>
                      <option value="rarity_desc" className="bg-gray-800">Rarity (High-Low)</option>
                      <option value="rarity_asc" className="bg-gray-800">Rarity (Low-High)</option>
                      <option value="id_asc" className="bg-gray-800">Pokedex # (Asc)</option>
                      <option value="id_desc" className="bg-gray-800">Pokedex # (Desc)</option>
                      <option value="type_asc" className="bg-gray-800">Type (A-Z)</option>
                   </select>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  {(['ALL', Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY] as const).map((r) => (
                    <button 
                      key={r}
                      onClick={() => setFilterRarity(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                        filterRarity === r 
                          ? 'bg-white text-black border-white' 
                          : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* Release All Button */}
                {displayedInventory.length > 0 && (
                  <button 
                    onClick={() => setShowReleaseConfirm(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 hover:border-red-500 transition-colors text-xs font-bold uppercase"
                  >
                    <Trash2 size={14} />
                    <span>Release Visible</span>
                  </button>
                )}
              </div>
            </div>
            
            {displayedInventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-700">
                 <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-600">
                    <LayoutGrid size={32} />
                 </div>
                 <p className="text-gray-500 text-lg">No Pokémon found.</p>
                 {filterRarity !== 'ALL' && (
                   <button 
                     onClick={() => setFilterRarity('ALL')}
                     className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium"
                   >
                     Clear Filters
                   </button>
                 )}
                 {inventory.length === 0 && (
                   <button 
                      onClick={() => setCurrentView('summon')}
                      className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full font-bold transition-colors"
                   >
                      Go Summon!
                   </button>
                 )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {displayedInventory.map((pokemon) => (
                  <PokemonCard 
                    key={pokemon.id} 
                    pokemon={pokemon} 
                    onClick={setSelectedPokemon} 
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modals */}
      
      {/* Detail Modal */}
      <Modal 
        isOpen={!!selectedPokemon} 
        onClose={() => setSelectedPokemon(null)}
        title={selectedPokemon?.name.toUpperCase()}
      >
        {selectedPokemon && (
          <PokemonDetail 
            pokemon={selectedPokemon} 
            onUpdatePokemon={handleUpdatePokemon}
            onRelease={handleReleasePokemon}
          />
        )}
      </Modal>

      {/* Recent Pulls Modal */}
      <Modal
        isOpen={showRecentModal}
        onClose={() => setShowRecentModal(false)}
        title="ACQUIRED DATA"
      >
        <div className="text-center mb-6">
           <h3 className="text-2xl font-bold text-yellow-400 animate-pulse">SUCCESS!</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-4">
          {recentPulls?.map((pokemon) => (
             <div key={pokemon.id} className="animate-in zoom-in-50 duration-500 slide-in-from-bottom-4 fade-in">
                <PokemonCard pokemon={pokemon} />
             </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => setShowRecentModal(false)}
            className="bg-white text-black font-bold py-3 px-12 rounded-full hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
          >
            Collect
          </button>
        </div>
      </Modal>
      
      {/* Fusion Result Modal */}
      <Modal
         isOpen={!!fusionResult}
         onClose={() => setFusionResult(null)}
         title="FUSION SUCCESSFUL"
      >
         <div className="flex flex-col items-center p-8">
            <div className="w-64 mb-8 animate-in zoom-in duration-500">
               {fusionResult && <PokemonCard pokemon={fusionResult} showStats />}
            </div>
            <h3 className="text-2xl font-bold mb-2">New Companion Created!</h3>
            <p className="text-gray-400 text-center max-w-md mb-6">
               Your fusion experiment was a success. {fusionResult?.name} has joined your collection.
            </p>
            <button 
               onClick={() => setFusionResult(null)}
               className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-8 rounded-full"
            >
               Awesome
            </button>
         </div>
      </Modal>

      {/* Release All Confirmation Modal */}
      <Modal
        isOpen={showReleaseConfirm}
        onClose={() => setShowReleaseConfirm(false)}
        title="CONFIRM RELEASE"
      >
         <div className="text-center p-4">
            <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
               <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Release {displayedInventory.length} Pokémon?</h3>
            <p className="text-gray-400 text-sm mb-6">
               You are about to release all currently visible Pokémon to the Professor. 
               This action cannot be undone.
            </p>
            
            <div className="bg-gray-800 p-4 rounded-xl mb-6 flex flex-col items-center">
               <span className="text-gray-500 text-xs uppercase font-bold">Total Refund Value</span>
               <div className="flex items-center gap-2 text-2xl font-bold text-green-400 mt-1">
                  <span>+{releaseValue}</span>
                  <Circle size={16} className="fill-yellow-400 text-yellow-400" />
               </div>
            </div>

            <div className="flex gap-4 justify-center">
               <button 
                  onClick={() => setShowReleaseConfirm(false)}
                  className="px-6 py-2 rounded-full bg-gray-700 hover:bg-gray-600 font-bold transition-colors"
               >
                  Cancel
               </button>
               <button 
                  onClick={handleReleaseAll}
                  className="px-6 py-2 rounded-full bg-red-600 hover:bg-red-500 font-bold transition-colors"
               >
                  Confirm Release
               </button>
            </div>
         </div>
      </Modal>

    </div>
  );
};

export default App;