"use client"
import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavbarProps {
  handleNavigate: (id: string) => void;
}

export function Navbar({ handleNavigate }: NavbarProps) {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  
  // State for the User Manual Modal
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY) < 5) return;
      
      if (currentScrollY < 10) setIsVisible(true);
      else if (currentScrollY > lastScrollY) setIsVisible(false);
      else setIsVisible(true);
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  const handleProceed = () => {
    setIsModalOpen(false);
    // Using encodeURI handles the spaces safely
    const pdfPath = encodeURI('/AutomataLab-User-Manual.pdf');
    window.open(pdfPath, '_blank');
  };

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 z-50 w-full flex justify-center transition-transform duration-300 ease-in-out",
          isVisible ? "translate-y-0" : "-translate-y-full" 
        )}
      >
        <div className="flex h-13 w-full items-center justify-between px-20 bg-gray-100 backdrop-blur-md border-gray-200 shadow-sm">
          <div className="font-bold text-xl tracking-tighter shrink-0 cursor-pointer" onClick={() => navigate("/")}>
            AUTOMATA<span className="font-light">LAB</span>
          </div>

          <div className="flex items-center gap-10">
            <nav className="flex items-center gap-8">
              <span 
                onClick={() => handleNavigate("selector")}
                className="text-xs font-semibold uppercase tracking-widest hover:text-black cursor-pointer transition-all hover:[text-shadow:_0.5px_0_0_currentColor]"
              >
                Selector
              </span>
              <span 
                onClick={() => handleNavigate("configuration")}
                className="text-xs font-semibold uppercase tracking-widest hover:text-black cursor-pointer transition-all hover:[text-shadow:_0.5px_0_0_currentColor]"
              >
                Configuration
              </span>
            </nav>

            <Button 
              variant="default" 
              size="sm"
              className="bg-[#1a1a1a] text-white hover:bg-[#74DCFF] hover:text-black hover:shadow-[0_5px_15px_rgba(0,0,0,0.4)] rounded-lg px-6 text-xs font-bold transition-all shrink-0"
              onClick={() => setIsModalOpen(true)} // Open modal instead of navigating
            >
              User Manual
            </Button>
          </div>
        </div>
      </header>

      {/* Pop-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-8 bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
            
            {/* Close Button (X) */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-4 text-gray-400 hover:text-black transition-colors text-2xl font-light"
            >
              &times;
            </button>

            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight">External Redirection</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                You are about to be redirected to the full User Manual documentation. 
                This will open in a new tab as a PDF file.
              </p>
              
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleProceed}
                  className="flex-1 bg-[#1a1a1a] text-white hover:bg-[#74DCFF] hover:text-black hover:shadow-[0_5px_15px_rgba(0,0,0,0.4)] font-bold py-5 transition-all"
                >
                  Proceed
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border-gray-200 font-bold py-5"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
