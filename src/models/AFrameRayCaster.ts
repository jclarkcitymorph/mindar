import type { Entity } from "aframe";
import type { Camera } from "three";
import type RenderTarget from "./RenderTargets/RenderTarget";

type TAFrameRayCasterInput = {
  camera: Entity;
  canvas: HTMLCanvasElement;
  renderTargets: RenderTarget[];
};

export default class AFrameRayCaster {
  private camera: Entity;
  private canvas: HTMLCanvasElement;
  private renderTargets: Set<RenderTarget>;

  constructor(input: TAFrameRayCasterInput) {
    this.camera = input.camera;
    this.canvas = input.canvas;
    this.renderTargets = new Set(input.renderTargets);
    this.setupClickListener();
  }

  public addRenderTarget(target: RenderTarget): void {
    this.renderTargets.add(target);
  }

  private setupClickListener(): void {
    this.canvas.addEventListener("click", (event: MouseEvent) => {
      // Calculate normalized device coordinates from click position
      const rect = this.canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Get the Three.js camera from A-Frame camera entity
      const threeCamera = this.camera.getObject3D("camera") as Camera;

      if (!threeCamera) {
        console.warn("Camera not found");
        return;
      }

      // Create raycaster from camera through mouse position
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, threeCamera);

      // Check each render target
      for (const target of this.renderTargets) {
        const renderObj = target.getRenderObj();

        if (renderObj && renderObj.object3D) {
          const intersects = raycaster.intersectObject(
            renderObj.object3D,
            true // recursive
          );

          if (intersects.length > 0) {
            target.onClick();
            break;
          }
        }
      }
    });
  }
}
