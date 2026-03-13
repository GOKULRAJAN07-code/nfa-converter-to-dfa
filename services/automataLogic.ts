
import { Automaton, Transition, ConversionResult, DFAStateMapping } from '../types';

/**
 * Computes the ε-closure of a set of states using a custom epsilon symbol.
 */
export function getEpsilonClosure(states: string[], transitions: Transition[], epsilon: string): string[] {
  const closure = new Set<string>(states);
  const stack = [...states];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const epsTransitions = transitions.filter(t => t.from === current && t.symbol === epsilon);
    
    for (const t of epsTransitions) {
      if (!closure.has(t.to)) {
        closure.add(t.to);
        stack.push(t.to);
      }
    }
  }

  return Array.from(closure).sort();
}

/**
 * Computes the set of states reachable from a set of states on a given symbol.
 */
export function move(states: string[], symbol: string, transitions: Transition[]): string[] {
  const result = new Set<string>();
  for (const state of states) {
    const relevantTransitions = transitions.filter(t => t.from === state && t.symbol === symbol);
    for (const t of relevantTransitions) {
      result.add(t.to);
    }
  }
  return Array.from(result).sort();
}

/**
 * Converts an ε-NFA to a DFA using the Subset Construction algorithm.
 */
export function convertNfaToDfa(nfa: Automaton, epsilon: string): ConversionResult {
  const steps: string[] = [];
  // Use the provided alphabet but exclude the custom epsilon
  const alphabet = nfa.alphabet.filter(s => s !== epsilon);
  const dfaTransitions: Transition[] = [];
  const mappings: DFAStateMapping[] = [];
  const processedStates: string[][] = [];
  const queue: string[][] = [];

  // Start state of DFA is epsilon closure of NFA's start state
  const startClosure = getEpsilonClosure([nfa.startState], nfa.transitions, epsilon);
  queue.push(startClosure);
  mappings.push({ dfaStateName: `{${startClosure.join(',')}}`, nfaStates: startClosure });
  steps.push(`Initial state: ε-closure(${nfa.startState}) using '${epsilon}' = {${startClosure.join(', ')}}`);

  const getStateName = (states: string[]) => `{${states.join(',')}}`;

  while (queue.length > 0) {
    const currentSet = queue.shift()!;
    const currentName = getStateName(currentSet);

    if (processedStates.some(s => s.join(',') === currentSet.join(','))) continue;
    processedStates.push(currentSet);

    for (const symbol of alphabet) {
      const moved = move(currentSet, symbol, nfa.transitions);
      const closure = getEpsilonClosure(moved, nfa.transitions, epsilon);
      const nextName = getStateName(closure);

      if (closure.length === 0) {
          // No transition for this set of states on this symbol
          continue;
      }

      dfaTransitions.push({ from: currentName, to: nextName, symbol });

      if (!processedStates.some(s => s.join(',') === closure.join(',')) && 
          !queue.some(s => s.join(',') === closure.join(','))) {
        queue.push(closure);
        mappings.push({ dfaStateName: nextName, nfaStates: closure });
        steps.push(`From ${currentName} on '${symbol}', moved to {${moved.join(', ')}}, ε-closure results in ${nextName}`);
      }
    }
  }

  const dfaStates = mappings.map(m => m.dfaStateName);
  const dfaFinalStates = mappings
    .filter(m => m.nfaStates.some(s => nfa.finalStates.includes(s)))
    .map(m => m.dfaStateName);

  return {
    dfa: {
      states: dfaStates,
      alphabet,
      transitions: dfaTransitions,
      startState: getStateName(startClosure),
      finalStates: dfaFinalStates
    },
    mappings,
    steps
  };
}
