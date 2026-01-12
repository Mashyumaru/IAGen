import React, { useState } from 'react';
import { Pokemon, Rarity } from '../types';
import { PokemonCard } from './PokemonCard';
import { Sparkles, ArrowRight, Atom, Check } from 'lucide-react';
import { fetchPokemonWithMinRarity } from '../services/pokemonService';

interface FusionChamberProps {
  inventory: Pokemon[];
  onFuse: (consumedIds: string[], result: Pokemon) => void;
}

export const FusionChamber: React.FC<FusionChamberProps> = ({ inventory, onFuse }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFusing, setIsFusing] = useState(false);
  const [inputRarity, setInputRarity] = useState<Rarity>(Rarity.COMMON);

  // Define fusion tiers
  const tiers = [
    { input: Rarity.COMMON, output: Rarity.RARE, label: 'Common Fusion', color: 'from-gray-500 to-gray-700', iconColor: 'text-gray-400' },
    { input: Rarity.RARE, output: Rarity.EPIC, label: 'Rare Fusion', color: 'from-blue-500 to-blue-700', iconColor: 'text-blue-400' },
    { input: Rarity.EPIC, output: Rarity.LEGENDARY, label: 'Epic Fusion', color: 'from-purple-500 to-purple-700', iconColor: 'text-purple-400' },
  ];

  const currentTier = tiers.find(t => t.input === inputRarity) || tiers[0];

  // Filter eligible pokemon based on selected input rarity
  const eligiblePokemon = inventory.filter(p => p.rarity === inputRarity);

  const handleTabChange = (rarity: Rarity) => {
    setInputRarity(rarity);
    setSelectedIds([]); // Clear selection when switching tabs
  };

  const handleSelect = (pokemon: Pokemon) => {
    if (selectedIds.includes(pokemon.id)) {
      setSelectedIds(prev => prev.filter(id => id !== pokemon.id));
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds(prev => [...prev, pokemon.id]);
      }
    }
  };

  const handleFuse = async () => {
    if (selectedIds.length !== 3 || isFusing) return;
    
    setIsFusing(true);
    
    try {
      // Animation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch the next tier pokemon
      const result = await fetchPokemonWithMinRarity(currentTier.output);
      
      onFuse(selectedIds, result);
      setSelectedIds([]);
    } catch (e) {
      console.error("Fusion failed", e);
    } finally {
      setIsFusing(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
           Molecular Fusion
        </h2>
        <p className="text-gray-400">Combine 3 Pokémon of the same rarity to create a powerful companion of the next tier.</p>
      </div>

      {/* Rarity Toggles */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-800 p-1 rounded-full border border-gray-700 inline-flex">
          {tiers.map((tier) => (
            <button
              key={tier.input}
              onClick={() => handleTabChange(tier.input)}
              className={`
                px-6 py-2 rounded-full text-sm font-bold uppercase transition-all
                ${inputRarity === tier.input 
                  ? `bg-gradient-to-r ${tier.color} text-white shadow-lg` 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'}
              `}
            >
              {tier.input}
            </button>
          ))}
        </div>
      </div>

      {/* Fusion Stage */}
      <div className={`bg-gray-800/50 rounded-3xl p-8 mb-8 border border-gray-700 relative overflow-hidden transition-colors duration-500`}>
         {/* Dynamic Background Effect */}
         <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] opacity-30 ${
            inputRarity === Rarity.COMMON ? 'from-gray-500/20' :
            inputRarity === Rarity.RARE ? 'from-blue-500/20' :
            'from-purple-500/20'
         } via-transparent to-transparent`}></div>
         
         <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative z-10">
            {/* Input Slots */}
            <div className="flex gap-4">
              {[0, 1, 2].map((idx) => {
                const id = selectedIds[idx];
                const pokemon = inventory.find(p => p.id === id);
                return (
                  <div key={idx} className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-2 border-dashed border-gray-600 bg-gray-800 flex items-center justify-center relative transition-all">
                    {pokemon ? (
                       <div className="relative w-full h-full p-2 animate-in zoom-in duration-300">
                          <img src={pokemon.image} alt={pokemon.name} className="w-full h-full object-contain" />
                          <button 
                            onClick={() => handleSelect(pokemon)}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-400 shadow-md"
                          >
                             <Atom size={12} className="rotate-45 text-white" />
                          </button>
                       </div>
                    ) : (
                       <div className="text-gray-600 font-bold text-4xl opacity-20">{idx + 1}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Arrow */}
            <div className={`hidden md:flex flex-col items-center ${isFusing ? 'animate-pulse' : ''}`}>
               <ArrowRight size={32} className={currentTier.iconColor} />
            </div>

            {/* Fusion Core Button */}
            <button
               onClick={handleFuse}
               disabled={selectedIds.length !== 3 || isFusing}
               className={`
                 w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center border-4 transition-all shadow-lg
                 ${selectedIds.length === 3 
                    ? `bg-gradient-to-br ${currentTier.color} border-white/20 hover:scale-105 cursor-pointer` 
                    : 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'}
                 ${isFusing ? 'animate-spin border-t-transparent border-l-transparent' : ''}
               `}
            >
               {isFusing ? (
                  <Atom size={40} className="text-white animate-pulse" />
               ) : (
                  <div className="flex flex-col items-center">
                     <Atom size={32} className="text-white mb-1" />
                     <span className="text-xs font-bold uppercase tracking-widest text-white">Fuse</span>
                  </div>
               )}
            </button>
         </div>
         
         <div className="text-center mt-6">
            <p className="text-sm font-medium text-gray-400">
               Result: <span className="text-white font-bold uppercase">{currentTier.output}</span> Pokémon Guaranteed
            </p>
         </div>
      </div>

      {/* Inventory Selector */}
      <div>
         <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl flex items-center gap-2">
               <span className={`w-2 h-8 rounded-full ${
                  inputRarity === Rarity.COMMON ? 'bg-gray-500' :
                  inputRarity === Rarity.RARE ? 'bg-blue-500' :
                  'bg-purple-500'
               }`}></span>
               Eligible Candidates ({eligiblePokemon.length})
            </h3>
            {/* Filter indication */}
            <span className="text-xs font-bold uppercase bg-gray-700 px-3 py-1 rounded-full text-gray-300">
               {inputRarity} Only
            </span>
         </div>
         
         {eligiblePokemon.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
               You have no {inputRarity} Pokémon to fuse. Go Summon more!
            </div>
         ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
               {eligiblePokemon.map((pokemon) => {
                  const isSelected = selectedIds.includes(pokemon.id);
                  return (
                     <div key={pokemon.id} className="relative group">
                        <div className={`${isSelected ? 'opacity-40 grayscale scale-95' : ''} transition-all`}>
                           <PokemonCard 
                              pokemon={pokemon} 
                              onClick={() => !isSelected && selectedIds.length < 3 && handleSelect(pokemon)} 
                           />
                        </div>
                        {isSelected && (
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-green-500 rounded-full p-2 shadow-lg animate-in zoom-in">
                                 <Check size={20} className="text-white" />
                              </div>
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         )}
      </div>
    </div>
  );
};