import "./Controls.css";
import { Control } from "./Control/Control";
import PubSub from "../PubSub/PubSub";

type TControlsInput = {
  controls: Array<Control>;
};

export class Controls {
  private modal: HTMLElement;
  private controls: Array<Control> = [];
  constructor(input: TControlsInput) {
    const body = document.querySelector("body");
    if (!body) throw new Error("Nullish Body");

    const modal = document.createElement("div");
    const inner = document.createElement("div");
    modal.classList.add("controls-wrapper");
    modal.classList.add("inactive");
    inner.classList.add("controls");

    this.controls.push(...input.controls);

    this.controls.forEach((c) => {
      inner.append(c.getElement());
    });
    this.modal = modal;
    modal.append(inner);
    body.appendChild(modal);

    this.registerOnMarkerFirstSeen();
  }
  private registerOnMarkerFirstSeen(): void {
    window.addEventListener(PubSub.eventNames.onMarkerFirstSeen, () => {
      this.modal.classList.remove("inactive");
      this.modal.classList.add("active");
    });
  }
}
