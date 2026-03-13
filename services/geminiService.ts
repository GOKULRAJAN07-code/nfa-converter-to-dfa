
import { GoogleGenAI } from "@google/genai";
import { Automaton, ConversionResult } from "../types";

export const getExplanation = async (nfa: Automaton, result: ConversionResult): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    I have converted an ε-NFA to a DFA. 
    NFA Data:
    States: ${nfa.states.join(', ')}
    Alphabet: ${nfa.alphabet.join(', ')}
    Transitions: ${nfa.transitions.map(t => `${t.from} --${t.symbol}--> ${t.to}`).join('; ')}
    Start: ${nfa.startState}
    Finals: ${nfa.finalStates.join(', ')}

    DFA Result:
    States: ${result.dfa.states.join(', ')}
    Final States: ${result.dfa.finalStates.join(', ')}
    Steps Taken:
    ${result.steps.join('\n')}

    Please provide a professional, concise, and easy-to-understand explanation of how the ε-closure and subset construction worked for this specific example. 
    Use markdown for formatting. Explain why certain states became final in the DFA.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No explanation generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI explanation. Please check your network connection.";
  }
};
