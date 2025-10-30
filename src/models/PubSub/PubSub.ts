import type { TCorners } from "../../types/models/render/TCorners";
import type { TMarkerData } from "../../types/models/render/TMarkerData";
import type CornerRenderData from "../CornerRenderData";

type MarkerEventData = {
  marker: TMarkerData;
  corners: Record<TCorners, CornerRenderData>;
};

export default class PubSub {
  private static seen = false;

  public static readonly eventNames = Object.freeze({
    onMarkerFound: "onMarkerFound",
    onMarkerLost: "onMarkerLost",
    onMarkerFirstSeen: "onMarkerFirstSeen",
  });

  private static emit(eventName: string, data: MarkerEventData): void {
    const event = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(event);
  }

  public static onMarkerFound(data: MarkerEventData): void {
    console.log("PubSub - Marker Found");
    if (!PubSub.seen) {
      PubSub.onMarkerFirstSeen(data);
      PubSub.seen = true;
    }
    PubSub.emit(PubSub.eventNames.onMarkerFound, data);
  }

  public static onMarkerLost(data: MarkerEventData): void {
    PubSub.emit(PubSub.eventNames.onMarkerLost, data);
  }

  public static onMarkerFirstSeen(data: MarkerEventData): void {
    PubSub.emit(PubSub.eventNames.onMarkerFirstSeen, data);
  }
}
