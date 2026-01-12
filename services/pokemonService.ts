import { Pokemon, PokemonStats, Rarity } from '../types';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// Helper to get random number inclusive
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Type bonuses for rarity calculation
const TYPE_BONUS: Record<string, number> = {
  dragon: 40,
  ghost: 25,
  psychic: 25,
  steel: 25,
  fairy: 25,
  fire: 15,
  ice: 15,
  electric: 15
};

// Determine rarity based on extended parameters (Stats, Exp, Types)
const determineRarity = (stats: PokemonStats, baseExp: number, types: string[]): Rarity => {
  const statSum = stats.hp + stats.attack + stats.defense + stats.speed;
  
  // Calculate max type bonus (use the highest bonus if dual type)
  const typeBonus = types.reduce((max, t) => Math.max(max, TYPE_BONUS[t] || 0), 0);
  
  // Weighted score calculation
  // Base Exp is a strong indicator of power level/evolution stage
  // Formula: Sum of physical stats + (Base Exp * 1.2) + Type Bonus
  const score = statSum + (baseExp * 1.2) + typeBonus;

  if (score > 800) return Rarity.LEGENDARY;
  if (score > 600) return Rarity.EPIC;
  if (score > 350) return Rarity.RARE;
  return Rarity.COMMON;
};

// Calculate resell value based on rarity
export const getResellValue = (pokemon: Pokemon | Rarity): number => {
  const rarity = typeof pokemon === 'string' ? pokemon : pokemon.rarity;
  let value = 0;
  
  switch (rarity) {
    case Rarity.COMMON: value = 10; break;
    case Rarity.RARE: value = 50; break;
    case Rarity.EPIC: value = 200; break;
    case Rarity.LEGENDARY: value = 1000; break;
    default: value = 0;
  }

  // Double value for shiny if passing a Pokemon object
  if (typeof pokemon !== 'string' && pokemon.isShiny) {
    value *= 2;
  }

  return value;
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

  const types = data.types.map((t: any) => t.type.name);
  // Base experience defaults to 100 if missing (some forms/new pokemon might lack it)
  const baseExp = data.base_experience || 100;
  
  // 5% chance for shiny
  const isShiny = Math.random() < 0.05;
  const image = isShiny 
    ? (data.sprites.other['official-artwork'].front_shiny || data.sprites.front_shiny || data.sprites.other['official-artwork'].front_default)
    : (data.sprites.other['official-artwork'].front_default || data.sprites.front_default);

  return {
    pokedexId: data.id,
    name: data.name,
    image: image,
    types: types,
    stats,
    rarity: determineRarity(stats, baseExp, types),
    isShiny
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
      obtainedAt: Date.now(),
      isShiny: false
    };
  }
};

export const fetchBatchPokemon = async (count: number): Promise<Pokemon[]> => {
  const promises = Array.from({ length: count }, () => fetchRandomPokemon());
  return Promise.all(promises);
};

// Fetch a pokemon that guarantees a minimum rarity (for fusion)
// If we can't find one naturally after retries, we boost a pokemon's stats to match
export const fetchPokemonWithMinRarity = async (minRarity: Rarity): Promise<Pokemon> => {
  const rarityValue = {
    [Rarity.COMMON]: 0,
    [Rarity.RARE]: 1,
    [Rarity.EPIC]: 2,
    [Rarity.LEGENDARY]: 3
  };
  
  const targetVal = rarityValue[minRarity];
  let attempts = 0;
  let bestPokemon: Pokemon | null = null;
  
  while (attempts < 5) {
    const p = await fetchRandomPokemon();
    if (rarityValue[p.rarity] >= targetVal) {
      return p;
    }
    // Keep the one with highest stats just in case
    if (!bestPokemon || getResellValue(p) > getResellValue(bestPokemon)) {
      bestPokemon = p;
    }
    attempts++;
  }

  // If we failed to find one naturally, take the best one and boost it
  if (bestPokemon) {
    const boostAmount = 100; // Flat boost to push score up
    bestPokemon.stats.attack += boostAmount;
    bestPokemon.stats.hp += boostAmount;
    // Force rarity update
    bestPokemon.rarity = minRarity;
    // Ensure ID is new just in case
    bestPokemon.id = crypto.randomUUID();
    return bestPokemon;
  }

  // Fallback shouldn't really happen due to fetchRandomPokemon fallback
  return fetchRandomPokemon();
};