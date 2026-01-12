import React, { useState, useEffect } from 'react';
import { Pokemon } from './types';
import { GachaMachine } from './components/GachaMachine';
import { PokemonCard } from './components/PokemonCard';
import { Modal } from './components/Modal';
import { PokemonDetail } from './components/PokemonDetail';
import { Circle, Wallet, Trophy, Grid } from 'lucide-react';
import { getResellValue } from './services/pokemonService';

const App: React.FC = () => {
  // State
  const [inventory, setInventory] = useState<Pokemon[]>([]);
  const [credits, setCredits] = useState(2000);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [recentPulls, setRecentPulls] = useState<Pokemon[] | null>(null);
  const [showRecentModal, setShowRecentModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-red-400 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                <div className="w-3 h-3 bg-white rounded-full"></div>
             </div>
             <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">
               PokéGen AI
             </h1>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
               onClick={addCredits}
               className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full border border-gray-700 transition-colors group"
             >
               <Wallet size={18} className="text-green-400 group-hover:scale-110 transition-transform" />
               <span className="font-bold font-mono">{credits}</span>
               <Circle size={10} className="fill-yellow-400 text-yellow-400" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
        
        {/* Gacha Section */}
        <section className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-2">Summon Companions</h2>
            <p className="text-gray-400">Use your credits to pull new Pokémon from the multiverse.</p>
          </div>
          <GachaMachine 
            credits={credits} 
            onSpendCredits={handleSpend} 
            onPullComplete={handlePullComplete} 
          />
        </section>

        {/* Inventory Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Trophy className="text-blue-400" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Your Collection</h2>
                <p className="text-gray-400 text-sm">Total: {inventory.length} / 1025</p>
              </div>
            </div>
            <div className="flex gap-2 text-gray-500">
               <Grid size={20} />
            </div>
          </div>
          
          {inventory.length === 0 ? (
            <div className="text-center py-20 bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-700">
              <p className="text-gray-500 text-lg">Your collection is empty. Start pulling!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {inventory.map((pokemon) => (
                <PokemonCard 
                  key={pokemon.id} 
                  pokemon={pokemon} 
                  onClick={setSelectedPokemon} 
                />
              ))}
            </div>
          )}
        </section>
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