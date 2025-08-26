// Global type declarations for libraries loaded via script tags

import type * as AFrameTypes from "aframe";
import type * as ThreeTypes from "three";

declare global {
  // A-Frame globals
  const AFRAME: typeof AFrameTypes;

  // Three.js globals (A-Frame exposes THREE globally)
  const THREE: typeof ThreeTypes;

  // MindAR globals (if needed)
  const MINDAR: any;

  // HLS.js global (if needed)
  const Hls: any;

  // Extend the Window interface if you need to access these via window
  interface Window {
    AFRAME: typeof AFrameTypes;
    THREE: typeof ThreeTypes;
    MINDAR: any;
    Hls: any;
  }
}

export {}; // This makes the file a module
