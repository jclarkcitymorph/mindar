import { ModalOverlayDisclosure } from "./models/ModalOverlayDisclosure/ModalOverlayDisclosure";
import GltfModelRenderTarget from "./models/RenderTargets/GltfModelRenderTarget/GltfModelRenderTarget";
import HlsVideoRenderTarget from "./models/RenderTargets/HlsVideoTarget/HlsVideoRenderTarget";
import SceneManager from "./models/SceneManager";

const markerDimensions = { x: 1, y: 0.57 };

new ModalOverlayDisclosure();

new SceneManager({
  isDebugging: true,
  renderTargets: [
    new HlsVideoRenderTarget({
      videoUrl:
        "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/23fa836c-65ea-47d2-80ee-10c01e2dc883/playlist.m3u8",
      markerDimensions,
      scaleVector: {
        x: 0.66,
        y: 0.66,
        z: 0.66,
      },
    }),
    new GltfModelRenderTarget({
      modelName: "ModelTarget",
      modelPath: "assets/testmodel.gltf",
      markerDimensions,
      scaleVector: {
        x: 1,
        y: 1,
        z: 1,
      },
      positionalOffsetVector: {
        x: -1,
        y: -1,
        z: 0,
      },
    }),
  ],
});
