import GltfModelRenderTarget from "./models/RenderTargets/GltfModelRenderTarget/GltfModelRenderTarget";
import HlsVideoRenderTarget from "./models/RenderTargets/HlsVideoTarget/HlsVideoRenderTarget";
import SceneManager from "./models/SceneManager";

const markerDimensions = { x: 1, y: 0.57 };

const vectorRotationLimits = {
  x: {
    min: -50,
    max: 50,
  },
  y: {
    min: -50,
    max: 50,
  },
  z: {
    min: -50,
    max: 50,
  },
};

const hlsVideoTarget = new HlsVideoRenderTarget({
  name: "Video Target",
  videoUrl:
    "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/23fa836c-65ea-47d2-80ee-10c01e2dc883/playlist.m3u8",
  markerDimensions,
  scaleVector: {
    x: 1,
    y: 1,
    z: 1,
  },
  vectorRotationLimits,
});

const hlsOnClickHandler = () => {
  const video = hlsVideoTarget.getVideoObj();
  if (video) {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }
};

hlsVideoTarget.setOnClickVideoHandler(hlsOnClickHandler);

const gltfModelTarget = new GltfModelRenderTarget({
  name: "Model Target",
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
    z: 0.00001,
  },
  vectorRotationLimits,
});

new SceneManager({
  isDebugging: false,
  renderTargets: [gltfModelTarget],
});
