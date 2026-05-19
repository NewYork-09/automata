import { Cfg01Grammar, CfgABGrammar } from "../constants/CfgGrammars";

export interface TraceStep {
    step: number;
    processed: string; // the processed string so far
    activeTerminal: string; // the characters that are currently being processed
    activeNonTerminal: string; // the non-terminals that are currently being processed
    futureNonTerminal: string; // the non-terminals that are yet to be processed
    derivation: string; // the derivation of the current step (combine strings)
}


class CfgEngine {
    private grammar: Record<string, string[][]>;
    private blockSequence: string[];
    private stateToBlock: Record<string, string>;


    constructor(
        grammar: Record<string, string[][]>,
        sequence: string[],
        stateMapping: Record<string, string>
    ) {
        this.grammar = grammar;
        this.blockSequence = sequence; // store the expected block order of the grammar
        this.stateToBlock = stateMapping // state to block label (so multiple state can belong to the same block)
    }

    // A helper function for clean visual representation of the states
    private getVisualName(state: string) {
        if (state === "ACCEPT") return "";
        return state[0];   
    }

    public trace(inputString: string) {
        
        // Recursive Parser (DFS)
        const solve = (
            blockIndex: number,
            currentState: string,
            remainingInput: string, 
            path: TraceStep[],
            completedPrefix: string,
            currentBlockTerminals: string,
        ) : { success: boolean; finalPath: TraceStep[] } | null => {
            
            // Base Case
            if (currentState === "ACCEPT") {
                return remainingInput === "" ? {success: true, finalPath: path} : null;
            }

            const rules = this.grammar[currentState] || [];
            // Sorts the rules to avoid greedy matching
            const sortedRules = [...rules].sort((a, b) => b[0].length - a[0].length);

            for (const [ terminal, nextState ] of sortedRules) {

                // Valid if the terminal matches beggining of the input, or if the terminal is epsilon
                if (terminal === "" || remainingInput.startsWith(terminal)) {
                    
                    const currentBlock = this.stateToBlock[currentState];
                    const nextBlock = this.stateToBlock[nextState] || "ACCEPT";

                    // Block Transition
                    const isTransitioning = currentBlock !== nextBlock;
                    const nextBlockIndex = isTransitioning ? blockIndex + 1 : blockIndex;
                    const nextCompletedPrefix = isTransitioning ? completedPrefix + currentBlockTerminals + terminal : completedPrefix;
                    const nextBlockTerminals = isTransitioning ? "" : currentBlockTerminals + terminal;
                    
                    // Removed matched Terminal
                    const nextRemainingInput = remainingInput.slice(terminal.length);

                    // --- Formatting the Pieces ---
                    const processedString = nextCompletedPrefix;
                    const activeNonTerminal = this.getVisualName(nextState);
                    const futureNonTerminal = this.blockSequence.slice(nextBlockIndex + 1). join("");
                    const activeTerminal = activeNonTerminal ? `${nextBlockTerminals}${activeNonTerminal}` : nextBlockTerminals;
                    const derivation = `${processedString}(${activeTerminal})${futureNonTerminal}`;

                    // --- Pushing the New Object ---
                    const newPath = [...path, {
                        step: path.length,
                        processed: processedString,
                        activeTerminal: activeTerminal,
                        activeNonTerminal: activeNonTerminal,
                        futureNonTerminal: futureNonTerminal,
                        derivation: derivation
                    }];

                    // Recursive Call (attempt the next step)
                    const result = solve (
                        nextBlockIndex,
                        nextState,
                        nextRemainingInput,
                        newPath,
                        nextCompletedPrefix,
                        nextBlockTerminals
                    );
                    if (result) return result;
                }
            }

            return null;
        };

        // --- Initial Derivation ---

        // Get first non terminal
        const firstStateVisual = this.getVisualName(this.blockSequence[0]);
        
        // Get remaining blocks
        const futureStateVisual = this.blockSequence.slice(1).join("");

        // Initial Deviation
        const initialDeviation = `(${firstStateVisual})${futureStateVisual}`


        // --- Initial Trace Step ---
        
        // create Step 0
        const initialPath: TraceStep[] = [{
            step: 0,
            processed: "",
            activeTerminal: "",
            activeNonTerminal: firstStateVisual,
            futureNonTerminal: futureStateVisual,
            derivation: initialDeviation
        }]


        // --- Start Solving ---
        const firstState = this.blockSequence[0];

        // Start recursive search
        const finalResult = solve(0, firstState, inputString, initialPath, "", "");

        return finalResult ? 
            {success: true, steps: finalResult.finalPath} :
            {success: false, error: `Rejected: ${inputString}`}
    }
}

// --- 01 CFG ---
const cfgEngine01Value = Cfg01Grammar.engine 
export const cfgEngine01 = new CfgEngine(cfgEngine01Value.rules, cfgEngine01Value.sequence, cfgEngine01Value.stateToBlock)

// --- AB CFG ---
const cfgEngineABValue = CfgABGrammar.engine 
export const cfgEngineAB = new CfgEngine(cfgEngineABValue.rules, cfgEngineABValue.sequence, cfgEngineABValue.stateToBlock);


