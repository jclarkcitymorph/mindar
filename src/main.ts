import HlsVideoRenderTarget from "./models/RenderTargets/HlsVideoTarget/HlsVideoRenderTarget";
import SceneManager from "./models/SceneManager";

new SceneManager({
  isDebugging: false,
  renderTarget: new HlsVideoRenderTarget({
    videoUrl:
      "https://reel-em-in-hls-bucket.s3-us-west-1.amazonaws.com/bab4eed3-a93e-4dff-ae47-6a29195f2a23/playlist.m3u8",
  }),
});
