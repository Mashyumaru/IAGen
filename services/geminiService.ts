import { GoogleGenAI } from "@google/genai";
import { Pokemon } from "../types";

// Initialize Gemini
// NOTE: process.env.API_KEY is assumed to be available as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = 'gemini-3-flash-preview'; 

export const generatePokemonPersonality = async (pokemon: Pokemon): Promise<string> => {
  try {
    const prompt = `
      Generate a short, quirky, and unique personality description (max 2 sentences) for a ${pokemon.name}.
      It has the following stats - HP: ${pokemon.stats.hp}, Attack: ${pokemon.stats.attack}, Defense: ${pokemon.stats.defense}, Speed: ${pokemon.stats.speed}.
      Based on these stats and its type (${pokemon.types.join(', ')}), give it a distinct trait (e.g., lazy, hyperactive, grumpy, foodie, poetic).
      Do not mention the stats numbers directly, just use them to infer the personality.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    
    return response.text?.trim() || `A mysterious ${pokemon.name} with an unknown past.`;
  } catch (error) {
    console.error("Gemini Personality Error:", error);
    return `A standard ${pokemon.name}. The AI scanner malfunctioned.`;
  }
};

export const chatWithPokemon = async (pokemon: Pokemon, history: {role: 'user' | 'model', text: string}[], userMessage: string): Promise<string> => {
  try {
    // Construct chat history for the context
    // We need to system instruct the model to BE the pokemon
    
    const systemInstruction = `
      You are a ${pokemon.name}. 
      Your personality is: ${pokemon.personality || 'Friendly and loyal'}.
      
      Rules:
      1. You mostly speak in "Pokemon speak" (variations of your name).
      2. HOWEVER, you MUST provide a translation in parentheses so the human understands you.
      3. Example: "${pokemon.name.slice(0, 4)}! (I am so hungry right now!)"
      4. Keep responses relatively short (under 50 words).
      5. React to the user's input based on your personality and type (${pokemon.types.join(', ')}).
    `;

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "...";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return `${pokemon.name}...? (The connection is weak...)`;
  }
};