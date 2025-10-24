import type { TVector3, TVector3Limits } from "../../../types/TVector3";
import type {
  TRenderTargetConstructorInput,
  TRenderTargetUpdateData,
} from "../RenderTarget";
import type { Entity } from "aframe";
import type { TVector2 } from "../../../types/TVector2";
import RenderTarget from "../RenderTarget";
import RenderData from "../../RenderData";
import { clamp } from "three/src/math/MathUtils.js";
import DEFAULT_ROTATION_LIMITS from "../_constants/DEFAULT_ROTATION_LIMITS";
import DEFAULT_POSITIONAL_OFFSET_VECTOR from "../_constants/DEFAULT_POSITIONAL_OFFSET_VECTOR";
import DEFAULT_SCALE_MULTIPLIER_VECTOR from "../_constants/DEFAULT_SCALE_MULTIPLIER_VECTOR";
import type { TRenderData } from "../../../types/TRenderData";
import {
  parseGIF,
  decompressFrames,
  type ParsedGif,
  type ParsedFrame,
} from "gifuct-js";
import type { Mesh } from "three";
import PubSub from "../../PubSub/PubSub";
import DEFAULT_ORIGIN_OFFSET_VECTOR from "../_constants/DEFAULT_ORIGIN_OFFSET_VECTOR";

export default class GifRenderTarget extends RenderTarget {
  protected name: string;
  protected markerDimensions: TVector2;
  protected positionalOffsetVector: TVector3;
  protected originOffsetVector: TVector3;
  protected scaleVector: TVector3;
  protected renderData: RenderData;
  protected vectorRotationLimits: TVector3Limits;
  protected renderObj: Entity | undefined;
  protected gifElement: HTMLCanvasElement | undefined;
  protected gifUrl: string;
  protected dimensions: TVector2;

  // Gif Status
  protected hasStarted: boolean = false;
  protected initialized: boolean = false;
  protected parsedGif: ParsedGif | undefined;
  protected parsedFrames: Array<ParsedFrame> | undefined;
  protected currentFrame: number = 0;
  protected frameDelayTotals: Array<number> = [];
  protected timeFor0thFrame: number = 0;
  protected timesToRepeat: number = -1; // -1 infinite,

  constructor(
    input: {
      dimensions: TVector2;
      gifUrl: string;
    } & TRenderTargetConstructorInput
  ) {
    super();
    this.name = input.name;
    this.scaleVector = input.scaleVector || DEFAULT_SCALE_MULTIPLIER_VECTOR;
    this.markerDimensions = input.markerDimensions;
    this.positionalOffsetVector =
      input.positionalOffsetVector || DEFAULT_POSITIONAL_OFFSET_VECTOR;
    this.renderData = new RenderData();
    this.vectorRotationLimits =
      input.vectorRotationLimits || DEFAULT_ROTATION_LIMITS;
    this.dimensions = input.dimensions;
    this.gifUrl = input.gifUrl;
    this.originOffsetVector =
      input.originOffsetVector || DEFAULT_ORIGIN_OFFSET_VECTOR;
    this.registerOnFirstSceneListener();
  }

  public init(): Promise<void> {
    return Promise.resolve();
  }

