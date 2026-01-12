import React from 'react';
import { Pokemon, Rarity } from '../types';
import { Sparkles, Zap, Shield, Heart, Activity } from 'lucide-react';

interface PokemonCardProps {
  pokemon: Pokemon;
  onClick?: (pokemon: Pokemon) => void;
  showStats?: boolean;
}

const rarityColors = {
  [Rarity.COMMON]: 'border-gray-400 bg-gray-800/50',
  [Rarity.RARE]: 'border-blue-400 bg-blue-900/30',
  [Rarity.EPIC]: 'border-purple-400 bg-purple-900/30',
  [Rarity.LEGENDARY]: 'border-yellow-400 bg-yellow-900/30 shadow-[0_0_15px_rgba(250,204,21,0.5)]',
};

const typeColors: Record<string, string> = {
  normal: 'bg-gray-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  electric: 'bg-yellow-400 text-black',
  ice: 'bg-cyan-300 text-black',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-amber-600',
  flying: 'bg-indigo-300 text-black',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-yellow-700',
  ghost: 'bg-purple-800',
  dragon: 'bg-indigo-600',
  dark: 'bg-gray-800',
  steel: 'bg-gray-400',
  fairy: 'bg-pink-300 text-black',
};

export const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, onClick, showStats = false }) => {
  return (
    <div 
      className={`
        relative group rounded-xl border-2 p-3 transition-all duration-300 cursor-pointer overflow-hidden
        hover:scale-105 hover:shadow-xl
        ${rarityColors[pokemon.rarity]}
      `}
      onClick={() => onClick?.(pokemon)}
    >
      <div className="absolute top-2 right-2 flex gap-1">
        {pokemon.types.map((t) => (
          <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${typeColors[t] || 'bg-gray-500'}`}>
            {t}
          </span>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <img 
          src={pokemon.image} 
          alt={pokemon.name} 
          className="w-32 h-32 object-contain drop-shadow-md group-hover:drop-shadow-2xl transition-all"
        />
      </div>

      <div className="mt-3 text-center">
        <h3 className="capitalize font-bold text-lg text-white truncate">{pokemon.name}</h3>
        <p className={`text-xs font-semibold uppercase tracking-widest opacity-80 ${
          pokemon.rarity === Rarity.LEGENDARY ? 'text-yellow-400' :
          pokemon.rarity === Rarity.EPIC ? 'text-purple-400' :
          pokemon.rarity === Rarity.RARE ? 'text-blue-400' : 'text-gray-400'
        }`}>
          {pokemon.rarity}
        </p>
      </div>

      {showStats && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-300 bg-black/20 p-2 rounded-lg">
          <div className="flex items-center gap-1"><Heart size={12} className="text-red-400"/> {pokemon.stats.hp}</div>
          <div className="flex items-center gap-1"><Zap size={12} className="text-yellow-400"/> {pokemon.stats.attack}</div>
          <div className="flex items-center gap-1"><Shield size={12} className="text-blue-400"/> {pokemon.stats.defense}</div>
          <div className="flex items-center gap-1"><Activity size={12} className="text-green-400"/> {pokemon.stats.speed}</div>
        </div>
      )}
      
      {pokemon.rarity === Rarity.LEGENDARY && (
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 to-transparent pointer-events-none" />
      )}
      
      {/* Optional shiny sparkle if desired, simplified for now */}
      {pokemon.rarity === Rarity.LEGENDARY && (
        <Sparkles className="absolute bottom-2 right-2 text-yellow-400 animate-pulse" size={16} />
      )}
    </div>
  );
};
