// processVideoIntoHlsStream.ts
import { spawn } from "child_process";
import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import type {
  MediaSummary,
  ProcessHlsOptions,
  ProcessHlsResult,
} from "../../../types/types";

/**
 * Process a video into HLS segments (segment00001.ts, ...) and a playlist.m3u8
 */
export default async function processVideoIntoHlsStream(
  inputFile: string,
  probed: MediaSummary,
  opts: ProcessHlsOptions = {}
): Promise<ProcessHlsResult> {
  if (!probed?.exists) {
    throw new Error(`Input not found: ${inputFile}`);
  }

  const {
    segmentSeconds = 3,
    startNumber = 1,
    segmentBasename = "segment",
    digits = 5,
    playlistName = "playlist.m3u8",
    outputDir = "output",
    reencode = true,

    videoCodec = "libx264",
    audioCodec = "aac",
    preset = "veryfast",
    profile = "main",
    pixelFormat = "yuv420p",
    audioBitrate = "128k",

    independentSegments = true,
    splitByTime = false,
    overwrite = true,

    extraInputArgs = [],
    extraOutputArgs = [],
  } = opts;

  // Resolve fps and compute GOP
  const fps =
    probed?.video?.fps_avg && probed.video.fps_avg > 0
      ? probed.video.fps_avg
      : 30; // safe default

  const gop = Math.max(1, Math.round(fps * segmentSeconds));

  const outDirAbs = path.resolve(outputDir);
  await fsp.mkdir(outDirAbs, { recursive: true });

  const segmentPattern = `${segmentBasename}%0${digits}d.ts`;
  const segmentPatternAbs = path.join(outDirAbs, segmentPattern);
  const playlistAbs = path.join(outDirAbs, playlistName);

  if (!overwrite) {
    if (fs.existsSync(playlistAbs)) {
      throw new Error(`Output exists and overwrite=false: ${playlistAbs}`);
    }
    // Best effort: check if any matching first few segments exist
    const firstSeg = path.join(
      outDirAbs,
      `${segmentBasename}${String(startNumber).padStart(digits, "0")}.ts`
    );
    if (fs.existsSync(firstSeg)) {
      throw new Error(`Output exists and overwrite=false: ${firstSeg}`);
    }
  }

  const inputAbs = path.resolve(inputFile);

  // Build ffmpeg args
  const args: string[] = [];

  if (overwrite) args.push("-y"); // overwrite outputs
  args.push(...extraInputArgs);

  args.push("-i", inputAbs);

  let mode: "reencode" | "copy" = "copy";

  if (reencode) {
    mode = "reencode";
    args.push(
      // video
      "-c:v",
      videoCodec,
      "-preset",
      preset,
      "-profile:v",
      profile,
      "-pix_fmt",
      pixelFormat,
      "-g",
      String(gop),
      "-keyint_min",
      String(gop),
      "-sc_threshold",
      "0",
      "-force_key_frames",
      `expr:gte(t,n_forced*${segmentSeconds})`,
      // audio
      "-c:a",
      audioCodec,
      "-b:a",
      audioBitrate
    );
  } else {
    // Fast path: copy streams (no new keyframes)
    args.push("-c", "copy");
  }

  // HLS outputs
  args.push(
    "-f",
    "hls",
    "-hls_time",
    String(segmentSeconds),
    "-hls_playlist_type",
    "vod",
    "-hls_segment_filename",
    segmentPatternAbs,
    "-start_number",
    String(startNumber)
  );

  if (independentSegments) {
    args.push("-hls_flags", "independent_segments");
  }

  if (splitByTime) {
    // Not usually recommended unless you must hard-split by wall clock time
    args.push("-hls_flags", "split_by_time");
  }

  if (extraOutputArgs.length) {
    args.push(...extraOutputArgs);
  }

  args.push(playlistAbs);

  // Spawn ffmpeg
  const cmd = "ffmpeg";
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });

    child.stdout.on("data", (_d) => {
      // ffmpeg usually logs to stderr; stdout is often minimal
      // console.log(String(d).trim());
    });

    child.stderr.on("data", (d) => {
      const s = String(d);
      // Optional: basic progress logging
      // e.g., frame=..., time=00:00:05.00, speed=...
      if (process.env.HLS_VERBOSE?.toLowerCase() === "1") {
        process.stderr.write(s);
      }
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });

  return {
    mode,
    fpsUsed: fps,
    gop,
    playlistPath: playlistAbs,
    segmentPatternPath: segmentPatternAbs,
    outputDir: outDirAbs,
    command: cmd,
    args,
  };
}
