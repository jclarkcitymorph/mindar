import type { TCorners } from "./TCorners";

type TDebug =
  | {
      isDebugging: false;
    }
  | {
      isDebugging: true;
      elements: {
        devTools: HTMLElement;
        showHideBtn: HTMLElement;
        fps: {
          display: HTMLElement;
          foundMarker: HTMLElement;
        };
        marker: {
          position: HTMLElement;
          rotation: HTMLElement;
          scale: HTMLElement;
        };
        corners: Record<TCorners, HTMLElement>;
      };
    };

export type { TDebug };
