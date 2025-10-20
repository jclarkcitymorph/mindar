import type { TSceneFlags } from "../types/TSceneFlags";
import type { Entity, Scene } from "aframe";
import type { TDebug } from "../types/TDebug";
import type { TCorners } from "../types/TCorners";
import type { TRenderData } from "../types/TRenderData";
//
// import AFRAME from "aframe";
import CornerRenderData from "./CornerRenderData";
import FpsData from "./FpsData";
import type RenderTarget from "./RenderTargets/RenderTarget";

type TSceneHtmlElements = {
  scene: Scene;
  marker: Entity;
  camera: Entity;
};

const { Vector3, Quaternion, Euler } = THREE;
const HISTORICS_TO_TRACK = 12;

type TSceneManagerInput = {
  renderTargets: RenderTarget[];
  isDebugging: boolean;
};

export default class SceneManager {
  private debug: TDebug;
  private htmlElements: TSceneHtmlElements;
  private flags: TSceneFlags;
  private fpsData: FpsData;
  private markerData: {
    found: boolean;
    current: {
      position: InstanceType<typeof Vector3>;
      scale: InstanceType<typeof Vector3>;
      rotation: InstanceType<typeof Vector3>;
      quaternion: InstanceType<typeof Quaternion>;
      euler: InstanceType<typeof Euler>;
    };
    historic: Array<TRenderData>;
    average: TRenderData;
  };
  private cornerData: Record<TCorners, CornerRenderData>;
  private renderTargets: RenderTarget[];
  constructor({ renderTargets, isDebugging }: TSceneManagerInput) {
    this.flags = {
      sceneStarted: false,
    };
    this.fpsData = new FpsData();
    this.markerData = {
      found: false,
      current: {
        position: new Vector3(),
        scale: new Vector3(),
        rotation: new Vector3(),
        quaternion: new Quaternion(),
        euler: new Euler(),
      },
      historic: [],
      average: {
        position: {
          x: 0,
          y: 0,
          z: 0,
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0,
        },
        scale: {
          x: 0,
          y: 0,
          z: 0,
        },
      },
    };
    this.cornerData = {
      bottomLeft: new CornerRenderData(),
      bottomRight: new CornerRenderData(),
      topLeft: new CornerRenderData(),
      topRight: new CornerRenderData(),
    };

    this.renderTargets = [...renderTargets];

    const { htmlElements, debug } = this.createScene(isDebugging);

    this.htmlElements = htmlElements;
    this.debug = debug;

    AFRAME.registerComponent("frame-scene", {
      init: this.init.bind(this),
      tick: this.tick.bind(this),
    });
  }

