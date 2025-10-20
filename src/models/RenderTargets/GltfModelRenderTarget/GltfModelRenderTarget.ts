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

    // Apply Scale
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

    const rotatedOffset = this.rotateVectorWithThree(
      this.positionalOffsetVector,
      avgMarkerData.rotation
    );

    // Add the rotated offset to the parent's position
    avgMarkerData.position.x += rotatedOffset.x;
    avgMarkerData.position.y += rotatedOffset.y;
    avgMarkerData.position.z += rotatedOffset.z;

    this.renderData.update(avgMarkerData);
    RenderData.updateHtmlElement(this.renderData, this.renderObj);
  }
  private rotateVectorWithThree(
    vector: TVector3,
    rotation: TVector3
  ): TVector3 {
    // Create Three.js Vector3 from offset
    const vec = new THREE.Vector3(vector.x, vector.y, vector.z);

    // Create Euler rotation (assuming degrees, convert to radians)
    const euler = new THREE.Euler(
      (rotation.x * Math.PI) / 180,
      (rotation.y * Math.PI) / 180,
      (rotation.z * Math.PI) / 180,
      "XYZ" // Rotation order - adjust if needed (XYZ, YXZ, ZXY, ZYX, YZX, XZY)
    );

    // Apply rotation to the vector
    vec.applyEuler(euler);

    return { x: vec.x, y: vec.y, z: vec.z };
  }
}
