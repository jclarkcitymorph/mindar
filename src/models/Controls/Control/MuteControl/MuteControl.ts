import { Control } from "../Control";
import "../Control.css";

type TMuteControlStates =
  | "Sound On"
  | "Pressed Sound On"
  | "Sound Off"
  | "Pressed Sound Off";

type TMuteControlInput = {
  state: TMuteControlStates;
  onPointerDown: (currentState: TMuteControlStates) => void;
};

export default class MuteControl extends Control {
  private image: HTMLImageElement;
  protected element: HTMLElement;
  protected state: TMuteControlStates;
  protected onPointerDown: (currentState: TMuteControlStates) => void;
  static stateData: Array<{
    name: TMuteControlStates;
    imageUrl: string;
  }> = [
    {
      name: "Sound On",
      imageUrl: "assets/icons/SoundOn_default.png",
    },
    {
      name: "Pressed Sound On",
      imageUrl: "assets/icons/SoundOn_press.png",
    },
    {
      name: "Sound Off",
      imageUrl: "assets/icons/SoundOff_default.png",
    },
    {
      name: "Pressed Sound Off",
      imageUrl: "assets/icons/SoundOff_press.png",
    },
  ];
  constructor(input: TMuteControlInput) {
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
      switch (this.getState()) {
        case "Sound On": {
          this.updateImageSrc("Pressed Sound Off");
          this.state = "Pressed Sound Off";
          break;
        }
        case "Pressed Sound On": {
          this.updateImageSrc("Pressed Sound Off");
          this.state = "Pressed Sound Off";
          break;
        }
        case "Sound Off": {
          this.updateImageSrc("Pressed Sound On");
          this.state = "Pressed Sound On";
          break;
        }
        case "Pressed Sound Off": {
          this.updateImageSrc("Pressed Sound On");
          this.state = "Pressed Sound On";
          break;
        }
      }
      this.onPointerDown(this.getState());
    });

    button.addEventListener("pointerup", () => {
      switch (this.getState()) {
        case "Sound On": {
          this.updateImageSrc("Sound On");
          this.state = "Sound On";
          break;
        }
        case "Pressed Sound On": {
          this.updateImageSrc("Sound On");
          this.state = "Sound On";
          break;
        }
        case "Sound Off": {
          this.updateImageSrc("Sound Off");
          this.state = "Sound Off";
          break;
        }
        case "Pressed Sound Off": {
          this.updateImageSrc("Sound Off");
          this.state = "Sound Off";
          break;
        }
      }
    });
  }
  private getState(): TMuteControlStates {
    return this.state;
  }
  private updateImageSrc(state: TMuteControlStates) {
    const currentStateDataImgSrc =
      MuteControl.stateData.find((s) => s.name === state)?.imageUrl || "";
    this.image.src = currentStateDataImgSrc;
  }
  public getElement() {
    return this.element;
  }
}