  // HTML Generators
  private createScene(isDebugging: boolean): {
    htmlElements: TSceneHtmlElements;
    debug: TDebug;
  } {
    const body = document.querySelector("body");
    if (body === null) {
      throw new Error("Body cannot be null");
    }
    const scene = document.createElement("a-scene") as Scene;
    scene.setAttribute("id", "scene");
    scene.setAttribute("frame-scene", "");
    scene.setAttribute("mindar-image", "imageTargetSrc: ./targets.mind;");
    scene.setAttribute("vr-mode-ui", "enabled: false");
    scene.setAttribute("device-orientation-permission-ui", "enabled: false");

    const assets = document.createElement("a-assets");

    const assetChildren = this.renderTargets
      .map((t) => t.createAssets())
      .flat()
      .filter((t) => t !== undefined);

    assetChildren?.forEach((child) => assets.appendChild(child));

    const camera = document.createElement("a-camera") as Entity;
    camera.setAttribute("position", "0 0 0");
    camera.setAttribute("look-controls", "enabled: false");

    const marker = document.createElement("a-entity") as Entity;
    marker.setAttribute("id", "marker");
    marker.setAttribute("mindar-image-target", "targetIndex: 0");

    const renderObjs = this.renderTargets.map((t) => t.createAFrameElement());

    scene.appendChild(assets);
    scene.appendChild(camera);
    scene.appendChild(marker);
    renderObjs.forEach((obj) => scene.appendChild(obj));

    const htmlElements: TSceneHtmlElements = {
      camera,
      marker,
      scene,
    };
    let debug: TDebug = {
      isDebugging: false,
    };

    if (isDebugging) {
      // Create Corners
      const topLeft = document.createElement("a-plane");
      topLeft.setAttribute("id", "topLeft");
      topLeft.setAttribute("position", "10000 10000 10000");
      topLeft.setAttribute("width", "1");
      topLeft.setAttribute("height", "1");
      topLeft.setAttribute("color", "red");

      const topRight = document.createElement("a-plane");
      topRight.setAttribute("id", "topRight");
      topRight.setAttribute("position", "10000 10000 10000");
      topRight.setAttribute("width", "1");
      topRight.setAttribute("height", "1");
      topRight.setAttribute("color", "green");

      const bottomLeft = document.createElement("a-plane");
      bottomLeft.setAttribute("id", "bottomLeft");
      bottomLeft.setAttribute("position", "10000 10000 10000");
      bottomLeft.setAttribute("width", "1");
      bottomLeft.setAttribute("height", "1");
      bottomLeft.setAttribute("color", "blue");

      const bottomRight = document.createElement("a-plane");
      bottomRight.setAttribute("id", "bottomRight");
      bottomRight.setAttribute("position", "10000 10000 10000");
      bottomRight.setAttribute("width", "1");
      bottomRight.setAttribute("height", "1");
      bottomRight.setAttribute("color", "yellow");

      // Create Dev Tools
      const devTools = document.createElement("div");
      devTools.setAttribute("id", "dev-tools");
      devTools.setAttribute("data-show-status", "showing");

      const devToolsShowHideBtn = document.createElement("button");
      devToolsShowHideBtn.setAttribute("id", "dev-tools-show-hide-btn");
      devToolsShowHideBtn.textContent = "Hide Dev Tools";

      const noticeBoardMisc = document.createElement("div");
      noticeBoardMisc.setAttribute("id", "notice-board-misc");
      noticeBoardMisc.setAttribute("class", "notice-board-div");

      const noticeBoard = document.createElement("ul");
      noticeBoard.setAttribute("class", "notice-board");

      const noticeMarkerFound = document.createElement("li");
      noticeMarkerFound.setAttribute("id", "notice-marker-found");
      noticeMarkerFound.setAttribute("data-status", "bad");
      noticeMarkerFound.textContent = "Marker Lost";

      const noticeFpsDisplay = document.createElement("li");
      noticeFpsDisplay.setAttribute("id", "notice-fps-display");
      noticeFpsDisplay.textContent = "FPS: -";

      noticeBoard.appendChild(noticeMarkerFound);
      noticeBoard.appendChild(noticeFpsDisplay);
      noticeBoardMisc.appendChild(noticeBoard);

      const noticeBoardMarker = document.createElement("div");
      noticeBoardMarker.setAttribute("id", "notice-board-marker");
      noticeBoardMarker.setAttribute("class", "notice-board-div");

      const markerUl = document.createElement("ul");
      markerUl.setAttribute("class", "notice-board");
      markerUl.setAttribute("data-show-status", "showing");

      const noticeMarkerPosition = document.createElement("li");
      noticeMarkerPosition.setAttribute("id", "notice-marker-position");
      noticeMarkerPosition.textContent = "Pos: -";

      const noticeMarkerRotation = document.createElement("li");
      noticeMarkerRotation.setAttribute("id", "notice-marker-rotation");
      noticeMarkerRotation.textContent = "Rot: -";

      const noticeMarkerScale = document.createElement("li");
      noticeMarkerScale.setAttribute("id", "notice-marker-scale");
      noticeMarkerScale.textContent = "Scl: -";

      markerUl.appendChild(noticeMarkerPosition);
      markerUl.appendChild(noticeMarkerRotation);
      markerUl.appendChild(noticeMarkerScale);
      noticeBoardMarker.appendChild(markerUl);

      devTools.appendChild(devToolsShowHideBtn);
      devTools.appendChild(noticeBoardMisc);
      devTools.appendChild(noticeBoardMarker);
      // Append DevTools Items

      scene.append(topLeft);
      scene.append(topRight);
      scene.append(bottomLeft);
      scene.append(bottomRight);

      body.append(devTools);

      debug = {
        isDebugging: true,
        elements: {
          fps: {
            display: noticeFpsDisplay,
            foundMarker: noticeMarkerFound,
          },
          marker: {
            position: noticeMarkerPosition,
            rotation: noticeMarkerRotation,
            scale: noticeMarkerScale,
          },
          corners: {
            bottomLeft,
            bottomRight,
            topLeft,
            topRight,
          },
          devTools,
          showHideBtn: devToolsShowHideBtn,
        },
      };
    }

    body.append(scene);

    return {
      htmlElements,
      debug,
    };
  }

  // LifeCycle Events
  private init() {
    this.renderTargets.forEach((t) => t.init());
    this.registerArEvents();
    if (this.debug.isDebugging) {
      this.registerDevToolEvents();
    }
  }
  private tick(time: number, _timeDelta: number) {
    this.fpsData.update(time);
    this.tickUpdateScreenCornerData();
    this.tickUpdateMarkerData();
    this.tickUpdateScreenCornerHtml();
    // Debug Ticks
    this.tickUpdateDevToolsFpsCounter();
    this.tickUpdateDevToolsMarkerDisplay();
    // Render Target Update
    this.renderTargets.forEach((t) =>
      t.tickUpdate({ corners: this.cornerData, marker: this.markerData })
    );
  }

