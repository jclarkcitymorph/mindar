import type { TDimensions } from "../types/models/render/TDimensions";
import type { TVector3 } from "../types/models/render/TVector3";

export default class CornerRenderData {
  private vector: TVector3;
  private dimensions: TDimensions;

  constructor() {
    this.vector = {
      x: 0,
      y: 0,
      z: 0,
    };
    this.dimensions = {
      width: 0,
      height: 0,
    };
  }
  public update({
    x,
    y,
    z,
    width,
    height,
  }: {
    x?: number;
    y?: number;
    z?: number;
    width?: number;
    height?: number;
  }) {
    if (typeof x === "number") {
      this.vector.x = x;
    }
    if (typeof y === "number") {
      this.vector.y = y;
    }
    if (typeof z === "number") {
      this.vector.z = z;
    }
    if (typeof width === "number") {
      this.dimensions.width = width;
    }
    if (typeof height === "number") {
      this.dimensions.height = height;
    }
  }
  public getPositionString() {
    return `${this.vector.x} ${this.vector.y} ${this.vector.z}`;
  }
  public getWidthString() {
    return `${this.dimensions.width}`;
  }
  public getHeightString() {
    return `${this.dimensions.height}`;
  }
  static updateHtmlElement(cornerData: CornerRenderData, element: HTMLElement) {
    element.setAttribute("position", cornerData.getPositionString());
    element.setAttribute("width", cornerData.getHeightString());
    element.setAttribute("height", cornerData.getHeightString());
  }
}
