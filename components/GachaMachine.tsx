import React, { useState } from 'react';
import { Pokemon } from '../types';
import { fetchBatchPokemon } from '../services/pokemonService';
import { Circle, Loader2, Sparkles } from 'lucide-react';

interface GachaMachineProps {
  onPullComplete: (newPokemon: Pokemon[]) => void;
  credits: number;
  onSpendCredits: (amount: number) => void;
}

export const GachaMachine: React.FC<GachaMachineProps> = ({ onPullComplete, credits, onSpendCredits }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [animationState, setAnimationState] = useState<'idle' | 'shaking' | 'shiny' | 'opening'>('idle');

  const handlePull = async (amount: number) => {
    if (credits < amount * 100 || isPulling) return;
    
    onSpendCredits(amount * 100);
    setIsPulling(true);
    setAnimationState('shaking');

    try {
      // Fetch data while animating
      const minAnimationTime = new Promise(resolve => setTimeout(resolve, 2000));
      const dataPromise = fetchBatchPokemon(amount);
      
      const [newMons] = await Promise.all([dataPromise, minAnimationTime]);
      const hasShiny = newMons.some(p => p.isShiny);

      if (hasShiny) {
         setAnimationState('shiny');
         // Play shiny animation 
         await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      setAnimationState('opening');
      setTimeout(() => {
        onPullComplete(newMons);
        setAnimationState('idle');
        setIsPulling(false);
      }, 500); // Quick flash for opening

    } catch (e) {
      console.error(e);
      setIsPulling(false);
      setAnimationState('idle');
    }
  };

  return (
    <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-gray-700 relative overflow-hidden max-w-md mx-auto w-full">
      {/* Visual Display */}
      <div className="aspect-square bg-gray-900 rounded-2xl mb-6 relative flex items-center justify-center overflow-hidden group">
        
        {/* Background Effects */}
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] opacity-50 transition-colors duration-1000 ${
           animationState === 'shiny' ? 'from-yellow-500 via-orange-900 to-black' : 'from-blue-900 via-gray-900 to-black'
        }`}></div>
        
        {/* Shiny Sparkles Overlay */}
        {animationState === 'shiny' && (
           <div className="absolute inset-0 pointer-events-none z-10">
              {[...Array(6)].map((_, i) => (
                 <Sparkles 
                    key={i}
                    size={32 + Math.random() * 24} 
                    className="absolute text-yellow-300 animate-bounce"
                    style={{
                       top: `${20 + Math.random() * 60}%`,
                       left: `${20 + Math.random() * 60}%`,
                       animationDelay: `${Math.random() * 0.5}s`,
                       animationDuration: '1s'
                    }}
                 />
              ))}
              <div className="absolute inset-0 bg-yellow-500/20 animate-pulse"></div>
           </div>
        )}

        {/* The Pokeball */}
        <div className={`relative transition-transform duration-500 ${animationState === 'shaking' ? 'animate-shake' : ''}`}>
          {animationState === 'opening' ? (
             <div className="absolute inset-0 flex items-center justify-center animate-ping">
               <div className="w-full h-full bg-white rounded-full opacity-75"></div>
             </div>
          ) : (
            <div 
               className={`
                  w-48 h-48 rounded-full border-8 border-gray-800 relative shadow-2xl overflow-hidden pokeball-gradient transform transition-transform 
                  ${isPulling ? 'scale-110' : 'group-hover:scale-105'}
                  ${animationState === 'shiny' ? 'shadow-[0_0_50px_rgba(234,179,8,0.6)] ring-4 ring-yellow-400 ring-offset-4 ring-offset-black' : ''}
               `}
            >
              {/* Top Half (Red via gradient) */}
              
              {/* Center Line */}
              <div className="absolute top-1/2 left-0 w-full h-4 bg-gray-800 -translate-y-1/2"></div>
              
              {/* Center Button */}
              <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white border-8 border-gray-800 rounded-full -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
                 <div className={`w-10 h-10 border-4 border-gray-300 rounded-full transition-colors duration-300 ${
                    animationState === 'shiny' ? 'bg-yellow-400 animate-ping' :
                    isPulling ? 'bg-red-500 animate-pulse' : 'bg-white'
                 }`}></div>
              </div>

              {/* Bottom Half (White) - achieved by masking or just background color if we used divs, but gradient handles top */}
              <div className="absolute top-1/2 left-0 w-full h-1/2 bg-white -z-1"></div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <button
          disabled={credits < 100 || isPulling}
          onClick={() => handlePull(1)}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-lg transform active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
        >
          <span className="text-lg">Pull 1</span>
          <span className="text-xs bg-black/30 px-2 py-1 rounded-full flex items-center gap-1">
             <Circle size={10} className="fill-yellow-400 text-yellow-400"/> 100
          </span>
        </button>

        <button
          disabled={credits < 1000 || isPulling}
          onClick={() => handlePull(10)}
          className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-lg transform active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
        >
          <span className="text-lg">Pull 10</span>
          <span className="text-xs bg-black/30 px-2 py-1 rounded-full flex items-center gap-1">
            <Circle size={10} className="fill-yellow-400 text-yellow-400"/> 1000
          </span>
        </button>
      </div>

      {isPulling && animationState !== 'shiny' && (
         <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-sm">
           <div className="text-center">
             <Loader2 className="animate-spin text-white mb-2 mx-auto" size={48} />
             <p className="text-white font-bold tracking-widest animate-pulse">SYNCING NEURAL NET...</p>
           </div>
         </div>
      )}
    </div>
  );
};