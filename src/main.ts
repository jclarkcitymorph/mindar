import MuteControl from "./models/Controls/Control/MuteControl/MuteControl";
import PlayPauseControl from "./models/Controls/Control/PlayPauseControl/PlayPauseControl";
import WeblinkControl from "./models/Controls/Control/WeblinkControl/WeblinkControl";
import { Controls } from "./models/Controls/Controls";
import GifRenderTarget from "./models/RenderTargets/GifRenderTarget/GifRenderTarget";
import HlsVideoRenderTarget from "./models/RenderTargets/HlsVideoTarget/HlsVideoRenderTarget";
import SceneManager from "./models/SceneManager";
import type { TVector3Limits } from "./types/TVector3";

const markerDimensions = { x: 1, y: 0.57 };

const demoVideos = {
  cityMorphDino:
    "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/23fa836c-65ea-47d2-80ee-10c01e2dc883/playlist.m3u8",
  worldRotation:
    "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/4534bfc8-a5c5-4f1a-9c9d-a6a9d1875b43/playlist.m3u8",
  streetFighterWithAudio:
    "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/bab4eed3-a93e-4dff-ae47-6a29195f2a23/playlist.m3u8",
};

const vectorRotationLimits: TVector3Limits = {
  x: {
    min: -30,
    max: 30,
  },
  y: {
    min: -30,
    max: 30,
  },
  z: {
    min: -30,
    max: 30,
  },
};

const hlsVideoTarget = new HlsVideoRenderTarget({
  name: "Video Target",
  videoUrl: demoVideos.streetFighterWithAudio,
  markerDimensions,
  scaleVector: {
    x: 1.05,
    y: 1.05,
    z: 1,
  },
  videoDimensions: {
    x: 1,
    y: 0.57,
  },
  vectorRotationLimits,
});

const gifTarget = new GifRenderTarget({
  markerDimensions,
  gifUrl: "assets/testgif.gif",
  name: "Test Gif",
  dimensions: {
    x: 0.7,
    y: 0.408333334,
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
  transparencyTarget: {
    blue: 5,
    green: 5,
    red: 5,
    tolerance: 70 / 255,
  },
  vectorRotationLimits,
});

const gifTarget2 = new GifRenderTarget({
  markerDimensions,
  gifUrl: "assets/cmslogo.gif",
  name: "CmsLogoGif",
  dimensions: {
    x: 0.36,
    y: 0.296470588,
  },
  positionalOffsetVector: {
    x: 0,
    y: 1.2,
    z: 0,
  },
  originOffsetVector: {
    x: 0,
    y: 1,
    z: 0,
  },
  vectorRotationLimits,
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
  renderTargets: [hlsVideoTarget, gifTarget, gifTarget2],
});
