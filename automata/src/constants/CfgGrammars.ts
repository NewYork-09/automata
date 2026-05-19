

export const Cfg01Grammar = {
    // --- VTPS: For the UI Presentation ---
    formal: {
        V: ["S", "A", "B", "C", "D", "E", "F", "G"],
        T: ["0", "1"],
        P: [
            "S -> ABCDG",
            "A -> 11 | 00",
            "B -> 1B | 0B | ε",
            "C -> 101 | 111 | 01",
            "D -> 0E | 1F",
            "E -> 0E | ε",
            "F -> 1F | ε",
            "G -> 1 | 0 | 11"
        ],
        S: "S",
    },

    // --- Engine Data: For the Trace Logic ---
    engine: {
        rules: {
            "A": [["11", "B"], ["00", "B"]], 
            "B": [["1", "B"], ["0", "B"], ["", "C"]],
            "C": [["101", "D"], ["111", "D"], ["01", "D"]],
            "D": [["0", "E"], ["1", "F"]], 
            "E": [["0", "E"], ["", "G"]], 
            "F": [["1", "F"], ["", "G"]], 
            "G": [["1", "ACCEPT"], ["0", "ACCEPT"], ["11", "ACCEPT"]]
        },
        sequence: ["A", "B", "C", "D", "G"],
        stateToBlock: { 
            "A": "A",
            "B": "B", 
            "C": "C", 
            "D": "D", 
            "E": "D", 
            "F": "D", 
            "G": "G", 
            "ACCEPT": "ACCEPT" 
        }
    }
};


export const CfgABGrammar = {
    // --- VTPS: For the UI Presentation ---
    formal: {
        V: ["S", "A", "B", "C", "D", "E"],
        T: ["a", "b"],
        P: [
            "S -> ABCDBE",
            "A -> a | b",
            "B -> a | b | ε",
            "C -> aa | bb",
            "D -> ab | ba",
            "E -> aba | baa"
        ],
        S: "S",
    },

    // --- Engine Data: For the Trace Logic ---
    engine: {
        rules: {
            "A": [["a", "B1"], ["b", "B1"]],
            "B1": [["a", "B1"], ["b", "B1"], ["", "C"]],
            "C": [["aa", "D"], ["bb", "D"]],
            "D": [["ab", "B2"], ["ba", "B2"]],
            "B2": [["a", "B2"], ["b", "B2"], ["", "E"]],
            "E": [["aba", "ACCEPT"], ["baa", "ACCEPT"]]
        },
        sequence: ["A", "B", "C", "D", "B", "E"],
        stateToBlock: { 
            "A": "A",
            "B1": "B",
            "C": "C",
            "D": "D",
            "B2": "B", 
            "E": "E", 
            "ACCEPT": "ACCEPT"
        }
    }
};