import type { TApiReturn } from "../types/api/TApiReturn";
import type { TDecomposedUrlData } from "../types/models/application/TDecomposedUrlData";
import type { TSiteConfiguration } from "../types/models/application/TSiteConfiguration";

// THIS IS FOR TESTING ALONE RIGHT NOW
const demoVideos = {
  cityMorphDino:
    "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/23fa836c-65ea-47d2-80ee-10c01e2dc883/playlist.m3u8",
  worldRotation:
    "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/4534bfc8-a5c5-4f1a-9c9d-a6a9d1875b43/playlist.m3u8",
  streetFighterWithAudio:
    "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/bab4eed3-a93e-4dff-ae47-6a29195f2a23/playlist.m3u8",
};

export default async function apiRetrieveSiteConfig({}: {
  decomposedUrlData: TDecomposedUrlData;
}): Promise<TApiReturn<TSiteConfiguration>> {
  try {
    return Promise.resolve({
      success: true,
      data: {
        metadata: {
          id: "1",
          title: "Some Title",
        },
        render: {
          aspectRatio: 1,
          mindUrl:
            "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/assets/targets.mind",
          globalRotationLimits: {
            x: {
              min: -55,
              max: 55,
            },
            y: {
              min: -55,
              max: 55,
            },
            z: {
              min: -55,
              max: 55,
            },
          },
          webLinkUrl: "https://www.citymorphstudio.com",
          targets: [
            {
              type: "hls" as const,
              data: {
                name: "hls1",
                videoUrl: demoVideos.streetFighterWithAudio,
                aspectRatio: 1.754385965,
                scaleVector: 1.05,
              },
            },
            // {
            //   type: "gif",
            //   data: {
            //     name: "gif1",
            //     objUrl:
            //       "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/assets/testgif.gif",
            //     aspectRatio: 1.714285712,
            //     positionalOffsetVector: {
            //       x: 0,
            //       y: -0.9,
            //       z: 0.1,
            //     },
            //     scaleVector: 0.85,
            //     originOffsetVector: {
            //       x: 0,
            //       y: -1,
            //       z: 0,
            //     },
            //     transparencyTarget: {
            //       blue: 5,
            //       green: 5,
            //       red: 5,
            //       tolerance: 70 / 255,
            //     },
            //   },
            // },
            {
              type: "gif",
              data: {
                name: "gif2",
                objUrl:
                  "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/assets/cmslogo.gif",
                aspectRatio: 1.214285715,
                positionalOffsetVector: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
                originOffsetVector: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
                scaleVector: 0.5,
              },
            },
            {
              type: "gif",
              data: {
                name: "gif3",
                objUrl:
                  "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/assets/cmslogo.gif",
                aspectRatio: 1.214285715,
                positionalOffsetVector: {
                  x: 1,
                  y: 0,
                  z: 0,
                },
                originOffsetVector: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
                scaleVector: 0.5,
              },
            },
            {
              type: "gif",
              data: {
                name: "gif4",
                objUrl:
                  "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/assets/cmslogo.gif",
                aspectRatio: 1.214285715,
                positionalOffsetVector: {
                  x: 0,
                  y: 1,
                  z: 0,
                },
                originOffsetVector: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
                scaleVector: 0.5,
              },
            },
            {
              type: "gif",
              data: {
                name: "gif5",
                objUrl:
                  "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/assets/cmslogo.gif",
                aspectRatio: 1.214285715,
                positionalOffsetVector: {
                  x: 0,
                  y: -1,
                  z: 0,
                },
                originOffsetVector: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
                scaleVector: 0.5,
              },
            },
            {
              type: "gif",
              data: {
                name: "gif6",
                objUrl:
                  "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/assets/cmslogo.gif",
                aspectRatio: 1.214285715,
                positionalOffsetVector: {
                  x: -1,
                  y: 0,
                  z: 0,
                },
                originOffsetVector: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
                scaleVector: 0.5,
              },
            },
          ],
        },
      },
    });
  } catch {
    return Promise.resolve({
      success: false,
    });
  }
}