  // Init Calls
  private registerDevToolEvents() {
    if (this.debug.isDebugging) {
      const { devTools, showHideBtn } = this.debug.elements;
      showHideBtn.addEventListener("click", () => {
        const showingStatus = devTools.getAttribute("data-show-status");
        if (showingStatus === "showing") {
          devTools.setAttribute("data-show-status", "hidden");
          showHideBtn.textContent = "Show Dev Tools";
        } else {
          devTools.setAttribute("data-show-status", "showing");
          showHideBtn.textContent = "Hide Dev Tools";
        }
      });
    }
  }
  private registerArEvents() {
    const { scene, marker } = this.htmlElements;
    scene.addEventListener("arReady", () => {
      this.syncCameraProperties();
    });
    marker.addEventListener("targetFound", () => {
      this.markerData.found = true;
      if (!this.flags.sceneStarted) {
        this.flags.sceneStarted = true;
        this.renderTargets.forEach((t) => t.onFirstSeen());
        document.querySelector(".mindar-ui-scanning")?.remove();
      }
      if (this.debug.isDebugging) {
        this.debug.elements.fps.foundMarker.textContent = "Marker Found";
        this.debug.elements.fps.foundMarker.setAttribute("data-status", "good");
      }
      const data = {
        marker: this.markerData,
        corners: this.cornerData,
      };
      this.renderTargets.forEach((t) => t.onMarkerFound(data));
    });
    marker.addEventListener("targetLost", () => {
      this.markerData.found = false;
      if (this.debug.isDebugging) {
        this.debug.elements.fps.foundMarker.textContent = "Marker Lost";
        this.debug.elements.fps.foundMarker.setAttribute("data-status", "bad");
      }
      const data = {
        marker: this.markerData,
        corners: this.cornerData,
      };
      this.renderTargets.forEach((t) => t.onMarkerLost(data));
    });
  }
  private syncCameraProperties() {
    const { camera } = this.htmlElements;
    const threeCamera = this.getThreeCameraEntityValues();
    camera.setAttribute("camera", {
      fov: threeCamera.fov,
      near: threeCamera.near,
      far: threeCamera.far,
    });
  }

