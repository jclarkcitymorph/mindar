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
const cityMorphInformationGifUrl =
  "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/assets/testgif.gif";
const cityMorphLogoGifUrl =
  "https://reel-em-in-hls-bucket.s3.us-west-1.amazonaws.com/assets/cmslogo.gif";

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
          },
          webLinkUrl: "https://www.citymorphstudio.com",
          targets: [
            {
              type: "hls" as const,
              data: {
                name: "hls1",
                videoUrl: demoVideos.streetFighterWithAudio,
                aspectRatio: 1.754385965,
                scaleVector: {
                  x: 1.05,
                  y: 1.05,
                  z: 1,
                },
              },
            },
            {
              type: "gif",
              data: {
                name: "gif1",
                objUrl: cityMorphInformationGifUrl,
                aspectRatio: 1.714285712,
                positionalOffsetVector: {
                  x: 0,
                  y: -0.9,
                  z: 0.1,
                },
                scaleVector: {
                  x: 0.85,
                  y: 0.85,
                  z: 1,
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
              },
            },
            {
              type: "gif",
              data: {
                name: "gif2",
                objUrl: cityMorphLogoGifUrl,
                aspectRatio: 1.214285715,
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
                scaleVector: {
                  x: 0.5,
                  y: 0.5,
                  z: 1,
                },
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
