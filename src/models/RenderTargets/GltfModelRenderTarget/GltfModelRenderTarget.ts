import RenderTarget from "../RenderTarget";
import RenderData from "../../RenderData";
import type { TVector3Limits } from "../../../types/TVector3";
import type { TRenderTargetUpdateData } from "../RenderTarget";
import type { TRenderData } from "../../../types/TRenderData";
import { clamp } from "three/src/math/MathUtils.js";
import type { Entity } from "aframe";
import { thickness } from "three/tsl";

type TGltfModelRenderTarget = {
  modelName: string;
  modelPath: string;
  rotationLimit?: TVector3Limits;
};

export default class GltfModelRenderTarget implements RenderTarget {
  private renderData: RenderData;
  private vectorRotationLimits: TVector3Limits;
  private renderObj: Entity | undefined;
  private modelName: string;
  private modelPath: string;

  constructor(input: TGltfModelRenderTarget) {
    this.modelName = input.modelName;
    this.modelPath = input.modelPath;
    this.renderData = new RenderData();
    //   {
    //   position: { x: 0, y: 0, z: -45 },
    //   rotation: { x: 0, y: 0, z: 0 },
    //   scale: { x: 35, y: 35, z: 35 },
    // }
    this.vectorRotationLimits = input.rotationLimit || defaultRotationLimits;
  }

  public init(): Promise<void> {
    return new Promise((res, _rej) => {
      const assetElement = document.getElementById(this.modelName);

      if (!assetElement) {
        console.error("Asset element not found:", this.modelName);
        res();
        return;
      }

      const setModelWhenReady = () => {
        if (this.renderObj) {
          this.renderObj.setAttribute("gltf-model", `#${this.modelName}`);
        }
        res();
      };

      if ((assetElement as any)["hasLoaded"]) {
        setModelWhenReady();
      } else {
        assetElement.addEventListener("loaded", setModelWhenReady);
      }
    });
  }

  public createAssets() {
    const asset = document.createElement("a-asset-item");
    asset.setAttribute("id", this.modelName);
    asset.setAttribute("src", this.modelPath);
    asset.setAttribute("response-type", "arraybuffer");
    return [asset];
  }

  public createAFrameElement(): Entity {
    if (this.renderObj === undefined) {
      const renderObj = document.createElement("a-entity") as Entity;
      renderObj.setAttribute("id", "gltf-obj");
      renderObj.setAttribute("position", "0 0 0");
      renderObj.setAttribute("rotation", "0 0 0");
      renderObj.setAttribute("scale", "0 0 0");
      renderObj.setAttribute("visible", "false");
      this.renderObj = renderObj;
    }

    return this.renderObj;
  }

  public onFirstSeen(): void {
    this.renderObj?.setAttribute("visible", "true");
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
        "tickUpdate called in GltfModelRenderTarget before renderObj initialized"
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
    avgMarkerData.scale.x *= 0.75;
    avgMarkerData.scale.y *= 0.75;
    avgMarkerData.scale.z *= 0.75;
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

const defaultRotationLimits: TVector3Limits = {
  x: {
    min: -25,
    max: 25,
  },
  y: {
    min: -25,
    max: 25,
  },
  z: {
    min: -25,
    max: 25,
  },
};
