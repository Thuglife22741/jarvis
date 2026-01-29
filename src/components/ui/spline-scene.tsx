"use client";

import { Suspense, lazy } from "react";
// Carregamento dinâmico para performance
const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <span className="loader text-cyan-500">Iniciando Sistemas...</span>
        </div>
      }
    >
      <Spline
        scene={scene}
        className={className}
        // Garante que o Spline receba eventos do mouse
        onLoad={(splineApp) => {
          console.log("JARVIS: Interface 3D Carregada");
        }}
      />
    </Suspense>
  );
}
