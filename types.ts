
export interface Transition {
  from: string;
  to: string;
  symbol: string; // use 'ε' for epsilon transitions
}

export interface Automaton {
  states: string[];
  alphabet: string[];
  transitions: Transition[];
  startState: string;
  finalStates: string[];
}

export interface DFAStateMapping {
  dfaStateName: string;
  nfaStates: string[];
}

export interface ConversionResult {
  dfa: Automaton;
  mappings: DFAStateMapping[];
  steps: string[];
}
