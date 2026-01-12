import React, { useState, useRef, useEffect } from 'react';
import { Pokemon, ChatMessage } from '../types';
import { generatePokemonPersonality, chatWithPokemon } from '../services/geminiService';
import { getResellValue } from '../services/pokemonService';
import { Send, Sparkles, Bot, User, Loader2, Trash2, Circle, Layers } from 'lucide-react';
import { PokemonCard } from './PokemonCard';

interface PokemonDetailProps {
  pokemon: Pokemon;
  siblings?: Pokemon[];
  onUpdatePokemon: (updated: Pokemon) => void;
  onRelease: (pokemon: Pokemon) => void;
  onSelectSibling?: (pokemon: Pokemon) => void;
}

export const PokemonDetail: React.FC<PokemonDetailProps> = ({ pokemon, siblings = [], onUpdatePokemon, onRelease, onSelectSibling }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingPersonality, setIsGeneratingPersonality] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // Generate personality if missing
  useEffect(() => {
    const initPersonality = async () => {
      if (!pokemon.personality && !isGeneratingPersonality) {
        setIsGeneratingPersonality(true);
        const personality = await generatePokemonPersonality(pokemon);
        onUpdatePokemon({ ...pokemon, personality });
        setIsGeneratingPersonality(false);
      }
    };
    initPersonality();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemon.id]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Build history for API
    const history: { role: 'user' | 'model'; text: string }[] = messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.text
    }));

    const responseText = await chatWithPokemon(pokemon, history, userMsg.text);

    const botMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'pokemon',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full min-h-[500px]">
      {/* Left Column: Card & Stats & Siblings */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="flex justify-center">
             <div className="w-64">
                <PokemonCard pokemon={pokemon} showStats={true} />
             </div>
        </div>
        
        {/* Personality Analysis */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
           <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">AI Personality Analysis</h3>
           {isGeneratingPersonality ? (
             <div className="flex items-center gap-2 text-sm text-blue-400 animate-pulse">
               <Sparkles size={16} /> Analyzing neural patterns...
             </div>
           ) : (
             <p className="text-sm italic text-gray-300">
               "{pokemon.personality}"
             </p>
           )}
        </div>

        {/* Siblings Selector */}
        {siblings.length > 1 && (
           <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-3 flex items-center justify-between">
                 <span>Identical Instances ({siblings.length})</span>
                 <Layers size={14} />
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                 {siblings.map((sib, idx) => (
                    <button
                       key={sib.id}
                       onClick={() => onSelectSibling?.(sib)}
                       className={`
                          shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden relative transition-all
                          ${sib.id === pokemon.id 
                             ? 'border-white ring-2 ring-blue-500 scale-105' 
                             : 'border-gray-600 opacity-50 hover:opacity-100 hover:border-gray-400'}
                       `}
                    >
                       <img src={sib.image} alt="" className="w-full h-full object-cover" />
                       <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-center font-mono text-white">
                          #{idx + 1}
                       </div>
                    </button>
                 ))}
              </div>
           </div>
        )}
      </div>

      {/* Right Column: Interaction */}
      <div className="w-full md:w-2/3 flex flex-col bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 font-medium text-sm transition-colors ${activeTab === 'info' ? 'bg-gray-700 text-white' : 'hover:bg-gray-750 text-gray-400'}`}
          >
            Data Logs
          </button>
          <button 
             onClick={() => setActiveTab('chat')}
             className={`flex-1 py-3 font-medium text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-gray-700 text-white' : 'hover:bg-gray-750 text-gray-400'}`}
          >
            <Sparkles size={16} className="text-purple-400"/> Neural Link
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {activeTab === 'info' && (
            <div className="p-6 h-full flex flex-col">
               <div className="space-y-4 overflow-auto flex-1">
                 <div>
                   <h4 className="text-gray-400 text-xs uppercase mb-1">Obtained</h4>
                   <p className="text-lg">{new Date(pokemon.obtainedAt).toLocaleDateString()} {new Date(pokemon.obtainedAt).toLocaleTimeString()}</p>
                 </div>
                 <div>
                   <h4 className="text-gray-400 text-xs uppercase mb-1">Pokedex ID</h4>
                   <p className="font-mono text-lg">#{String(pokemon.pokedexId).padStart(4, '0')}</p>
                 </div>
                 <div>
                   <h4 className="text-gray-400 text-xs uppercase mb-1">Types</h4>
                   <div className="flex gap-2">
                     {pokemon.types.map(t => (
                       <span key={t} className="px-3 py-1 bg-gray-700 rounded-full capitalize">{t}</span>
                     ))}
                   </div>
                 </div>
               </div>
               
               <div className="mt-6 pt-6 border-t border-gray-700">
                 <button 
                   onClick={() => onRelease(pokemon)}
                   className="w-full py-3 bg-red-900/20 border border-red-900/50 hover:bg-red-900/40 hover:border-red-500 text-red-400 rounded-xl flex items-center justify-center gap-2 transition-all group"
                 >
                   <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                   <span className="font-semibold">Transfer Instance to Professor</span>
                   <span className="bg-black/30 px-2 py-0.5 rounded-full text-sm flex items-center gap-1 ml-2">
                      +{getResellValue(pokemon.rarity)} <Circle size={10} className="fill-yellow-400 text-yellow-400"/>
                   </span>
                 </button>
                 <p className="text-center text-xs text-gray-500 mt-2">
                   Transferred Pokémon cannot be recovered.
                 </p>
               </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-12">
                    <Bot size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Establish a neural link with {pokemon.name}.</p>
                    <p className="text-xs mt-2">Say hello!</p>
                  </div>
                )}
                
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                      {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600/20 text-blue-100 rounded-tr-none' 
                        : 'bg-purple-600/20 text-purple-100 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                      <Bot size={14} />
                    </div>
                    <div className="bg-purple-600/20 rounded-2xl rounded-tl-none px-4 py-2 flex items-center">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-700 bg-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={`Message ${pokemon.name}...`}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full text-white transition-colors"
                  >
                    {isTyping ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};