import RenderTarget from "../RenderTarget";
import RenderData from "../../RenderData";
import type {
  TVector3,
  TVector3Limits,
} from "../../../types/models/render/TVector3";
import type {
  TRenderTargetConstructorInput,
  TRenderTargetUpdateData,
} from "../RenderTarget";
import type { TRenderData } from "../../../types/models/render/TRenderData";
import type { Entity } from "aframe";
import { clamp } from "three/src/math/MathUtils.js";
import DEFAULT_ROTATION_LIMITS from "../_constants/DEFAULT_ROTATION_LIMITS";
import type { TVector2 } from "../../../types/models/render/TVector2";
import DEFAULT_POSITIONAL_OFFSET_VECTOR from "../_constants/DEFAULT_POSITIONAL_OFFSET_VECTOR";
import DEFAULT_SCALE_MULTIPLIER_VECTOR from "../_constants/DEFAULT_SCALE_MULTIPLIER_VECTOR";
import DEFAULT_ORIGIN_OFFSET_VECTOR from "../_constants/DEFAULT_ORIGIN_OFFSET_VECTOR";

export type TGltfModelRenderTarget = {
  modelName: string;
  modelUrl: string;
  scaleVector: TVector3;
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
  protected modelUrl: string;
  protected originOffsetVector: TVector3;

  constructor(input: TGltfModelRenderTarget) {
    super();
    this.name = input.name;
    this.markerDimensions = input.markerDimensions;
    this.positionalOffsetVector =
      input.positionalOffsetVector || DEFAULT_POSITIONAL_OFFSET_VECTOR;
    this.modelName = input.modelName;
    this.modelUrl = input.modelUrl;
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
    asset.setAttribute("src", this.modelUrl);
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
        "tickUpdate called in HlsVideoRenderTarget before renderObj initialized"
      );
    }

    // 1. Get averaged data for stability
    const avgMarkerData = JSON.parse(
      JSON.stringify(data.marker.average)
    ) as TRenderData;

    // Convert averaged rotation to THREE.js objects
    const avgQuaternion = new THREE.Quaternion();
    avgQuaternion.setFromEuler(
      new THREE.Euler(
        (avgMarkerData.rotation.x * Math.PI) / 180,
        (avgMarkerData.rotation.y * Math.PI) / 180,
        (avgMarkerData.rotation.z * Math.PI) / 180,
        "XYZ"
      )
    );

    const avgPosition = new THREE.Vector3(
      avgMarkerData.position.x,
      avgMarkerData.position.y,
      avgMarkerData.position.z
    );

    // Use a temporary scale vector for the plane projection matrix.
    // Z-scale is set to 1.0 for matrix composition stability.
    const tempAvgScale = new THREE.Vector3(
      avgMarkerData.scale.x,
      avgMarkerData.scale.y,
      1.0
    );

    // Create the marker's world transformation matrix
    const markerMatrix = new THREE.Matrix4();
    markerMatrix.compose(avgPosition, avgQuaternion, tempAvgScale);

    // 2. Define the local offset position *ON* the marker plane (Z=0).
    // This defines the corner position (e.g., bottom-left is x:-1, y:-1).
    const localPositionOnPlane = new THREE.Vector3(
      (this.markerDimensions.x / 2) * this.positionalOffsetVector.x,
      (this.markerDimensions.y / 2) * this.positionalOffsetVector.y,
      0 // Crucial: Z must be 0 here to calculate the point on the marker surface
    );

    // 3. Transform the local position on the plane to its world space coordinate.
    const worldPositionOnPlane =
      localPositionOnPlane.applyMatrix4(markerMatrix);

    // 4. Calculate the Z-offset in world space (perpendicular to the marker surface).
    // Get the marker's Z-axis (normal vector) by applying the marker's rotation to the Z-unit vector [0, 0, 1].
    const markerZAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(
      avgQuaternion
    );
    markerZAxis.normalize();

    // The final world position is the point on the plane plus the small Z-offset along the marker's normal.
    const finalWorldPosition = worldPositionOnPlane.add(
      markerZAxis.multiplyScalar(this.positionalOffsetVector.z)
    );

    // Clamp Rotations (This section remains unchanged and is correct)
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

    // Apply scale multiplier (This section remains unchanged and is correct)
    const finalScale = {
      x: avgMarkerData.scale.x * this.scaleVector.x,
      y: avgMarkerData.scale.y * this.scaleVector.y,
      z: avgMarkerData.scale.z * this.scaleVector.z,
    };

    this.renderData.update({
      position: {
        x: finalWorldPosition.x,
        y: finalWorldPosition.y,
        z: finalWorldPosition.z,
      },
      rotation: avgMarkerData.rotation,
      scale: finalScale,
    });

    RenderData.updateHtmlElement(this.renderData, this.renderObj);
  }

  public getRenderObj(): Entity | undefined {
    return this.renderObj;
  }
}
