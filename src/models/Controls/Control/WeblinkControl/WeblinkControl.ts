import { Control } from "../Control";
import "../Control.css";

type TWeblinkControlStates = "Default" | "Pressed";

type TWeblinkControlInput = {
  weblinkUrl: string;
  state: TWeblinkControlStates;
};

export default class WeblinkControl extends Control {
  private image: HTMLImageElement;
  protected element: HTMLElement;
  protected state: TWeblinkControlStates;
  protected weblinkUrl: string;
  static stateData: Array<{
    name: TWeblinkControlStates;
    imageUrl: string;
  }> = [
    {
      name: "Default",
      imageUrl: "assets/icons/Website_default.png",
    },
    {
      name: "Pressed",
      imageUrl: "assets/icons/Website_press.png",
    },
  ];
  constructor(input: TWeblinkControlInput) {
    super();
    this.weblinkUrl = input.weblinkUrl;
    this.state = input.state;
    const button = document.createElement("button");
    button.classList.add("control");
    const img = document.createElement("img");
    img.classList.add("control-img");
    this.element = button;
    this.image = img;
    this.updateImageSrc(this.state);
    button.appendChild(img);

    button.addEventListener("pointerdown", () => {
      this.updateImageSrc("Pressed");
      this.state = "Pressed";
    });

    button.addEventListener("pointerup", () => {
      this.updateImageSrc("Default");
      this.state = "Default";
      window.open(this.weblinkUrl, "_blank");
    });
  }
  private updateImageSrc(state: TWeblinkControlStates) {
    const currentStateDataImgSrc =
      WeblinkControl.stateData.find((s) => s.name === state)?.imageUrl || "";
    this.image.src = currentStateDataImgSrc;
  }
  public getElement() {
    return this.element;
  }
}