  // Tick Calls
  private tickUpdateMarkerData(): void {
    if (this.markerData.found) {
      // Update Render Data
      const marker3d = this.htmlElements.marker.object3D;
      marker3d.updateMatrixWorld(true);
      const { position, rotation, scale, euler, quaternion } =
        this.markerData.current;
      marker3d.matrixWorld.decompose(position, quaternion, scale);
      euler.setFromQuaternion(quaternion, "XYZ");
      const d = AFRAME.THREE.MathUtils.radToDeg;
      rotation.x = d(euler.x);
      rotation.y = d(euler.y);
      rotation.z = d(euler.z);
      // Update Historic Data
      this.markerData.historic.push({
        position: {
          x: position.x,
          y: position.y,
          z: position.z,
        },
        rotation: {
          x: rotation.x,
          y: rotation.y,
          z: rotation.z,
        },
        scale: {
          x: scale.x,
          y: scale.y,
          z: scale.z,
        },
      });
      if (this.markerData.historic.length > HISTORICS_TO_TRACK) {
        this.markerData.historic = this.markerData.historic.slice(
          -HISTORICS_TO_TRACK,
          this.markerData.historic.length
        );
      }
      if (this.markerData.historic.length > 0) {
        const avgMarkerData: TRenderData = this.markerData.historic.reduce(
          (prev, curr) => {
            prev.position.x += curr.position.x;
            prev.position.y += curr.position.y;
            prev.position.z += curr.position.z;
            prev.rotation.x += curr.rotation.x;
            prev.rotation.y += curr.rotation.y;
            prev.rotation.z += curr.rotation.z;
            prev.scale.x += curr.scale.x;
            prev.scale.y += curr.scale.y;
            prev.scale.z += curr.scale.z;
            return prev;
          },
          {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 0, y: 0, z: 0 },
          } as TRenderData
        );
        const count = this.markerData.historic.length;
        avgMarkerData.position.x /= count;
        avgMarkerData.position.y /= count;
        avgMarkerData.position.z /= count;
        avgMarkerData.rotation.x /= count;
        avgMarkerData.rotation.y /= count;
        avgMarkerData.rotation.z /= count;
        avgMarkerData.scale.x /= count;
        avgMarkerData.scale.y /= count;
        avgMarkerData.scale.z /= count;
        this.markerData.average = avgMarkerData;
      }
    }
  }
  private tickUpdateScreenCornerHtml(): void {
    if (this.debug.isDebugging) {
      (
        Object.entries(this.debug.elements.corners) as [TCorners, HTMLElement][]
      ).forEach(([key, value]) => {
        CornerRenderData.updateHtmlElement(this.cornerData[key], value);
      });
    }
  }
  private tickUpdateScreenCornerData(): void {
    const { zDistance, halfHeight, halfWidth } = this.calculateScreenCorners();
    this.cornerData.topLeft.update({
      x: -halfWidth,
      y: halfHeight,
      z: zDistance,
      width: 1,
      height: 1,
    });
    this.cornerData.topRight.update({
      x: halfWidth,
      y: halfHeight,
      z: zDistance,
      width: 1,
      height: 1,
    });
    this.cornerData.bottomLeft.update({
      x: -halfWidth,
      y: -halfHeight,
      z: zDistance,
      width: 1,
      height: 1,
    });
    this.cornerData.bottomRight.update({
      x: halfWidth,
      y: -halfHeight,
      z: zDistance,
      width: 1,
      height: 1,
    });
  }
  private tickUpdateDevToolsFpsCounter(): void {
    if (this.debug.isDebugging) {
      this.debug.elements.fps.display.textContent = `FPS: ${
        this.fpsData.get().fps
      }`;
    }
  }
  private tickUpdateDevToolsMarkerDisplay(): void {
    if (this.debug.isDebugging) {
      const { position, rotation, scale } = this.debug.elements.marker;
      if (this.markerData.found) {
        position.textContent = `Pos: {x: ${this.markerData.current.position.x.toFixed(
          1
        )}, y: ${this.markerData.current.position.y.toFixed(
          1
        )}, z: ${this.markerData.current.position.z.toFixed(1)}}`;
        rotation.textContent = `Rot: {x: ${this.markerData.current.rotation.x.toFixed(
          1
        )}°, y: ${this.markerData.current.rotation.y.toFixed(
          1
        )}°, z: ${this.markerData.current.rotation.z.toFixed(1)}°}`;
        scale.textContent = `Scl: {x: ${this.markerData.current.scale.x.toFixed(
          1
        )}, y: ${this.markerData.current.scale.y.toFixed(
          1
        )}, z: ${this.markerData.current.scale.z.toFixed(1)}}`;
      } else {
        const lastKnown = this.markerData.historic[0];
        if (lastKnown) {
          position.textContent = `Pos: {x: ${lastKnown.position.x.toFixed(
            1
          )}, y: ${lastKnown.position.y.toFixed(
            1
          )}, z: ${lastKnown.position.z.toFixed(1)}}`;
          rotation.textContent = `Rot: {x: ${lastKnown.rotation.x.toFixed(
            1
          )}°, y: ${lastKnown.rotation.y.toFixed(
            1
          )}°, z: ${lastKnown.rotation.z.toFixed(1)}°}`;
          scale.textContent = `Scl: {x: ${lastKnown.scale.x.toFixed(
            1
          )}, y: ${lastKnown.scale.y.toFixed(
            1
          )}, z: ${lastKnown.scale.z.toFixed(1)}}`;
        } else {
          position.textContent = `Pos: {x: ???, y: ???, z: ???}`;
          rotation.textContent = `Rot: {x: ???°, y: ???°, z: ???°}`;
          scale.textContent = `Scl: {x: ???, y: ???, z: ???}`;
        }
      }
    }
  }
  // Util Funcs
  private getThreeCameraEntityValues(): {
    near: number;
    far: number;
    fov: number;
    aspect: number;
  } {
    const { camera } = this.htmlElements;
    const { object3D } = camera;
    if (object3D.children.length === 0) {
      throw new Error("#camera.object3d children is 0");
    }

    const threeCamera = object3D.children[0];
    if (
      !("near" in threeCamera) ||
      !("far" in threeCamera) ||
      !("fov" in threeCamera) ||
      !("aspect" in threeCamera) ||
      typeof threeCamera.near !== "number" ||
      typeof threeCamera.far !== "number" ||
      typeof threeCamera.fov !== "number" ||
      typeof threeCamera.aspect !== "number"
    ) {
      throw new Error("threeCamera must be instance of PerspectiveCamera");
    }
    return {
      near: threeCamera.near,
      far: threeCamera.far,
      fov: threeCamera.fov,
      aspect: threeCamera.aspect,
    };
  }
  private calculateScreenCorners(): {
    zDistance: number;
    halfWidth: number;
    halfHeight: number;
  } {
    const threeCamera = this.getThreeCameraEntityValues();
    const { near, fov, aspect } = threeCamera;
    const zDistance = -near;
    const verticalHalfFOVRad = (fov / 2) * (Math.PI / 180);
    const tanResult = Math.tan(verticalHalfFOVRad);
    const halfHeight = near * tanResult;
    const halfWidth = halfHeight * aspect;
    return {
      zDistance,
      halfHeight,
      halfWidth,
    };
  }
}
