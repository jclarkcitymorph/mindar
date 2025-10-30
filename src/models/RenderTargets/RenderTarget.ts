import type { Entity } from "aframe";
import type { TCorners } from "../../types/models/render/TCorners";
import type { TRenderData } from "../../types/models/render/TRenderData";
import type { TVector2 } from "../../types/models/render/TVector2";
import type {
  TVector3,
  TVector3Limits,
} from "../../types/models/render/TVector3";
import type CornerRenderData from "../CornerRenderData";
import type RenderData from "../RenderData";
import type { TVector } from "../../types/models/render/TVector";
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
    average: TRenderData;
  };
  corners: Record<TCorners, CornerRenderData>;
};

export type TRenderTargetConstructorInput = {
  name: string;
  markerOffsetVector?: TVector3;
  localOffsetVector?: TVector3;
  scaleVector?: TVector | TVector2 | TVector3;
  vectorRotationLimits?: TVector3Limits;
  markerDimensions: TVector2;
};

export default abstract class RenderTarget {
  protected abstract name: string;
  protected abstract markerDimensions: TVector2;
  protected abstract markerOffsetVector: TVector3;
  protected abstract localOffsetVector: TVector3;
  protected abstract scaleVector: TVector | TVector2 | TVector3;
  protected abstract renderData: RenderData;
  protected abstract renderObj: Entity | undefined;

  public abstract init(): Promise<void>;
  public abstract createAFrameElement(): HTMLElement;
  public abstract createAssets(): Array<HTMLElement> | undefined;
  public abstract tickUpdate(_data: TRenderTargetUpdateData): void;
  public abstract getRenderObj(): Entity | undefined;
  public abstract onClick(): void;
}

export type { TRenderTargetUpdateData };
