import { Control } from "../Control";
import "../Control.css";

type TPlayPauseControlStates =
  | "Playing"
  | "Pressed Playing"
  | "Paused"
  | "Pressed Pause";

type TPlayPauseControlInput = {
  state: TPlayPauseControlStates;
  onPointerDown: (currentState: TPlayPauseControlStates) => void;
};

export default class PlayPauseControl extends Control {
  private image: HTMLImageElement;
  protected element: HTMLElement;
  protected state: TPlayPauseControlStates;
  protected onPointerDown: (currentState: TPlayPauseControlStates) => void;
  static stateData: Array<{
    name: TPlayPauseControlStates;
    imageUrl: string;
  }> = [
    {
      name: "Playing",
      imageUrl: "assets/icons/Pause_default.png",
    },
    {
      name: "Pressed Playing",
      imageUrl: "assets/icons/Pause_press.png",
    },
    {
      name: "Paused",
      imageUrl: "assets/icons/Play_default.png",
    },
    {
      name: "Pressed Pause",
      imageUrl: "assets/icons/Play_press.png",
    },
  ];
  constructor(input: TPlayPauseControlInput) {
    super();
    this.state = input.state;
    this.onPointerDown = input.onPointerDown;
    const button = document.createElement("button");
    button.classList.add("control");
    const img = document.createElement("img");
    img.classList.add("control-img");
    this.element = button;
    this.image = img;
    this.updateImageSrc(this.state);
    button.appendChild(img);

    button.addEventListener("pointerdown", () => {
      const currentState = this.getState();
      switch (currentState) {
        case "Playing": {
          this.updateImageSrc("Pressed Pause");
          this.state = "Pressed Pause";
          break;
        }
        case "Pressed Playing": {
          this.updateImageSrc("Pressed Pause");
          this.state = "Pressed Pause";
          break;
        }
        case "Paused": {
          this.updateImageSrc("Pressed Playing");
          this.state = "Pressed Playing";
          break;
        }
        case "Pressed Pause": {
          this.updateImageSrc("Pressed Playing");
          this.state = "Pressed Playing";
          break;
        }
      }
      this.onPointerDown(currentState);
    });

    button.addEventListener("pointerup", () => {
      switch (this.getState()) {
        case "Playing": {
          this.updateImageSrc("Playing");
          this.state = "Playing";
          break;
        }
        case "Pressed Playing": {
          this.updateImageSrc("Playing");
          this.state = "Playing";
          break;
        }
        case "Paused": {
          this.updateImageSrc("Paused");
          this.state = "Paused";
          break;
        }
        case "Pressed Pause": {
          this.updateImageSrc("Paused");
          this.state = "Paused";
          break;
        }
      }
    });
  }
  private getState(): TPlayPauseControlStates {
    return this.state;
  }
  private updateImageSrc(state: TPlayPauseControlStates) {
    const currentStateDataImgSrc =
      PlayPauseControl.stateData.find((s) => s.name === state)?.imageUrl || "";
    this.image.src = currentStateDataImgSrc;
  }
  public getElement() {
    return this.element;
  }
}
