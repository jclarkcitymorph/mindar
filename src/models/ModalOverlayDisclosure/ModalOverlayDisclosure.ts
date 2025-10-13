import "./ModalOverlayDisclosure.css";

export class ModalOverlayDisclosure {
  constructor() {
    const body = document.querySelector("body");
    if (!body) throw new Error("Nullish Body");

    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";

    const disclosureContainer = document.createElement("section");
    disclosureContainer.className = "modal-overlay__container";

    const disclosureTitle = document.createElement("h1");
    disclosureTitle.className = "modal-overlay__title";
    disclosureTitle.innerText =
      "This experience requires you to acknowledge a video will autoplay";

    const disclosureButton = document.createElement("button");
    disclosureButton.className = "modal-overlay__button";
    disclosureButton.innerText = "Accept";

    disclosureContainer.append(disclosureTitle, disclosureButton);
    modalOverlay.appendChild(disclosureContainer);
    body.appendChild(modalOverlay);

    disclosureButton.addEventListener("click", () => {
      body.removeChild(modalOverlay);
    });
  }
}
