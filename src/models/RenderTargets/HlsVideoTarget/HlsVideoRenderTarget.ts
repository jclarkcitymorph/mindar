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

type THlsVideoRenderTargetInput = {
  videoUrl: string;
} & TRenderTargetConstructorInput;

export default class HlsVideoRenderTarget extends RenderTarget {
  protected markerDimensions: TVector2;
  protected positionalOffsetVector: TVector3;
  protected scaleVector: TVector3;
  protected renderData: RenderData;
  protected vectorRotationLimits: TVector3Limits;
  protected renderObj: Entity | undefined;
  protected video: HTMLVideoElement | undefined;
  protected videoUrl: string;
  constructor(input: THlsVideoRenderTargetInput) {
    super();
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
      renderObj.setAttribute("width", "1.6");
      renderObj.setAttribute("height", ".9");
      renderObj.setAttribute("visible", "true");
      renderObj.setAttribute("material", "src: #hls-video; shader: flat;");
      this.renderObj = renderObj;
    }

    return this.renderObj;
  }
  public onFirstSeen(): void {
    if (this.video === undefined)
      throw new Error(
        "Cannot call onFirstSeen() without initializing HlsVideoRenderTarget"
      );

    this.video.play();
  }
  public onMarkerFound(): void {
    return;
  }
  public onMarkerLost(): void {
    return;
  }
  public tickUpdate(data: TRenderTargetUpdateData): void {
    if (this.video === undefined || this.renderObj === undefined)
      throw new Error(
        "tickUpdate called in HlsVideoRenderTarget before video or renderObj initialized"
      );
    const avgMarkerData = JSON.parse(
      JSON.stringify(data.marker.average)
    ) as TRenderData;

    avgMarkerData.scale.x *= this.scaleVector.x;
    avgMarkerData.scale.y *= this.scaleVector.y;
    avgMarkerData.scale.z *= this.scaleVector.z;

    avgMarkerData.rotation.x = clamp(
      avgMarkerData.rotation.x,
      this.vectorRotationLimits.x.min || -360,
      this.vectorRotationLimits.x.max || 360
    );
    avgMarkerData.rotation.y = clamp(
      avgMarkerData.rotation.y,
      this.vectorRotationLimits.y.min || -360,
      this.vectorRotationLimits.y.max || 360
    );
    avgMarkerData.rotation.z = clamp(
      avgMarkerData.rotation.z,
      this.vectorRotationLimits.z.min || -360,
      this.vectorRotationLimits.z.max || 360
    );

    this.renderData.update(avgMarkerData);

    RenderData.updateHtmlElement(this.renderData, this.renderObj);
  }
}
