import RenderTarget from "../RenderTarget";
import RenderData from "../../RenderData";
import type { TVector3, TVector3Limits } from "../../../types/TVector3";
import type {
  TRenderTargetConstructorInput,
  TRenderTargetUpdateData,
} from "../RenderTarget";
import type { TRenderData } from "../../../types/TRenderData";
import { clamp } from "three/src/math/MathUtils.js";
import type { Entity } from "aframe";
import DEFAULT_ROTATION_LIMITS from "../_constants/DEFAULT_ROTATION_LIMITS";
import type { TVector2 } from "../../../types/TVector2";
import DEFAULT_POSITIONAL_OFFSET_VECTOR from "../_constants/DEFAULT_POSITIONAL_OFFSET_VECTOR";

type TGifRenderTargetInput = {
  gifName: string;
  gifPath: string;
  drawableDimensions: TVector2;
} & TRenderTargetConstructorInput;

export default class GifRenderTarget extends RenderTarget {
  protected markerDimensions: TVector2;
  protected positionalOffsetVector: TVector3;
  protected renderObj: Entity | undefined;
  protected renderData: RenderData;
  protected vectorRotationLimits: TVector3Limits;
  protected gifName: string;
  protected gifPath: string;
  protected drawableDimensions: TVector2;

  constructor(input: TGifRenderTargetInput) {
    super();
    this.vectorRotationLimits =
      input.vectorRotationLimits || DEFAULT_ROTATION_LIMITS;
    this.positionalOffsetVector =
      input.positionalOffsetVector || DEFAULT_POSITIONAL_OFFSET_VECTOR;
    this.markerDimensions = input.markerDimensions;
    this.gifName = input.gifName;
    this.gifPath = input.gifPath;
    this.drawableDimensions = input.drawableDimensions;
    this.renderData = new RenderData();
  }

  public init(): Promise<void> {
    return new Promise((res, _rej) => {
      res();
    });
  }

  public createAssets(): Array<HTMLImageElement> {
    const img = document.createElement("img");
    img.setAttribute("id", this.gifName);
    img.setAttribute("src", this.gifPath);
    img.setAttribute("crossorigin", "anonymous");
    return [img];
  }

  public createAFrameElement(): Entity {
    if (this.renderObj === undefined) {
      const renderObj = document.createElement("a-plane") as Entity;
      renderObj.setAttribute("id", "gif-obj");
      renderObj.setAttribute("position", "1000 1000 -10");
      renderObj.setAttribute("rotation", "0 0 0");
      renderObj.setAttribute("scale", "1 1 1");
      renderObj.setAttribute("width", this.drawableDimensions.x.toString());
      renderObj.setAttribute("height", this.drawableDimensions.y.toString());
      renderObj.setAttribute("visible", "true");
      renderObj.setAttribute(
        "material",
        `src: #${this.gifName}; shader: flat;`
      );
      this.renderObj = renderObj;
    }

    return this.renderObj;
  }

  public onFirstSeen(): void {
    return;
  }

  public onMarkerFound(): void {
    return;
  }

  public onMarkerLost(): void {
    return;
  }

  public tickUpdate(data: TRenderTargetUpdateData): void {
    if (this.renderObj === undefined) {
      throw new Error(
        "tickUpdate called in GifRenderTarget before renderObj initialized"
      );
    }

    const avgMarkerData: TRenderData = data.marker.historic.reduce(
      (prev, curr) => {
        prev.position.x += curr.position.x;
        prev.position.y += curr.position.y;
        prev.position.z += curr.position.z;
        prev.rotation.x += curr.rotation.x;
        prev.rotation.y += curr.rotation.y;
        prev.rotation.z += curr.rotation.z;
        prev.scale.x += curr.scale.x;
        prev.scale.y += curr.scale.y;
        prev.scale.z += curr.scale.z;
        return prev;
      },
      {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0, y: 0, z: 0 },
      } as TRenderData
    );

    const count = data.marker.historic.length;
    avgMarkerData.position.x /= count;
    avgMarkerData.position.y /= count;
    avgMarkerData.position.z /= count;
    avgMarkerData.rotation.x /= count;
    avgMarkerData.rotation.y /= count;
    avgMarkerData.rotation.z /= count;
    avgMarkerData.scale.x /= count;
    avgMarkerData.scale.y /= count;
    avgMarkerData.scale.z /= count;

    avgMarkerData.rotation.x = clamp(
      avgMarkerData.rotation.x,
      this.vectorRotationLimits.x.min ?? -360,
      this.vectorRotationLimits.x.max ?? 360
    );
    avgMarkerData.rotation.y = clamp(
      avgMarkerData.rotation.y,
      this.vectorRotationLimits.y.min ?? -360,
      this.vectorRotationLimits.y.max ?? 360
    );
    avgMarkerData.rotation.z = clamp(
      avgMarkerData.rotation.z,
      this.vectorRotationLimits.z.min ?? -360,
      this.vectorRotationLimits.z.max ?? 360
    );

    this.renderData.update(avgMarkerData);
    RenderData.updateHtmlElement(this.renderData, this.renderObj);
  }
}
