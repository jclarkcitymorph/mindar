export type FFprobeStream = {
  index: number;
  codec_name?: string;
  codec_long_name?: string;
  codec_type?: "video" | "audio" | "subtitle" | string;
  codec_tag_string?: string;
  profile?: string | number;
  width?: number;
  height?: number;
  coded_width?: number;
  coded_height?: number;
  sample_aspect_ratio?: string;
  display_aspect_ratio?: string;
  pix_fmt?: string;
  color_range?: string;
  color_space?: string;
  color_transfer?: string;
  color_primaries?: string;
  field_order?: string;
  level?: number;
  is_avc?: "true" | "false" | boolean;
  r_frame_rate?: string; // e.g. "24000/1001"
  avg_frame_rate?: string; // e.g. "24/1"
  bit_rate?: string; // as string from ffprobe
  bits_per_raw_sample?: string;
  nb_frames?: string;
  disposition?: Record<string, number>;
  tags?: Record<string, string>;
  // audio-specific
  sample_rate?: string;
  channels?: number;
  channel_layout?: string;
};

export type FFprobeFormat = {
  filename: string;
  nb_streams: number;
  format_name?: string;
  format_long_name?: string;
  start_time?: string;
  duration?: string;
  size?: string;
  bit_rate?: string;
  tags?: Record<string, string>;
};

export type FFprobeJSON = {
  streams: FFprobeStream[];
  format: FFprobeFormat;
};

export type VideoMetrics = {
  codec: string | null;
  profile: string | number | null;
  level: number | null;
  width: number | null;
  height: number | null;
  dar: string | null; // display aspect ratio
  sar: string | null; // sample aspect ratio
  fps_avg: number | null; // numeric avg_frame_rate
  fps_r?: string | null; // raw avg_frame_rate string
  r_frame_rate_num?: number | null; // numeric r_frame_rate
  pix_fmt: string | null;
  color: {
    range: string | null;
    space: string | null;
    primaries: string | null;
    transfer: string | null;
    hdr_hint: "PQ" | "HLG" | "SDR" | "Unknown";
  };
  bit_rate_bps: number | null;
  nb_frames: number | null;
  interlace_hint: "progressive" | "interlaced" | "unknown";
};

export type AudioMetrics = {
  codec: string | null;
  sample_rate_hz: number | null;
  channels: number | null;
  layout: string | null;
  bit_rate_bps: number | null;
};

export type ContainerMetrics = {
  container: string | null;
  container_long: string | null;
  duration_seconds: number | null;
  size_bytes: number | null;
  bit_rate_bps: number | null;
  start_time_seconds: number | null;
  tags: Record<string, string>;
};

export type MediaSummary = {
  path: string;
  exists: boolean;
  container: ContainerMetrics;
  video?: VideoMetrics;
  audio?: AudioMetrics;
  other_streams: number;
};

export type ProcessHlsOptions = {
  /** Seconds per segment (default 3) */
  segmentSeconds?: number;
  /** First segment number (default 1) */
  startNumber?: number;
  /** File name base for segments (default "segment") */
  segmentBasename?: string;
  /** Zero-pad digits (default 5 => 00001) */
  digits?: number;
  /** Playlist filename (default "playlist.m3u8") */
  playlistName?: string;
  /** Output directory (default "output") */
  outputDir?: string;
  /**
   * If true, re-encode video so we can force keyframes on segment boundaries.
   * If false, try stream copy (fast) — but you won't get exact segment cuts
   * unless your source already has keyframes in the right places.
   * Default: true
   */
  reencode?: boolean;

  // Re-encode tuning
  videoCodec?: string; // default "libx264"
  audioCodec?: string; // default "aac"
  preset?: string; // default "veryfast"
  profile?: string; // default "main"
  pixelFormat?: string; // default "yuv420p"
  audioBitrate?: string; // default "128k"

  /** Add HLS independent_segments flag (default true) */
  independentSegments?: boolean;

  /**
   * Force exact time splits with -hls_flags split_by_time.
   * Usually not recommended unless you must cut mid-GOP.
   * Default: false
   */
  splitByTime?: boolean;

  /** Overwrite outputs (default true) */
  overwrite?: boolean;

  /** Extra ffmpeg args (advanced) */
  extraInputArgs?: string[];
  extraOutputArgs?: string[];
};

export type ProcessHlsResult = {
  mode: "reencode" | "copy";
  fpsUsed: number;
  gop: number;
  playlistPath: string;
  segmentPatternPath: string;
  outputDir: string;
  command: string;
  args: string[];
};
