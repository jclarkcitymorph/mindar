// probe-media.ts
// Description: Probe a media file with ffprobe and print useful metrics as JSON.
// Usage: ts-node probe-media.ts "/path/to/video.mp4"

import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import type {
  AudioMetrics,
  ContainerMetrics,
  FFprobeFormat,
  FFprobeJSON,
  FFprobeStream,
  MediaSummary,
  VideoMetrics,
} from "../../../types/types";

const execFileAsync = promisify(execFile);

function parseFraction(frac?: string | null): number | null {
  if (!frac) return null;
  if (frac.includes("/")) {
    const [a, b] = frac.split("/").map(Number);
    if (!isFinite(a) || !isFinite(b) || b === 0) return null;
    return a / b;
  }
  const val = Number(frac);
  return isFinite(val) ? val : null;
}

function parseNumber(s?: string | number | null): number | null {
  if (s === undefined || s === null) return null;
  const n = Number(s);
  return isFinite(n) ? n : null;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function deriveDAR(
  width?: number,
  height?: number,
  sar?: string | null,
  existingDAR?: string | null
): string | null {
  if (existingDAR) return existingDAR;
  if (!width || !height) return null;

  // If SAR is present like "1:1" or "10:11", apply it; else fall back to width:height simplification.
  let w = width,
    h = height;

  if (sar && sar.includes(":")) {
    const [sx, sy] = sar.split(":").map(Number);
    if (isFinite(sx) && isFinite(sy) && sy !== 0) {
      w = width * sx;
      h = height * sy;
    }
  }
  const g = gcd(w, h);
  return `${Math.round(w / g)}:${Math.round(h / g)}`;
}

function colorHdrHint(
  transfer?: string | null
): "PQ" | "HLG" | "SDR" | "Unknown" {
  if (!transfer) return "Unknown";
  const t = transfer.toLowerCase();
  if (t.includes("smpte2084") || t.includes("pq")) return "PQ";
  if (t.includes("arib-std-b67") || t.includes("hlg")) return "HLG";
  if (
    t.includes("bt709") ||
    t.includes("bt.709") ||
    t.includes("iec61966-2-1") ||
    t.includes("gamma")
  )
    return "SDR";
  return "Unknown";
}

function interlaceHint(
  field_order?: string
): "progressive" | "interlaced" | "unknown" {
  if (!field_order) return "unknown";
  const fo = field_order.toLowerCase();
  if (fo.includes("progressive")) return "progressive";
  if (
    fo.includes("tt") ||
    fo.includes("bb") ||
    fo.includes("tb") ||
    fo.includes("bt")
  )
    return "interlaced";
  return "unknown";
}

async function ffprobeJSON(filePath: string): Promise<FFprobeJSON> {
  const args = [
    "-v",
    "error",
    "-show_format",
    "-show_streams",
    "-print_format",
    "json",
    filePath,
  ];
  const { stdout } = await execFileAsync("ffprobe", args, {
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(stdout) as FFprobeJSON;
}

function pickVideoStream(streams: FFprobeStream[]): FFprobeStream | undefined {
  return streams.find((s) => s.codec_type === "video");
}

function pickAudioStream(streams: FFprobeStream[]): FFprobeStream | undefined {
  return streams.find((s) => s.codec_type === "audio");
}

function buildVideoMetrics(v?: FFprobeStream): VideoMetrics | undefined {
  if (!v) return undefined;

  const fpsAvg = parseFraction(v.avg_frame_rate ?? null);
  const fpsR = v.avg_frame_rate ?? null;
  const rFpsNum = parseFraction(v.r_frame_rate ?? null);

  const width = v.width ?? null;
  const height = v.height ?? null;

  const dar = deriveDAR(
    width ?? undefined,
    height ?? undefined,
    v.sample_aspect_ratio ?? null,
    v.display_aspect_ratio ?? null
  );

  const br = parseNumber(v.bit_rate ?? null);
  const frames = parseNumber(v.nb_frames ?? null);

  return {
    codec: v.codec_name ?? null,
    profile: v.profile ?? null,
    level: v.level ?? null,
    width,
    height,
    dar,
    sar: v.sample_aspect_ratio ?? null,
    fps_avg: fpsAvg,
    fps_r: fpsR,
    r_frame_rate_num: rFpsNum,
    pix_fmt: v.pix_fmt ?? null,
    color: {
      range: v.color_range ?? null,
      space: v.color_space ?? null,
      primaries: v.color_primaries ?? null,
      transfer: v.color_transfer ?? null,
      hdr_hint: colorHdrHint(v.color_transfer ?? null),
    },
    bit_rate_bps: br,
    nb_frames: frames,
    interlace_hint: interlaceHint(v.field_order),
  };
}

function buildAudioMetrics(a?: FFprobeStream): AudioMetrics | undefined {
  if (!a) return undefined;

  return {
    codec: a.codec_name ?? null,
    sample_rate_hz: parseNumber(a.sample_rate ?? null),
    channels: a.channels ?? null,
    layout: a.channel_layout ?? null,
    bit_rate_bps: parseNumber(a.bit_rate ?? null),
  };
}

function buildContainerMetrics(fmt: FFprobeFormat): ContainerMetrics {
  return {
    container: fmt.format_name ?? null,
    container_long: fmt.format_long_name ?? null,
    duration_seconds: parseNumber(fmt.duration ?? null),
    size_bytes: parseNumber(fmt.size ?? null),
    bit_rate_bps: parseNumber(fmt.bit_rate ?? null),
    start_time_seconds: parseNumber(fmt.start_time ?? null),
    tags: fmt.tags ?? {},
  };
}

export default async function main(filePath: string) {
  const fullPath = path.resolve(filePath);
  const exists = fs.existsSync(fullPath);
  if (!exists) {
    console.error(
      JSON.stringify(
        {
          path: fullPath,
          exists: false,
          error: "File not found",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  try {
    const data = await ffprobeJSON(fullPath);

    const v = pickVideoStream(data.streams || []);
    const a = pickAudioStream(data.streams || []);
    const otherCount = (data.streams || []).filter(
      (s) => s.codec_type !== "video" && s.codec_type !== "audio"
    ).length;

    const summary: MediaSummary = {
      path: fullPath,
      exists: true,
      container: buildContainerMetrics(data.format),
      video: buildVideoMetrics(v),
      audio: buildAudioMetrics(a),
      other_streams: otherCount,
    };

    // Add a few convenience fields if present:
    // - Estimated pixels (WxH) and megapixels/frame
    if (summary.video?.width && summary.video?.height) {
      const px = summary.video.width * summary.video.height;
      (summary as any).video_pixels_per_frame = px;
      (summary as any).video_megapixels_per_frame = +(px / 1_000_000).toFixed(
        3
      );
    }

    // - Approx total frames if duration & fps are known and nb_frames missing
    if (
      summary.container.duration_seconds &&
      summary.video?.fps_avg &&
      !summary.video.nb_frames
    ) {
      const estFrames = Math.round(
        summary.container.duration_seconds * summary.video.fps_avg
      );
      (summary.video as any).nb_frames_estimated = estFrames;
    }

    // - Rough “quality” hint (very rough, bitrate per pixel per second)
    if (
      summary.container.bit_rate_bps &&
      summary.video?.width &&
      summary.video?.height
    ) {
      const bppps =
        summary.container.bit_rate_bps /
        (summary.video.width * summary.video.height);
      (summary as any).bitrate_per_pixel_per_sec = +bppps.toFixed(6);
    }

    return summary;
  } catch (err: any) {
    console.error(
      JSON.stringify(
        {
          path: fullPath,
          exists: true,
          error: err?.message || String(err),
          stderr: err?.stderr,
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}
