import { css, useTheme, type Theme } from "@emotion/react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader } from "../Loader";
import { formatTime } from "../../utils/formatTime";

// how long (ms) a playing video's controls stay after the mouse stops
const HIDE_CONTROLS_AFTER = 2500;
// how far (s) the arrow keys skip
const SKIP_SECONDS = 5;

const styles = (theme: Theme) =>
  css({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    maxWidth: "100%",
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    overflow: "hidden",

    "&:focus-visible": {
      outline: `2px solid ${theme.colors.accent}`,
      outlineOffset: "2px",
    },

    "&.video": {
      backgroundColor: "#000",
    },

    video: {
      display: "block",
      width: "100%",
      maxHeight: "inherit",
      objectFit: "contain",
      cursor: "pointer",
    },

    ".videoStage": {
      position: "relative",
      display: "grid",
      placeItems: "center",
      minHeight: "160px",
      maxHeight: "inherit",
    },

    // before a video has loaded there's nothing to size the stage by
    ".videoStage.empty": {
      aspectRatio: "16 / 9",
    },

    ".bigPlay": {
      position: "absolute",
      inset: 0,
      margin: "auto",
      width: "3.5rem",
      height: "3.5rem",
      display: "grid",
      placeItems: "center",
      border: 0,
      borderRadius: "50%",
      color: theme.colors.onAccent,
      backgroundColor: theme.colors.accent,
      cursor: "pointer",
      boxShadow: theme.shadow.popup,

      "&:hover": { backgroundColor: theme.colors.accentHover },
    },

    ".status": {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      fontSize: "0.8rem",
      color: theme.colors.light_grey,
      pointerEvents: "none",
    },

    ".controls": {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 8px",
      backgroundColor: theme.colors.dark_grey,
      transition: "opacity 0.2s ease",
    },

    "&.video .controls": {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    },

    // a playing video's controls fade out while the mouse is still
    "&.video.idle .controls": {
      opacity: 0,
      pointerEvents: "none",
    },
    "&.video.idle": { cursor: "none" },

    ".controlBtn": {
      flex: "0 0 auto",
      width: "1.9rem",
      height: "1.9rem",
      display: "grid",
      placeItems: "center",
      padding: 0,
      border: 0,
      borderRadius: theme.radius.sm,
      color: theme.colors.white,
      backgroundColor: "transparent",
      cursor: "pointer",

      "&:hover:enabled": { backgroundColor: "rgba(255, 255, 255, 0.12)" },
      "&:disabled": { opacity: 0.5, cursor: "default" },
      "&:focus-visible": { outline: `2px solid ${theme.colors.accent}` },
    },

    "input[type=range]": {
      accentColor: theme.colors.accent,
      cursor: "pointer",
      "&:disabled": { cursor: "default" },
    },

    ".seek": {
      flex: 1,
      minWidth: "60px",
    },

    ".volume": {
      width: "64px",
    },

    ".time": {
      flex: "0 0 auto",
      fontSize: "0.72rem",
      fontVariantNumeric: "tabular-nums",
      color: theme.colors.white,
      whiteSpace: "nowrap",
    },

    ".audioTitle": {
      padding: "8px 10px 0",
      fontSize: "0.8rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    ".audioError": {
      padding: "0 10px 8px",
      fontSize: "0.72rem",
      color: theme.colors.danger,
    },
  });

interface MediaPlayerProps {
  kind: "video" | "audio";
  title: string;
  // undefined until the file has been fetched
  src?: string;
  loading?: boolean;
  error?: boolean;
  // asks for the file to be fetched; called the first time play is pressed
  onRequestLoad?: () => void;
  autoPlay?: boolean;
  // pauses playback, e.g. while the same file plays somewhere else
  suspended?: boolean;
  className?: string;
}

