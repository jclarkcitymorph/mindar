export default class FpsData {
  private frameCount: number;
  private lastTime: number;
  private fps: number;

  constructor() {
    this.frameCount = 0;
    this.lastTime = 0;
    this.fps = 0;
  }

  public update(time: number) {
    this.frameCount++;

    // Calculate instantaneous FPS (time between this frame and last frame)
    if (this.lastTime > 0) {
      const deltaTime = time - this.lastTime;
      if (deltaTime > 0) {
        this.fps = Math.round(1000 / deltaTime);
      }
    }

    this.lastTime = time;
  }

  public get() {
    return {
      frameCount: this.frameCount,
      fps: this.fps,
    };
  }
}
