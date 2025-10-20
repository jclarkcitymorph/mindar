import type { TVector3, TVector3Limits } from "../../../types/TVector3";
import type {
  TRenderTargetConstructorInput,
  TRenderTargetUpdateData,
} from "../RenderTarget";
import type { TRenderData } from "../../../types/TRenderData";
import type { Entity } from "aframe";
import type { TVector2 } from "../../../types/TVector2";
import Hls from "hls.js";
import RenderTarget from "../RenderTarget";
import RenderData from "../../RenderData";
import { clamp } from "three/src/math/MathUtils.js";
import DEFAULT_ROTATION_LIMITS from "../_constants/DEFAULT_ROTATION_LIMITS";
import DEFAULT_POSITIONAL_OFFSET_VECTOR from "../_constants/DEFAULT_POSITIONAL_OFFSET_VECTOR";
import DEFAULT_SCALE_MULTIPLIER_VECTOR from "../_constants/DEFAULT_SCALE_MULTIPLIER_VECTOR";

type THlsOnClickInput = {
  markerDimensions?: TVector2;
  positionalOffsetVector?: TVector3;
  scaleVector?: TVector3;
  renderData?: RenderData;
  vectorRotationLimits?: TVector3Limits;
  renderObj?: Entity | undefined;
  video?: HTMLVideoElement | undefined;
  videoUrl?: string;
  imageUrl?: string;
};

type THlsVideoRenderTargetInput = {
  videoUrl: string;
} & TRenderTargetConstructorInput;

export default class HlsVideoRenderTarget extends RenderTarget {
  protected name: string;
  protected markerDimensions: TVector2;
  protected positionalOffsetVector: TVector3;
  protected scaleVector: TVector3;
  protected renderData: RenderData;
  protected vectorRotationLimits: TVector3Limits;
  protected renderObj: Entity | undefined;
  protected video: HTMLVideoElement | undefined;
  protected videoUrl: string;
  protected onClickHandler: ((input: THlsOnClickInput) => void) | undefined;
  constructor(input: THlsVideoRenderTargetInput) {
    super();
    this.name = input.name;
    this.scaleVector = input.scaleVector || DEFAULT_SCALE_MULTIPLIER_VECTOR;
    this.markerDimensions = input.markerDimensions;
    this.positionalOffsetVector =
      input.positionalOffsetVector || DEFAULT_POSITIONAL_OFFSET_VECTOR;
    this.renderData = new RenderData();
    this.vectorRotationLimits =
      input.vectorRotationLimits || DEFAULT_ROTATION_LIMITS;
    this.videoUrl = input.videoUrl;
  }
  public init(): Promise<void> {
    return new Promise((res, _rej) => {
      if (this.video === undefined)
        throw new Error("video asset must first be defined");
      if (Hls.isSupported()) {
        console.log("HLS Supported");
        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: false,
          maxBufferLength: 10,
          maxMaxBufferLength: 20,
          maxBufferSize: 60 * 1000 * 1000,
        });

        hls.loadSource(this.videoUrl);
        hls.attachMedia(this.video);

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error("HLS Error:", data);
        });
      } else if (this.video.canPlayType("application/vnd.apple.mpegurl")) {
        console.log("HLS Not Supported");
        // Safari native HLS support
        this.video.src = this.videoUrl;
      }
      res();
    });
  }
  public createAssets(): Array<HTMLVideoElement> {
    if (this.video === undefined) {
      const video = document.createElement("video");
      video.setAttribute("id", "hls-video");
      video.setAttribute("preload", "metadata");
      video.setAttribute("crossorigin", "anonymous");
      video.setAttribute("muted", "true");
      video.setAttribute("playsinline", "true");
      video.setAttribute("loop", "true");
      video.setAttribute("muted", "true");
      this.video = video;
    }

    return [this.video];
  }
  public createAFrameElement(): Entity {
    if (this.renderObj === undefined) {
      const renderObj = document.createElement("a-plane");
      renderObj.setAttribute("id", "obj");
      renderObj.setAttribute("position", "1000 1000 -10");
      renderObj.setAttribute("rotation", "0 0 0");
      renderObj.setAttribute("scale", "1 1 1");
      renderObj.setAttribute("width", "1");
      renderObj.setAttribute("height", ".57");
      renderObj.setAttribute("visible", "true");
      renderObj.setAttribute("material", "src: #hls-video; shader: flat;");
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
  public onClick(): void {
    if (this.onClickHandler) {
      this.onClickHandler({
        markerDimensions: this.markerDimensions,
        positionalOffsetVector: this.positionalOffsetVector,
        video: this.video,
        renderData: this.renderData,
        renderObj: this.renderObj,
        scaleVector: this.scaleVector,
        vectorRotationLimits: this.vectorRotationLimits,
        videoUrl: this.videoUrl,
      });
    }
  }
  public tickUpdate(data: TRenderTargetUpdateData): void {
    if (this.renderObj === undefined) {
      throw new Error(
        "tickUpdate called in HlsVideoRenderTarget before renderObj initialized"
      );
    }

    // Use averaged data for stability
    const avgMarkerData = JSON.parse(
      JSON.stringify(data.marker.average)
    ) as TRenderData;

    // Convert averaged rotation back to quaternion for proper matrix composition
    const avgQuaternion = new THREE.Quaternion();
    const avgEuler = new THREE.Euler(
      (avgMarkerData.rotation.x * Math.PI) / 180,
      (avgMarkerData.rotation.y * Math.PI) / 180,
      (avgMarkerData.rotation.z * Math.PI) / 180,
      "XYZ"
    );
    avgQuaternion.setFromEuler(avgEuler);

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
    // This handles rotation and position, but we need to handle z-offset separately
    const worldPosition = localPosition.applyMatrix4(markerMatrix);

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
      rotation: avgMarkerData.rotation,
      scale: finalScale,
    });

    RenderData.updateHtmlElement(this.renderData, this.renderObj);
  }
  public getRenderObj(): Entity | undefined {
    return this.renderObj;
  }
  public getVideoObj(): HTMLVideoElement | undefined {
    return this.video;
  }
  public setOnClickVideoHandler(
    func: ((input: THlsOnClickInput) => void) | undefined
  ) {
    this.onClickHandler = func;
  }
}
