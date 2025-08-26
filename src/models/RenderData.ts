import type { TRenderData } from "../types/TRenderData";
import type { TVector3 } from "../types/TVector3";

export default class RenderData {
  private data: TRenderData;
  constructor(input?: Partial<TRenderData>) {
    this.data = {
      position: {
        x: input?.position?.x || 0,
        y: input?.position?.y || 0,
        z: input?.position?.z || 0,
      },
      rotation: {
        x: input?.rotation?.x || 0,
        y: input?.rotation?.y || 0,
        z: input?.rotation?.z || 0,
      },
      scale: {
        x: input?.scale?.x || 0,
        y: input?.scale?.y || 0,
        z: input?.scale?.z || 0,
      },
    };
  }
  update(input: Partial<TRenderData>) {
    if (input.position) {
      this.data.position = input.position;
    }
    if (input.rotation) {
      this.data.rotation = input.rotation;
    }
    if (input.scale) {
      this.data.scale = input.scale;
    }
  }
  getPosition(): TVector3 {
    return { ...this.data.position };
  }
  getRotation(): TVector3 {
    return { ...this.data.rotation };
  }
  getScale(): TVector3 {
    return { ...this.data.scale };
  }
  static updateHtmlElement(renderData: RenderData, element: HTMLElement) {
    const pos = renderData.getPosition();
    const rot = renderData.getRotation();
    const scl = renderData.getScale();
    element.setAttribute("position", `${pos.x} ${pos.y} ${pos.z}`);
    element.setAttribute("rotation", `${rot.x} ${rot.y} ${rot.z}`);
    element.setAttribute("scale", `${scl.x} ${scl.y} ${scl.z}`);
  }
}
