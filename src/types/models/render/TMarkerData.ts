import type { Euler, Quaternion, Vector3 } from "three";
import type { TRenderData } from "./TRenderData";

export type TMarkerData = {
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