// A video or audio player with the app's own controls. Space or K plays and
// pauses, the arrow keys skip, M mutes and F makes a video full screen.
export const MediaPlayer = ({
  kind,
  title,
  src,
  loading = false,
  error = false,
  onRequestLoad,
  autoPlay = false,
  suspended = false,
  className,
}: MediaPlayerProps) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [idle, setIdle] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  // play was pressed before the file had been fetched
  const [wantsPlay, setWantsPlay] = useState(autoPlay);

  const failed = error || mediaError;
  const name = kind === "video" ? "video" : "audio";

  useEffect(() => {
    if (autoPlay && !src) onRequestLoad?.();
    // only on mount: autoplay asks for the file once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // play once the file that was waited for arrives
  useEffect(() => {
    if (!src || !wantsPlay) return;
    setWantsPlay(false);
    mediaRef.current?.play().catch(() => {});
  }, [src, wantsPlay]);

  useEffect(() => {
    if (suspended) mediaRef.current?.pause();
  }, [suspended]);

  useEffect(() => {
    const onChange = () =>
      setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const togglePlay = useCallback(() => {
    const media = mediaRef.current;
    if (failed) return;
    if (!src || !media) {
      setWantsPlay(true);
      onRequestLoad?.();
      return;
    }
    if (media.paused) media.play().catch(() => {});
    else media.pause();
  }, [failed, src, onRequestLoad]);

  const seek = (time: number) => {
    const media = mediaRef.current;
    if (!media || !src) return;
    media.currentTime = Math.min(Math.max(time, 0), duration || 0);
    setCurrentTime(media.currentTime);
  };

  const changeVolume = (value: number) => {
    const media = mediaRef.current;
    if (!media) return;
    media.volume = value;
    media.muted = value === 0;
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.muted = !media.muted;
    // unmuting at no volume would stay silent
    if (!media.muted && media.volume === 0) media.volume = 0.5;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else container.requestFullscreen?.().catch(() => {});
  };

  // a playing video's controls hide until the mouse moves again
  const wake = () => {
    setIdle(false);
    clearTimeout(hideTimer.current);
    if (kind === "video" && playing) {
      hideTimer.current = setTimeout(() => setIdle(true), HIDE_CONTROLS_AFTER);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    // sliders and buttons handle their own keys
    const target = event.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "BUTTON") return;

    switch (event.key) {
      case " ":
      case "k":
        togglePlay();
        break;
      case "ArrowLeft":
        seek(currentTime - SKIP_SECONDS);
        break;
      case "ArrowRight":
        seek(currentTime + SKIP_SECONDS);
        break;
      case "m":
        toggleMute();
        break;
      case "f":
        if (kind === "video") toggleFullscreen();
        break;
      default:
        return;
    }
    event.preventDefault();
    wake();
  };

  const mediaEvents = {
    onPlay: () => {
      setPlaying(true);
      wake();
    },
    onPause: () => {
      setPlaying(false);
      setIdle(false);
      clearTimeout(hideTimer.current);
    },
    onEnded: () => setPlaying(false),
    onTimeUpdate: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      setCurrentTime(e.currentTarget.currentTime),
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      setDuration(e.currentTarget.duration),
    onDurationChange: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      setDuration(e.currentTarget.duration),
    onVolumeChange: (e: React.SyntheticEvent<HTMLMediaElement>) => {
      setVolume(e.currentTarget.volume);
      setMuted(e.currentTarget.muted);
    },
    onError: () => setMediaError(true),
  };

  const waiting = loading || (wantsPlay && !src && !failed);
  const silent = muted || volume === 0;

  const controls = (
    <div className="controls">
      <button
        type="button"
        className="controlBtn"
        onClick={togglePlay}
        disabled={failed}
        aria-label={playing ? `Pause ${name}` : `Play ${name}`}
      >
        {playing ? <Pause size="1rem" /> : <Play size="1rem" />}
      </button>
      <input
        type="range"
        className="seek"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        onChange={(e) => seek(Number(e.target.value))}
        disabled={!src || failed}
        aria-label="Seek"
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
      />
      <span className="time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      <button
        type="button"
        className="controlBtn"
        onClick={toggleMute}
        disabled={!src || failed}
        aria-label={silent ? "Unmute" : "Mute"}
      >
        {silent ? <VolumeX size="1rem" /> : <Volume2 size="1rem" />}
      </button>
      <input
        type="range"
        className="volume"
        min={0}
        max={1}
        step={0.05}
        value={muted ? 0 : volume}
        onChange={(e) => changeVolume(Number(e.target.value))}
        disabled={!src || failed}
        aria-label="Volume"
      />
      {kind === "video" && (
        <button
          type="button"
          className="controlBtn"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? "Exit full screen" : "Full screen"}
        >
          {fullscreen ? <Minimize size="1rem" /> : <Maximize size="1rem" />}
        </button>
      )}
    </div>
  );

  const classes = [kind, idle ? "idle" : "", className ?? ""].join(" ");

  if (kind === "audio") {
    return (
      <div
        ref={containerRef}
        css={styles(theme)}
        className={classes}
        tabIndex={0}
        role="group"
        aria-label={`Audio player: ${title}`}
        onKeyDown={onKeyDown}
      >
        {src && (
          <audio ref={mediaRef} src={src} preload="metadata" {...mediaEvents} />
        )}
        <div className="audioTitle" title={title}>
          {title}
        </div>
        {controls}
        {failed && <div className="audioError">Couldn't play this audio</div>}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      css={styles(theme)}
      className={classes}
      tabIndex={0}
      role="group"
      aria-label={`Video player: ${title}`}
      onKeyDown={onKeyDown}
      onMouseMove={wake}
      onMouseLeave={() => playing && setIdle(true)}
      onFocus={wake}
    >
      <div className={src ? "videoStage" : "videoStage empty"}>
        {src && (
          <video
            ref={mediaRef}
            src={src}
            preload="metadata"
            playsInline
            onClick={togglePlay}
            onDoubleClick={toggleFullscreen}
            {...mediaEvents}
          />
        )}
        {failed ? (
          <div className="status" role="alert">
            Couldn't play this video
          </div>
        ) : waiting ? (
          <div className="status" aria-label={`Loading ${title}`}>
            <Loader />
          </div>
        ) : (
          !playing && (
            <button
              type="button"
              className="bigPlay"
              onClick={togglePlay}
              // the control bar has the same button for keyboard and
              // screen reader users
              aria-hidden
              tabIndex={-1}
            >
              <Play size="1.5rem" />
            </button>
          )
        )}
      </div>
      {controls}
    </div>
  );
};