  public createAssets(): Array<HTMLCanvasElement> {
    if (!this.gifElement) {
      const canvas = document.createElement("canvas");
      this.gifElement = canvas;
      canvas.id = `${this.name}-canvas`;

      fetch(this.gifUrl)
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          this.parsedGif = parseGIF(buffer);
          this.parsedFrames = decompressFrames(this.parsedGif, true);
          this.frameDelayTotals = this.parsedFrames.reduce(
            (prev, curr, index) => {
              if (index === 0) {
                prev.push(curr.delay);
              } else {
                prev.push(prev[index - 1] + curr.delay);
              }
              return prev;
            },
            [] as number[]
          );

          const bytes = new Uint8Array(buffer);
          const str = new TextDecoder().decode(bytes);

          const idx = str.indexOf("NETSCAPE2.0");
          if (idx === -1) {
            this.timesToRepeat = 0;
          } else {
            const loopCount = bytes[idx + 16] + (bytes[idx + 17] << 8);
            this.timesToRepeat = loopCount === 0 ? -1 : loopCount;
          }

          canvas.width = this.parsedGif.lsd.width;
          canvas.height = this.parsedGif.lsd.height;

          this.initialized = true;
        });
    }
    return [this.gifElement];
  }

  public createAFrameElement(): Entity {
    if (!this.renderObj) {
      const renderObj = document.createElement("a-plane");
      renderObj.setAttribute("id", `${this.name}-renderObj`);
      renderObj.setAttribute("position", "1000 1000 -10");
      renderObj.setAttribute("rotation", "0 0 0");
      renderObj.setAttribute("scale", "1 1 1");
      renderObj.setAttribute("width", this.dimensions.x.toString());
      renderObj.setAttribute("height", this.dimensions.y.toString());
      renderObj.setAttribute("visible", "true");

      // Use canvas with transparency
      renderObj.setAttribute(
        "material",
        `src: #${this.name}-canvas; transparent: true; alphaTest: 0.01`
      );

      this.renderObj = renderObj;
    }
    return this.renderObj;
  }

  public onClick(): void {
    return;
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
      x: avgMarkerData.scale.x * this.scaleVector.x,
      y: avgMarkerData.scale.y * this.scaleVector.y,
      z: avgMarkerData.scale.z * this.scaleVector.z,
    };

    avgMarkerData.position.x =
      avgMarkerData.position.x +
      this.markerDimensions.x *
        avgMarkerData.scale.x *
        this.positionalOffsetVector.x *
        0.5 +
      this.dimensions.x *
        avgMarkerData.scale.x *
        this.originOffsetVector.x *
        0.5;
    avgMarkerData.position.y =
      avgMarkerData.position.y +
      this.markerDimensions.y *
        avgMarkerData.scale.y *
        this.positionalOffsetVector.y *
        0.5 +
      this.dimensions.y *
        avgMarkerData.scale.y *
        this.originOffsetVector.y *
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

  private registerOnFirstSceneListener() {
    window.addEventListener(PubSub.eventNames.onMarkerFirstSeen, () => {
      if (!this.hasStarted) {
        this.hasStarted = true;
        this.currentFrame = 0;
        this.timeFor0thFrame = new Date().getTime();
        requestAnimationFrame(this.render.bind(this));
      }
    });
  }

  private render() {
    const canvas = this.gifElement;
    if (this.parsedFrames && this.parsedGif && canvas && this.renderObj) {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        requestAnimationFrame(this.render.bind(this));
        return;
      }

      const now = new Date().getTime();
      const diff = now - this.timeFor0thFrame;
      const totalDuration =
        this.frameDelayTotals[this.frameDelayTotals.length - 1];

      let adjustedDiff = diff;
      let animationFinished = false;

      if (this.timesToRepeat === -1) {
        adjustedDiff = diff % totalDuration;
      } else if (this.timesToRepeat > 0) {
        const loopNumber = Math.floor(diff / totalDuration);
        if (loopNumber < this.timesToRepeat) {
          adjustedDiff = diff % totalDuration;
        } else {
          animationFinished = true;
        }
      } else {
        if (diff > totalDuration) {
          animationFinished = true;
        }
      }

      if (animationFinished) {
        return;
      }

      // Find which frame we should be on
      let targetFrame = 0;
      for (let i = 0; i < this.frameDelayTotals.length; i++) {
        if (adjustedDiff < this.frameDelayTotals[i]) {
          targetFrame = i;
          break;
        }
      }

      if (targetFrame !== this.currentFrame) {
        const frame = this.parsedFrames[targetFrame];
        if (targetFrame === 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        // Render the new frame
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = frame.dims.width;
        tempCanvas.height = frame.dims.height;
        const tempCtx = tempCanvas.getContext("2d");

        if (tempCtx) {
          const imageData = tempCtx.createImageData(
            frame.dims.width,
            frame.dims.height
          );
          imageData.data.set(frame.patch);

          // Make black transparent =>
          // CUSTOM OVERWRITE OF ALPHA FOR ANYTHING UNDER 10
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 45 && data[i + 1] < 45 && data[i + 2] < 45) {
              data[i + 3] = 0;
            }
          }

          tempCtx.putImageData(imageData, 0, 0);
          ctx.drawImage(tempCanvas, frame.dims.left, frame.dims.top);
        }

        const mesh = this.renderObj.getObject3D("mesh") as Mesh;
        if (mesh && mesh.material && "map" in mesh.material) {
          const material = mesh.material as any;
          if (material.map) {
            material.map.needsUpdate = true;
          }
        }

        this.currentFrame = targetFrame;
      }

      requestAnimationFrame(this.render.bind(this));
    } else {
      requestAnimationFrame(this.render.bind(this));
    }
  }
}
