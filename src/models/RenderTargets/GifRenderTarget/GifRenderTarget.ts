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

type TGifRenderTargetInput = {
  dimensions: TVector2;
  gifUrl: string;
  transparencyTarget?: TGifTransparencyTarget;
} & TRenderTargetConstructorInput;

type TGifTransparencyTarget = {
  red: number; // 0 - 255
  green: number; // 0 - 255
  blue: number; // 0 - 255
  tolerance: number; // 0 - 1
};

type TGifTransparencyTargetExpanded = {
  redMin: number;
  redMax: number;
  greenMin: number;
  greenMax: number;
  blueMin: number;
  blueMax: number;
};

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
  protected transparencyTargetExpanded:
    | TGifTransparencyTargetExpanded
    | undefined;

  // Gif Status
  protected hasStarted: boolean = false;
  protected initialized: boolean = false;
  protected parsedGif: ParsedGif | undefined;
  protected parsedFrames: Array<ParsedFrame> | undefined;
  protected currentFrame: number = 0;
  protected frameDelayTotals: Array<number> = [];
  protected timeFor0thFrame: number = 0;
  protected timesToRepeat: number = -1; // -1 infinite,

  constructor(input: TGifRenderTargetInput) {
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
    if (input.transparencyTarget) {
      const { red, blue, green, tolerance } = input.transparencyTarget;
      const toleranceRange = 255 * tolerance;

      this.transparencyTargetExpanded = {
        redMin: Math.max(0, red - toleranceRange),
        redMax: Math.min(255, red + toleranceRange),
        greenMin: Math.max(0, green - toleranceRange),
        greenMax: Math.min(255, green + toleranceRange),
        blueMin: Math.max(0, blue - toleranceRange),
        blueMax: Math.min(255, blue + toleranceRange),
      };
    }
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
          console.log({
            name: this.name,
            disposalType: this.parsedFrames
              .map((f) => f.disposalType)
              .join(", "),
          });
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

    // Step 1: Clamp rotations
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

    // Step 2: Calculate final scale
    const finalScale = {
      x: avgMarkerData.scale.x * this.scaleVector.x,
      y: avgMarkerData.scale.y * this.scaleVector.y,
      z: avgMarkerData.scale.z * this.scaleVector.z,
    };

    // Step 3: Calculate the attachment point offset in marker's local space
    const attachmentOffset = {
      x:
        this.markerDimensions.x *
        avgMarkerData.scale.x *
        this.positionalOffsetVector.x *
        0.5,
      y:
        this.markerDimensions.y *
        avgMarkerData.scale.y *
        this.positionalOffsetVector.y *
        0.5,
      z: 0 * avgMarkerData.scale.z * this.positionalOffsetVector.z * 0.5,
    };

    // Step 4: Calculate the child's origin offset in its local space
    const childOriginOffset = {
      x:
        this.dimensions.x *
        avgMarkerData.scale.x *
        this.originOffsetVector.x *
        0.5,
      y:
        this.dimensions.y *
        avgMarkerData.scale.y *
        this.originOffsetVector.y *
        0.5,
      z: 0,
    };

    // Step 5: Add Z-offset in local space to push child in front of marker
    // This value should be adjusted based on your scene scale
    const Z_OFFSET = 1; // Small offset to prevent z-fighting
    const localZOffset = {
      x: 0,
      y: 0,
      z: Z_OFFSET,
    };

    // Step 6: Rotate all offsets by the marker's rotation
    const rotatedAttachmentOffset = this.rotateVector(
      attachmentOffset,
      avgMarkerData.rotation
    );

    const rotatedChildOriginOffset = this.rotateVector(
      childOriginOffset,
      avgMarkerData.rotation
    );

    const rotatedZOffset = this.rotateVector(
      localZOffset,
      avgMarkerData.rotation
    );

    // Step 7: Calculate final position with Z-offset
    const finalPosition = {
      x:
        avgMarkerData.position.x +
        rotatedAttachmentOffset.x +
        rotatedChildOriginOffset.x +
        rotatedZOffset.x,
      y:
        avgMarkerData.position.y +
        rotatedAttachmentOffset.y +
        rotatedChildOriginOffset.y +
        rotatedZOffset.y,
      z:
        avgMarkerData.position.z +
        rotatedAttachmentOffset.z +
        rotatedChildOriginOffset.z +
        rotatedZOffset.z,
    };

    // Step 8: Use the same rotation as the marker
    this.renderData.update({
      position: finalPosition,
      rotation: avgMarkerData.rotation,
      scale: finalScale,
    });

    RenderData.updateHtmlElement(this.renderData, this.renderObj);
  }

  private rotateVector(vector: TVector3, rotation: TVector3): TVector3 {
    // Convert degrees to radians
    const rx = (rotation.x * Math.PI) / 180;
    const ry = (rotation.y * Math.PI) / 180;
    const rz = (rotation.z * Math.PI) / 180;

    let x = vector.x;
    let y = vector.y;
    let z = vector.z;

    // Rotate around Z axis
    let newX = x * Math.cos(rz) - y * Math.sin(rz);
    let newY = x * Math.sin(rz) + y * Math.cos(rz);
    x = newX;
    y = newY;

    // Rotate around Y axis
    newX = x * Math.cos(ry) + z * Math.sin(ry);
    let newZ = -x * Math.sin(ry) + z * Math.cos(ry);
    x = newX;
    z = newZ;

    // Rotate around X axis
    newY = y * Math.cos(rx) - z * Math.sin(rx);
    newZ = y * Math.sin(rx) + z * Math.cos(rx);
    y = newY;
    z = newZ;

    return { x, y, z };
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
        if (
          frame.disposalType === 2 ||
          frame.disposalType === 3 ||
          targetFrame === 0
        ) {
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

          if (this.transparencyTargetExpanded) {
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Check if pixel falls within tolerance range for all channels
              if (
                r >= this.transparencyTargetExpanded.redMin &&
                r <= this.transparencyTargetExpanded.redMax &&
                g >= this.transparencyTargetExpanded.greenMin &&
                g <= this.transparencyTargetExpanded.greenMax &&
                b >= this.transparencyTargetExpanded.blueMin &&
                b <= this.transparencyTargetExpanded.blueMax
              ) {
                data[i + 3] = 0; // Make transparent
              }
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
