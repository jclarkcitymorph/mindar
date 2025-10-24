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
import DEFAULT_ORIGIN_OFFSET_VECTOR from "../_constants/DEFAULT_ORIGIN_OFFSET_VECTOR";

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
  protected originOffsetVector: TVector3;

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
    this.originOffsetVector =
      input.originOffsetVector || DEFAULT_ORIGIN_OFFSET_VECTOR;
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

  public onClick(): void {
    return;
  }

  public tickUpdate(data: TRenderTargetUpdateData): void {
    if (this.renderObj === undefined) {
      throw new Error(
        "tickUpdate called in GltfModelRenderTarget before renderObj initialized"
      );
    }

    // Use averaged data for stability
    const avgMarkerData = data.marker.average;

    // Use the averaged quaternion directly (already normalized in SceneManager)
    const avgQuaternion = new THREE.Quaternion(
      avgMarkerData.quaternion.x,
      avgMarkerData.quaternion.y,
      avgMarkerData.quaternion.z,
      avgMarkerData.quaternion.w
    );

    // Convert averaged position and scale to THREE.js vectors
    const avgPosition = new THREE.Vector3(
      avgMarkerData.position.x,
      avgMarkerData.position.y,
      avgMarkerData.position.z
    );
    // Use unit scale for z-axis since marker is flat (z-scale is near 0)
    // This prevents degenerate matrix issues
    const avgScale = new THREE.Vector3(
      avgMarkerData.scale.x,
      avgMarkerData.scale.y,
      1.0
    );

    // Create the marker's world transformation matrix from averaged data
    const markerMatrix = new THREE.Matrix4();
    markerMatrix.compose(avgPosition, avgQuaternion, avgScale);

    // Define the local offset position (in marker's local space)
    // Note: Z offset should NOT be scaled by marker scale since marker is flat (z-scale ≈ 0)
    const localPosition = new THREE.Vector3(
      (this.markerDimensions.x / 2) * this.positionalOffsetVector.x,
      (this.markerDimensions.y / 2) * this.positionalOffsetVector.y,
      this.positionalOffsetVector.z
    );

    // Transform the local position to world space using the marker's matrix
    const worldPosition = localPosition.applyMatrix4(markerMatrix);

    // Convert quaternion to Euler for display/clamping if needed
    const euler = new THREE.Euler().setFromQuaternion(avgQuaternion, "XYZ");
    const rotation = {
      x: THREE.MathUtils.radToDeg(euler.x),
      y: THREE.MathUtils.radToDeg(euler.y),
      z: THREE.MathUtils.radToDeg(euler.z),
    };

    // Clamp Rotations
    rotation.x = clamp(
      rotation.x,
      this.vectorRotationLimits.x.min ?? -360,
      this.vectorRotationLimits.x.max ?? 360
    );
    rotation.y = clamp(
      rotation.y,
      this.vectorRotationLimits.y.min ?? -360,
      this.vectorRotationLimits.y.max ?? 360
    );
    rotation.z = clamp(
      rotation.z,
      this.vectorRotationLimits.z.min ?? -360,
      this.vectorRotationLimits.z.max ?? 360
    );

    // Apply scale multiplier
    const finalScale = {
      x: avgMarkerData.scale.x * this.scaleVector.x,
      y: avgMarkerData.scale.y * this.scaleVector.y,
      z: avgMarkerData.scale.z * this.scaleVector.z,
    };

    this.renderData.update({
      position: {
        x: worldPosition.x,
        y: worldPosition.y,
        z: worldPosition.z,
      },
      rotation,
      scale: finalScale,
    });

    RenderData.updateHtmlElement(this.renderData, this.renderObj);
  }

  public getRenderObj(): Entity | undefined {
    return this.renderObj;
  }
}
