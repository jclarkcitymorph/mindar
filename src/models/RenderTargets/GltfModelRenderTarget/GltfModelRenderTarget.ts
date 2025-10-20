import RenderTarget from "../RenderTarget";
import RenderData from "../../RenderData";
import type { TVector3, TVector3Limits } from "../../../types/TVector3";
import type {
  TRenderTargetConstructorInput,
  TRenderTargetUpdateData,
} from "../RenderTarget";
import type { TRenderData } from "../../../types/TRenderData";
import type { Entity } from "aframe";
import { clamp } from "three/src/math/MathUtils.js";
import DEFAULT_ROTATION_LIMITS from "../_constants/DEFAULT_ROTATION_LIMITS";
import type { TVector2 } from "../../../types/TVector2";
import DEFAULT_POSITIONAL_OFFSET_VECTOR from "../_constants/DEFAULT_POSITIONAL_OFFSET_VECTOR";
import DEFAULT_SCALE_MULTIPLIER_VECTOR from "../_constants/DEFAULT_SCALE_MULTIPLIER_VECTOR";

type TGltfModelRenderTarget = {
  modelName: string;
  modelPath: string;
} & TRenderTargetConstructorInput;

export default class GltfModelRenderTarget extends RenderTarget {
  protected name: string;
  protected markerDimensions: TVector2;
  protected positionalOffsetVector: TVector3;
  protected scaleVector: TVector3;
  protected vectorRotationLimits: TVector3Limits;
  protected renderData: RenderData;
  protected renderObj: Entity | undefined;
  protected modelName: string;
  protected modelPath: string;

  constructor(input: TGltfModelRenderTarget) {
    super();
    this.name = input.name;
    this.markerDimensions = input.markerDimensions;
    this.positionalOffsetVector =
      input.positionalOffsetVector || DEFAULT_POSITIONAL_OFFSET_VECTOR;
    this.modelName = input.modelName;
    this.modelPath = input.modelPath;
    this.renderData = new RenderData();
    this.vectorRotationLimits =
      input.vectorRotationLimits || DEFAULT_ROTATION_LIMITS;
    this.scaleVector = input.scaleVector || DEFAULT_SCALE_MULTIPLIER_VECTOR;
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

    // Grab Average Data
    const avgMarkerData = JSON.parse(
      JSON.stringify(data.marker.average)
    ) as TRenderData;

    // Store original marker scale BEFORE applying scaleVector multiplier
    const originalMarkerScale = {
      x: avgMarkerData.scale.x,
      y: avgMarkerData.scale.y,
      z: avgMarkerData.scale.z,
    };

    // Apply Scale multiplier to the object (for rendering)
    avgMarkerData.scale.x *= this.scaleVector.x;
    avgMarkerData.scale.y *= this.scaleVector.y;
    avgMarkerData.scale.z *= this.scaleVector.z;

    // Clamp Rotations
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

    // Calculate the local offset using ORIGINAL marker scale (not the modified scale)
    const localOffset = new THREE.Vector3(
      (this.markerDimensions.x / 2) *
        this.positionalOffsetVector.x *
        originalMarkerScale.x,
      (this.markerDimensions.y / 2) *
        this.positionalOffsetVector.y *
        originalMarkerScale.y,
      1 * this.positionalOffsetVector.z * originalMarkerScale.z
    );

    // Rotate the offset by the marker's rotation
    const euler = new THREE.Euler(
      (avgMarkerData.rotation.x * Math.PI) / 180,
      (avgMarkerData.rotation.y * Math.PI) / 180,
      (avgMarkerData.rotation.z * Math.PI) / 180,
      "XYZ" // Adjust rotation order if needed
    );
    localOffset.applyEuler(euler);

    // Apply the rotated offset to the marker's position
    const finalPosition: TVector3 = {
      x: avgMarkerData.position.x + localOffset.x,
      y: avgMarkerData.position.y + localOffset.y,
      z: avgMarkerData.position.z + localOffset.z,
    };

    this.renderData.update({
      position: finalPosition,
      rotation: avgMarkerData.rotation,
      scale: avgMarkerData.scale, // This uses the multiplied scale for rendering
    });

    RenderData.updateHtmlElement(this.renderData, this.renderObj);
  }
  public getRenderObj(): Entity | undefined {
    return this.renderObj;
  }
}
