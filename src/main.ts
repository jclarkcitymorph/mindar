import MuteControl from "./models/Controls/Control/MuteControl/MuteControl";
import PlayPauseControl from "./models/Controls/Control/PlayPauseControl/PlayPauseControl";
import WeblinkControl from "./models/Controls/Control/WeblinkControl/WeblinkControl";
import { Controls } from "./models/Controls/Controls";
import GifRenderTarget from "./models/RenderTargets/GifRenderTarget/GifRenderTarget";
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

const demoVideos = {
  cityMorphDino:
    "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/23fa836c-65ea-47d2-80ee-10c01e2dc883/playlist.m3u8",
  worldRotation:
    "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/4534bfc8-a5c5-4f1a-9c9d-a6a9d1875b43/playlist.m3u8",
  streetFighterWithAudio:
    "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/bab4eed3-a93e-4dff-ae47-6a29195f2a23/playlist.m3u8",
};

const hlsVideoTarget = new HlsVideoRenderTarget({
  name: "Video Target",
  videoUrl: demoVideos.cityMorphDino,
  markerDimensions,
  scaleVector: {
    x: 1.05,
    y: 1.05,
    z: 1,
  },
  vectorRotationLimits,
  videoDimensions: {
    x: 1,
    y: 0.57,
  },
});

const gifTarget = new GifRenderTarget({
  markerDimensions,
  gifUrl: "assets/testgif.gif",
  name: "Test Gif",
  dimensions: {
    x: 0.35,
    y: 0.204166667,
  },
  positionalOffsetVector: {
    x: 0,
    y: -0.9,
    z: 0.1,
  },
  originOffsetVector: {
    x: 0,
    y: -1,
    z: 0,
  },
});

new Controls({
  controls: [
    new PlayPauseControl({
      state: "Paused",
      onPointerDown: (state) => {
        const video = hlsVideoTarget.getVideoObj();
        switch (state) {
          case "Playing": {
            video?.pause();
            break;
          }
          case "Pressed Playing": {
            video?.pause();
            break;
          }
          case "Paused": {
            video?.play();
            break;
          }
          case "Pressed Pause": {
            video?.play();
            break;
          }
        }
      },
    }),
    new MuteControl({
      state: "Sound Off",
      onPointerDown: () => {
        const video = hlsVideoTarget.getVideoObj();
        if (video) {
          if (video.muted) {
            video.muted = false;
            video.volume = 1;
          } else {
            video.muted = true;
            video.volume = 0;
          }
        }
      },
    }),
    new WeblinkControl({
      state: "Default",
      weblinkUrl: "https://www.citymorphstudio.com",
    }),
  ],
});

new SceneManager({
  isDebugging: false,
  renderTargets: [hlsVideoTarget, gifTarget],
});
