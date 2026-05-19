"use client"
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export const Footer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleManualClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleProceed = () => {
    setIsModalOpen(false);
    // Using encodeURI handles the spaces safely
    const pdfPath = encodeURI('/AutomataLab-User-Manual.pdf');
    window.open(pdfPath, '_blank');
  };

  return (
    <>
      <footer className="footer">
        <span className="footer-set">© 2026 AutomataLab</span>
        <span className="footer-separator">|</span>
        <span className="footer-set">Group 3 - BCS32</span>
        <span className="footer-separator">|</span>
        <span className="footer-set">
          <a href="#" onClick={handleManualClick}>User Manual</a>
        </span>
      </footer>

      {/* Pop-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md p-8 bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
            
            {/* Close Button (X) */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-4 text-gray-400 hover:text-black transition-colors text-2xl font-light"
            >
              &times;
            </button>

            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight text-black text-center">External Redirection</h2>
              <p className="text-sm text-gray-600 leading-relaxed text-center">
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
                  className="flex-1 border-gray-200 font-bold py-5 text-black"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
