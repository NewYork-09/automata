import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { TableOptions } from "../components/TableOptions";
import { AutomataSimulator } from "@/components/AutomataSimulator";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import LetterGlitch from "@/components/LetterGlitch";
import { ReactFlowProvider } from '@xyflow/react';
type ModelType = "dfa" | "cfg" | "pda";
type RegexChoice = "regex1" | "regex2";

function Home() {
  const { state } = useLocation();
  const [selectedRegex, setSelectedRegex] = useState<RegexChoice>("regex1");
  const [selectedModel, setSelectedModel] = useState<ModelType>("dfa");

  const handleNavigate = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      const yOffset = id === "configuration" ? -20 : -120; 
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (state?.scrollTo) {
      const element = document.getElementById(state.scrollTo);
      element?.scrollIntoView({ behavior: "smooth" });
    }
  }, [state]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Navbar handleNavigate={handleNavigate} />

      <div className="flex flex-col w-full">
        {/* --- HERO SECTION --- */}
        <div 
          className="relative h-[750px] bg-[#1a1a1a] overflow-hidden flex items-center"
          style={{
            width: '100vw',
            position: 'relative',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw'
          }}
        >
          {/* Background Layer */}
          <div className="absolute inset-0 z-0">
            <div style={{ width: '100vw', height: '100%', display: 'block' }}>
              <LetterGlitch
                key="hero-glitch" 
                glitchColors={["#74dcff3a", "#272727", "#212121"]}
                glitchSpeed={50}
                centerVignette
                outerVignette={false}
                smooth
              />
            </div>
          </div>

          {/* Foreground Content */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-20 flex flex-col justify-center items-center">
            <h1 className="text-6xl font-bold tracking-tight text-white text-center mb-15">
              How do machines <span className="text-[#74DCFF]">think?</span>
            </h1>
            <p className="text-gray-400 max-w-3xl text-xl text-center mx-auto mb-10 leading-relaxed">
              <strong className="text-[#FFFFFF]">Automata theory</strong> is the study of abstract machines and the computational problems they can solve. 
              Dive into the mathematical foundations of computer science!
            </p>

            <p className="text-gray-400 max-w-3xl text-xl text-center mx-auto mb-10 leading-relaxed">
              <strong className="text-[#FFFFFF]">Want to try it out?</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => scrollToSection('docs')}
                className="w-full h-[50px] flex items-center gap-4 bg-[#1a1a1a] text-white hover:bg-[#74DCFF] hover:text-black rounded-lg border-2 border-[#74DCFF] px-6 py-3 cursor-pointer transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>

        {/* Title Section */}
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-20 mt-30 mb-1">
          <div className="flex flex-col items-start">
             <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
               Automata Theory Playground
             </h1>
             <p className="text-muted-foreground mt-2 max-w-2xl">
               Explore Regular Expressions and their corresponding computational models.
             </p>
          </div>
        </div>

        {/* --- MODEL CHOICES & SIMULATOR --- */}
        <div className="py-10">
          <div id="docs" className="scroll-mt-20"> 
            <TableOptions
              selectedRegex={selectedRegex}
              setSelectedRegex={setSelectedRegex}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              handleNavigate={handleNavigate}
            />
          </div>

          <div
            id="simulator"
            className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-4 md:px-13 mt-15 scroll-mt-20"
          >
            <ReactFlowProvider> {/* Allows the usage of useReactFlow hook */}
              <AutomataSimulator 
                selectedRegex={selectedRegex} 
                selectedModel={selectedModel} 
                handleNavigate={handleNavigate} 
              />
            </ReactFlowProvider>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Home;
