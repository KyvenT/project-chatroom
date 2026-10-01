import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaPlayer } from "../../src/components/attachments/MediaPlayer";
import { formatTime } from "../../src/utils/formatTime";
import { ThemeProvider } from "@emotion/react";
import { render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { theme } from "../../src/styles/theme";

// a player that can be re-rendered with new props, keeping the theme
const renderPlayer = (props: ComponentProps<typeof MediaPlayer>) => {
  const withTheme = (p: typeof props) => (
    <ThemeProvider theme={theme}>
      <MediaPlayer {...p} />
    </ThemeProvider>
  );
  const result = render(withTheme(props));
  return {
    ...result,
    rerender: (next: typeof props) => result.rerender(withTheme(next)),
  };
};

describe("formatTime", () => {
  it("shows minutes and seconds, and hours when there are any", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65.7)).toBe("1:05");
    expect(formatTime(3725)).toBe("1:02:05");
    expect(formatTime(NaN)).toBe("0:00");
    expect(formatTime(Infinity)).toBe("0:00");
  });
});

describe("MediaPlayer", () => {
  let play: ReturnType<typeof vi.spyOn>;
  let pause: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // jsdom has no media playback; play and pause fire the events a browser
    // would
    play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockImplementation(function (this: HTMLMediaElement) {
        Object.defineProperty(this, "paused", {
          value: false,
          configurable: true,
        });
        this.dispatchEvent(new Event("play"));
        return Promise.resolve();
      });
    pause = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(function (this: HTMLMediaElement) {
        Object.defineProperty(this, "paused", {
          value: true,
          configurable: true,
        });
        this.dispatchEvent(new Event("pause"));
      });
  });
  afterEach(() => vi.restoreAllMocks());

  it("asks for the file on first play and plays once it arrives", () => {
    const onRequestLoad = vi.fn();
    const { rerender } = renderPlayer({
      kind: "video",
      title: "clip.mp4",
      onRequestLoad,
    });

    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    expect(onRequestLoad).toHaveBeenCalledOnce();
    expect(play).not.toHaveBeenCalled();

    rerender({
      kind: "video",
      title: "clip.mp4",
      src: "blob:clip",
      onRequestLoad,
    });
    expect(play).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("button", { name: "Pause video" }),
    ).toBeInTheDocument();
  });

  it("plays and pauses from the keyboard", () => {
    renderPlayer({ kind: "audio", title: "song.mp3", src: "blob:song" });
    const player = screen.getByRole("group", {
      name: "Audio player: song.mp3",
    });

    fireEvent.keyDown(player, { key: " " });
    expect(play).toHaveBeenCalledOnce();
    fireEvent.keyDown(player, { key: "k" });
    expect(pause).toHaveBeenCalledOnce();
  });

  it("seeks with the slider and shows the time", () => {
    const { container } = renderPlayer({
      kind: "video",
      title: "clip.mp4",
      src: "blob:clip",
    });
    const video = container.querySelector("video")!;
    Object.defineProperty(video, "duration", { value: 90, configurable: true });
    act(() => {
      video.dispatchEvent(new Event("loadedmetadata"));
    });

    fireEvent.change(screen.getByRole("slider", { name: "Seek" }), {
      target: { value: "30" },
    });
    expect(video.currentTime).toBe(30);
    expect(screen.getByText("0:30 / 1:30")).toBeInTheDocument();
  });

  it("mutes and unmutes", () => {
    const { container } = renderPlayer({
      kind: "audio",
      title: "song.mp3",
      src: "blob:song",
    });
    const audio = container.querySelector("audio")!;

    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    expect(audio.muted).toBe(true);
    act(() => {
      audio.dispatchEvent(new Event("volumechange"));
    });
    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));
    expect(audio.muted).toBe(false);
  });

  it("pauses when suspended", () => {
    const { rerender } = renderPlayer({
      kind: "video",
      title: "clip.mp4",
      src: "blob:clip",
    });
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    rerender({
      kind: "video",
      title: "clip.mp4",
      src: "blob:clip",
      suspended: true,
    });
    expect(pause).toHaveBeenCalled();
  });

  it("says when the file couldn't be played", () => {
    renderPlayer({ kind: "video", title: "clip.mp4", error: true });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't play this video",
    );
    expect(screen.getByRole("button", { name: "Play video" })).toBeDisabled();
  });
});
