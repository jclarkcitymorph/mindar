import type { TVector2 } from "../../types/models/render/TVector2";

export default function dimensionsFromAspectRatio(
  aspectRatio: number
): TVector2 {
  return {
    x: 1,
    y: 1 / aspectRatio,
  };
}
