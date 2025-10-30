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
import type { TVector2 } from "../../../types/models/render/TVector2";
import Hls from "hls.js";
import RenderTarget from "../RenderTarget";
import RenderData from "../../RenderData";
import { clamp } from "three/src/math/MathUtils.js";
import DEFAULT_ROTATION_LIMITS from "../_constants/DEFAULT_ROTATION_LIMITS";
import DEFAULT_POSITIONAL_OFFSET_VECTOR from "../_constants/DEFAULT_POSITIONAL_OFFSET_VECTOR";
import DEFAULT_ORIGIN_OFFSET_VECTOR from "../_constants/DEFAULT_ORIGIN_OFFSET_VECTOR";
import dimensionsFromAspectRatio from "../../../utils/math/dimensionsFromAspectRatio";
import type { TVector } from "../../../types/models/render/TVector";

export type THlsOnClickInput = {
  markerDimensions?: TVector2;
  positionalOffsetVector?: TVector3;
  scaleVector?: TVector;
  renderData?: RenderData;
  vectorRotationLimits?: TVector3Limits;
  renderObj?: Entity | undefined;
  videoDimensions?: TVector2;
  video?: HTMLVideoElement | undefined;
  videoUrl?: string;
  imageUrl?: string;
};

export type THlsVideoRenderTargetInput = {
  videoUrl: string;
  aspectRatio: number;
  scaleVector: TVector;
} & TRenderTargetConstructorInput;

export default class HlsVideoRenderTarget extends RenderTarget {
  protected name: string;
  protected markerDimensions: TVector2;
  protected positionalOffsetVector: TVector3;
  protected originOffsetVector: TVector3;
  protected scaleVector: TVector;
  protected renderData: RenderData;
  protected vectorRotationLimits: TVector3Limits;
  protected renderObj: Entity | undefined;
  protected video: HTMLVideoElement | undefined;
  protected videoDimensions: TVector2;
  protected videoUrl: string;
  protected onClickHandler: ((input: THlsOnClickInput) => void) | undefined;
  constructor(input: THlsVideoRenderTargetInput) {
    super();
    this.name = input.name;
    this.scaleVector = input.scaleVector || 1;
    this.markerDimensions = input.markerDimensions;
    this.positionalOffsetVector =
      input.positionalOffsetVector || DEFAULT_POSITIONAL_OFFSET_VECTOR;
    this.renderData = new RenderData();
    this.vectorRotationLimits =
      input.vectorRotationLimits || DEFAULT_ROTATION_LIMITS;
    this.videoUrl = input.videoUrl;
    this.videoDimensions = dimensionsFromAspectRatio(input.aspectRatio);
    this.originOffsetVector =
      input.originOffsetVector ?? DEFAULT_ORIGIN_OFFSET_VECTOR;
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
      video.muted = true;
      this.video = video;
    }

    return [this.video];
  }
  public createAFrameElement(): Entity {
    if (this.renderObj === undefined) {
      const renderObj = document.createElement("a-plane");
      renderObj.setAttribute("id", "obj");
      renderObj.setAttribute("position", "1000 1000 -10"); // Overwritten by tickUpdate()
      renderObj.setAttribute("rotation", "0 0 0"); // Overwritten by tickUpdate()
      renderObj.setAttribute("scale", "1 1 1"); // Overwritten by tickUpdate()
      renderObj.setAttribute("width", this.videoDimensions.x.toString());
      renderObj.setAttribute("height", this.videoDimensions.y.toString());
      renderObj.setAttribute("visible", "true");
      renderObj.setAttribute("material", "src: #hls-video; shader: flat;");
      this.renderObj = renderObj;
    }

    return this.renderObj;
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
    if (!this.renderObj) {
      throw new Error("tickUpdate called before renderObj initialized");
    }

    const avgMarkerData = JSON.parse(
      JSON.stringify(data.marker.average)
    ) as TRenderData;

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

    const finalScale = {
      x: avgMarkerData.scale.x * this.scaleVector,
      y: avgMarkerData.scale.y * this.scaleVector,
      z: avgMarkerData.scale.z,
    };

    avgMarkerData.position.x =
      avgMarkerData.position.x +
      this.markerDimensions.x *
        avgMarkerData.scale.x *
        this.positionalOffsetVector.x *
        0.5;
    avgMarkerData.position.y =
      avgMarkerData.position.y +
      this.markerDimensions.y *
        avgMarkerData.scale.y *
        this.positionalOffsetVector.y *
        0.5;
    avgMarkerData.position.z =
      avgMarkerData.position.z +
      0 * avgMarkerData.scale.z * this.positionalOffsetVector.z * 0.5;

    this.renderData.update({
      position: avgMarkerData.position,
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
