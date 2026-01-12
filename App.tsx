import React, { useState, useEffect } from 'react';
import { Pokemon, Rarity } from './types';
import { GachaMachine } from './components/GachaMachine';
import { PokemonCard } from './components/PokemonCard';
import { Modal } from './components/Modal';
import { PokemonDetail } from './components/PokemonDetail';
import { Circle, Wallet, Trophy, Grid, LayoutGrid, Sparkles } from 'lucide-react';
import { getResellValue } from './services/pokemonService';

const App: React.FC = () => {
  // State
  const [inventory, setInventory] = useState<Pokemon[]>([]);
  const [credits, setCredits] = useState(2000);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [recentPulls, setRecentPulls] = useState<Pokemon[] | null>(null);
  const [showRecentModal, setShowRecentModal] = useState(false);
  
  // Navigation & Filter State
  const [currentView, setCurrentView] = useState<'summon' | 'collection'>('summon');
  const [filterRarity, setFilterRarity] = useState<Rarity | 'ALL'>('ALL');

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
    const value = getResellValue(pokemon.rarity);
    setCredits(prev => prev + value);
    setInventory(prev => prev.filter(p => p.id !== pokemon.id));
    setSelectedPokemon(null);
  };

  // Add free daily credits (mock)
  const addCredits = () => {
    setCredits(prev => prev + 500);
  };

  // Filter logic
  const filteredInventory = inventory.filter(p => 
    filterRarity === 'ALL' ? true : p.rarity === filterRarity
  );

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
          
          {/* Mobile View Toggle - Visible on small screens inside header, or just part of the layout */}
          <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-full border border-gray-700">
             <button 
               onClick={() => setCurrentView('summon')}
               className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-2 ${currentView === 'summon' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
             >
               <Sparkles size={14} /> <span className="hidden sm:inline">Summon</span>
             </button>
             <button 
               onClick={() => setCurrentView('collection')}
               className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-2 ${currentView === 'collection' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
             >
               <Grid size={14} /> <span className="hidden sm:inline">Collection</span>
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
        ) : (
          /* Inventory Section */
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/20 rounded-xl">
                  <Trophy className="text-blue-400" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Your Collection</h2>
                  <p className="text-gray-400 text-sm">Total: {inventory.length} / 1025</p>
                </div>
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
            </div>
            
            {filteredInventory.length === 0 ? (
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
                {filteredInventory.map((pokemon) => (
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

    </div>
  );
};

export default App;