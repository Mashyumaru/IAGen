import { Pokemon, PokemonStats, Rarity } from '../types';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// Helper to get random number inclusive
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Determine rarity based on base stats total
const determineRarity = (stats: PokemonStats): Rarity => {
  const total = stats.hp + stats.attack + stats.defense + stats.speed;
  if (total > 450) return Rarity.LEGENDARY;
  if (total > 350) return Rarity.EPIC;
  if (total > 250) return Rarity.RARE;
  return Rarity.COMMON;
};

// Calculate resell value based on rarity
export const getResellValue = (rarity: Rarity): number => {
  switch (rarity) {
    case Rarity.COMMON: return 10;
    case Rarity.RARE: return 50;
    case Rarity.EPIC: return 200;
    case Rarity.LEGENDARY: return 1000;
    default: return 0;
  }
};

// Map PokeAPI response to our interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapApiToPokemon = (data: any): Omit<Pokemon, 'id' | 'obtainedAt'> => {
  const stats: PokemonStats = {
    hp: data.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 0,
    attack: data.stats.find((s: any) => s.stat.name === 'attack')?.base_stat || 0,
    defense: data.stats.find((s: any) => s.stat.name === 'defense')?.base_stat || 0,
    speed: data.stats.find((s: any) => s.stat.name === 'speed')?.base_stat || 0,
  };

  return {
    pokedexId: data.id,
    name: data.name,
    image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
    types: data.types.map((t: any) => t.type.name),
    stats,
    rarity: determineRarity(stats),
  };
};

export const fetchRandomPokemon = async (): Promise<Pokemon> => {
  // Gen 1-9 approx up to 1000, let's stick to 1-1025
  const randomId = randomInt(1, 1025);
  try {
    const response = await fetch(`${POKEAPI_BASE}/pokemon/${randomId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const mapped = mapApiToPokemon(data);
    
    return {
      ...mapped,
      id: crypto.randomUUID(),
      obtainedAt: Date.now(),
    };
  } catch (error) {
    console.error('Failed to fetch pokemon', error);
    // Fallback to Pikachu if API fails
    return {
      id: crypto.randomUUID(),
      pokedexId: 25,
      name: 'pikachu',
      image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
      types: ['electric'],
      stats: { hp: 35, attack: 55, defense: 40, speed: 90 },
      rarity: Rarity.RARE,
      obtainedAt: Date.now()
    };
  }
};

export const fetchBatchPokemon = async (count: number): Promise<Pokemon[]> => {
  const promises = Array.from({ length: count }, () => fetchRandomPokemon());
  return Promise.all(promises);
};