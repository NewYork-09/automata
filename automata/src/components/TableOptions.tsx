import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown } from "lucide-react";

export type ModelType = "dfa" | "cfg" | "pda";
export type RegexChoice = "regex1" | "regex2";

type Props = {
  selectedRegex: RegexChoice;
  setSelectedRegex: (v: RegexChoice) => void;
  selectedModel: ModelType;
  setSelectedModel: (v: ModelType) => void;
  handleNavigate: (id: string) => void;
};

export function TableOptions({
  selectedRegex,
  setSelectedRegex,
  selectedModel,
  setSelectedModel,
  handleNavigate,
}: Props) {
  // Mapping content for the third column
  const modelInfo = {
    dfa: {
      title: "Deterministic Finite Automaton",
      description: (
        <>
          <p className="leading-7">
            A <strong>Deterministic Finite Automaton (DFA)</strong> is a finite-state machine that accepts or rejects strings of symbols. It is "deterministic" because for every state and input symbol, there is exactly one transition to a next state.
          </p>
          <p className="mt-4 leading-7">
            It is formally defined by the 5-tuple 𝑀=(𝑄, Σ, 𝛿, 𝑞0, 𝐹). DFAs are the primary models for <strong>Regular Languages</strong> and are used extensively in lexical analysis.
          </p>
          <p className="mt-4 leading-7 text-muted-foreground italic">
            Commonly applied in simple pattern matching, search algorithms, and the control logic of vending machines or traffic lights.
          </p>
        </>
      ),
    },
    cfg: {
      title: "Context-Free Grammar",
      description: (
        <>
          <p className="leading-7">
            A <strong>Context-Free Grammar (CFG)</strong> is a formal grammar used to generate all possible strings in a given formal language. It describes the structure of sentences in a language by using recursive substitution rules.
          </p>
          <p className="mt-4 leading-7">
            A CFG is formally defined as 𝐺=(𝑉, Σ, 𝑅, 𝑆). They are more powerful than Regular Expressions and are essential for describing <strong>Programming Languages</strong> and nested structures like HTML or JSON.
          </p>
          <p className="mt-4 leading-7 text-muted-foreground italic">
            CFGs form the basis of most modern compilers and parsers, enabling machines to understand the nested syntax of code.
          </p>
        </>
      ),
    },
    pda: {
      title: "Pushdown Automaton",
      description: (
        <>
          <p className="leading-7">
            A <strong>Pushdown Automaton (PDA)</strong> is essentially a Finite Automaton with an added <strong>stack</strong> for memory. This stack allows it to "remember" an infinite amount of information in a Last-In, First-Out (LIFO) manner.
          </p>
          <p className="mt-4 leading-7">
            It is formally defined by the 7-tuple 𝑀=(𝑄, Σ, Γ, 𝛿, 𝑞0, 𝑍0, 𝐹). PDAs are the machines that recognize <strong>Context-Free Languages</strong>, allowing them to solve problems DFAs cannot, such as matching parentheses.
          </p>
          <p className="mt-4 leading-7 text-muted-foreground italic">
            By utilizing a stack, PDAs can track balance and symmetry, making them capable of parsing mathematical expressions and balanced delimiters.
          </p>
        </>
      ),
    },
  };

  const activeModel = modelInfo[selectedModel];

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-20">
      <div className="flex items-center gap-3 mb-4 mt-16 group">
  <h2 id="selector" className="text-2xl font-semibold text-left tracking-wide">
    Expression and Model Selector
  </h2>
  
  <button
    onClick={() => handleNavigate("configuration")}
    className="p-1 rounded-full cursor-pointer relative overflow-hidden hover:bg-gray-200"
    aria-label="Scroll to Configuration"
  >
    <ChevronDown
      size={28}
      className="text-[#74DCFF] stroke-[4]"
      style={{
        animation: 'bounce 0.3s ease-in-out infinite alternate',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.animation = 'none')}
      onMouseLeave={(e) =>
        (e.currentTarget.style.animation = 'bounce 0.3s ease-in-out infinite alternate')
      }
    />
    <style>
      {`
        @keyframes bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
      `}
    </style>
  </button>
</div>
      <Table className="table-fixed w-full border-collapse border-none">
        <TableBody>
          <TableRow className="align-top text-left border-none hover:bg-transparent">
            {/* Column 1: Regex */}
            <TableCell className="w-[21%] border-t border-r p-6 lg:p-8 !pl-0 align-top text-left whitespace-normal break-words">
              <h2 className="text-lg font-semibold mb-4">Regular Expressions</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-12">
                Select a regular expression to see how it translates to the chosen model.
              </p>

              <div className="space-y-5">
                <label className="w-full h-[85px] mb-7 flex items-center gap-4 bg-[#1a1a1a] text-white hover:bg-[#74DCFF] hover:text-black rounded-lg px-6 py-3 shadow-sm cursor-pointer transition-colors border-2 border-transparent hover:border-[#74DCFF]">
                  <input
                    type="radio"
                    name="regex"
                    value="regex1"
                    checked={selectedRegex === "regex1"}
                    onChange={() => setSelectedRegex("regex1")}
                    className="mt-1 h-5 w-5 shrink-0 accent-[#74DCFF] cursor-pointer"
                  />
                  <span className="text-sm font-mono break-all leading-tight">
                    (a+b) (a+b)* (aa+bb) (ab+ba)
                    <span className="block h-1.5"></span>
                    (a+b)* (aba+baa)
                  </span>
                </label>

                <label className="w-full h-[85px] flex items-center gap-4 bg-[#1a1a1a] text-white hover:bg-[#74DCFF] hover:text-black rounded-lg px-6 py-3 shadow-sm cursor-pointer transition-colors border-2 border-transparent hover:border-[#74DCFF]">
                  <input
                    type="radio"
                    name="regex"
                    value="regex2"
                    checked={selectedRegex === "regex2"}
                    onChange={() => setSelectedRegex("regex2")}
                    className="mt-1 h-5 w-5 shrink-0 accent-[#74DCFF] cursor-pointer"
                  />
                  <span className="text-sm font-mono break-all leading-tight">
                    (11+00) (1+0)* (101+111+01)
                    <span className="block h-1.5"></span>
                    (00*+11*) (1+0+11)
                  </span>
                </label>
              </div>
            </TableCell>

            {/* Column 2: Models */}
            <TableCell className="w-[24%] border-t p-6 lg:p-8 align-top text-left whitespace-normal break-words">
              <h2 className="text-lg font-semibold mb-4">Models of Computation</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-12">
                Choose the computational model to evaluate the string logic and behavior accurately.
              </p>

              <div className="space-y-5">
                {[
                  { id: "dfa", label: "Deterministic Finite Automaton" },
                  { id: "cfg", label: "Context-Free Grammar" },
                  { id: "pda", label: "Pushdown Automaton" },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="w-full h-[50px] mb-6 flex items-center gap-4 bg-[#1a1a1a] text-white hover:bg-[#74DCFF] hover:text-black rounded-lg px-6 py-3 shadow-sm cursor-pointer transition-all border-2 border-transparent hover:border-[#74DCFF]"
                  >
                    <input
                      type="radio"
                      name="model"
                      value={item.id}
                      checked={selectedModel === item.id}
                      onChange={() => setSelectedModel(item.id as ModelType)}
                      className="mt-1 h-5 w-5 shrink-0 accent-[#74DCFF] cursor-pointer"
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </TableCell>

            {/* Column 3: Dynamic Description */}
            <TableCell className="w-[40%] border-t border-l border-r border-b p-10 lg:p-10 align-top text-left whitespace-normal break-words">
              <h1 className="!text-4xl font-light tracking-tight leading-tight mb-8">
                What is {activeModel.title}?
              </h1>

              <div className="prose prose-sm max-w-none text-foreground">
                {activeModel.description}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
