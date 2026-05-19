import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
// @ts-ignore
import PixelBlast from "./ui/PixelBlast";

export function HeroSection() {
  return (
    <section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[80vh] flex items-center justify-center overflow-hidden bg-white">
      {/* Background Layer */}
      <div style={{ width: '1080px', height: '1080px', position: 'relative' }}>
        <PixelBlast
            variant="square"
            pixelSize={4}
            color="#B19EEF"
            patternScale={2}
            patternDensity={1}
            enableRipples
            rippleSpeed={0.3}
            rippleThickness={0.1}
            rippleIntensityScale={1}
            speed={0.85}
            transparent
            edgeFade={0.25}
        />
        </div>
    </section>
  )
}