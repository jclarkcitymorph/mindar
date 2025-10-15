import Hls from "hls.js";
import RenderTarget from "../RenderTarget";
import RenderData from "../../RenderData";
import type { TVector3Limits } from "../../../types/TVector3";
import type { TRenderTargetUpdateData } from "../RenderTarget";
import type { TRenderData } from "../../../types/TRenderData";
import { clamp } from "three/src/math/MathUtils.js";
import type { Entity } from "aframe";

type THlsVideoRenderTargetInput = {
  videoUrl: string;
  rotationLimit?: TVector3Limits;
};

export default class HlsVideoRenderTarget implements RenderTarget {
  private isPlaying: boolean;
  private renderData: RenderData;
  private vectorRotationLimits: TVector3Limits;
  private renderObj: Entity | undefined;
  private video: HTMLVideoElement | undefined;
  private videoUrl: string;
  constructor(input: THlsVideoRenderTargetInput) {
    this.isPlaying = false;
    this.videoUrl = input.videoUrl;
    this.renderData = new RenderData();
    this.vectorRotationLimits = input.rotationLimit || defaultRotationLimits;
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

    const playPromise = this.video.play();
    playPromise
      .then(() => {
        this.isPlaying = true;
      })
      .catch((err) => {
        console.log(JSON.stringify({ err }));
      });
  }
  public onMarkerFound(): void {
    console.log(JSON.stringify({ isPlaying: this.isPlaying }));
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

const defaultRotationLimits: TVector3Limits = {
  x: {
    min: -5,
    max: 5,
  },
  y: {
    min: -5,
    max: 5,
  },
  z: {
    min: -15,
    max: 15,
  },
};
