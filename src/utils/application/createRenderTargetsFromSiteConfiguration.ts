import GifRenderTarget from "../../models/RenderTargets/GifRenderTarget/GifRenderTarget";
import GltfModelRenderTarget from "../../models/RenderTargets/GltfModelRenderTarget/GltfModelRenderTarget";
import HlsVideoRenderTarget from "../../models/RenderTargets/HlsVideoTarget/HlsVideoRenderTarget";
import type RenderTarget from "../../models/RenderTargets/RenderTarget";
import type { TSiteConfiguration } from "../../types/models/application/TSiteConfiguration";
import dimensionsFromAspectRatio from "../math/dimensionsFromAspectRatio";

export default function createRenderTargetsFromSiteConfiguration(
  siteConfiguration: TSiteConfiguration
) {
  const markerDimensions = dimensionsFromAspectRatio(
    siteConfiguration.render.aspectRatio
  );
  const renderTargets: RenderTarget[] = [];
  siteConfiguration.render.targets.forEach((t) => {
    switch (t.type) {
      case "hls": {
        renderTargets.push(
          new HlsVideoRenderTarget({
            name: t.data.name,
            aspectRatio: t.data.aspectRatio,
            markerDimensions,
            videoUrl: t.data.videoUrl,
            localOffsetVector: t.data.localOffsetVector,
            markerOffsetVector: t.data.markerOffsetVector,
            scaleVector: t.data.scaleVector,
            vectorRotationLimits:
              siteConfiguration.render.globalRotationLimits ||
              t.data.vectorRotationLimits,
          })
        );
        break;
      }
      case "gif": {
        renderTargets.push(
          new GifRenderTarget({
            name: t.data.name,
            aspectRatio: t.data.aspectRatio,
            markerDimensions,
            objUrl: t.data.objUrl,
            localOffsetVector: t.data.localOffsetVector,
            markerOffsetVector: t.data.markerOffsetVector,
            scaleVector: t.data.scaleVector,
            transparencyTarget: t.data.transparencyTarget,
            vectorRotationLimits:
              siteConfiguration.render.globalRotationLimits ||
              t.data.vectorRotationLimits,
          })
        );
        break;
      }
      case "gltf": {
        renderTargets.push(
          new GltfModelRenderTarget({
            name: t.data.name,
            markerDimensions,
            modelName: t.data.modelName,
            modelUrl: t.data.modelUrl,
            localOffsetVector: t.data.localOffsetVector,
            markerOffsetVector: t.data.markerOffsetVector,
            scaleVector: t.data.scaleVector,
            vectorRotationLimits:
              siteConfiguration.render.globalRotationLimits ||
              t.data.vectorRotationLimits,
          })
        );
        break;
      }
      default: {
        throw new Error(
          "Unaccounted switch case in createRenderTargetsFromSiteConfiguration()"
        );
      }
    }
  });
  return renderTargets;
}
