import probeVideoFile from "./utils/probeVideoFile";
import processVideoIntoHlsStream from "./utils/processVideoIntoHlsStream";

async function main() {
  const inputFile = "./assets/VideoFile.mp4";
  const probed = await probeVideoFile(inputFile);

  // Bail early if missing streams
  if (!(probed.exists && probed.video && probed.audio)) {
    console.error("Input missing audio/video or not found:", probed);
    process.exit(1);
  }
  const result = await processVideoIntoHlsStream(inputFile, probed, {
    segmentSeconds: 3,
    startNumber: 1,
    segmentBasename: "segment",
    digits: 5,
    playlistName: "playlist.m3u8",
    outputDir: "output",
    reencode: true, // recommended for clean 3s cuts
    independentSegments: true, // good for HLS
    splitByTime: false, // set true only if you must hard-split
    // extraInputArgs: [],
    // extraOutputArgs: [],
  });

  console.log("HLS ready:", {
    mode: result.mode,
    fps: result.fpsUsed,
    gop: result.gop,
    playlist: result.playlistPath,
    segments: result.segmentPatternPath,
    outputDir: result.outputDir,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
