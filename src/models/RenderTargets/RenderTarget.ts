import type { TCorners } from "../../types/TCorners";
import type { TRenderData } from "../../types/TRenderData";
import type CornerRenderData from "../CornerRenderData";
const { Vector3, Quaternion, Euler } = THREE;
// Abstracted goal of this is to have different types of render targets with abstract methods for how to handle them within the scene
type TRenderTargetUpdateData = {
  marker: {
    found: boolean;
    current: {
      position: InstanceType<typeof Vector3>;
      scale: InstanceType<typeof Vector3>;
      rotation: InstanceType<typeof Vector3>;
      quaternion: InstanceType<typeof Quaternion>;
      euler: InstanceType<typeof Euler>;
    };
    historic: Array<TRenderData>;
  };
  corners: Record<TCorners, CornerRenderData>;
};

export default class RenderTarget {
  public async init(): Promise<void> {
    throw new Error(
      "Instance of Render target called init() without implementation"
    );
  }
  public createAFrameElement(): HTMLElement {
    throw new Error(
      "Instance of Render target called createHtmlAFrame() without implementation"
    );
  }
  public createAssets(): Array<HTMLElement> | undefined {
    throw new Error(
      "Instance of Render target called createAssets() without implementation"
    );
  }
  public onFirstSeen(): void {
    throw new Error(
      "Instance of Render target called onFirstSeen() without implementation"
    );
  }
  public onMarkerLost(): void {
    throw new Error(
      "Instance of Render target called onMarkerLost() without implementation"
    );
  }
  public onMarkerFound(): void {
    throw new Error(
      "Instance of Render target called onMarkerFound() without implementation"
    );
  }
  public tickUpdate(_data: TRenderTargetUpdateData): void {
    throw new Error(
      "Instance of Render target called tickUpdate() without implementation"
    );
  }
}

export type { TRenderTargetUpdateData };
