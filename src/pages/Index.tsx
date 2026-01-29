import GridBackground from "@/components/GridBackground";
import JarvisHeader from "@/components/JarvisHeader";
import JarvisCore from "@/components/JarvisCore";
import AudioVisualizer from "@/components/AudioVisualizer";
import OrbitalRing from "@/components/OrbitalRing";
import TechLabels from "@/components/TechLabels";

import SplineRobotBackground from "@/components/SplineRobotBackground";
import { ElevenLabsProvider } from "@/contexts/ElevenLabsContext";

const Index = () => {
  return (
    <ElevenLabsProvider>
      <div className="relative min-h-screen w-full bg-background overflow-hidden">
        {/* 3D Robot Background */}
        <SplineRobotBackground />
        
        {/* Background grid - on top of robot */}
        <div className="relative z-10 pointer-events-none">
          <GridBackground />
        </div>

        {/* Header */}
        <JarvisHeader />

        {/* Main content - centered */}
        <main className="relative z-20 flex items-center justify-center min-h-screen pointer-events-none">
          {/* Orbital rings and particles */}
          <OrbitalRing />

          {/* Audio visualizer */}
          <AudioVisualizer />

          {/* Central core */}
          <JarvisCore />

          {/* Technical labels */}
          <TechLabels />

          {/* Footer Author Label */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-cyan-400/50 font-mono tracking-widest uppercase pointer-events-none z-50">
            By: Autor Fernando Cerqueira
          </div>
        </main>

      </div>
    </ElevenLabsProvider>
  );
};

export default Index;
