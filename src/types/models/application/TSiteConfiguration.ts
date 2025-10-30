import type { TGifRenderTargetInput } from "../../../models/RenderTargets/GifRenderTarget/GifRenderTarget";
import type { TGltfModelRenderTarget } from "../../../models/RenderTargets/GltfModelRenderTarget/GltfModelRenderTarget";
import type { THlsVideoRenderTargetInput } from "../../../models/RenderTargets/HlsVideoTarget/HlsVideoRenderTarget";
import type { TVector3Limits } from "../render/TVector3";

export type TSiteConfiguration = {
  metadata: {
    id: string;
    title: string;
  };
  render: {
    aspectRatio: number;
    mindUrl: string;
    webLinkUrl?: string;
    globalRotationLimits?: TVector3Limits;
    targets: Array<RenderTarget>;
  };
};

type RenderTargetMap = {
  gif: Omit<TGifRenderTargetInput, "markerDimensions">;
  hls: Omit<THlsVideoRenderTargetInput, "markerDimensions">;
  gltf: Omit<TGltfModelRenderTarget, "markerDimensions">;
};

type RenderTarget = {
  [K in keyof RenderTargetMap]: {
    type: K;
    data: RenderTargetMap[K];
  };
}[keyof RenderTargetMap];
