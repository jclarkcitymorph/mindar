import { ModalOverlayDisclosure } from "./models/ModalOverlayDisclosure/ModalOverlayDisclosure";
import GltfModelRenderTarget from "./models/RenderTargets/GltfModelRenderTarget/GltfModelRenderTarget";
import HlsVideoRenderTarget from "./models/RenderTargets/HlsVideoTarget/HlsVideoRenderTarget";
import SceneManager from "./models/SceneManager";

// new ModalOverlayDisclosure();

// new SceneManager({
//   isDebugging: false,
//   renderTarget: new HlsVideoRenderTarget({
//     videoUrl:
//       "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/23fa836c-65ea-47d2-80ee-10c01e2dc883/playlist.m3u8",
//   }),
// });

new SceneManager({
  isDebugging: true,
  renderTarget: new GltfModelRenderTarget({
    modelName: "ModelTarget",
    modelPath: "assets/testmodel.gltf",
  }),
});
